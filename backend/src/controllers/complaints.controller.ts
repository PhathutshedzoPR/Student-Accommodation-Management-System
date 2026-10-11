import type { Request, Response } from 'express';
import { prisma } from '../utils/prisma';
import { asyncHandler, ApiError } from '../middleware/errorHandler';
import { createComplaintSchema, updateComplaintSchema } from '../validators/complaint.validators';
import { generateComplaintId } from '../utils/generateId';
import { createAuditLog } from '../utils/audit';
import { notifyResident } from '../utils/notify';
import { fileUrl } from '../utils/upload';

const complaintInclude = {
  resident: { select: { firstName: true, lastName: true, studentNumber: true } },
  assignee: { select: { id: true, email: true } },
  notes: { include: { author: { select: { email: true } } }, orderBy: { createdAt: 'asc' as const } },
};

async function residentIdForUser(userId: string) {
  const resident = await prisma.resident.findUnique({ where: { userId } });
  if (!resident) throw new ApiError(404, 'Resident profile not found');
  return resident.id;
}

// POST /api/complaints — resident creates (multipart form, optional "photo")
export const createComplaint = asyncHandler(async (req: Request, res: Response) => {
  const data = createComplaintSchema.parse(req.body);
  const residentId = await residentIdForUser(req.user!.userId);
  const id = await generateComplaintId();

  const complaint = await prisma.complaint.create({
    data: {
      id,
      residentId,
      category: data.category,
      title: data.title,
      description: data.description,
      priority: data.priority,
      photoUrl: req.file ? fileUrl(req.file.filename) : undefined,
    },
    include: complaintInclude,
  });

  await createAuditLog(req.user!.userId, 'COMPLAINT_CREATED', 'complaint', complaint.id, null, { category: data.category, priority: data.priority });

  res.status(201).json(complaint);
});

// GET /api/complaints — resident: own; admin: all. Supports ?status=&category=&priority=&count=true
export const listComplaints = asyncHandler(async (req: Request, res: Response) => {
  const { status, category, priority, count } = req.query as Record<string, string | undefined>;
  const isAdmin = req.user!.role === 'ADMIN';

  const where: any = {
    ...(status ? { status } : {}),
    ...(category ? { category } : {}),
    ...(priority ? { priority } : {}),
  };

  if (!isAdmin) {
    where.residentId = await residentIdForUser(req.user!.userId);
  }

  if (count === 'true') {
    return res.json({ count: await prisma.complaint.count({ where }) });
  }

  const complaints = await prisma.complaint.findMany({
    where,
    include: complaintInclude,
    orderBy: { createdAt: 'desc' },
  });
  res.json(complaints);
});

// GET /api/complaints/:id
export const getComplaint = asyncHandler(async (req: Request, res: Response) => {
  const complaint = await prisma.complaint.findUnique({ where: { id: req.params.id }, include: complaintInclude });
  if (!complaint) throw new ApiError(404, 'Complaint not found');

  if (req.user!.role === 'RESIDENT') {
    const residentId = await residentIdForUser(req.user!.userId);
    if (complaint.residentId !== residentId) throw new ApiError(403, 'Forbidden');
  }

  res.json(complaint);
});

// PUT /api/complaints/:id — admin: update status, assignment, notes, priority
export const updateComplaint = asyncHandler(async (req: Request, res: Response) => {
  const data = updateComplaintSchema.parse(req.body);
  const complaint = await prisma.complaint.findUnique({ where: { id: req.params.id } });
  if (!complaint) throw new ApiError(404, 'Complaint not found');

  const oldValue = { status: complaint.status, priority: complaint.priority, assignedTo: complaint.assignedTo };

  const updated = await prisma.complaint.update({
    where: { id: complaint.id },
    data: {
      status: data.status,
      priority: data.priority,
      assignedTo: data.assignedTo === null ? null : data.assignedTo,
      photoUrl: req.file ? fileUrl(req.file.filename) : undefined,
    },
    include: complaintInclude,
  });

  if (data.note) {
    await prisma.complaintNote.create({
      data: { complaintId: complaint.id, authorId: req.user!.userId, note: data.note },
    });
  }

  await createAuditLog(req.user!.userId, 'COMPLAINT_UPDATED', 'complaint', complaint.id, oldValue, {
    status: updated.status,
    priority: updated.priority,
    assignedTo: updated.assignedTo,
  });

  if (data.status && data.status !== complaint.status) {
    await notifyResident(
      complaint.residentId,
      'COMPLAINT',
      `🔔 Your complaint ${complaint.id} is now ${data.status.replace('_', ' ')}.`
    );
  }

  const full = await prisma.complaint.findUnique({ where: { id: complaint.id }, include: complaintInclude });
  res.json(full);
});
