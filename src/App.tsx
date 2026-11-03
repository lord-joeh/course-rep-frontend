import { QueryClientProvider, useQuery } from '@tanstack/react-query';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { queryClient } from '@/lib/query-client';
import { apiClient } from '@/lib/api-client';
import { ThemeProvider } from '@/components/theme-provider';
import { ErrorBoundary } from '@/components/common/error-boundary';
import { Toaster } from '@/components/ui/sonner';
import { AppLayout } from '@/components/layout/app-layout';
import { PageHeader } from '@/components/common/page-header';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { CheckCircle2, AlertTriangle, ShieldCheck, Database, Server } from 'lucide-react';
import type { ApiResponse } from '@/types';

interface HealthData {
  status: 'ok' | 'degraded';
  timestamp: string;
  services: {
    database: { status: string };
    redis: { status: string };
  };
}

function Phase1Dashboard() {
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
        title="Frontend V2 — Foundation Active"
        description="Phase 1 Scaffolding, Deep Navy & White Design Tokens, In-Memory Auth, and TanStack Query v5."
      >
        <Button
          onClick={() => {
            toast.success('System Verification Passed', {
              description: 'Toast notifications operating with crisp navy & white design tokens.',
            });
          }}
        >
          Test Notification
        </Button>
      </PageHeader>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* Core Architecture Card */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Tech Stack</CardTitle>
              <Badge variant="default">Verified</Badge>
            </div>
            <CardDescription>Enterprise Single Page App</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex justify-between py-1 border-b border-border">
              <span className="text-muted-foreground">Framework:</span>
              <span className="font-medium text-foreground">React 19 + TypeScript</span>
            </div>
            <div className="flex justify-between py-1 border-b border-border">
              <span className="text-muted-foreground">Build Tool:</span>
              <span className="font-medium text-foreground">Vite + Tailwind v4</span>
            </div>
            <div className="flex justify-between py-1 border-b border-border">
              <span className="text-muted-foreground">Server State:</span>
              <span className="font-medium text-foreground">TanStack Query v5</span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-muted-foreground">UI Primitives:</span>
              <span className="font-medium text-foreground">Radix UI + shadcn</span>
            </div>
          </CardContent>
        </Card>

        {/* Security & Auth Card */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Security & Session</CardTitle>
              <ShieldCheck className="h-5 w-5 text-emerald-600" />
            </div>
            <CardDescription>In-Memory JWT & Rotation Mutex</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex justify-between py-1 border-b border-border">
              <span className="text-muted-foreground">JWT Access Storage:</span>
              <span className="font-medium text-foreground">In-Memory (Zero LocalStorage)</span>
            </div>
            <div className="flex justify-between py-1 border-b border-border">
              <span className="text-muted-foreground">Rotation Endpoint:</span>
              <span className="font-medium text-foreground">/api/auth/refresh-token</span>
            </div>
            <div className="flex justify-between py-1 border-b border-border">
              <span className="text-muted-foreground">Rate Limit Backoff:</span>
              <span className="font-medium text-foreground">Exponential Retry (429)</span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-muted-foreground">Gradients Policy:</span>
              <span className="font-medium text-foreground">Strictly Zero Gradients</span>
            </div>
          </CardContent>
        </Card>

        {/* Backend V2 Connection Card */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Backend V2 Health</CardTitle>
              <Server className="h-5 w-5 text-primary" />
            </div>
            <CardDescription>Live NestJS V2 API Ping</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {isLoading && (
              <div className="text-sm text-muted-foreground animate-pulse">
                Connecting to backend on port 5000...
              </div>
            )}
            {isError && (
              <div className="rounded-md bg-amber-50 dark:bg-amber-950/40 p-3 border border-amber-200 dark:border-amber-900 text-xs text-amber-800 dark:text-amber-300 flex items-start gap-2">
                <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold">Backend Unreachable</p>
                  <p className="mt-0.5">Ensure NestJS V2 is started on port 5000.</p>
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
                    <CheckCircle2 className="h-4 w-4 text-emerald-600" /> System Status
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
                    <Server className="h-4 w-4 text-primary" /> Redis Cache
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

export function App() {
  const dummyUser = {
    id: 'REP-001',
    name: 'Course Representative',
    email: 'rep@university.edu',
    isRep: true,
  };

  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider defaultTheme="light">
          <BrowserRouter>
            <Routes>
              <Route element={<AppLayout user={dummyUser} onLogout={() => toast.info('Logged out')} />}>
                <Route path="/reps/dashboard" element={<Phase1Dashboard />} />
                <Route path="/students/dashboard" element={<Phase1Dashboard />} />
                <Route path="*" element={<Navigate to="/reps/dashboard" replace />} />
              </Route>
            </Routes>
          </BrowserRouter>
          <Toaster position="top-right" />
        </ThemeProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;
