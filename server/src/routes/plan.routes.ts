import { Router, Response, NextFunction } from 'express';
import prisma from '../lib/prisma.js';
import { authenticate, AuthRequest } from '../middleware/auth.middleware.js';
import { AppError } from '../middleware/error.middleware.js';

const router = Router();
router.use(authenticate);

// GET /api/plans
router.get('/', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { type, status, from, to } = req.query;
    const where: any = { userId: req.userId! };

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
router.get('/:id', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const plan = await prisma.plan.findUnique({
      where: { id: req.params.id, userId: req.userId! },
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
router.post('/', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const plan = await prisma.plan.create({
      data: {
        userId: req.userId!,
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
router.put('/:id', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const plan = await prisma.plan.update({
      where: { id: req.params.id, userId: req.userId! },
      data: req.body,
    });
    res.json({ success: true, data: plan });
  } catch (error) {
    next(error);
  }
});

// DELETE /api/plans/:id
router.delete('/:id', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    await prisma.plan.delete({ where: { id: req.params.id, userId: req.userId! } });
    res.json({ success: true, message: 'Plan deleted' });
  } catch (error) {
    next(error);
  }
});

// POST /api/plans/generate — Auto-generate an accurate plan for a given date
router.post('/generate', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { date, maxDoctors = 15, latitude, longitude } = req.body;
    const planDate = new Date(date);
    planDate.setHours(0, 0, 0, 0); // Normalize date to start of day
    const planDateEnd = new Date(planDate);
    planDateEnd.setDate(planDateEnd.getDate() + 1);
    
    const dayOfWeek = planDate.getDay();

    // 1. Get all active doctors with their visits for the CURRENT month to calculate targets
    const startOfMonth = new Date(planDate.getFullYear(), planDate.getMonth(), 1);
    const endOfMonth = new Date(planDate.getFullYear(), planDate.getMonth() + 1, 0);

    const doctors = await prisma.doctor.findMany({
      where: { status: 'ACTIVE', userId: req.userId! },
      include: {
        area: { select: { id: true, name: true } },
        beat: { select: { id: true, name: true } },
        visits: {
          where: { visitDate: { gte: startOfMonth, lte: endOfMonth }, completed: true },
          orderBy: { visitDate: 'desc' },
          select: { visitDate: true },
        },
      },
    });

    // 2. Fetch doctors who ALREADY have a pending followUp on this exact date
    const pendingFollowUps = await prisma.visit.findMany({
      where: {
        userId: req.userId!,
        followUpDate: { gte: planDate, lt: planDateEnd },
      },
      select: { doctorId: true },
    });
    const followUpDoctorIds = new Set(pendingFollowUps.map((v) => v.doctorId));

    // 3. Fetch doctors who are ALREADY scheduled in a plan for this exact date
    const alreadyPlannedItems = await prisma.planItem.findMany({
      where: {
        plan: {
          userId: req.userId!,
          date: { gte: planDate, lt: planDateEnd },
        },
      },
      select: { doctorId: true },
    });
    const alreadyPlannedDoctorIds = new Set(alreadyPlannedItems.map((pi) => pi.doctorId));

    // 4. Initial Scoring & Hard Constraints
    const scored = doctors.map((doc) => {
      let score = 0;
      let reasons: string[] = [];

      // --- HARD BANS (Score = -1000) ---
      
      // Ban 1: Ex-station day
      if (doc.exStationDays.includes(dayOfWeek)) {
        return { doctor: doc, score: -1000, reasons: ['Out of station (Ex-station)'] };
      }

      // Ban 2: Already planned today
      if (alreadyPlannedDoctorIds.has(doc.id)) {
        return { doctor: doc, score: -1000, reasons: ['Already planned for this date'] };
      }

      const monthlyTarget = doc.grade === 'A' ? 3 : doc.grade === 'B' ? 2 : 1;
      const visitsThisMonth = doc.visits.length;
      const lastVisit = doc.visits[0]?.visitDate;

      // Ban 3: Target Hit
      if (visitsThisMonth >= monthlyTarget) {
        return { doctor: doc, score: -1000, reasons: ['Monthly visit target already met'] };
      }

      // Ban 4: Too Soon (Minimum Spacing)
      if (lastVisit) {
        const daysSince = Math.floor((planDate.getTime() - new Date(lastVisit).getTime()) / (1000 * 60 * 60 * 24));
        const minGap = doc.grade === 'A' ? 7 : 14;
        if (daysSince < minGap) {
          return { doctor: doc, score: -1000, reasons: [`Visited recently (${daysSince} days ago). Min gap is ${minGap} days.`] };
        }
        
        // Days since last visit bonus (Logarithmic growth for older visits)
        score += Math.min(20, Math.log2(daysSince + 1) * 4);
      } else {
        score += 20; // High priority if never visited this month
      }

      // --- MASSIVE BOOSTS ---

      // Boost 1: Follow-Up Due
      if (followUpDoctorIds.has(doc.id)) {
        score += 200;
        reasons.push('Follow-up scheduled for today');
      }

      // Boost 2: Preferred Day
      if (doc.preferredDays.includes(dayOfWeek)) {
        score += 50;
        reasons.push('Preferred visiting day');
      }

      // --- GENERAL PRIORITIES ---

      // Grade Priority
      if (doc.grade === 'A') score += 20;
      else if (doc.grade === 'B') score += 12;
      else score += 5;

      // Favorite
      if (doc.favorite) {
        score += 10;
        reasons.push('Marked as Favorite');
      }

      // Reverse Priority (1 is highest priority in DB, so 1 -> +10)
      score += 11 - doc.priority;

      // Distance Penalty (Optional, if location is provided)
      if (latitude && longitude && doc.latitude && doc.longitude) {
        const dist = haversineDistance(latitude, longitude, doc.latitude, doc.longitude);
        score -= Math.min(20, dist * 2); // -2 score per km, max -20
      }

      if (reasons.length === 0) reasons.push('General priority');

      return { doctor: doc, score, reasons };
    });

    // 5. Smart Clustering (Route Optimization)
    // Find the highest scoring doctor (the anchor)
    const validDoctors = scored.filter((s) => s.score > 0);
    validDoctors.sort((a, b) => b.score - a.score);
    
    if (validDoctors.length > 0) {
      const anchor = validDoctors[0].doctor;
      const anchorBeatId = anchor.beatId;
      const anchorAreaId = anchor.areaId;

      // Apply cluster bonuses
      validDoctors.forEach((s) => {
        if (s.doctor.id !== anchor.id) {
          if (anchorBeatId && s.doctor.beatId === anchorBeatId) {
            s.score += 40;
            s.reasons.push('Same Beat as highest priority doctor');
          } else if (anchorAreaId && s.doctor.areaId === anchorAreaId) {
            s.score += 20;
            s.reasons.push('Same Area as highest priority doctor');
          }
        }
      });
    }

    // Re-sort after clustering
    validDoctors.sort((a, b) => b.score - a.score);
    
    // Select top maxDoctors
    const topDoctors = validDoctors.slice(0, maxDoctors);

    // 6. Create the plan
    const plan = await prisma.plan.create({
      data: {
        userId: req.userId!,
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
        reasons: s.reasons,
      })),
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/plans/:id/items — Add doctor to plan
router.post('/:id/items', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const plan = await prisma.plan.findUnique({
      where: { id: req.params.id, userId: req.userId! },
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
router.put('/:id/items/:itemId', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    await prisma.planItem.updateMany({
      where: { id: req.params.itemId, plan: { id: req.params.id, userId: req.userId! } },
      data: req.body,
    });
    res.json({ success: true, message: 'Item updated' });
  } catch (error) {
    next(error);
  }
});

// DELETE /api/plans/:id/items/:itemId — Remove from plan
router.delete('/:id/items/:itemId', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    await prisma.planItem.deleteMany({ 
      where: { id: req.params.itemId, plan: { id: req.params.id, userId: req.userId! } } 
    });
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
