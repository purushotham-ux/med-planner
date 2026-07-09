import { Router, Request, Response, NextFunction } from 'express';
import prisma from '../lib/prisma.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { AppError } from '../middleware/error.middleware.js';

const router = Router();
router.use(authenticate);

// GET /api/areas
router.get('/', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const areas = await prisma.area.findMany({
      include: {
        _count: { select: { doctors: true, beats: true, chemists: true } },
        beats: {
          select: { id: true, name: true, dayOfWeek: true, _count: { select: { doctors: true } } },
        },
      },
      orderBy: { name: 'asc' },
    });
    res.json({ success: true, data: areas });
  } catch (error) {
    next(error);
  }
});

// GET /api/areas/:id
router.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const area = await prisma.area.findUnique({
      where: { id: req.params.id },
      include: {
        beats: {
          include: { _count: { select: { doctors: true } } },
        },
        doctors: {
          include: {
            beat: { select: { id: true, name: true } },
            _count: { select: { visits: true } },
          },
        },
        chemists: true,
        _count: { select: { doctors: true, beats: true, chemists: true } },
      },
    });
    if (!area) throw new AppError('Area not found', 404);
    res.json({ success: true, data: area });
  } catch (error) {
    next(error);
  }
});

// POST /api/areas
router.post('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const area = await prisma.area.create({
      data: req.body,
      include: { _count: { select: { doctors: true, beats: true } } },
    });
    res.status(201).json({ success: true, data: area });
  } catch (error) {
    next(error);
  }
});

// PUT /api/areas/:id
router.put('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const area = await prisma.area.update({
      where: { id: req.params.id },
      data: req.body,
    });
    res.json({ success: true, data: area });
  } catch (error) {
    next(error);
  }
});

// DELETE /api/areas/:id
router.delete('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    await prisma.area.delete({ where: { id: req.params.id } });
    res.json({ success: true, message: 'Area deleted' });
  } catch (error) {
    next(error);
  }
});

// GET /api/areas/:id/doctors
router.get('/:id/doctors', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const doctors = await prisma.doctor.findMany({
      where: { areaId: req.params.id },
      include: {
        beat: { select: { id: true, name: true } },
        chemist: { select: { id: true, name: true, pharmacyName: true } },
        _count: { select: { visits: true } },
      },
      orderBy: { name: 'asc' },
    });
    res.json({ success: true, data: doctors });
  } catch (error) {
    next(error);
  }
});

export default router;
