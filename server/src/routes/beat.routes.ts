import { Router, Request, Response, NextFunction } from 'express';
import prisma from '../lib/prisma.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { AppError } from '../middleware/error.middleware.js';

const router = Router();
router.use(authenticate);

// GET /api/beats
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { area } = req.query;
    const where: any = {};
    if (area) where.areaId = String(area);

    const beats = await prisma.beat.findMany({
      where,
      include: {
        area: { select: { id: true, name: true, color: true } },
        _count: { select: { doctors: true, chemists: true } },
      },
      orderBy: [{ area: { name: 'asc' } }, { name: 'asc' }],
    });
    res.json({ success: true, data: beats });
  } catch (error) {
    next(error);
  }
});

// GET /api/beats/:id
router.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const beat = await prisma.beat.findUnique({
      where: { id: req.params.id },
      include: {
        area: true,
        doctors: {
          include: { _count: { select: { visits: true } } },
        },
        chemists: true,
        _count: { select: { doctors: true, chemists: true } },
      },
    });
    if (!beat) throw new AppError('Beat not found', 404);
    res.json({ success: true, data: beat });
  } catch (error) {
    next(error);
  }
});

// POST /api/beats
router.post('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const beat = await prisma.beat.create({
      data: req.body,
      include: {
        area: { select: { id: true, name: true } },
        _count: { select: { doctors: true } },
      },
    });
    res.status(201).json({ success: true, data: beat });
  } catch (error) {
    next(error);
  }
});

// PUT /api/beats/:id
router.put('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const beat = await prisma.beat.update({
      where: { id: req.params.id },
      data: req.body,
      include: { area: { select: { id: true, name: true } } },
    });
    res.json({ success: true, data: beat });
  } catch (error) {
    next(error);
  }
});

// DELETE /api/beats/:id
router.delete('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    await prisma.beat.delete({ where: { id: req.params.id } });
    res.json({ success: true, message: 'Beat deleted' });
  } catch (error) {
    next(error);
  }
});

// POST /api/beats/:id/reassign — Reassign doctors from one beat to another
router.post('/:id/reassign', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { targetBeatId, doctorIds } = req.body;
    if (!targetBeatId || !doctorIds?.length) {
      throw new AppError('Target beat ID and doctor IDs are required', 400);
    }

    await prisma.doctor.updateMany({
      where: { id: { in: doctorIds }, beatId: req.params.id },
      data: { beatId: targetBeatId },
    });

    res.json({ success: true, message: `Reassigned ${doctorIds.length} doctors` });
  } catch (error) {
    next(error);
  }
});

export default router;
