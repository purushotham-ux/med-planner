import { Router, Request, Response, NextFunction } from 'express';
import prisma from '../lib/prisma.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { AppError } from '../middleware/error.middleware.js';

const router = Router();
router.use(authenticate);

// GET /api/plans
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { type, status, from, to } = req.query;
    const where: any = {};

    if (type) where.type = type;
    if (status) where.status = status;
    if (from || to) {
      where.date = {};
      if (from) where.date.gte = new Date(from as string);
      if (to) where.date.lte = new Date(to as string);
    }

    const plans = await prisma.plan.findMany({
      where,
      include: {
        _count: { select: { items: true } },
        items: {
          include: {
            doctor: {
              select: { id: true, name: true, speciality: true, grade: true, area: { select: { name: true } } },
            },
          },
          orderBy: { order: 'asc' },
        },
      },
      orderBy: { date: 'desc' },
    });

    res.json({ success: true, data: plans });
  } catch (error) {
    next(error);
  }
});

// GET /api/plans/:id
router.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const plan = await prisma.plan.findUnique({
      where: { id: req.params.id },
      include: {
        items: {
          include: {
            doctor: {
              include: {
                area: { select: { id: true, name: true, color: true } },
                beat: { select: { id: true, name: true } },
                chemist: { select: { id: true, name: true, pharmacyName: true } },
              },
            },
            visit: true,
          },
          orderBy: { order: 'asc' },
        },
      },
    });
    if (!plan) throw new AppError('Plan not found', 404);
    res.json({ success: true, data: plan });
  } catch (error) {
    next(error);
  }
});

// POST /api/plans
router.post('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const plan = await prisma.plan.create({
      data: {
        name: req.body.name,
        date: new Date(req.body.date),
        type: req.body.type || 'DAILY',
        status: req.body.status || 'DRAFT',
        notes: req.body.notes,
      },
    });
    res.status(201).json({ success: true, data: plan });
  } catch (error) {
    next(error);
  }
});

// PUT /api/plans/:id
router.put('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const plan = await prisma.plan.update({
      where: { id: req.params.id },
      data: req.body,
    });
    res.json({ success: true, data: plan });
  } catch (error) {
    next(error);
  }
});

// DELETE /api/plans/:id
router.delete('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    await prisma.plan.delete({ where: { id: req.params.id } });
    res.json({ success: true, message: 'Plan deleted' });
  } catch (error) {
    next(error);
  }
});

// POST /api/plans/generate — Auto-generate a plan for a given date
router.post('/generate', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { date, maxDoctors = 15, latitude, longitude } = req.body;
    const planDate = new Date(date);
    const dayOfWeek = planDate.getDay();

    // Get all active doctors with their last visit
    const doctors = await prisma.doctor.findMany({
      where: { status: 'ACTIVE' },
      include: {
        area: { select: { id: true, name: true } },
        beat: { select: { id: true, name: true } },
        visits: {
          orderBy: { visitDate: 'desc' },
          take: 1,
          select: { visitDate: true },
        },
      },
    });

    // Score each doctor
    const scored = doctors.map((doc) => {
      let score = 0;

      // Preferred day match (+25)
      if (doc.preferredDays.includes(dayOfWeek)) score += 25;

      // Grade priority (+20 for A, +12 for B, +5 for C)
      if (doc.grade === 'A') score += 20;
      else if (doc.grade === 'B') score += 12;
      else score += 5;

      // Days since last visit (+0 to +20, logarithmic)
      const lastVisit = doc.visits[0]?.visitDate;
      if (lastVisit) {
        const daysSince = Math.floor(
          (planDate.getTime() - new Date(lastVisit).getTime()) / (1000 * 60 * 60 * 24),
        );
        score += Math.min(20, Math.log2(daysSince + 1) * 4);
      } else {
        score += 20; // Never visited = high priority
      }

      // Favorite (+10)
      if (doc.favorite) score += 10;

      // Priority (inverse: 1→10, 10→1)
      score += 11 - doc.priority;

      // Ex-station penalty (-50)
      if (doc.exStationDays.includes(dayOfWeek)) score -= 50;

      // Distance penalty (if current location provided)
      if (latitude && longitude && doc.latitude && doc.longitude) {
        const dist = haversineDistance(latitude, longitude, doc.latitude, doc.longitude);
        score -= Math.min(20, dist * 2); // -2 per km, max -20
      }

      return { doctor: doc, score };
    });

    // Sort by score descending, take top N
    scored.sort((a, b) => b.score - a.score);
    const topDoctors = scored.slice(0, maxDoctors).filter((s) => s.score > 0);

    // Create the plan
    const plan = await prisma.plan.create({
      data: {
        name: `Plan for ${planDate.toLocaleDateString('en-IN', { weekday: 'long', month: 'short', day: 'numeric' })}`,
        date: planDate,
        type: 'DAILY',
        status: 'DRAFT',
        items: {
          create: topDoctors.map((s, index) => ({
            doctorId: s.doctor.id,
            order: index + 1,
            timeSlot: s.doctor.preferredTime || undefined,
          })),
        },
      },
      include: {
        items: {
          include: {
            doctor: {
              include: {
                area: { select: { id: true, name: true } },
                beat: { select: { id: true, name: true } },
              },
            },
          },
          orderBy: { order: 'asc' },
        },
      },
    });

    res.status(201).json({
      success: true,
      data: plan,
      suggestions: topDoctors.map((s) => ({
        doctorId: s.doctor.id,
        doctorName: s.doctor.name,
        score: Math.round(s.score),
      })),
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/plans/:id/items — Add doctor to plan
router.post('/:id/items', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const plan = await prisma.plan.findUnique({
      where: { id: req.params.id },
      include: { items: { orderBy: { order: 'desc' }, take: 1 } },
    });
    if (!plan) throw new AppError('Plan not found', 404);

    const nextOrder = (plan.items[0]?.order || 0) + 1;

    const item = await prisma.planItem.create({
      data: {
        planId: req.params.id,
        doctorId: req.body.doctorId,
        order: req.body.order || nextOrder,
        scheduledTime: req.body.scheduledTime,
        timeSlot: req.body.timeSlot,
      },
      include: {
        doctor: {
          include: {
            area: { select: { name: true } },
            beat: { select: { name: true } },
          },
        },
      },
    });

    res.status(201).json({ success: true, data: item });
  } catch (error) {
    next(error);
  }
});

// PUT /api/plans/:id/items/:itemId — Update plan item
router.put('/:id/items/:itemId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const item = await prisma.planItem.update({
      where: { id: req.params.itemId },
      data: req.body,
    });
    res.json({ success: true, data: item });
  } catch (error) {
    next(error);
  }
});

// DELETE /api/plans/:id/items/:itemId — Remove from plan
router.delete('/:id/items/:itemId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    await prisma.planItem.delete({ where: { id: req.params.itemId } });
    res.json({ success: true, message: 'Item removed from plan' });
  } catch (error) {
    next(error);
  }
});

// Haversine distance calculation (km)
function haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRad(deg: number): number {
  return (deg * Math.PI) / 180;
}

export default router;
