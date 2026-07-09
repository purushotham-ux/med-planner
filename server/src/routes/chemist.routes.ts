import { Router, Request, Response, NextFunction } from 'express';
import prisma from '../lib/prisma.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { AppError } from '../middleware/error.middleware.js';

const router = Router();
router.use(authenticate);

// GET /api/chemists
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { search, area, beat } = req.query;
    const where: any = {};

    if (search && typeof search === 'string') {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { pharmacyName: { contains: search, mode: 'insensitive' } },
        { address: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search, mode: 'insensitive' } },
      ];
    }
    if (area) where.areaId = area;
    if (beat) where.beatId = beat;

    const chemists = await prisma.chemist.findMany({
      where,
      include: {
        area: { select: { id: true, name: true } },
        beat: { select: { id: true, name: true } },
        _count: { select: { doctors: true } },
      },
      orderBy: { name: 'asc' },
    });

    res.json({ success: true, data: chemists });
  } catch (error) {
    next(error);
  }
});

// GET /api/chemists/:id
router.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const chemist = await prisma.chemist.findUnique({
      where: { id: req.params.id },
      include: {
        area: true,
        beat: true,
        doctors: {
          select: { id: true, name: true, speciality: true, grade: true },
        },
      },
    });
    if (!chemist) throw new AppError('Chemist not found', 404);
    res.json({ success: true, data: chemist });
  } catch (error) {
    next(error);
  }
});

// POST /api/chemists
router.post('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const chemist = await prisma.chemist.create({
      data: req.body,
      include: {
        area: { select: { id: true, name: true } },
        beat: { select: { id: true, name: true } },
      },
    });
    res.status(201).json({ success: true, data: chemist });
  } catch (error) {
    next(error);
  }
});

// PUT /api/chemists/:id
router.put('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const chemist = await prisma.chemist.update({
      where: { id: req.params.id },
      data: req.body,
      include: {
        area: { select: { id: true, name: true } },
        beat: { select: { id: true, name: true } },
      },
    });
    res.json({ success: true, data: chemist });
  } catch (error) {
    next(error);
  }
});

// DELETE /api/chemists/:id
router.delete('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    await prisma.chemist.delete({ where: { id: req.params.id } });
    res.json({ success: true, message: 'Chemist deleted' });
  } catch (error) {
    next(error);
  }
});

export default router;
