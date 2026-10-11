import { prisma } from './prisma';
import type { Prisma } from '@prisma/client';

/**
 * Append a row to audit_logs. This table is append-only — nothing in this
 * codebase should ever call auditLog.delete / deleteMany.
 */
export async function createAuditLog(
  userId: string | null,
  action: string,
  targetType: string,
  targetId: string | null,
  oldValue: Prisma.InputJsonValue | null,
  newValue: Prisma.InputJsonValue | null
) {
  return prisma.auditLog.create({
    data: {
      userId: userId ?? undefined,
      action,
      targetType,
      targetId: targetId ?? undefined,
      oldValue: oldValue ?? undefined,
      newValue: newValue ?? undefined,
    },
  });
}
