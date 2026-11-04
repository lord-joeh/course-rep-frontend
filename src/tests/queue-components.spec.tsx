import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { QueueSummaryGrid } from '@/components/queues/queue-summary-grid';
import { QueueWorkerCard } from '@/components/queues/queue-worker-card';
import { BullBoardLinkButton } from '@/components/queues/bull-board-link-button';
import { TestEmailDialog } from '@/components/queues/test-email-dialog';
import { TestSmsDialog } from '@/components/queues/test-sms-dialog';
import { QUEUE_REGISTRY } from '@/lib/queue-validation';
import { apiClient } from '@/lib/api-client';
import type { QueueStatsMap } from '@/types/queue.types';

describe('Queue Admin UI Components', () => {
  let queryClient: QueryClient;

  const mockStats: QueueStatsMap = {
    email: { active: 2, completed: 80, failed: 0, delayed: 0, waiting: 5, paused: 0 },
    sms: { active: 0, completed: 40, failed: 2, delayed: 0, waiting: 0, paused: 0 },
    'drive-sync': { active: 1, completed: 10, failed: 0, delayed: 0, waiting: 1, paused: 0 },
    attendance: { active: 0, completed: 150, failed: 0, delayed: 0, waiting: 0, paused: 0 },
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

  it('renders QueueSummaryGrid with aggregate totals across all queues', () => {
    render(<QueueSummaryGrid stats={mockStats} />);

    // Completed: 80 + 40 + 10 + 150 = 280
    expect(screen.getByText('Completed Tasks')).toBeInTheDocument();
    expect(screen.getByText('280')).toBeInTheDocument();

    // Active: 2 + 0 + 1 + 0 = 3
    expect(screen.getByText('Active Processing')).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument();

    // Waiting: 5 + 0 + 1 + 0 = 6
    expect(screen.getByText('Waiting in Queue')).toBeInTheDocument();
    expect(screen.getByText('6')).toBeInTheDocument();

    // Failed: 0 + 2 + 0 + 0 = 2
    expect(screen.getByText('Failed / Stalled')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument();
  });

  it('renders QueueWorkerCard with job counts and triggers probe handler', () => {
    const handleOpenTest = vi.fn();
    render(
      <QueueWorkerCard
        queueMeta={QUEUE_REGISTRY.email}
        counts={mockStats.email}
        onOpenTest={handleOpenTest}
      />,
    );

    expect(screen.getByText('Student Notification Email Queue')).toBeInTheDocument();
    expect(screen.getByText(/queue: email/i)).toBeInTheDocument();
    expect(screen.getByText('Processing')).toBeInTheDocument();

    const probeBtn = screen.getByRole('button', { name: /Dispatch test probe for Student Notification Email Queue/i });
    fireEvent.click(probeBtn);
    expect(handleOpenTest).toHaveBeenCalledWith('email');
  });

  it('renders BullBoardLinkButton and launches external console', () => {
    const openSpy = vi.spyOn(window, 'open').mockImplementation(() => null);
    render(<BullBoardLinkButton />);

    const btn = screen.getByRole('button', { name: /Open Bull-Board management console in new tab/i });
    fireEvent.click(btn);

    expect(openSpy).toHaveBeenCalledWith(
      expect.stringContaining('/admin/queues/ui'),
      '_blank',
      'noopener,noreferrer',
    );
  });

  it('handles TestEmailDialog submission', async () => {
    vi.spyOn(apiClient, 'post').mockResolvedValueOnce({
      data: {
        message: 'Test email job successfully enqueued',
        jobId: 'email-42',
        recipient: 'rep@university.edu',
      },
    });

    const handleClose = vi.fn();
    render(
      <QueryClientProvider client={queryClient}>
        <TestEmailDialog isOpen={true} onClose={handleClose} />
      </QueryClientProvider>,
    );

    expect(screen.getByText('Dispatch Test Email Probe')).toBeInTheDocument();

    const input = screen.getByLabelText(/Recipient Email/i);
    fireEvent.change(input, { target: { value: 'custom@university.edu' } });

    const submitBtn = screen.getByRole('button', { name: /Submit Probe Job/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(handleClose).toHaveBeenCalled();
    });
  });

  it('handles TestSmsDialog validation and submission', async () => {
    vi.spyOn(apiClient, 'post').mockResolvedValueOnce({
      data: {
        message: 'Test SMS job successfully enqueued',
        jobId: 'sms-99',
        recipient: '0256269405',
      },
    });

    const handleClose = vi.fn();
    render(
      <QueryClientProvider client={queryClient}>
        <TestSmsDialog isOpen={true} onClose={handleClose} />
      </QueryClientProvider>,
    );

    expect(screen.getByText('Dispatch Test SMS Probe')).toBeInTheDocument();

    const phoneInput = screen.getByLabelText(/Recipient Phone Number/i);
    fireEvent.change(phoneInput, { target: { value: '0256269405' } });

    const submitBtn = screen.getByRole('button', { name: /Submit Probe SMS/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(handleClose).toHaveBeenCalled();
    });
  });
});

