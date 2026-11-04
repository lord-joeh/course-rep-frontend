import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuditLogsPage } from '@/pages/reps/audit-logs-page';
import { apiClient } from '@/lib/api-client';
import type { SecurityAuditLog, AuditDashboardStats } from '@/types/audit.types';

describe('AuditLogsPage Component', () => {
  let queryClient: QueryClient;

  const mockLogs: SecurityAuditLog[] = [
    {
      id: 'log-101',
      sequenceNumber: 1,
      timestamp: '2026-11-04T12:00:00.000Z',
      actorId: 'rep-001',
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
    },
    {
      id: 'log-102',
      sequenceNumber: 2,
      timestamp: '2026-11-04T12:05:00.000Z',
      actorId: 'std-002',
      actorRole: 'STUDENT',
      actorEmail: 'student@university.edu',
      action: 'ATTENDANCE_GEOFENCE_BREACH',
      severity: 'CRITICAL',
      resource: 'ATTENDANCE',
      resourceId: 'sess-001',
      ipAddress: '192.168.1.55',
      userAgent: 'Mozilla/5.0 Mobile',
      details: { distanceMeters: 380 },
      previousHash: 'a'.repeat(64),
      currentHash: 'b'.repeat(64),
    },
  ];

  const mockStats: AuditDashboardStats = {
    totalLogs: 2,
    severityCounts: { INFO: 1, LOW: 0, MEDIUM: 0, HIGH: 0, CRITICAL: 1 },
    failedLoginsLast24h: 0,
    geofenceBreachesLast24h: 1,
    recentHighSeverityCount: 1,
  };

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
    });
    vi.restoreAllMocks();
  });

  const renderWithProviders = () =>
    render(
      <QueryClientProvider client={queryClient}>
        <AuditLogsPage />
      </QueryClientProvider>,
    );

  it('renders page header, operational stats, and audit table rows', async () => {
    vi.spyOn(apiClient, 'get').mockImplementation(async (url: string) => {
      if (url.includes('/stats')) {
        return { data: { success: true, data: mockStats } };
      }
      return {
        data: {
          success: true,
          data: {
            items: mockLogs,
            meta: { page: 1, limit: 20, total: 2, totalPages: 1 },
          },
        },
      };
    });

    renderWithProviders();

    // Header
    expect(screen.getByText('Security Audit Trail & Ledger')).toBeInTheDocument();
    expect(screen.getByText(/Immutable SHA-256 chained security log/i)).toBeInTheDocument();

    // Stats Cards
    await waitFor(() => {
      expect(screen.getByText('Total Audit Logs')).toBeInTheDocument();
      expect(screen.getByText('Auth Failures (24h)')).toBeInTheDocument();
      expect(screen.getByText('Geofence Breaches (24h)')).toBeInTheDocument();
    });

    // Table Rows
    await waitFor(() => {
      expect(screen.getByText('Attendance Initialized')).toBeInTheDocument();
      expect(screen.getByText('Attendance Geofence Breach')).toBeInTheDocument();
      expect(screen.getByText('#1')).toBeInTheDocument();
      expect(screen.getByText('#2')).toBeInTheDocument();
      expect(screen.getAllByText('Critical').length).toBeGreaterThanOrEqual(1);
    });
  });

  it('opens AuditIntegrityModal when clicking Verify Chain button', async () => {
    vi.spyOn(apiClient, 'get').mockResolvedValue({
      data: {
        success: true,
        data: { items: [], meta: { page: 1, limit: 20, total: 0, totalPages: 1 } },
      },
    });

    renderWithProviders();

    const verifyChainBtn = screen.getByRole('button', { name: /Verify hash chain integrity/i });
    fireEvent.click(verifyChainBtn);

    await waitFor(() => {
      expect(screen.getByText('Cryptographic Audit Chain Verifier')).toBeInTheDocument();
    });
  });

  it('opens AuditDetailsSheet when clicking a table row', async () => {
    vi.spyOn(apiClient, 'get').mockImplementation(async (url: string) => {
      if (url.includes('/stats')) {
        return { data: { success: true, data: mockStats } };
      }
      return {
        data: {
          success: true,
          data: {
            items: mockLogs,
            meta: { page: 1, limit: 20, total: 2, totalPages: 1 },
          },
        },
      };
    });

    renderWithProviders();

    await waitFor(() => {
      expect(screen.getByText('Attendance Geofence Breach')).toBeInTheDocument();
    });

    // Click on row
    const row = screen.getByText('Attendance Geofence Breach');
    fireEvent.click(row);

    // Sheet should open
    await waitFor(() => {
      expect(screen.getByText('Seq #2')).toBeInTheDocument();
      expect(screen.getByText('Target Resource')).toBeInTheDocument();
      expect(screen.getByText('Cryptographic Chain Proof')).toBeInTheDocument();
    });
  });

  it('displays empty state when no audit records are found', async () => {
    vi.spyOn(apiClient, 'get').mockResolvedValue({
      data: {
        success: true,
        data: {
          items: [],
          meta: { page: 1, limit: 20, total: 0, totalPages: 0 },
        },
      },
    });

    renderWithProviders();

    await waitFor(() => {
      expect(screen.getByText('No audit events found')).toBeInTheDocument();
      expect(screen.getByText(/The security audit ledger is currently empty/i)).toBeInTheDocument();
    });
  });
});

