import type { Request, Response } from 'express';
import { prisma } from '../utils/prisma';
import { asyncHandler, ApiError } from '../middleware/errorHandler';

const residentInclude = {
  bed: { include: { room: { include: { building: true } } } },
};

async function findResidentByUserId(userId: string) {
  const resident = await prisma.resident.findUnique({
    where: { userId },
    include: residentInclude,
  });
  if (!resident) throw new ApiError(404, 'Resident profile not found');
  return resident;
}

// GET /api/residents/me
export const getMe = asyncHandler(async (req: Request, res: Response) => {
  const resident = await findResidentByUserId(req.user!.userId);
  res.json(resident);
});

// PUT /api/residents/me — profile edits (phone, course, school)
export const updateMe = asyncHandler(async (req: Request, res: Response) => {
  const resident = await findResidentByUserId(req.user!.userId);
  const { phone, course, school } = req.body as { phone?: string; course?: string; school?: string };
  const updated = await prisma.resident.update({
    where: { id: resident.id },
    data: { phone, course, school },
    include: residentInclude,
  });
  res.json(updated);
});

// GET /api/residents/me/accommodation
export const getMyAccommodation = asyncHandler(async (req: Request, res: Response) => {
  const resident = await findResidentByUserId(req.user!.userId);
  if (!resident.bed) {
    return res.json({ assigned: false });
  }
  const latestApplication = await prisma.application.findFirst({
    where: { residentId: resident.id, status: 'ROOM_ASSIGNED' },
    orderBy: { reviewedAt: 'desc' },
  });
  res.json({
    assigned: true,
    building: resident.bed.room.building.name,
    roomNumber: resident.bed.room.roomNumber,
    floor: resident.bed.room.floor,
    bedLabel: resident.bed.label,
    moveInDate: latestApplication?.moveInDate ?? null,
  });
});

// GET /api/admin/residents — searchable list for the admin Residents page
// and for the "assign a resident to a bed" search box.
export const listResidents = asyncHandler(async (req: Request, res: Response) => {
  const q = (req.query.q as string | undefined)?.trim();
  const unassignedOnly = req.query.unassigned === 'true';

  const residents = await prisma.resident.findMany({
    where: {
      AND: [
        q
          ? {
              OR: [
                { firstName: { contains: q, mode: 'insensitive' } },
                { lastName: { contains: q, mode: 'insensitive' } },
                { studentNumber: { contains: q, mode: 'insensitive' } },
              ],
            }
          : {},
        unassignedOnly ? { bedId: null } : {},
      ],
    },
    include: { ...residentInclude, user: { select: { email: true } } },
    orderBy: { createdAt: 'desc' },
    take: 50,
  });

  res.json(residents);
});

// GET /api/admin/residents/:id
export const getResident = asyncHandler(async (req: Request, res: Response) => {
  const resident = await prisma.resident.findUnique({
    where: { id: req.params.id },
    include: { ...residentInclude, user: { select: { email: true } } },
  });
  if (!resident) throw new ApiError(404, 'Resident not found');
  res.json(resident);
});
