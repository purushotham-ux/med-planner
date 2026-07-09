import { Router, Response, NextFunction } from 'express';
import prisma from '../lib/prisma.js';
import { authenticate, AuthRequest } from '../middleware/auth.middleware.js';

const router = Router();
router.use(authenticate);

// GET /api/dashboard/today
router.get('/today', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dayOfWeek = today.getDay();

    const [
      todaysPlan,
      todaysVisits,
      totalDoctors,
      activeDoctors,
      totalChemists,
      preferredToday,
      exStationToday,
      pendingFollowups,
      recentVisits,
    ] = await Promise.all([
      // Today's active plan
      prisma.plan.findFirst({
        where: {
          userId: req.userId!,
          date: { gte: today, lt: tomorrow },
          status: { in: ['DRAFT', 'ACTIVE'] },
        },
        include: {
          items: {
            include: {
              doctor: {
                select: {
                  id: true, name: true, speciality: true, grade: true,
                  hospital: true, latitude: true, longitude: true,
                  area: { select: { name: true, color: true } },
                },
              },
              visit: { select: { id: true, completed: true, skipped: true } },
            },
            orderBy: { order: 'asc' },
          },
          _count: { select: { items: true } },
        },
      }),

      // Today's visits count
      prisma.visit.count({
        where: { userId: req.userId!, visitDate: { gte: today, lt: tomorrow }, completed: true },
      }),

      // Total doctors
      prisma.doctor.count({ where: { userId: req.userId! } }),

      // Active doctors
      prisma.doctor.count({ where: { userId: req.userId!, status: 'ACTIVE' } }),

      // Total chemists
      prisma.chemist.count({ where: { userId: req.userId! } }),

      // Doctors who prefer today
      prisma.doctor.count({
        where: { userId: req.userId!, status: 'ACTIVE', preferredDays: { has: dayOfWeek } },
      }),

      // Ex-station today
      prisma.doctor.count({
        where: { userId: req.userId!, status: 'ACTIVE', exStationDays: { has: dayOfWeek } },
      }),

      // Pending follow-ups (due within next 7 days)
      prisma.visit.findMany({
        where: {
          userId: req.userId!,
          followUpDate: {
            gte: today,
            lte: new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000),
          },
        },
        include: {
          doctor: { select: { id: true, name: true, speciality: true } },
        },
        orderBy: { followUpDate: 'asc' },
        take: 10,
      }),

      // Recent 7-day visit counts
      prisma.visit.groupBy({
        by: ['visitDate'],
        where: {
          userId: req.userId!,
          visitDate: { gte: new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000) },
          completed: true,
        },
        _count: true,
      }),
    ]);

    // Calculate plan progress
    const planItems = todaysPlan?.items || [];
    const completed = planItems.filter((i) => i.visit?.completed).length;
    const skipped = planItems.filter((i) => i.visit?.skipped).length;
    const pending = planItems.length - completed - skipped;

    res.json({
      success: true,
      data: {
        plan: todaysPlan,
        planProgress: {
          total: planItems.length,
          completed,
          skipped,
          pending,
          percentage: planItems.length ? Math.round((completed / planItems.length) * 100) : 0,
        },
        stats: {
          todaysVisits,
          totalDoctors,
          activeDoctors,
          totalChemists,
          preferredToday,
          exStationToday,
        },
        pendingFollowups,
        recentVisits,
      },
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/dashboard/stats
router.get('/stats', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const thisMonth = new Date();
    thisMonth.setDate(1);
    thisMonth.setHours(0, 0, 0, 0);

    const [
      totalDoctors,
      doctorsByGrade,
      doctorsBySpeciality,
      monthlyVisits,
      totalVisits,
      areaStats,
    ] = await Promise.all([
      prisma.doctor.count({ where: { userId: req.userId!, status: 'ACTIVE' } }),

      prisma.doctor.groupBy({
        by: ['grade'],
        where: { userId: req.userId!, status: 'ACTIVE' },
        _count: true,
      }),

      prisma.doctor.groupBy({
        by: ['speciality'],
        where: { userId: req.userId!, status: 'ACTIVE' },
        _count: true,
      }),

      prisma.visit.count({
        where: { userId: req.userId!, visitDate: { gte: thisMonth }, completed: true },
      }),

      prisma.visit.count({ where: { userId: req.userId!, completed: true } }),

      prisma.area.findMany({
        where: { userId: req.userId! },
        select: {
          id: true,
          name: true,
          color: true,
          _count: { select: { doctors: true, beats: true } },
        },
        orderBy: { name: 'asc' },
      }),
    ]);

    // Coverage: unique doctors visited this month / total active
    const uniqueVisited = await prisma.visit.findMany({
      where: { userId: req.userId!, visitDate: { gte: thisMonth }, completed: true },
      distinct: ['doctorId'],
      select: { doctorId: true },
    });

    res.json({
      success: true,
      data: {
        totalDoctors,
        doctorsByGrade,
        doctorsBySpeciality,
        monthlyVisits,
        totalVisits,
        coverage: {
          visited: uniqueVisited.length,
          total: totalDoctors,
          percentage: totalDoctors ? Math.round((uniqueVisited.length / totalDoctors) * 100) : 0,
        },
        areaStats,
      },
    });
  } catch (error) {
    next(error);
  }
});

export default router;
