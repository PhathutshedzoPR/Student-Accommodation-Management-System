import type { Request, Response } from 'express';
import { prisma } from '../utils/prisma';
import { asyncHandler, ApiError } from '../middleware/errorHandler';
import { createBuildingSchema, createRoomSchema, assignBedSchema } from '../validators/accommodation.validators';
import { createAuditLog } from '../utils/audit';
import { assignResidentToBed } from '../services/accommodationService';

// GET /api/buildings — any authenticated user; just names/addresses, used to
// populate the "building preference" dropdown on the application form.
export const listPublicBuildings = asyncHandler(async (_req: Request, res: Response) => {
  const buildings = await prisma.building.findMany({
    select: { id: true, name: true, address: true },
    orderBy: { name: 'asc' },
  });
  res.json(buildings);
});

// GET /api/admin/buildings
export const listBuildings = asyncHandler(async (_req: Request, res: Response) => {
  const buildings = await prisma.building.findMany({
    include: { rooms: { include: { beds: { include: { resident: true } } } } },
    orderBy: { name: 'asc' },
  });
  res.json(buildings);
});

// POST /api/admin/buildings
export const createBuilding = asyncHandler(async (req: Request, res: Response) => {
  const data = createBuildingSchema.parse(req.body);
  const building = await prisma.building.create({ data });
  res.status(201).json(building);
});

// POST /api/admin/buildings/:id/rooms — also creates its beds
export const createRoom = asyncHandler(async (req: Request, res: Response) => {
  const data = createRoomSchema.parse(req.body);
  const building = await prisma.building.findUnique({ where: { id: req.params.id } });
  if (!building) throw new ApiError(404, 'Building not found');

  const labels = data.bedLabels?.length
    ? data.bedLabels
    : ['A', 'B', 'C', 'D'].slice(0, data.capacity);

  const room = await prisma.room.create({
    data: {
      buildingId: building.id,
      roomNumber: data.roomNumber,
      floor: data.floor,
      capacity: data.capacity,
      beds: { create: labels.map((label) => ({ label })) },
    },
    include: { beds: true },
  });

  res.status(201).json(room);
});

// GET /api/admin/rooms — table with occupancy counts, per the build guide
export const listRooms = asyncHandler(async (req: Request, res: Response) => {
  const buildingId = req.query.buildingId as string | undefined;
  const rooms = await prisma.room.findMany({
    where: buildingId ? { buildingId } : undefined,
    include: { building: true, beds: { include: { resident: true } } },
    orderBy: [{ building: { name: 'asc' } }, { roomNumber: 'asc' }],
  });

  const withOccupancy = rooms.map((room) => ({
    ...room,
    occupied: room.beds.filter((b) => b.resident).length,
    capacity: room.beds.length,
  }));

  res.json(withOccupancy);
});

// GET /api/admin/rooms/:id/beds
export const getRoomBeds = asyncHandler(async (req: Request, res: Response) => {
  const beds = await prisma.bed.findMany({
    where: { roomId: req.params.id },
    include: { resident: true },
    orderBy: { label: 'asc' },
  });
  res.json(beds);
});

// PUT /api/admin/beds/:id/assign — body: { residentId }
export const assignBed = asyncHandler(async (req: Request, res: Response) => {
  const { residentId } = assignBedSchema.parse(req.body);
  const bed = await assignResidentToBed(req.params.id, residentId, req.user!.userId);
  res.json(bed);
});

// PUT /api/admin/beds/:id/vacate — free up a bed (reassignment / resident leaving)
export const vacateBed = asyncHandler(async (req: Request, res: Response) => {
  const bed = await prisma.bed.findUnique({ where: { id: req.params.id }, include: { resident: true } });
  if (!bed) throw new ApiError(404, 'Bed not found');
  if (!bed.resident) throw new ApiError(400, 'Bed is already vacant');

  await prisma.resident.update({ where: { id: bed.resident.id }, data: { bedId: null } });
  await createAuditLog(req.user!.userId, 'BED_VACATED', 'resident', bed.resident.id, { bedId: bed.id, label: bed.label }, null);

  res.json({ message: 'Bed vacated' });
});
