export type Role = 'RESIDENT' | 'ADMIN' | 'SECURITY';

export type ApplicationStatus = 'SUBMITTED' | 'DOCUMENTS_VERIFIED' | 'APPROVED' | 'REJECTED' | 'ROOM_ASSIGNED';
export type DocumentType = 'STUDENT_ID' | 'PROOF_OF_REGISTRATION' | 'PROOF_OF_PAYMENT' | 'OTHER';
export type ChargeType = 'ACCOMMODATION' | 'ELECTRICITY' | 'LAUNDRY' | 'OTHER';
export type ComplaintCategory =
  | 'PLUMBING'
  | 'ELECTRICAL'
  | 'LIFT'
  | 'INTERNET'
  | 'CLEANING'
  | 'SECURITY'
  | 'FURNITURE'
  | 'NOISE'
  | 'OTHER';
export type ComplaintPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
export type ComplaintStatus = 'OPEN' | 'ASSIGNED' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED';
export type VisitorStatus = 'AWAITING_CHECKIN' | 'CHECKED_IN' | 'CHECKED_OUT' | 'NO_SHOW';
export type NotificationType = 'APPLICATION' | 'COMPLAINT' | 'VISITOR' | 'ANNOUNCEMENT' | 'PAYMENT';

export interface Building {
  id: string;
  name: string;
  address: string;
  rooms?: Room[];
}

export interface Room {
  id: string;
  buildingId: string;
  roomNumber: string;
  floor: number;
  capacity: number;
  beds: Bed[];
  building?: Building;
  occupied?: number;
}

export interface Bed {
  id: string;
  roomId: string;
  label: string;
  resident?: Resident | null;
  room?: Room;
}

export interface Resident {
  id: string;
  userId: string;
  studentNumber: string;
  firstName: string;
  lastName: string;
  phone: string;
  course: string;
  school: string;
  bedId?: string | null;
  bed?: Bed | null;
  createdAt: string;
  user?: { email: string };
}

export interface ApplicationDocument {
  id: string;
  applicationId: string;
  type: DocumentType;
  fileUrl: string;
  fileName: string;
  uploadedAt: string;
}

export interface Application {
  id: string;
  residentId: string;
  status: ApplicationStatus;
  bedId?: string | null;
  bed?: Bed | null;
  moveInDate?: string | null;
  buildingPreference?: string | null;
  roomTypePreference?: string | null;
  rejectionReason?: string | null;
  submittedAt: string;
  reviewedBy?: string | null;
  reviewedAt?: string | null;
  documents: ApplicationDocument[];
  resident?: { firstName: string; lastName: string; studentNumber: string; phone: string };
}

export interface AccountCharge {
  id: string;
  residentId: string;
  type: ChargeType;
  amount: string;
  period: string;
  createdAt: string;
}

export interface Payment {
  id: string;
  residentId: string;
  amount: string;
  description: string;
  paidAt: string;
}

export interface Balance {
  balance: string;
  totalCharges: string;
  totalPayments: string;
  charges: AccountCharge[];
  payments: Payment[];
}

export interface ComplaintNote {
  id: string;
  note: string;
  createdAt: string;
  author: { email: string };
}

export interface Complaint {
  id: string;
  residentId: string;
  category: ComplaintCategory;
  title: string;
  description: string;
  priority: ComplaintPriority;
  status: ComplaintStatus;
  assignedTo?: string | null;
  assignee?: { id: string; email: string } | null;
  photoUrl?: string | null;
  notes: ComplaintNote[];
  createdAt: string;
  updatedAt: string;
  resident?: { firstName: string; lastName: string; studentNumber: string };
}

export interface Visitor {
  id: string;
  residentId: string;
  visitorName: string;
  phone: string;
  idNumber?: string; // only present for admin/security
  expectedDate: string;
  expectedFrom: string;
  expectedUntil: string;
  purpose: string;
  status: VisitorStatus;
  checkedInAt?: string | null;
  checkedOutAt?: string | null;
  createdAt: string;
  resident?: {
    firstName: string;
    lastName: string;
    studentNumber: string;
    bed?: Bed | null;
  };
}

export interface IncidentReport {
  id: string;
  visitorId?: string | null;
  residentId?: string | null;
  description: string;
  peopleInvolved?: string | null;
  createdAt: string;
  visitor?: Visitor | null;
  resident?: { firstName: string; lastName: string; studentNumber: string } | null;
  creator: { email: string };
}

export interface AuditLog {
  id: string;
  userId?: string | null;
  action: string;
  targetType: string;
  targetId?: string | null;
  oldValue?: unknown;
  newValue?: unknown;
  createdAt: string;
  user?: { email: string; role: Role } | null;
}

export interface Announcement {
  id: string;
  title: string;
  body: string;
  createdAt: string;
  creator?: { email: string };
}

export interface NotificationItem {
  id: string;
  type: NotificationType;
  message: string;
  read: boolean;
  createdAt: string;
}

export interface StaffUser {
  id: string;
  email: string;
  role: Role;
}
