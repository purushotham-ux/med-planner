import { Router, Request, Response, NextFunction } from 'express';
import prisma from '../lib/prisma.js';
import { authenticate } from '../middleware/auth.middleware.js';

const router = Router();
router.use(authenticate);

// GET /api/brands
router.get('/', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const brands = await prisma.brand.findMany({
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
    });
    res.json({ success: true, data: brands });
  } catch (error) {
    next(error);
  }
});

// POST /api/brands
router.post('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const brand = await prisma.brand.create({ data: req.body });
    res.status(201).json({ success: true, data: brand });
  } catch (error) {
    next(error);
  }
});

// PUT /api/brands/:id
router.put('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const brand = await prisma.brand.update({
      where: { id: req.params.id },
      data: req.body,
    });
    res.json({ success: true, data: brand });
  } catch (error) {
    next(error);
  }
});

// DELETE /api/brands/:id
router.delete('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    await prisma.brand.delete({ where: { id: req.params.id } });
    res.json({ success: true, message: 'Brand deleted' });
  } catch (error) {
    next(error);
  }
});

export default router;
