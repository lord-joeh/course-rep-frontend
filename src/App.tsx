import { useEffect, useState } from 'react';
import { QueryClientProvider, useQuery } from '@tanstack/react-query';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { queryClient } from '@/lib/query-client';
import { apiClient } from '@/lib/api-client';
import { authStore, useAuthStore } from '@/lib/auth-store';
import { ThemeProvider } from '@/components/theme-provider';
import { ErrorBoundary } from '@/components/common/error-boundary';
import { Toaster } from '@/components/ui/sonner';
import { AppLayout } from '@/components/layout/app-layout';
import { PageHeader } from '@/components/common/page-header';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { CheckCircle2, AlertTriangle, ShieldCheck, Database, Server, Key } from 'lucide-react';
import { useLogoutMutation } from '@/hooks/use-auth-mutations';
import { ProtectedRoute, RoleRoute, PublicOnlyRoute } from '@/components/auth/route-guards';
import { LoginPage } from '@/pages/auth/login-page';
import { RegisterPage } from '@/pages/auth/register-page';
import { ForgotPasswordPage } from '@/pages/auth/forgot-password-page';
import { ResetPasswordPage } from '@/pages/auth/reset-password-page';
import { ChangePasswordDialog } from '@/components/auth/change-password-dialog';
import { StudentDirectoryPage } from '@/pages/reps/student-directory-page';
import { StudentProfilePage } from '@/pages/students/student-profile-page';
import { LecturerDirectoryPage } from '@/pages/lecturers/lecturer-directory-page';
import { CourseCatalogPage } from '@/pages/courses/course-catalog-page';
import { DriveVaultPage } from '@/pages/reps/drive-vault-page';
import { CourseSlidesPage } from '@/pages/slides/course-slides-page';
import type { ApiResponse } from '@/types';

interface HealthData {
  status: 'ok' | 'degraded';
  timestamp: string;
  services: {
    database: { status: string };
    redis: { status: string };
  };
}

function DashboardView({ role }: { role: 'REP' | 'STUDENT' }) {
  const { user } = useAuthStore();
  const [passwordDialogOpen, setPasswordDialogOpen] = useState(false);

  const { data: health, isLoading, isError, refetch } = useQuery({
    queryKey: ['system-health'],
    queryFn: async () => {
      const res = await apiClient.get<ApiResponse<HealthData>>('/health');
      return res.data?.data || (res.data as unknown as HealthData);
    },
    staleTime: 30000,
    retry: 1,
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title={`${role === 'REP' ? 'Representative' : 'Student'} Dashboard`}
        description={`Welcome back, ${user?.name || user?.email || 'User'}. Real-time session and permissions active.`}
      >
        <Button variant="outline" onClick={() => setPasswordDialogOpen(true)}>
          <Key className="mr-2 h-4 w-4" />
          Change Password
        </Button>
        <Button
          onClick={() => {
            toast.success('Live Notification', {
              description: 'Toast dispatcher and design tokens running cleanly.',
            });
          }}
        >
          Test Notification
        </Button>
      </PageHeader>

      <ChangePasswordDialog
        open={passwordDialogOpen}
        onOpenChange={setPasswordDialogOpen}
      />

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* Active Session Card */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Authenticated Profile</CardTitle>
              <Badge variant={user?.isRep ? 'default' : 'secondary'}>
                {user?.isRep ? 'Course Rep' : 'Student'}
              </Badge>
            </div>
            <CardDescription>Cryptographic In-Memory Session</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex justify-between py-1 border-b border-border">
              <span className="text-muted-foreground">ID:</span>
              <span className="font-mono font-medium text-foreground">{user?.id || 'N/A'}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-border">
              <span className="text-muted-foreground">Name:</span>
              <span className="font-medium text-foreground">{user?.name || 'N/A'}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-border">
              <span className="text-muted-foreground">Email:</span>
              <span className="font-medium text-foreground truncate max-w-[180px]">{user?.email || 'N/A'}</span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-muted-foreground">Status:</span>
              <span className="font-semibold text-emerald-600 uppercase text-xs">{user?.status || 'Active'}</span>
            </div>
          </CardContent>
        </Card>

        {/* Security & RBAC Card */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">RBAC & Token Security</CardTitle>
              <ShieldCheck className="h-5 w-5 text-emerald-600" />
            </div>
            <CardDescription>Route Guards & Token Rotation</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex justify-between py-1 border-b border-border">
              <span className="text-muted-foreground">Access Token Vault:</span>
              <span className="font-medium text-foreground">In-Memory Only</span>
            </div>
            <div className="flex justify-between py-1 border-b border-border">
              <span className="text-muted-foreground">Silent Rotation:</span>
              <span className="font-medium text-foreground">Enabled (Mutex Queue)</span>
            </div>
            <div className="flex justify-between py-1 border-b border-border">
              <span className="text-muted-foreground">Role Access Check:</span>
              <span className="font-medium text-foreground">Enforced via RoleRoute</span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-muted-foreground">Palette:</span>
              <span className="font-medium text-foreground">Deep Navy / White (No Gradients)</span>
            </div>
          </CardContent>
        </Card>

        {/* Backend V2 Live Ping */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Backend Connection</CardTitle>
              <Server className="h-5 w-5 text-primary" />
            </div>
            <CardDescription>Live NestJS V2 API Ping</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {isLoading && (
              <div className="text-sm text-muted-foreground animate-pulse">
                Pinging Backend V2...
              </div>
            )}
            {isError && (
              <div className="rounded-md bg-amber-50 dark:bg-amber-950/40 p-3 border border-amber-200 dark:border-amber-900 text-xs text-amber-800 dark:text-amber-300 flex items-start gap-2">
                <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold">Backend Offline</p>
                  <p className="mt-0.5">NestJS V2 API not responding on port 5000.</p>
                  <Button variant="outline" size="sm" onClick={() => refetch()} className="mt-2 h-7 text-xs">
                    Retry Ping
                  </Button>
                </div>
              </div>
            )}
            {health && (
              <div className="space-y-2 text-sm">
                <div className="flex items-center justify-between py-1 border-b border-border">
                  <span className="text-muted-foreground flex items-center gap-1.5">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600" /> Status
                  </span>
                  <Badge variant="success" className="uppercase">
                    {health.status}
                  </Badge>
                </div>
                <div className="flex items-center justify-between py-1 border-b border-border">
                  <span className="text-muted-foreground flex items-center gap-1.5">
                    <Database className="h-4 w-4 text-primary" /> PostgreSQL
                  </span>
                  <Badge variant="outline" className="text-xs">
                    {health.services?.database?.status || 'connected'}
                  </Badge>
                </div>
                <div className="flex items-center justify-between py-1">
                  <span className="text-muted-foreground flex items-center gap-1.5">
                    <Server className="h-4 w-4 text-primary" /> Redis
                  </span>
                  <Badge variant="outline" className="text-xs">
                    {health.services?.redis?.status || 'connected'}
                  </Badge>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

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
                  <Route path="/reps/dashboard" element={<DashboardView role="REP" />} />
                  <Route path="/reps/students" element={<StudentDirectoryPage />} />
                  <Route path="/reps/lecturers" element={<LecturerDirectoryPage />} />
                  <Route path="/reps/courses" element={<CourseCatalogPage />} />
                  <Route path="/reps/drive-vault" element={<DriveVaultPage />} />
                  <Route path="/reps/slides" element={<CourseSlidesPage />} />
                  <Route path="/reps/profile" element={<StudentProfilePage />} />
                </Route>
              </Route>

              {/* Protected Student Area */}
              <Route element={<ProtectedRoute />}>
                <Route element={<AuthenticatedShell />}>
                  <Route path="/students/dashboard" element={<DashboardView role="STUDENT" />} />
                  <Route path="/students/lecturers" element={<LecturerDirectoryPage />} />
                  <Route path="/students/courses" element={<CourseCatalogPage />} />
                  <Route path="/students/slides" element={<CourseSlidesPage />} />
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
