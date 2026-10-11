import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import ProtectedRoute from '@/components/ProtectedRoute';

import Login from '@/pages/auth/Login';
import Register from '@/pages/auth/Register';

import ResidentLayout from '@/layouts/ResidentLayout';
import ResidentDashboard from '@/pages/resident/Dashboard';
import ResidentApplication from '@/pages/resident/ApplicationStatus';
import ResidentRoom from '@/pages/resident/MyRoom';
import ResidentAccount from '@/pages/resident/Account';
import ResidentPayments from '@/pages/resident/Payments';
import ResidentComplaints from '@/pages/resident/Complaints';
import ResidentComplaintDetail from '@/pages/resident/ComplaintDetail';
import ResidentVisitors from '@/pages/resident/Visitors';
import ResidentNotifications from '@/pages/resident/Notifications';
import ResidentProfile from '@/pages/resident/Profile';

import AdminLayout from '@/layouts/AdminLayout';
import AdminDashboard from '@/pages/admin/Dashboard';
import AdminApplications from '@/pages/admin/Applications';
import AdminApplicationDetail from '@/pages/admin/ApplicationDetail';
import AdminResidents from '@/pages/admin/Residents';
import AdminResidentDetail from '@/pages/admin/ResidentDetail';
import AdminRooms from '@/pages/admin/Rooms';
import AdminPayments from '@/pages/admin/Payments';
import AdminComplaints from '@/pages/admin/Complaints';
import AdminComplaintDetail from '@/pages/admin/ComplaintDetail';
import AdminVisitors from '@/pages/admin/Visitors';
import AdminAnnouncements from '@/pages/admin/Announcements';
import AdminAuditLogs from '@/pages/admin/AuditLogs';
import AdminReports from '@/pages/admin/Reports';

import SecurityLayout from '@/layouts/SecurityLayout';
import SecurityDashboard from '@/pages/security/Dashboard';
import SecurityToday from '@/pages/security/TodayVisitors';
import SecurityCheckIn from '@/pages/security/CheckIn';
import SecurityCheckOut from '@/pages/security/CheckOut';
import SecurityCurrent from '@/pages/security/CurrentVisitors';
import SecurityHistory from '@/pages/security/VisitorHistory';
import SecurityIncidents from '@/pages/security/IncidentReports';

function RoleHome() {
  const { role } = useAuth();
  if (role === 'ADMIN') return <Navigate to="/admin/dashboard" replace />;
  if (role === 'SECURITY') return <Navigate to="/security/dashboard" replace />;
  if (role === 'RESIDENT') return <Navigate to="/resident/dashboard" replace />;
  return <Navigate to="/login" replace />;
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<RoleHome />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      <Route element={<ProtectedRoute role="RESIDENT" />}>
        <Route element={<ResidentLayout />}>
          <Route path="/resident/dashboard" element={<ResidentDashboard />} />
          <Route path="/resident/application" element={<ResidentApplication />} />
          <Route path="/resident/room" element={<ResidentRoom />} />
          <Route path="/resident/account" element={<ResidentAccount />} />
          <Route path="/resident/payments" element={<ResidentPayments />} />
          <Route path="/resident/complaints" element={<ResidentComplaints />} />
          <Route path="/resident/complaints/:id" element={<ResidentComplaintDetail />} />
          <Route path="/resident/visitors" element={<ResidentVisitors />} />
          <Route path="/resident/notifications" element={<ResidentNotifications />} />
          <Route path="/resident/profile" element={<ResidentProfile />} />
        </Route>
      </Route>

      <Route element={<ProtectedRoute role="ADMIN" />}>
        <Route element={<AdminLayout />}>
          <Route path="/admin/dashboard" element={<AdminDashboard />} />
          <Route path="/admin/applications" element={<AdminApplications />} />
          <Route path="/admin/applications/:id" element={<AdminApplicationDetail />} />
          <Route path="/admin/residents" element={<AdminResidents />} />
          <Route path="/admin/residents/:id" element={<AdminResidentDetail />} />
          <Route path="/admin/rooms" element={<AdminRooms />} />
          <Route path="/admin/payments" element={<AdminPayments />} />
          <Route path="/admin/complaints" element={<AdminComplaints />} />
          <Route path="/admin/complaints/:id" element={<AdminComplaintDetail />} />
          <Route path="/admin/visitors" element={<AdminVisitors />} />
          <Route path="/admin/announcements" element={<AdminAnnouncements />} />
          <Route path="/admin/audit-logs" element={<AdminAuditLogs />} />
          <Route path="/admin/reports" element={<AdminReports />} />
        </Route>
      </Route>

      <Route element={<ProtectedRoute role="SECURITY" />}>
        <Route element={<SecurityLayout />}>
          <Route path="/security/dashboard" element={<SecurityDashboard />} />
          <Route path="/security/today" element={<SecurityToday />} />
          <Route path="/security/check-in" element={<SecurityCheckIn />} />
          <Route path="/security/check-out" element={<SecurityCheckOut />} />
          <Route path="/security/current" element={<SecurityCurrent />} />
          <Route path="/security/history" element={<SecurityHistory />} />
          <Route path="/security/incidents" element={<SecurityIncidents />} />
        </Route>
      </Route>

      <Route path="*" element={<RoleHome />} />
    </Routes>
  );
}
