import { Router, Response, NextFunction } from 'express';
import prisma from '../lib/prisma.js';
import { authenticate, AuthRequest } from '../middleware/auth.middleware.js';
import { AppError } from '../middleware/error.middleware.js';

const router = Router();
router.use(authenticate);

// GET /api/visits
router.get('/', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { doctorId, from, to, completed, skipped, page = '1', limit = '50' } = req.query;
    const where: any = { userId: req.userId! };

    if (doctorId) where.doctorId = doctorId;
    if (completed === 'true') where.completed = true;
    if (skipped === 'true') where.skipped = true;

    if (from || to) {
      where.visitDate = {};
      if (from) where.visitDate.gte = new Date(from as string);
      if (to) where.visitDate.lte = new Date(to as string);
    }

    const skip = (parseInt(page as string) - 1) * parseInt(limit as string);
    const take = parseInt(limit as string);

    const [visits, total] = await Promise.all([
      prisma.visit.findMany({
        where,
        include: {
          doctor: {
            select: { id: true, name: true, speciality: true, grade: true, hospital: true },
          },
        },
        orderBy: { visitDate: 'desc' },
        skip,
        take,
      }),
      prisma.visit.count({ where }),
    ]);

    res.json({
      success: true,
      data: visits,
      pagination: {
        page: parseInt(page as string),
        limit: take,
        total,
        totalPages: Math.ceil(total / take),
      },
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/visits
router.post('/', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const visit = await prisma.visit.create({
      data: { ...req.body, userId: req.userId! },
      include: {
        doctor: { select: { id: true, name: true, speciality: true } },
      },
    });
    res.status(201).json({ success: true, data: visit });
  } catch (error) {
    next(error);
  }
});

// PUT /api/visits/:id
router.put('/:id', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const visit = await prisma.visit.update({
      where: { id: req.params.id, userId: req.userId! },
      data: req.body,
    });
    res.json({ success: true, data: visit });
  } catch (error) {
    next(error);
  }
});

// GET /api/visits/doctor/:doctorId — Visit history for a doctor
router.get('/doctor/:doctorId', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const visits = await prisma.visit.findMany({
      where: { doctorId: req.params.doctorId, userId: req.userId! },
      orderBy: { visitDate: 'desc' },
      take: 50,
    });
    res.json({ success: true, data: visits });
  } catch (error) {
    next(error);
  }
});

// DELETE /api/visits/:id
router.delete('/:id', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    await prisma.visit.delete({ where: { id: req.params.id, userId: req.userId! } });
    res.json({ success: true, message: 'Visit deleted' });
  } catch (error) {
    next(error);
  }
});

export default router;
