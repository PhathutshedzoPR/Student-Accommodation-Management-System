import type { Request, Response } from 'express';
import { prisma } from '../utils/prisma';
import { asyncHandler, ApiError } from '../middleware/errorHandler';
import { inviteVisitorSchema, incidentReportSchema } from '../validators/visitor.validators';
import { generateVisitorId } from '../utils/generateId';
import { createAuditLog } from '../utils/audit';
import { notifyResident } from '../utils/notify';
import { encrypt, decrypt } from '../utils/crypto';

const visitorInclude = {
  resident: {
    select: {
      firstName: true,
      lastName: true,
      studentNumber: true,
      bed: { include: { room: { include: { building: true } } } },
    },
  },
  checkedInUser: { select: { email: true } },
  checkedOutUser: { select: { email: true } },
};

// id_number is encrypted at rest (schema comment + utils/crypto.ts). Decrypt
// it only for the roles that are allowed to see it (security, admin) and
// strip it entirely from resident-facing list views.
function presentVisitor(v: any, canSeeIdNumber: boolean) {
  const { idNumber, ...rest } = v;
  return canSeeIdNumber ? { ...rest, idNumber: decrypt(idNumber) } : rest;
}

async function residentIdForUser(userId: string) {
  const resident = await prisma.resident.findUnique({ where: { userId } });
  if (!resident) throw new ApiError(404, 'Resident profile not found');
  return resident.id;
}

// POST /api/visitors — resident invites a visitor
export const inviteVisitor = asyncHandler(async (req: Request, res: Response) => {
  const data = inviteVisitorSchema.parse(req.body);
  const residentId = await residentIdForUser(req.user!.userId);
  const id = await generateVisitorId();

  const visitor = await prisma.visitor.create({
    data: {
      id,
      residentId,
      visitorName: data.visitorName,
      phone: data.phone,
      idNumber: encrypt(data.idNumber),
      expectedDate: new Date(data.expectedDate),
      expectedFrom: data.expectedFrom,
      expectedUntil: data.expectedUntil,
      purpose: data.purpose,
    },
    include: visitorInclude,
  });

  await createAuditLog(req.user!.userId, 'VISITOR_INVITED', 'visitor', visitor.id, null, {
    visitorName: data.visitorName,
    expectedDate: data.expectedDate,
  });

  res.status(201).json(presentVisitor(visitor, false));
});

function startOfDay(d: Date) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}
function endOfDay(d: Date) {
  const x = new Date(d);
  x.setHours(23, 59, 59, 999);
  return x;
}

// GET /api/visitors — resident: own; admin/security: all (with filters)
// Query params: status, date ('today' or ISO date), q (name/id search), count=true
export const listVisitors = asyncHandler(async (req: Request, res: Response) => {
  const { status, date, q, count } = req.query as Record<string, string | undefined>;
  const role = req.user!.role;

  const where: any = {};

  if (role === 'RESIDENT') {
    where.residentId = await residentIdForUser(req.user!.userId);
  }

  if (status) where.status = status;

  if (date === 'today') {
    const now = new Date();
    where.expectedDate = { gte: startOfDay(now), lte: endOfDay(now) };
  } else if (date) {
    const d = new Date(date);
    where.expectedDate = { gte: startOfDay(d), lte: endOfDay(d) };
  }

  if (q) {
    where.OR = [
      { visitorName: { contains: q, mode: 'insensitive' } },
      { id: { contains: q.toUpperCase(), mode: 'insensitive' } },
      { resident: { firstName: { contains: q, mode: 'insensitive' } } },
      { resident: { lastName: { contains: q, mode: 'insensitive' } } },
    ];
  }

  if (count === 'true') {
    return res.json({ count: await prisma.visitor.count({ where }) });
  }

  const visitors = await prisma.visitor.findMany({
    where,
    include: visitorInclude,
    orderBy: [{ expectedDate: 'desc' }, { expectedFrom: 'asc' }],
  });

  const canSeeId = role === 'ADMIN' || role === 'SECURITY';
  res.json(visitors.map((v) => presentVisitor(v, canSeeId)));
});

// GET /api/visitors/:id
export const getVisitor = asyncHandler(async (req: Request, res: Response) => {
  const visitor = await prisma.visitor.findUnique({ where: { id: req.params.id }, include: visitorInclude });
  if (!visitor) throw new ApiError(404, 'Visitor not found');

  if (req.user!.role === 'RESIDENT') {
    const residentId = await residentIdForUser(req.user!.userId);
    if (visitor.residentId !== residentId) throw new ApiError(403, 'Forbidden');
    return res.json(presentVisitor(visitor, false));
  }

  res.json(presentVisitor(visitor, true));
});

// POST /api/visitors/:id/check-in — security only
export const checkInVisitor = asyncHandler(async (req: Request, res: Response) => {
  const visitor = await prisma.visitor.findUnique({ where: { id: req.params.id } });
  if (!visitor) throw new ApiError(404, 'Visitor not found');
  if (visitor.status === 'CHECKED_IN') throw new ApiError(409, 'Visitor is already checked in');
  if (visitor.status === 'CHECKED_OUT') throw new ApiError(409, 'Visitor has already checked out');

  const updated = await prisma.visitor.update({
    where: { id: visitor.id },
    data: { status: 'CHECKED_IN', checkedInAt: new Date(), checkedInBy: req.user!.userId },
    include: visitorInclude,
  });

  await createAuditLog(req.user!.userId, 'VISITOR_CHECKED_IN', 'visitor', visitor.id, { status: visitor.status }, { status: 'CHECKED_IN' });
  await notifyResident(visitor.residentId, 'VISITOR', `🔔 Your visitor ${visitor.visitorName} has arrived.`);

  res.json(presentVisitor(updated, true));
});

// POST /api/visitors/:id/check-out — security only
export const checkOutVisitor = asyncHandler(async (req: Request, res: Response) => {
  const visitor = await prisma.visitor.findUnique({ where: { id: req.params.id } });
  if (!visitor) throw new ApiError(404, 'Visitor not found');
  if (visitor.status !== 'CHECKED_IN') throw new ApiError(409, 'Visitor is not currently checked in');

  const updated = await prisma.visitor.update({
    where: { id: visitor.id },
    data: { status: 'CHECKED_OUT', checkedOutAt: new Date(), checkedOutBy: req.user!.userId },
    include: visitorInclude,
  });

  await createAuditLog(req.user!.userId, 'VISITOR_CHECKED_OUT', 'visitor', visitor.id, { status: visitor.status }, { status: 'CHECKED_OUT' });
  await notifyResident(visitor.residentId, 'VISITOR', `🔔 Your visitor ${visitor.visitorName} has left.`);

  res.json(presentVisitor(updated, true));
});

// GET /api/admin/visitors/history — searchable full history (admin + security)
export const visitorHistory = asyncHandler(async (req: Request, res: Response) => {
  const { q, dateFrom, dateTo } = req.query as Record<string, string | undefined>;
  const where: any = {};

  if (q) {
    where.OR = [
      { visitorName: { contains: q, mode: 'insensitive' } },
      { id: { contains: q.toUpperCase(), mode: 'insensitive' } },
      { resident: { firstName: { contains: q, mode: 'insensitive' } } },
      { resident: { lastName: { contains: q, mode: 'insensitive' } } },
    ];
  }
  if (dateFrom || dateTo) {
    where.expectedDate = {
      ...(dateFrom ? { gte: startOfDay(new Date(dateFrom)) } : {}),
      ...(dateTo ? { lte: endOfDay(new Date(dateTo)) } : {}),
    };
  }

  const visitors = await prisma.visitor.findMany({
    where,
    include: visitorInclude,
    orderBy: [{ expectedDate: 'desc' }, { expectedFrom: 'asc' }],
  });

  res.json(visitors.map((v) => presentVisitor(v, true)));
});

// Marks AWAITING_CHECKIN visitors from past days as NO_SHOW. Call this from
// the dashboard load and/or wire it to a daily cron in production.
export const markNoShows = asyncHandler(async (_req: Request, res: Response) => {
  const result = await prisma.visitor.updateMany({
    where: { status: 'AWAITING_CHECKIN', expectedDate: { lt: startOfDay(new Date()) } },
    data: { status: 'NO_SHOW' },
  });
  res.json({ updated: result.count });
});

// ── Incident reports ────────────────────────────────────────────────────
// Deliberately separate from audit_logs so the append-only trail can never
// be contaminated by investigation notes (build guide, Phase 8).

// POST /api/incidents — admin or security
export const createIncident = asyncHandler(async (req: Request, res: Response) => {
  const data = incidentReportSchema.parse(req.body);
  const incident = await prisma.incidentReport.create({
    data: {
      visitorId: data.visitorId,
      residentId: data.residentId,
      description: data.description,
      peopleInvolved: data.peopleInvolved,
      createdBy: req.user!.userId,
    },
    include: {
      visitor: true,
      resident: { select: { firstName: true, lastName: true, studentNumber: true } },
      creator: { select: { email: true } },
    },
  });
  res.status(201).json(incident);
});

// GET /api/incidents — admin or security
export const listIncidents = asyncHandler(async (_req: Request, res: Response) => {
  const incidents = await prisma.incidentReport.findMany({
    include: {
      visitor: true,
      resident: { select: { firstName: true, lastName: true, studentNumber: true } },
      creator: { select: { email: true } },
    },
    orderBy: { createdAt: 'desc' },
  });
  res.json(incidents);
});
