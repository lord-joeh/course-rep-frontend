import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuditStatsCards } from '@/components/audit/audit-stats-cards';
import { AuditIntegrityModal } from '@/components/audit/audit-integrity-modal';
import { AuditDetailsSheet } from '@/components/audit/audit-details-sheet';
import { AuditExportButton } from '@/components/audit/audit-export-button';
import { apiClient } from '@/lib/api-client';
import type { SecurityAuditLog, AuditDashboardStats } from '@/types/audit.types';

describe('Audit UI Components', () => {
  let queryClient: QueryClient;

  const mockLog: SecurityAuditLog = {
    id: 'log-001',
    sequenceNumber: 104,
    timestamp: '2026-11-04T12:00:00.000Z',
    actorId: 'user-001',
    actorRole: 'REP',
    actorEmail: 'rep@university.edu',
    action: 'ATTENDANCE_GEOFENCE_BREACH',
    severity: 'CRITICAL',
    resource: 'ATTENDANCE',
    resourceId: 'sess-001',
    ipAddress: '192.168.1.10',
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
    details: { lat: 5.6037, lng: -0.187, distanceMeters: 450 },
    previousHash: '0'.repeat(64),
    currentHash: 'b'.repeat(64),
  };

  const mockStats: AuditDashboardStats = {
    totalLogs: 120,
    severityCounts: { INFO: 80, LOW: 20, MEDIUM: 15, HIGH: 4, CRITICAL: 1 },
    failedLoginsLast24h: 6,
    geofenceBreachesLast24h: 2,
    recentHighSeverityCount: 5,
  };

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
    });
    vi.restoreAllMocks();
  });

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );

  it('renders AuditStatsCards with KPI metrics and severity summary bar', () => {
    render(<AuditStatsCards stats={mockStats} />);

    expect(screen.getByText('Total Audit Logs')).toBeInTheDocument();
    expect(screen.getByText('120')).toBeInTheDocument();

    expect(screen.getByText('Auth Failures (24h)')).toBeInTheDocument();
    expect(screen.getByText('6')).toBeInTheDocument();

    expect(screen.getByText('Geofence Breaches (24h)')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument();

    expect(screen.getByText('Critical / High Incidents')).toBeInTheDocument();
    expect(screen.getByText('5')).toBeInTheDocument();

    // Severity badges
    expect(screen.getByText(/Info: 80/i)).toBeInTheDocument();
    expect(screen.getByText(/Critical: 1/i)).toBeInTheDocument();
  });

  it('renders AuditIntegrityModal and handles verification execution', async () => {
    vi.spyOn(apiClient, 'post').mockResolvedValueOnce({
      data: {
        success: true,
        data: {
          isIntact: true,
          totalVerified: 120,
          unbrokenChainLength: 120,
          genesisHashValid: true,
          verifiedAt: '2026-11-04T13:00:00.000Z',
          errors: [],
        },
      },
    });

    render(
      <QueryClientProvider client={queryClient}>
        <AuditIntegrityModal isOpen={true} onClose={vi.fn()} />
      </QueryClientProvider>,
    );

    expect(screen.getByText('Cryptographic Audit Chain Verifier')).toBeInTheDocument();
    expect(
      screen.getByText(/Verify the mathematical integrity and sequence ordering/i),
    ).toBeInTheDocument();

    const verifyBtn = screen.getByRole('button', { name: /Run Cryptographic Verification/i });
    fireEvent.click(verifyBtn);

    await waitFor(() => {
      expect(screen.getByText('Audit Chain Intact')).toBeInTheDocument();
      expect(screen.getAllByText('120').length).toBeGreaterThanOrEqual(1);
      expect(screen.getByText('HMAC-SHA256')).toBeInTheDocument();
    });
  });

  it('renders AuditDetailsSheet with cryptographic proof and JSON payload', () => {
    render(<AuditDetailsSheet log={mockLog} isOpen={true} onClose={vi.fn()} />);

    expect(screen.getByText('Seq #104')).toBeInTheDocument();
    expect(screen.getByText('CRITICAL')).toBeInTheDocument();
    expect(screen.getByText('Attendance Geofence Breach')).toBeInTheDocument();
    expect(screen.getByText('rep@university.edu')).toBeInTheDocument();
    expect(screen.getByText('192.168.1.10')).toBeInTheDocument();

    // Cryptographic proofs
    expect(screen.getByText(/Previous Hash \(Genesis Block\)/i)).toBeInTheDocument();
    expect(screen.getByText('0'.repeat(64))).toBeInTheDocument();
    expect(screen.getByText('b'.repeat(64))).toBeInTheDocument();

    // JSON Details
    expect(screen.getByText(/distanceMeters/i)).toBeInTheDocument();
  });

  it('handles AuditExportButton click and initiates download', () => {
    const createElementSpy = vi.spyOn(document, 'createElement');
    render(<AuditExportButton logs={[mockLog]} />);

    const exportBtn = screen.getByRole('button', { name: /Export audit logs as CSV/i });
    fireEvent.click(exportBtn);

    expect(createElementSpy).toHaveBeenCalledWith('a');
  });
});

