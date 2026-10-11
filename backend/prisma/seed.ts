import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';

const prisma = new PrismaClient();

function hash(pw: string) {
  return bcrypt.hashSync(pw, 10);
}

// Mirrors src/utils/crypto.ts so seeded visitor ID numbers decrypt correctly
// at runtime (this script runs stand-alone, outside the app process).
function encrypt(plainText: string): string {
  const PASSPHRASE = process.env.ENCRYPTION_KEY ?? 'dev-only-insecure-passphrase';
  const KEY = crypto.scryptSync(PASSPHRASE, 'student-accommodation-fixed-salt', 32);
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv('aes-256-cbc', KEY, iv);
  const encrypted = Buffer.concat([cipher.update(plainText, 'utf8'), cipher.final()]);
  return `${iv.toString('hex')}:${encrypted.toString('hex')}`;
}

async function main() {
  console.log('Seeding database...');

  // ── Buildings / rooms / beds ──────────────────────────────────────────
  const blockA = await prisma.building.create({
    data: { name: 'Block A', address: '12 Jorissen Street, Braamfontein' },
  });
  const blockB = await prisma.building.create({
    data: { name: 'Block B', address: '14 Jorissen Street, Braamfontein' },
  });

  const room204 = await prisma.room.create({
    data: {
      buildingId: blockA.id,
      roomNumber: '204',
      floor: 2,
      capacity: 2,
      beds: { create: [{ label: 'A' }, { label: 'B' }] },
    },
    include: { beds: true },
  });

  await prisma.room.create({
    data: {
      buildingId: blockA.id,
      roomNumber: '101',
      floor: 1,
      capacity: 2,
      beds: { create: [{ label: 'A' }, { label: 'B' }] },
    },
  });

  await prisma.room.create({
    data: {
      buildingId: blockB.id,
      roomNumber: '102',
      floor: 1,
      capacity: 3,
      beds: { create: [{ label: 'A' }, { label: 'B' }, { label: 'C' }] },
    },
  });

  // ── Users ──────────────────────────────────────────────────────────────
  const admin = await prisma.user.create({
    data: { email: 'admin@accommodation.test', passwordHash: hash('Admin123!'), role: 'ADMIN' },
  });

  const security = await prisma.user.create({
    data: { email: 'security@accommodation.test', passwordHash: hash('Security123!'), role: 'SECURITY' },
  });

  const residentUser = await prisma.user.create({
    data: { email: 'phathu@accommodation.test', passwordHash: hash('Resident123!'), role: 'RESIDENT' },
  });

  const bedB = room204.beds.find((b) => b.label === 'B')!;

  const resident = await prisma.resident.create({
    data: {
      userId: residentUser.id,
      studentNumber: '2024178452',
      firstName: 'Phathutshedzo',
      lastName: 'Ramakuela',
      phone: '+27 71 234 5678',
      course: 'Advanced Diploma in App Development',
      school: 'IIE Rosebank College',
      bedId: bedB.id,
    },
  });

  // A second resident, unassigned, with a pending application — handy for
  // demoing the admin "Applications" review queue and bed-assignment flow.
  const secondUser = await prisma.user.create({
    data: { email: 'thabo@accommodation.test', passwordHash: hash('Resident123!'), role: 'RESIDENT' },
  });
  const secondResident = await prisma.resident.create({
    data: {
      userId: secondUser.id,
      studentNumber: '2024199021',
      firstName: 'Thabo',
      lastName: 'Mokoena',
      phone: '+27 82 555 1122',
      course: 'BSc Computer Science',
      school: 'University of the Witwatersrand',
    },
  });

  // ── Application (already room-assigned, for the first resident) ────────
  await prisma.application.create({
    data: {
      residentId: resident.id,
      status: 'ROOM_ASSIGNED',
      bedId: bedB.id,
      moveInDate: new Date('2027-02-01'),
      submittedAt: new Date('2027-01-22'),
      reviewedBy: admin.id,
      reviewedAt: new Date('2027-01-25'),
    },
  });

  // Pending application for the second resident
  await prisma.application.create({
    data: {
      residentId: secondResident.id,
      status: 'SUBMITTED',
      buildingPreference: 'Block B',
      submittedAt: new Date(),
    },
  });

  // ── Charges & payments ──────────────────────────────────────────────────
  await prisma.accountCharge.createMany({
    data: [
      { residentId: resident.id, type: 'ACCOMMODATION', amount: 7500, period: '2027-02', addedBy: admin.id },
      { residentId: resident.id, type: 'ELECTRICITY', amount: 500, period: '2027-02', addedBy: admin.id },
      { residentId: resident.id, type: 'LAUNDRY', amount: 500, period: '2027-02', addedBy: admin.id },
      { residentId: resident.id, type: 'ACCOMMODATION', amount: 7500, period: '2027-01', addedBy: admin.id },
      { residentId: resident.id, type: 'ELECTRICITY', amount: 500, period: '2027-01', addedBy: admin.id },
    ],
  });

  await prisma.payment.createMany({
    data: [
      { residentId: resident.id, amount: 7500, description: 'Accommodation — Jan', paidAt: new Date('2027-01-15'), recordedBy: admin.id },
      { residentId: resident.id, amount: 500, description: 'Electricity — Jan', paidAt: new Date('2027-01-15'), recordedBy: admin.id },
    ],
  });

  // ── Complaints ───────────────────────────────────────────────────────
  await prisma.complaint.create({
    data: {
      id: 'COM-2027-00001',
      residentId: resident.id,
      category: 'PLUMBING',
      title: 'Toilet not flushing properly',
      description: 'The toilet in room 204 has weak flush pressure and sometimes does not clear.',
      priority: 'MEDIUM',
      status: 'OPEN',
    },
  });

  await prisma.complaint.create({
    data: {
      id: 'COM-2027-00002',
      residentId: resident.id,
      category: 'LIFT',
      title: 'Lift stuck between floors yesterday evening',
      description: 'Lift 2 stopped between the 1st and 2nd floor for about 5 minutes around 9pm.',
      priority: 'HIGH',
      status: 'IN_PROGRESS',
      assignedTo: admin.id,
    },
  });

  // ── Visitors ─────────────────────────────────────────────────────────
  const today = new Date();
  await prisma.visitor.create({
    data: {
      id: 'VIS-000001',
      residentId: resident.id,
      visitorName: 'Michael Johnson',
      phone: '+27 73 999 1234',
      idNumber: encrypt('9001015800087'),
      expectedDate: today,
      expectedFrom: '18:00',
      expectedUntil: '22:00',
      purpose: 'Study group',
      status: 'AWAITING_CHECKIN',
    },
  });

  const checkedInVisitor = await prisma.visitor.create({
    data: {
      id: 'VIS-000002',
      residentId: secondResident.id,
      visitorName: 'Sarah Dlamini',
      phone: '+27 71 222 3344',
      idNumber: encrypt('9512120012083'),
      expectedDate: today,
      expectedFrom: '14:00',
      expectedUntil: '18:00',
      purpose: 'Family visit',
      status: 'CHECKED_IN',
      checkedInAt: new Date(),
      checkedInBy: security.id,
    },
  });
  void checkedInVisitor;

  // ── Announcement ─────────────────────────────────────────────────────
  await prisma.announcement.create({
    data: {
      title: 'Water interruption — Block A, 10 Oct',
      body: 'Municipal maintenance will interrupt water supply to Block A from 09:00 to 13:00 on 10 October. Please store water in advance.',
      createdBy: admin.id,
    },
  });

  console.log('Seed complete.');
  console.log('');
  console.log('Demo logins:');
  console.log('  Admin:    admin@accommodation.test / Admin123!');
  console.log('  Security: security@accommodation.test / Security123!');
  console.log('  Resident: phathu@accommodation.test / Resident123!  (room-assigned, has charges/payments/complaints)');
  console.log('  Resident: thabo@accommodation.test / Resident123!   (pending application, no room yet)');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
