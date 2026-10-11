import { prisma } from '../utils/prisma';
import { createAuditLog } from '../utils/audit';
import { ApiError } from '../middleware/errorHandler';

/**
 * Assigns a resident to a bed. Shared by the admin "assign bed" endpoint and
 * the application-approval flow. Always writes a BED_ASSIGNED audit row with
 * the old and new bed, per the build guide.
 */
export async function assignResidentToBed(bedId: string, residentId: string, actingUserId: string) {
  const bed = await prisma.bed.findUnique({
    where: { id: bedId },
    include: { resident: true, room: { include: { building: true } } },
  });
  if (!bed) throw new ApiError(404, 'Bed not found');
  if (bed.resident && bed.resident.id !== residentId) {
    throw new ApiError(409, 'That bed is already occupied');
  }

  const resident = await prisma.resident.findUnique({ where: { id: residentId }, include: { bed: true } });
  if (!resident) throw new ApiError(404, 'Resident not found');

  const oldBed = resident.bed;

  // Free the resident's previous bed (if any) and occupy the new one.
  await prisma.$transaction(async (tx) => {
    if (oldBed && oldBed.id !== bedId) {
      await tx.resident.update({ where: { id: residentId }, data: { bedId: null } });
    }
    await tx.resident.update({ where: { id: residentId }, data: { bedId } });
  });

  await createAuditLog(
    actingUserId,
    'BED_ASSIGNED',
    'resident',
    residentId,
    oldBed ? { bedId: oldBed.id, label: oldBed.label } : null,
    { bedId: bed.id, label: bed.label, room: bed.room.roomNumber, building: bed.room.building.name }
  );

  return prisma.bed.findUnique({
    where: { id: bedId },
    include: { resident: true, room: { include: { building: true } } },
  });
}
