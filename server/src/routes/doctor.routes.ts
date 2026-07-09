import { Router, Request, Response, NextFunction } from 'express';
import prisma from '../lib/prisma.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { AppError } from '../middleware/error.middleware.js';
import { Prisma } from '@prisma/client';

const router = Router();
router.use(authenticate);

// GET /api/doctors - List all doctors with filters, search, pagination
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const {
      search,
      area,
      beat,
      speciality,
      grade,
      status,
      favorite,
      preferredDay,
      page = '1',
      limit = '50',
      sortBy = 'name',
      sortOrder = 'asc',
    } = req.query;

    const where: Prisma.DoctorWhereInput = {};

    // Search across multiple fields
    if (search && typeof search === 'string') {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { hospital: { contains: search, mode: 'insensitive' } },
        { clinic: { contains: search, mode: 'insensitive' } },
        { address: { contains: search, mode: 'insensitive' } },
        { notes: { contains: search, mode: 'insensitive' } },
        { assistantName: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (area) where.areaId = area as string;
    if (beat) where.beatId = beat as string;
    if (speciality) where.speciality = speciality as any;
    if (grade) where.grade = grade as any;
    if (status) where.status = status as any;
    if (favorite === 'true') where.favorite = true;
    if (preferredDay) where.preferredDays = { has: parseInt(preferredDay as string) };

    const skip = (parseInt(page as string) - 1) * parseInt(limit as string);
    const take = parseInt(limit as string);

    const [doctors, total] = await Promise.all([
      prisma.doctor.findMany({
        where,
        include: {
          area: { select: { id: true, name: true, color: true } },
          beat: { select: { id: true, name: true } },
          chemist: { select: { id: true, name: true, pharmacyName: true } },
          _count: { select: { visits: true } },
        },
        orderBy: { [sortBy as string]: sortOrder as string },
        skip,
        take,
      }),
      prisma.doctor.count({ where }),
    ]);

    res.json({
      success: true,
      data: doctors,
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

// GET /api/doctors/nearby - Find nearby doctors
router.get('/nearby', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { lat, lng, radius = '5' } = req.query;

    if (!lat || !lng) {
      throw new AppError('Latitude and longitude are required', 400);
    }

    const latitude = parseFloat(lat as string);
    const longitude = parseFloat(lng as string);
    const radiusKm = parseFloat(radius as string);

    // Haversine formula via raw query for performance
    const doctors = await prisma.$queryRaw`
      SELECT d.*, 
        a.name as "areaName", a.color as "areaColor",
        b.name as "beatName",
        (6371 * acos(
          cos(radians(${latitude})) * cos(radians(d.latitude)) *
          cos(radians(d.longitude) - radians(${longitude})) +
          sin(radians(${latitude})) * sin(radians(d.latitude))
        )) AS distance
      FROM "Doctor" d
      LEFT JOIN "Area" a ON d."areaId" = a.id
      LEFT JOIN "Beat" b ON d."beatId" = b.id
      WHERE d.latitude IS NOT NULL 
        AND d.longitude IS NOT NULL
        AND d.status = 'ACTIVE'
        AND (6371 * acos(
          cos(radians(${latitude})) * cos(radians(d.latitude)) *
          cos(radians(d.longitude) - radians(${longitude})) +
          sin(radians(${latitude})) * sin(radians(d.latitude))
        )) <= ${radiusKm}
      ORDER BY distance ASC
    `;

    res.json({ success: true, data: doctors });
  } catch (error) {
    next(error);
  }
});

// GET /api/doctors/available-now - Doctors available at current time
router.get('/available-now', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const now = new Date();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    const currentTime = `${String(currentHour).padStart(2, '0')}:${String(currentMinute).padStart(2, '0')}`;
    const currentDay = now.getDay(); // 0=Sun, 1=Mon...6=Sat

    const doctors = await prisma.doctor.findMany({
      where: {
        status: 'ACTIVE',
        exStationDays: { isEmpty: true }, // Not ex-station (simplified)
      },
      include: {
        area: { select: { id: true, name: true, color: true } },
        beat: { select: { id: true, name: true } },
      },
    });

    // Filter based on current time matching their available timings
    const available = doctors.filter((doc) => {
      // Check if not ex-station today
      if (doc.exStationDays.includes(currentDay)) return false;

      // Check morning timing
      if (doc.morningStart && doc.morningEnd) {
        if (currentTime >= doc.morningStart && currentTime <= doc.morningEnd) return true;
      }
      // Check afternoon timing
      if (doc.afternoonStart && doc.afternoonEnd) {
        if (currentTime >= doc.afternoonStart && currentTime <= doc.afternoonEnd) return true;
      }
      // Check evening timing
      if (doc.eveningStart && doc.eveningEnd) {
        if (currentTime >= doc.eveningStart && currentTime <= doc.eveningEnd) return true;
      }

      return false;
    });

    res.json({ success: true, data: available });
  } catch (error) {
    next(error);
  }
});

// GET /api/doctors/:id - Get doctor profile
router.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const doctor = await prisma.doctor.findUnique({
      where: { id: req.params.id },
      include: {
        area: true,
        beat: true,
        chemist: true,
        visits: {
          orderBy: { visitDate: 'desc' },
          take: 20,
        },
        planItems: {
          include: { plan: { select: { id: true, name: true, date: true } } },
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
        _count: { select: { visits: true, planItems: true } },
      },
    });

    if (!doctor) {
      throw new AppError('Doctor not found', 404);
    }

    res.json({ success: true, data: doctor });
  } catch (error) {
    next(error);
  }
});

// POST /api/doctors - Create doctor
router.post('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const doctor = await prisma.doctor.create({
      data: req.body,
      include: {
        area: { select: { id: true, name: true } },
        beat: { select: { id: true, name: true } },
        chemist: { select: { id: true, name: true, pharmacyName: true } },
      },
    });
    res.status(201).json({ success: true, data: doctor });
  } catch (error) {
    next(error);
  }
});

// PUT /api/doctors/:id - Update doctor
router.put('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const doctor = await prisma.doctor.update({
      where: { id: req.params.id },
      data: req.body,
      include: {
        area: { select: { id: true, name: true } },
        beat: { select: { id: true, name: true } },
        chemist: { select: { id: true, name: true, pharmacyName: true } },
      },
    });
    res.json({ success: true, data: doctor });
  } catch (error) {
    next(error);
  }
});

// DELETE /api/doctors/:id - Delete doctor
router.delete('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    await prisma.doctor.delete({ where: { id: req.params.id } });
    res.json({ success: true, message: 'Doctor deleted' });
  } catch (error) {
    next(error);
  }
});

// PATCH /api/doctors/:id/favorite - Toggle favorite
router.patch('/:id/favorite', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const doctor = await prisma.doctor.findUnique({
      where: { id: req.params.id },
      select: { favorite: true },
    });
    if (!doctor) throw new AppError('Doctor not found', 404);

    const updated = await prisma.doctor.update({
      where: { id: req.params.id },
      data: { favorite: !doctor.favorite },
    });
    res.json({ success: true, data: updated });
  } catch (error) {
    next(error);
  }
});

export default router;
