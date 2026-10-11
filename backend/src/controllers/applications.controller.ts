import type { Request, Response } from 'express';
import { prisma } from '../utils/prisma';
import { asyncHandler, ApiError } from '../middleware/errorHandler';
import { submitApplicationSchema, reviewApplicationSchema } from '../validators/application.validators';
import { createAuditLog } from '../utils/audit';
import { notifyResident } from '../utils/notify';
import { assignResidentToBed } from '../services/accommodationService';
import { fileUrl } from '../utils/upload';

const applicationInclude = {
  documents: true,
  bed: { include: { room: { include: { building: true } } } },
  resident: { select: { firstName: true, lastName: true, studentNumber: true, phone: true } },
};

async function getResidentOrThrow(userId: string) {
  const resident = await prisma.resident.findUnique({ where: { userId } });
  if (!resident) throw new ApiError(404, 'Resident profile not found');
  return resident;
}

// POST /api/applications — resident submits (or re-submits after rejection)
export const submitApplication = asyncHandler(async (req: Request, res: Response) => {
  const data = submitApplicationSchema.parse(req.body);
  const resident = await getResidentOrThrow(req.user!.userId);

  const existing = await prisma.application.findFirst({
    where: { residentId: resident.id, status: { notIn: ['REJECTED'] } },
  });
  if (existing) {
    throw new ApiError(409, 'You already have an active application on file');
  }

  const application = await prisma.application.create({
    data: {
      residentId: resident.id,
      moveInDate: data.moveInDate ? new Date(data.moveInDate) : undefined,
      buildingPreference: data.buildingPreference,
      roomTypePreference: data.roomTypePreference,
    },
    include: applicationInclude,
  });

  await createAuditLog(req.user!.userId, 'APPLICATION_SUBMITTED', 'application', application.id, null, {
    status: application.status,
  });

  res.status(201).json(application);
});

// POST /api/applications/:id/documents — upload one document (multer "file")
export const uploadApplicationDocument = asyncHandler(async (req: Request, res: Response) => {
  const resident = await getResidentOrThrow(req.user!.userId);
  const application = await prisma.application.findUnique({ where: { id: req.params.id } });
  if (!application || application.residentId !== resident.id) {
    throw new ApiError(404, 'Application not found');
  }
  if (!req.file) throw new ApiError(400, 'No file uploaded');

  const type = (req.body.type as string) ?? 'OTHER';
  const doc = await prisma.applicationDocument.create({
    data: {
      applicationId: application.id,
      type: type as any,
      fileUrl: fileUrl(req.file.filename),
      fileName: req.file.originalname,
    },
  });

  res.status(201).json(doc);
});

// GET /api/applications/me
export const getMyApplication = asyncHandler(async (req: Request, res: Response) => {
  const resident = await getResidentOrThrow(req.user!.userId);
  const application = await prisma.application.findFirst({
    where: { residentId: resident.id },
    orderBy: { submittedAt: 'desc' },
    include: applicationInclude,
  });
  res.json(application);
});

// GET /api/admin/applications?status=&page=
export const listApplications = asyncHandler(async (req: Request, res: Response) => {
  const status = req.query.status as string | undefined;
  const page = Math.max(1, Number(req.query.page) || 1);
  const pageSize = 20;

  const where = status ? { status: status as any } : {};

  const [items, total] = await Promise.all([
    prisma.application.findMany({
      where,
      include: applicationInclude,
      orderBy: { submittedAt: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.application.count({ where }),
  ]);

  res.json({ items, total, page, pageSize, totalPages: Math.ceil(total / pageSize) });
});

// GET /api/admin/applications/:id
export const getApplication = asyncHandler(async (req: Request, res: Response) => {
  const application = await prisma.application.findUnique({
    where: { id: req.params.id },
    include: applicationInclude,
  });
  if (!application) throw new ApiError(404, 'Application not found');
  res.json(application);
});

// GET /api/admin/beds/available — vacant beds for the approve/assign picker
export const listAvailableBeds = asyncHandler(async (_req: Request, res: Response) => {
  const beds = await prisma.bed.findMany({
    where: { resident: null },
    include: { room: { include: { building: true } } },
    orderBy: [{ room: { building: { name: 'asc' } } }, { room: { roomNumber: 'asc' } }, { label: 'asc' }],
  });
  res.json(beds);
});

// PUT /api/admin/applications/:id — approve / reject / verify documents
export const reviewApplication = asyncHandler(async (req: Request, res: Response) => {
  const data = reviewApplicationSchema.parse(req.body);
  const application = await prisma.application.findUnique({ where: { id: req.params.id } });
  if (!application) throw new ApiError(404, 'Application not found');

  const adminId = req.user!.userId;
  const oldStatus = application.status;

  if (data.action === 'VERIFY_DOCUMENTS') {
    const updated = await prisma.application.update({
      where: { id: application.id },
      data: { status: 'DOCUMENTS_VERIFIED', reviewedBy: adminId, reviewedAt: new Date() },
      include: applicationInclude,
    });
    await createAuditLog(adminId, 'APPLICATION_DOCUMENTS_VERIFIED', 'application', application.id, { status: oldStatus }, { status: updated.status });
    return res.json(updated);
  }

  if (data.action === 'REJECT') {
    const updated = await prisma.application.update({
      where: { id: application.id },
      data: {
        status: 'REJECTED',
        rejectionReason: data.rejectionReason ?? 'No reason given',
        reviewedBy: adminId,
        reviewedAt: new Date(),
      },
      include: applicationInclude,
    });
    await createAuditLog(adminId, 'APPLICATION_REJECTED', 'application', application.id, { status: oldStatus }, { status: updated.status, reason: data.rejectionReason });
    return res.json(updated);
  }

  if (data.action === 'APPROVE') {
    // Approving selects a bed from available options and assigns it in one
    // step, matching the build guide's admin review flow.
    if (!data.bedId) throw new ApiError(400, 'bedId is required to approve an application');

    await assignResidentToBed(data.bedId as string, application.residentId, adminId);
    const result = await prisma.application.update({
      where: { id: application.id },
      data: {
        status: 'ROOM_ASSIGNED',
        bedId: data.bedId,
        moveInDate: data.moveInDate ? new Date(data.moveInDate) : application.moveInDate,
        reviewedBy: adminId,
        reviewedAt: new Date(),
      },
      include: applicationInclude,
    });

    await createAuditLog(adminId, 'APPLICATION_APPROVED', 'application', application.id, { status: oldStatus }, { status: result.status, bedId: data.bedId });

    await notifyResident(
      application.residentId,
      'APPLICATION',
      `🎉 Your application was approved and a room has been assigned. Check "My Room" for details.`
    );

    return res.json(result);
  }

  if (data.action === 'ASSIGN_ROOM') {
    if (!data.bedId) throw new ApiError(400, 'bedId is required');
    await assignResidentToBed(data.bedId as string, application.residentId, adminId);
    const result = await prisma.application.update({
      where: { id: application.id },
      data: { status: 'ROOM_ASSIGNED', bedId: data.bedId, moveInDate: data.moveInDate ? new Date(data.moveInDate) : application.moveInDate },
      include: applicationInclude,
    });
    await createAuditLog(adminId, 'APPLICATION_ROOM_ASSIGNED', 'application', application.id, { status: oldStatus }, { status: result.status, bedId: data.bedId });
    await notifyResident(application.residentId, 'APPLICATION', `🏠 A room has been assigned to you. Check "My Room" for details.`);
    return res.json(result);
  }

  throw new ApiError(400, 'Unknown action');
});
