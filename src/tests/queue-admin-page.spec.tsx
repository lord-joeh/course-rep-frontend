import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { QueueAdminPage } from '@/pages/reps/queue-admin-page';
import { apiClient } from '@/lib/api-client';
import type { QueueStatsMap } from '@/types/queue.types';

describe('QueueAdminPage Component', () => {
  let queryClient: QueryClient;

  const mockStats: QueueStatsMap = {
    email: { active: 1, completed: 120, failed: 0, delayed: 0, waiting: 2, paused: 0 },
    sms: { active: 0, completed: 60, failed: 1, delayed: 0, waiting: 0, paused: 0 },
    'drive-sync': { active: 0, completed: 35, failed: 0, delayed: 0, waiting: 0, paused: 0 },
    attendance: { active: 0, completed: 200, failed: 0, delayed: 0, waiting: 0, paused: 0 },
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
        <QueueAdminPage />
      </QueryClientProvider>,
    );

  it('renders page header, summary grid metrics, and all 4 worker cards', async () => {
    vi.spyOn(apiClient, 'get').mockResolvedValueOnce({
      data: {
        message: 'Queue operational metrics retrieved successfully',
        stats: mockStats,
      },
    });

    renderWithProviders();

    // Header
    expect(screen.getByText('BullMQ Queue Administration')).toBeInTheDocument();
    expect(screen.getByText('4 Queues Active')).toBeInTheDocument();

    // Summary Metrics
    await waitFor(() => {
      expect(screen.getByText('Completed Tasks')).toBeInTheDocument();
      // Total completed: 120 + 60 + 35 + 200 = 415
      expect(screen.getByText('415')).toBeInTheDocument();
      expect(screen.getByText('Active Processing')).toBeInTheDocument();
      expect(screen.getByText('Waiting in Queue')).toBeInTheDocument();
      expect(screen.getByText('Failed / Stalled')).toBeInTheDocument();
    });

    // 4 Worker Cards
    expect(screen.getByText('Student Notification Email Queue')).toBeInTheDocument();
    expect(screen.getByText('Arkesel Carrier SMS Queue')).toBeInTheDocument();
    expect(screen.getByText('Google Drive Sync Queue')).toBeInTheDocument();
    expect(screen.getByText('Attendance Batch Roster Queue')).toBeInTheDocument();

    // Bull-Board link button present
    expect(screen.getAllByText('Bull-Board Console').length).toBeGreaterThanOrEqual(1);
  });

  it('opens TestEmailDialog when clicking Probe Email button', async () => {
    vi.spyOn(apiClient, 'get').mockResolvedValue({
      data: { stats: mockStats },
    });

    renderWithProviders();

    const probeEmailBtn = screen.getByRole('button', { name: /Probe Email/i });
    fireEvent.click(probeEmailBtn);

    await waitFor(() => {
      expect(screen.getByText('Dispatch Test Email Probe')).toBeInTheDocument();
    });
  });

  it('opens TestSmsDialog when clicking Probe SMS button', async () => {
    vi.spyOn(apiClient, 'get').mockResolvedValue({
      data: { stats: mockStats },
    });

    renderWithProviders();

    const probeSmsBtn = screen.getByRole('button', { name: /Probe SMS/i });
    fireEvent.click(probeSmsBtn);

    await waitFor(() => {
      expect(screen.getByText('Dispatch Test SMS Probe')).toBeInTheDocument();
    });
  });

  it('allows changing auto-refresh interval selector', async () => {
    vi.spyOn(apiClient, 'get').mockResolvedValue({
      data: { stats: mockStats },
    });

    renderWithProviders();

    const select = screen.getByLabelText(/Select auto-refresh interval/i);
    expect(select).toBeInTheDocument();

    fireEvent.change(select, { target: { value: '5000' } });
    expect((select as HTMLSelectElement).value).toBe('5000');
  });
});

