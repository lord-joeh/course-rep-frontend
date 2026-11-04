import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  useAuditLogsQuery,
  useAuditStatsQuery,
  useRecentAuditAlertsQuery,
  useAuditLogQuery,
  useVerifyAuditIntegrityMutation,
} from '@/hooks/use-audit-logs';
import { apiClient } from '@/lib/api-client';
import type { SecurityAuditLog, AuditDashboardStats, AuditIntegrityReport } from '@/types/audit.types';

describe('use-audit-logs hooks', () => {
  let queryClient: QueryClient;

  const mockLog: SecurityAuditLog = {
    id: 'log-001',
    sequenceNumber: 1,
    timestamp: '2026-11-04T12:00:00.000Z',
    actorId: 'user-001',
    actorRole: 'REP',
    actorEmail: 'rep@university.edu',
    action: 'ATTENDANCE_INITIALIZED',
    severity: 'INFO',
    resource: 'ATTENDANCE',
    resourceId: 'sess-001',
    ipAddress: '192.168.1.10',
    userAgent: 'Mozilla/5.0 Chrome',
    details: { classType: 'PHYSICAL', radiusMeters: 50 },
    previousHash: '0'.repeat(64),
    currentHash: 'a'.repeat(64),
  };

  const mockStats: AuditDashboardStats = {
    totalLogs: 42,
    severityCounts: { INFO: 30, LOW: 5, MEDIUM: 4, HIGH: 2, CRITICAL: 1 },
    failedLoginsLast24h: 3,
    geofenceBreachesLast24h: 1,
    recentHighSeverityCount: 3,
  };

  const mockReport: AuditIntegrityReport = {
    isIntact: true,
    totalVerified: 42,
    unbrokenChainLength: 42,
    genesisHashValid: true,
    verifiedAt: '2026-11-04T12:30:00.000Z',
    errors: [],
  };

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });
    vi.restoreAllMocks();
  });

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );

  it('fetches paginated audit logs', async () => {
    vi.spyOn(apiClient, 'get').mockResolvedValueOnce({
      data: {
        success: true,
        data: {
          items: [mockLog],
          meta: { page: 1, limit: 20, total: 1, totalPages: 1 },
        },
      },
    });

    const { result } = renderHook(() => useAuditLogsQuery({ severity: 'INFO' }), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.items).toHaveLength(1);
    expect(result.current.data?.items[0].action).toBe('ATTENDANCE_INITIALIZED');
  });

  it('fetches security dashboard statistics', async () => {
    vi.spyOn(apiClient, 'get').mockResolvedValueOnce({
      data: {
        success: true,
        data: mockStats,
      },
    });

    const { result } = renderHook(() => useAuditStatsQuery(), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.totalLogs).toBe(42);
    expect(result.current.data?.failedLoginsLast24h).toBe(3);
    expect(result.current.data?.geofenceBreachesLast24h).toBe(1);
  });

  it('fetches recent critical security alerts', async () => {
    vi.spyOn(apiClient, 'get').mockResolvedValueOnce({
      data: {
        success: true,
        data: [{ ...mockLog, severity: 'CRITICAL', action: 'ATTENDANCE_GEOFENCE_BREACH' }],
      },
    });

    const { result } = renderHook(() => useRecentAuditAlertsQuery(5), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toHaveLength(1);
    expect(result.current.data?.[0].severity).toBe('CRITICAL');
  });

  it('fetches single audit log event details by id', async () => {
    vi.spyOn(apiClient, 'get').mockResolvedValueOnce({
      data: {
        success: true,
        data: mockLog,
      },
    });

    const { result } = renderHook(() => useAuditLogQuery('log-001'), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.id).toBe('log-001');
    expect(result.current.data?.currentHash).toBe('a'.repeat(64));
  });

  it('executes cryptographic integrity verification mutation', async () => {
    vi.spyOn(apiClient, 'post').mockResolvedValueOnce({
      data: {
        success: true,
        data: mockReport,
      },
    });

    const { result } = renderHook(() => useVerifyAuditIntegrityMutation(), { wrapper });

    const response = await result.current.mutateAsync({ fromSeq: 1, toSeq: 42 });
    expect(response?.isIntact).toBe(true);
    expect(response?.unbrokenChainLength).toBe(42);
    expect(response?.genesisHashValid).toBe(true);
  });
});

