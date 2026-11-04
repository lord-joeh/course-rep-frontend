import { useEffect } from 'react';
import { QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { queryClient } from '@/lib/query-client';
import { authStore, useAuthStore } from '@/lib/auth-store';
import { ThemeProvider } from '@/components/theme-provider';
import { ErrorBoundary } from '@/components/common/error-boundary';
import { Toaster } from '@/components/ui/sonner';
import { AppLayout } from '@/components/layout/app-layout';
import { useLogoutMutation } from '@/hooks/use-auth-mutations';
import { ProtectedRoute, RoleRoute, PublicOnlyRoute } from '@/components/auth/route-guards';
import { LoginPage } from '@/pages/auth/login-page';
import { RegisterPage } from '@/pages/auth/register-page';
import { ForgotPasswordPage } from '@/pages/auth/forgot-password-page';
import { ResetPasswordPage } from '@/pages/auth/reset-password-page';
import { StudentDirectoryPage } from '@/pages/reps/student-directory-page';
import { StudentProfilePage } from '@/pages/students/student-profile-page';
import { LecturerDirectoryPage } from '@/pages/lecturers/lecturer-directory-page';
import { CourseCatalogPage } from '@/pages/courses/course-catalog-page';
import { DriveVaultPage } from '@/pages/reps/drive-vault-page';
import { CourseSlidesPage } from '@/pages/slides/course-slides-page';
import { AssignmentsPage } from '@/pages/assignments/assignments-page';
import { AttendancePage } from '@/pages/attendance/attendance-page';
import { GroupsPage } from '@/pages/groups/groups-page';
import { EventsPage } from '@/pages/events/events-page';
import { NotificationsPage } from '@/pages/notifications/notifications-page';
import { FeedbackPage } from '@/pages/feedback/feedback-page';
import { AuditLogsPage } from '@/pages/reps/audit-logs-page';
import { QueueAdminPage } from '@/pages/reps/queue-admin-page';
import { RepDashboardPage } from '@/pages/reps/rep-dashboard-page';
import { StudentDashboardPage } from '@/pages/students/student-dashboard-page';

function AuthenticatedShell() {
  const { user } = useAuthStore();
  const logoutMutation = useLogoutMutation();

  return (
    <AppLayout
      user={user}
      onLogout={() => logoutMutation.mutate()}
    />
  );
}

function RootRedirect() {
  const { user, isAuthenticated, isLoading } = useAuthStore();

  if (isLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }

  return <Navigate to={user.isRep ? '/reps/dashboard' : '/students/dashboard'} replace />;
}

export function App() {
  useEffect(() => {
    authStore.initialize();
  }, []);

  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider defaultTheme="light">
          <BrowserRouter>
            <Routes>
              {/* Public Auth Routes (Blocked when already authenticated) */}
              <Route element={<PublicOnlyRoute />}>
                <Route path="/login" element={<LoginPage />} />
                <Route path="/register" element={<RegisterPage />} />
                <Route path="/forgot-password" element={<ForgotPasswordPage />} />
                <Route path="/reset-password" element={<ResetPasswordPage />} />
              </Route>

              {/* Protected Course Rep Area */}
              <Route element={<RoleRoute requiredRole="REP" />}>
                <Route element={<AuthenticatedShell />}>
                  <Route path="/reps/dashboard" element={<RepDashboardPage />} />
                  <Route path="/reps/notifications" element={<NotificationsPage />} />
                  <Route path="/reps/students" element={<StudentDirectoryPage />} />
                  <Route path="/reps/lecturers" element={<LecturerDirectoryPage />} />
                  <Route path="/reps/courses" element={<CourseCatalogPage />} />
                  <Route path="/reps/drive-vault" element={<DriveVaultPage />} />
                  <Route path="/reps/slides" element={<CourseSlidesPage />} />
                  <Route path="/reps/assignments" element={<AssignmentsPage />} />
                  <Route path="/reps/attendance" element={<AttendancePage />} />
                  <Route path="/reps/groups" element={<GroupsPage />} />
                  <Route path="/reps/events" element={<EventsPage />} />
                  <Route path="/reps/feedback" element={<FeedbackPage />} />
                  <Route path="/reps/audit-logs" element={<AuditLogsPage />} />
                  <Route path="/reps/queues" element={<QueueAdminPage />} />
                  <Route path="/reps/profile" element={<StudentProfilePage />} />
                </Route>
              </Route>

              {/* Protected Student Area */}
              <Route element={<ProtectedRoute />}>
                <Route element={<AuthenticatedShell />}>
                  <Route path="/students/dashboard" element={<StudentDashboardPage />} />
                  <Route path="/students/notifications" element={<NotificationsPage />} />
                  <Route path="/students/lecturers" element={<LecturerDirectoryPage />} />
                  <Route path="/students/courses" element={<CourseCatalogPage />} />
                  <Route path="/students/slides" element={<CourseSlidesPage />} />
                  <Route path="/students/assignments" element={<AssignmentsPage />} />
                  <Route path="/students/attendance" element={<AttendancePage />} />
                  <Route path="/students/groups" element={<GroupsPage />} />
                  <Route path="/students/events" element={<EventsPage />} />
                  <Route path="/students/feedback" element={<FeedbackPage />} />
                  <Route path="/students/profile" element={<StudentProfilePage />} />
                </Route>
              </Route>

              {/* Root / Catch-All */}
              <Route path="/" element={<RootRedirect />} />
              <Route path="*" element={<RootRedirect />} />
            </Routes>
          </BrowserRouter>
          <Toaster position="top-right" />
        </ThemeProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;
