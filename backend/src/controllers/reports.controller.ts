import type { Request, Response } from 'express';
import { prisma } from '../utils/prisma';
import { asyncHandler } from '../middleware/errorHandler';
import { Prisma } from '@prisma/client';

// GET /api/admin/dashboard — stat cards for the admin dashboard
export const getAdminDashboard = asyncHandler(async (_req: Request, res: Response) => {
  const [totalBeds, occupiedBeds, pendingApplications, openComplaints, residentsCount, visitorsToday] =
    await Promise.all([
      prisma.bed.count(),
      prisma.bed.count({ where: { resident: { isNot: null } } }),
      prisma.application.count({ where: { status: { in: ['SUBMITTED', 'DOCUMENTS_VERIFIED', 'APPROVED'] } } }),
      prisma.complaint.count({ where: { status: { in: ['OPEN', 'ASSIGNED', 'IN_PROGRESS'] } } }),
      prisma.resident.count(),
      prisma.visitor.count({
        where: {
          expectedDate: {
            gte: new Date(new Date().setHours(0, 0, 0, 0)),
            lte: new Date(new Date().setHours(23, 59, 59, 999)),
          },
        },
      }),
    ]);

  const [chargesAgg, paymentsAgg] = await Promise.all([
    prisma.accountCharge.aggregate({ _sum: { amount: true } }),
    prisma.payment.aggregate({ _sum: { amount: true } }),
  ]);
  const totalCharges = chargesAgg._sum.amount ?? new Prisma.Decimal(0);
  const totalPayments = paymentsAgg._sum.amount ?? new Prisma.Decimal(0);

  res.json({
    totalBeds,
    occupiedBeds,
    occupancyRate: totalBeds ? Math.round((occupiedBeds / totalBeds) * 100) : 0,
    pendingApplications,
    openComplaints,
    residentsCount,
    visitorsToday,
    totalRevenue: Number(totalPayments),
    totalOutstanding: Number(Prisma.Decimal.sub(totalCharges, totalPayments)),
  });
});

// GET /api/admin/reports — breakdowns for the Reports page
export const getReports = asyncHandler(async (_req: Request, res: Response) => {
  const complaintsByCategory = await prisma.complaint.groupBy({
    by: ['category'],
    _count: { _all: true },
  });
  const complaintsByStatus = await prisma.complaint.groupBy({
    by: ['status'],
    _count: { _all: true },
  });
  const applicationsByStatus = await prisma.application.groupBy({
    by: ['status'],
    _count: { _all: true },
  });
  const visitorsByStatus = await prisma.visitor.groupBy({
    by: ['status'],
    _count: { _all: true },
  });

  res.json({
    complaintsByCategory: complaintsByCategory.map((c) => ({ category: c.category, count: c._count._all })),
    complaintsByStatus: complaintsByStatus.map((c) => ({ status: c.status, count: c._count._all })),
    applicationsByStatus: applicationsByStatus.map((c) => ({ status: c.status, count: c._count._all })),
    visitorsByStatus: visitorsByStatus.map((c) => ({ status: c.status, count: c._count._all })),
  });
});

// GET /api/resident/dashboard — stat cards for the resident dashboard
export const getResidentDashboard = asyncHandler(async (req: Request, res: Response) => {
  const resident = await prisma.resident.findUnique({
    where: { userId: req.user!.userId },
    include: { bed: { include: { room: { include: { building: true } } } } },
  });
  if (!resident) return res.status(404).json({ message: 'Resident profile not found' });

  const [charges, payments, openComplaints, visitorsToday] = await Promise.all([
    prisma.accountCharge.aggregate({ where: { residentId: resident.id }, _sum: { amount: true } }),
    prisma.payment.aggregate({ where: { residentId: resident.id }, _sum: { amount: true } }),
    prisma.complaint.count({ where: { residentId: resident.id, status: { in: ['OPEN', 'ASSIGNED', 'IN_PROGRESS'] } } }),
    prisma.visitor.count({
      where: {
        residentId: resident.id,
        expectedDate: {
          gte: new Date(new Date().setHours(0, 0, 0, 0)),
          lte: new Date(new Date().setHours(23, 59, 59, 999)),
        },
      },
    }),
  ]);

  const balance = Prisma.Decimal.sub(charges._sum.amount ?? new Prisma.Decimal(0), payments._sum.amount ?? new Prisma.Decimal(0));

  res.json({
    room: resident.bed
      ? { building: resident.bed.room.building.name, roomNumber: resident.bed.room.roomNumber, bedLabel: resident.bed.label }
      : null,
    balance: Number(balance),
    openComplaints,
    visitorsToday,
  });
});
