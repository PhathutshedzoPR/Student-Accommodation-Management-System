import { prisma } from './prisma';

/**
 * Human-readable complaint ticket ID: COM-YYYY-NNNNN
 * e.g. COM-2027-00142
 */
export async function generateComplaintId(): Promise<string> {
  const year = new Date().getFullYear();
  let candidate = '';
  let attempt = 0;

  do {
    const count = await prisma.complaint.count({
      where: { id: { startsWith: `COM-${year}-` } },
    });
    const n = count + 1 + attempt;
    candidate = `COM-${year}-${String(n).padStart(5, '0')}`;
    attempt++;
  } while ((await prisma.complaint.findUnique({ where: { id: candidate } })) && attempt < 20);

  return candidate;
}

/**
 * Human-readable visitor ID: VIS-NNNNNN
 * e.g. VIS-000123
 */
export async function generateVisitorId(): Promise<string> {
  let candidate = '';
  let attempt = 0;

  do {
    const count = await prisma.visitor.count();
    const n = count + 1 + attempt;
    candidate = `VIS-${String(n).padStart(6, '0')}`;
    attempt++;
  } while ((await prisma.visitor.findUnique({ where: { id: candidate } })) && attempt < 20);

  return candidate;
}
