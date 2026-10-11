import type { Request, Response } from 'express';
import { prisma } from '../utils/prisma';
import { asyncHandler } from '../middleware/errorHandler';

// GET /api/admin/audit-logs?targetType=&action=&page=
export const listAuditLogs = asyncHandler(async (req: Request, res: Response) => {
  const { targetType, action, q } = req.query as Record<string, string | undefined>;
  const page = Math.max(1, Number(req.query.page) || 1);
  const pageSize = 50;

  const where: any = {
    ...(targetType ? { targetType } : {}),
    ...(action ? { action: { contains: action, mode: 'insensitive' } } : {}),
    ...(q ? { targetId: { contains: q, mode: 'insensitive' } } : {}),
  };

  const [items, total] = await Promise.all([
    prisma.auditLog.findMany({
      where,
      include: { user: { select: { email: true, role: true } } },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.auditLog.count({ where }),
  ]);

  res.json({ items, total, page, pageSize, totalPages: Math.ceil(total / pageSize) });
});
