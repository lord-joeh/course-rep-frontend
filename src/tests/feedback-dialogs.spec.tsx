import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { FeedbackCard } from '@/components/feedback/feedback-card';
import { SubmitFeedbackDialog } from '@/components/feedback/submit-feedback-dialog';
import { FeedbackDetailsSheet } from '@/components/feedback/feedback-details-sheet';
import { DeleteFeedbackDialog } from '@/components/feedback/delete-feedback-dialog';
import { apiClient } from '@/lib/api-client';
import type { Feedback } from '@/types';

describe('Feedback Components & Dialogs', () => {
  let queryClient: QueryClient;

  const mockFeedback: Feedback = {
    id: 'fb-001',
    studentId: 'std-101',
    student: { id: 'std-101', name: 'Kofi Annan', email: 'kofi@univ.edu' },
    courseId: 'CPEN305',
    course: { id: 'CPEN305', name: 'Operating Systems' },
    category: 'academic',
    title: 'Lab 2 Guidelines Clarification',
    content: 'The rubric for question 3 seems ambiguous regarding mutex locks.',
    isAnonymous: false,
    priority: 'medium',
    status: 'submitted',
    repResponse: null,
    respondedAt: null,
    respondedBy: null,
    createdAt: '2026-11-04T10:00:00.000Z',
    updatedAt: '2026-11-04T10:00:00.000Z',
  };

  const mockAnonymousFeedback: Feedback = {
    ...mockFeedback,
    id: 'fb-002',
    isAnonymous: true,
    studentId: null,
    student: { name: 'Anonymous Student' },
    repResponse: 'We have updated the syllabus with clearer rubric examples.',
    respondedAt: '2026-11-04T12:00:00.000Z',
    status: 'resolved',
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

  describe('FeedbackCard', () => {
    it('renders feedback title, category badge, and status', () => {
      render(
        <FeedbackCard feedback={mockFeedback} onClick={vi.fn()} />,
        { wrapper },
      );

      expect(screen.getByText('Lab 2 Guidelines Clarification')).toBeInTheDocument();
      expect(screen.getByText('Academic')).toBeInTheDocument();
      expect(screen.getByText('Submitted')).toBeInTheDocument();
      expect(screen.getByText('Kofi Annan')).toBeInTheDocument();
    });

    it('renders anonymous shield and rep response callout if responded', () => {
      render(
        <FeedbackCard feedback={mockAnonymousFeedback} onClick={vi.fn()} />,
        { wrapper },
      );

      expect(screen.getByText('Anonymous Student')).toBeInTheDocument();
      expect(screen.getByText(/Course Rep Response/i)).toBeInTheDocument();
      expect(screen.getByText(/We have updated the syllabus/i)).toBeInTheDocument();
      expect(screen.getByText('Resolved')).toBeInTheDocument();
    });
  });

  describe('SubmitFeedbackDialog', () => {
    it('renders form inputs and handles submission', async () => {
      vi.spyOn(apiClient, 'get').mockResolvedValueOnce({
        data: { success: true, statusCode: 200, data: { items: [], meta: { total: 0 } } },
      });
      const postSpy = vi.spyOn(apiClient, 'post').mockResolvedValueOnce({
        data: { success: true, statusCode: 201, data: mockFeedback },
      });

      const onClose = vi.fn();
      render(<SubmitFeedbackDialog isOpen={true} onClose={onClose} />, { wrapper });

      expect(screen.getByText('Submit Feedback or Suggestion')).toBeInTheDocument();

      fireEvent.change(screen.getByLabelText(/Subject \/ Title/i), {
        target: { value: 'Fix projector in room 302' },
      });
      fireEvent.change(screen.getByLabelText(/Detailed Description/i), {
        target: { value: 'The projector turns off automatically every 5 minutes.' },
      });

      // Toggle anonymous checkbox
      const anonymousCheckbox = screen.getByLabelText(/Submit Anonymously/i);
      fireEvent.click(anonymousCheckbox);

      const submitBtn = screen.getByRole('button', { name: /Submit Feedback/i });
      fireEvent.click(submitBtn);

      await waitFor(() => {
        expect(postSpy).toHaveBeenCalledWith('/feedback', expect.objectContaining({
          title: 'Fix projector in room 302',
          content: 'The projector turns off automatically every 5 minutes.',
          isAnonymous: true,
        }));
      });
      expect(onClose).toHaveBeenCalled();
    });
  });

  describe('FeedbackDetailsSheet', () => {
    it('renders full feedback details and allows Course Rep to update status and respond', async () => {
      const patchSpy = vi.spyOn(apiClient, 'patch').mockResolvedValueOnce({
        data: {
          success: true,
          statusCode: 200,
          data: { ...mockFeedback, status: 'under_review', repResponse: 'Investigating now' },
        },
      });

      const onClose = vi.fn();
      render(
        <FeedbackDetailsSheet
          feedback={mockFeedback}
          isOpen={true}
          onClose={onClose}
          isRep={true}
        />,
        { wrapper },
      );

      expect(screen.getByText('Lab 2 Guidelines Clarification')).toBeInTheDocument();
      expect(screen.getByText(/Course Rep Triage & Actions/i)).toBeInTheDocument();

      const statusSelect = screen.getByLabelText(/Triage Status/i);
      fireEvent.change(statusSelect, { target: { value: 'under_review' } });

      const responseTextarea = screen.getByLabelText(/Official Rep Response/i);
      fireEvent.change(responseTextarea, { target: { value: 'Investigating now' } });

      const saveBtn = screen.getByRole('button', { name: /Save Triage & Response/i });
      fireEvent.click(saveBtn);

      await waitFor(() => {
        expect(patchSpy).toHaveBeenCalledWith('/feedback/fb-001/status', {
          status: 'under_review',
          repResponse: 'Investigating now',
        });
      });
      expect(onClose).toHaveBeenCalled();
    });
  });

  describe('DeleteFeedbackDialog', () => {
    it('triggers delete mutation on confirmation', async () => {
      const deleteSpy = vi.spyOn(apiClient, 'delete').mockResolvedValueOnce({
        data: { success: true, statusCode: 200, data: { message: 'Deleted' } },
      });

      const onClose = vi.fn();
      render(
        <DeleteFeedbackDialog
          feedback={mockFeedback}
          isOpen={true}
          onClose={onClose}
        />,
        { wrapper },
      );

      expect(screen.getByText(/Permanently Delete Feedback\?/i)).toBeInTheDocument();

      const confirmBtn = screen.getByRole('button', { name: /Confirm Delete/i });
      fireEvent.click(confirmBtn);

      await waitFor(() => {
        expect(deleteSpy).toHaveBeenCalledWith('/feedback/fb-001');
      });
      expect(onClose).toHaveBeenCalled();
    });
  });
});

