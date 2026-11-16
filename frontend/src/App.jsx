import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Layout } from './components/Layout';
import { LoginPage } from './pages/LoginPage';
import { SeniorAdminDashboard } from './pages/SeniorAdminDashboard';
import { BranchManagerDashboard } from './pages/BranchManagerDashboard';
import { EmployeeDashboard } from './pages/EmployeeDashboard';
import { BranchesPage } from './pages/BranchesPage';
import { EmployeesPage } from './pages/EmployeesPage';
import { AttendancePage } from './pages/AttendancePage';
import { WorkSheetsPage } from './pages/WorkSheetsPage';
import { TasksPage } from './pages/TasksPage';
import { DocumentsPage } from './pages/DocumentsPage';
import { LeavesPage } from './pages/LeavesPage';
import { PerformancePage } from './pages/PerformancePage';
import { ReportsPage } from './pages/ReportsPage';
import { AnalyticsPage } from './pages/AnalyticsPage';
import { AuditLogsPage } from './pages/AuditLogsPage';
import { SettingsPage } from './pages/SettingsPage';

// Protected Route Component
const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, token, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-navy-950 flex items-center justify-center text-white">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-gold-400 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-xs uppercase tracking-widest text-gold-300 font-medium">
            Authenticating AAV Partners Workspace...
          </span>
        </div>
      </div>
    );
  }

  if (!token || !user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    // Redirect to their default dashboard if unauthorized
    if (user.role === 'senior_admin') return <Navigate to="/admin/dashboard" replace />;
    if (user.role === 'branch_manager') return <Navigate to="/manager/dashboard" replace />;
    return <Navigate to="/employee/dashboard" replace />;
  }

  return children;
};

// Root Dashboard Redirector based on user's role
const RoleHomeRedirect = () => {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user) return <Navigate to="/login" replace />;

  if (user.role === 'senior_admin') return <Navigate to="/admin/dashboard" replace />;
  if (user.role === 'branch_manager') return <Navigate to="/manager/dashboard" replace />;
  return <Navigate to="/employee/dashboard" replace />;
};

export const App = () => {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Login */}
          <Route path="/login" element={<LoginPage />} />

          {/* Root redirect */}
          <Route path="/" element={<RoleHomeRedirect />} />

          {/* Protected Application Routes inside Corporate Layout */}
          <Route
            element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }
          >
            {/* Dashboards */}
            <Route
              path="/admin/dashboard"
              element={
                <ProtectedRoute allowedRoles={['senior_admin']}>
                  <SeniorAdminDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/manager/dashboard"
              element={
                <ProtectedRoute allowedRoles={['senior_admin', 'branch_manager']}>
                  <BranchManagerDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/employee/dashboard"
              element={<EmployeeDashboard />}
            />

            {/* Core Modules */}
            <Route
              path="/branches"
              element={
                <ProtectedRoute allowedRoles={['senior_admin']}>
                  <BranchesPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/employees"
              element={
                <ProtectedRoute allowedRoles={['senior_admin', 'branch_manager']}>
                  <EmployeesPage />
                </ProtectedRoute>
              }
            />
            <Route path="/attendance" element={<AttendancePage />} />
            <Route path="/work-sheets" element={<WorkSheetsPage />} />
            <Route path="/tasks" element={<TasksPage />} />
            <Route path="/documents" element={<DocumentsPage />} />
            <Route path="/leaves" element={<LeavesPage />} />
            <Route path="/performance" element={<PerformancePage />} />
            <Route
              path="/reports"
              element={
                <ProtectedRoute allowedRoles={['senior_admin', 'branch_manager']}>
                  <ReportsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/analytics"
              element={
                <ProtectedRoute allowedRoles={['senior_admin']}>
                  <AnalyticsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/audit-logs"
              element={
                <ProtectedRoute allowedRoles={['senior_admin']}>
                  <AuditLogsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/settings"
              element={
                <ProtectedRoute allowedRoles={['senior_admin']}>
                  <SettingsPage />
                </ProtectedRoute>
              }
            />

            {/* Notification Route Redirection Aliases */}
            <Route path="/manager/leaves" element={<Navigate to="/leaves" replace />} />
            <Route path="/employee/leaves" element={<Navigate to="/leaves" replace />} />
            <Route path="/manager/tasks" element={<Navigate to="/tasks" replace />} />
            <Route path="/employee/tasks" element={<Navigate to="/tasks" replace />} />
            <Route path="/manager/attendance" element={<Navigate to="/attendance" replace />} />
            <Route path="/employee/attendance" element={<Navigate to="/attendance" replace />} />
            <Route path="/manager/worksheets" element={<Navigate to="/work-sheets" replace />} />
            <Route path="/employee/worksheets" element={<Navigate to="/work-sheets" replace />} />
            <Route path="/manager/documents" element={<Navigate to="/documents" replace />} />
            <Route path="/employee/documents" element={<Navigate to="/documents" replace />} />
            <Route path="/admin/reports" element={<Navigate to="/reports" replace />} />
            <Route path="/manager/reports" element={<Navigate to="/reports" replace />} />
            <Route path="/admin/branches" element={<Navigate to="/branches" replace />} />
          </Route>

          {/* Catch-all fallback */}
          <Route path="*" element={<RoleHomeRedirect />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
};

export default App;
