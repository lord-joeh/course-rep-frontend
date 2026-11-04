import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { CreateAssignmentDialog } from '@/components/assignments/create-assignment-dialog';
import { EditAssignmentDialog } from '@/components/assignments/edit-assignment-dialog';
import { DeleteAssignmentDialog } from '@/components/assignments/delete-assignment-dialog';
import { SubmitAssignmentDialog } from '@/components/assignments/submit-assignment-dialog';
import { DeleteSubmissionDialog } from '@/components/assignments/delete-submission-dialog';
import { AssignmentSubmissionsSheet } from '@/components/assignments/assignment-submissions-sheet';
import { AssignmentCard } from '@/components/assignments/assignment-card';
import { apiClient } from '@/lib/api-client';
import type { Assignment } from '@/types';

describe('Assignment Dialogs, Sheet & Card Components', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
    });
    vi.restoreAllMocks();
  });

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );

  const futureDeadline = new Date(Date.now() + 86400000 * 3).toISOString(); // 3 days in future
  const pastDeadline = new Date(Date.now() - 86400000 * 2).toISOString(); // 2 days in past

  const mockAssignmentActive: Assignment = {
    id: 'assign-101',
    title: 'Distributed Consensus Project',
    description: 'Implement the Raft consensus protocol in Go or Rust.',
    courseId: 'CPEN402',
    deadline: futureDeadline,
    submissionFolderId: 'drive-folder-cpen402',
    fileId: 'brief-file-123',
    fileName: 'Raft_Specification.pdf',
    submissionCount: 12,
    hasSubmitted: false,
    studentSubmission: null,
    createdAt: '2026-11-01T10:00:00.000Z',
    updatedAt: '2026-11-01T10:00:00.000Z',
  };

  const mockAssignmentSubmitted: Assignment = {
    ...mockAssignmentActive,
    id: 'assign-102',
    hasSubmitted: true,
    studentSubmission: {
      id: 'sub-404',
      fileName: 'alice_raft_v1.zip',
      submittedAt: '2026-11-02T15:00:00.000Z',
    },
  };

  const mockAssignmentClosed: Assignment = {
    ...mockAssignmentActive,
    id: 'assign-103',
    deadline: pastDeadline,
  };

  describe('AssignmentCard', () => {
    it('renders assignment title, course badge, and rep actions in rep mode', () => {
      const onEdit = vi.fn();
      const onDelete = vi.fn();
      const onViewSubmissions = vi.fn();

      render(
        <AssignmentCard
          assignment={mockAssignmentActive}
          isRep={true}
          onEdit={onEdit}
          onDelete={onDelete}
          onViewSubmissions={onViewSubmissions}
        />,
        { wrapper },
      );

      expect(screen.getByText('CPEN402')).toBeInTheDocument();
      expect(screen.getByText('Distributed Consensus Project')).toBeInTheDocument();
      expect(screen.getByText('Download Brief')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /View Submissions \(12\)/i })).toBeInTheDocument();

      fireEvent.click(screen.getByTitle('Edit Assignment'));
      expect(onEdit).toHaveBeenCalledWith(mockAssignmentActive);

      fireEvent.click(screen.getByTitle('Delete Assignment'));
      expect(onDelete).toHaveBeenCalledWith(mockAssignmentActive);

      fireEvent.click(screen.getByRole('button', { name: /View Submissions \(12\)/i }));
      expect(onViewSubmissions).toHaveBeenCalledWith(mockAssignmentActive);
    });

    it('renders student mode with submit button when active and not submitted', () => {
      const onSubmit = vi.fn();

      render(
        <AssignmentCard
          assignment={mockAssignmentActive}
          isRep={false}
          onSubmit={onSubmit}
        />,
        { wrapper },
      );

      const submitBtn = screen.getByRole('button', { name: /Submit Solution/i });
      expect(submitBtn).toBeInTheDocument();
      expect(submitBtn).not.toBeDisabled();

      fireEvent.click(submitBtn);
      expect(onSubmit).toHaveBeenCalledWith(mockAssignmentActive);
    });

    it('renders submitted status and withdraw option when student has submitted', () => {
      const onWithdraw = vi.fn();

      render(
        <AssignmentCard
          assignment={mockAssignmentSubmitted}
          isRep={false}
          onWithdraw={onWithdraw}
        />,
        { wrapper },
      );

      expect(screen.getByText(/Submitted: alice_raft_v1.zip/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Re-Submit Solution/i })).toBeInTheDocument();

      const withdrawBtn = screen.getByTitle('Withdraw solution before deadline');
      expect(withdrawBtn).toBeInTheDocument();
      fireEvent.click(withdrawBtn);
      expect(onWithdraw).toHaveBeenCalledWith('sub-404', 'alice_raft_v1.zip', mockAssignmentSubmitted.title);
    });

    it('disables submit button and shows closed status when past deadline', () => {
      render(
        <AssignmentCard
          assignment={mockAssignmentClosed}
          isRep={false}
        />,
        { wrapper },
      );

      expect(screen.getByText('Closed / Past Due')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Submissions Closed/i })).toBeDisabled();
    });
  });

  describe('CreateAssignmentDialog', () => {
    it('validates required fields and shows validation errors on empty submit', () => {
      render(
        <CreateAssignmentDialog
          open={true}
          onOpenChange={vi.fn()}
        />,
        { wrapper },
      );

      expect(screen.getByText('Create Course Assignment')).toBeInTheDocument();
      const submitBtn = screen.getByRole('button', { name: /Publish Assignment/i });
      fireEvent.click(submitBtn);

      expect(screen.getByText(/Assignment title is required/i)).toBeInTheDocument();
      expect(screen.getByText(/Assignment description is required/i)).toBeInTheDocument();
    });
  });

  describe('EditAssignmentDialog', () => {
    it('pre-populates inputs with existing assignment information', () => {
      render(
        <EditAssignmentDialog
          assignment={mockAssignmentActive}
          open={true}
          onOpenChange={vi.fn()}
        />,
        { wrapper },
      );

      expect(screen.getByText('Edit Assignment')).toBeInTheDocument();
      expect(screen.getByDisplayValue('Distributed Consensus Project')).toBeInTheDocument();
      expect(screen.getByDisplayValue('Implement the Raft consensus protocol in Go or Rust.')).toBeInTheDocument();
    });
  });

  describe('DeleteAssignmentDialog', () => {
    it('displays cascade deletion warning and deletes on confirmation', async () => {
      const onOpenChange = vi.fn();
      const deleteSpy = vi.spyOn(apiClient, 'delete').mockResolvedValueOnce({
        data: { success: true },
      });

      render(
        <DeleteAssignmentDialog
          assignment={mockAssignmentActive}
          open={true}
          onOpenChange={onOpenChange}
        />,
        { wrapper },
      );

      expect(screen.getByRole('heading', { name: /Delete Assignment/i })).toBeInTheDocument();
      expect(screen.getByText(/Are you sure\? This action is irreversible/i)).toBeInTheDocument();

      const confirmBtn = screen.getByRole('button', { name: /Delete Assignment/i });
      fireEvent.click(confirmBtn);

      await waitFor(() => {
        expect(deleteSpy).toHaveBeenCalledWith('/assignments/assign-101');
        expect(onOpenChange).toHaveBeenCalledWith(false);
      });
    });
  });

  describe('SubmitAssignmentDialog', () => {
    it('renders drag-and-drop file selector and handles solution submission', () => {
      render(
        <SubmitAssignmentDialog
          assignment={mockAssignmentActive}
          open={true}
          onOpenChange={vi.fn()}
        />,
        { wrapper },
      );

      expect(screen.getByText('Submit Assignment Solution')).toBeInTheDocument();
      expect(screen.getByText(/Click to select or drag & drop solution file/i)).toBeInTheDocument();
    });
  });

  describe('DeleteSubmissionDialog', () => {
    it('displays withdrawal confirmation notice and deletes submission', async () => {
      const onOpenChange = vi.fn();
      const deleteSpy = vi.spyOn(apiClient, 'delete').mockResolvedValueOnce({
        data: { success: true },
      });

      render(
        <DeleteSubmissionDialog
          submissionId="sub-404"
          fileName="alice_raft_v1.zip"
          assignmentTitle="Distributed Consensus Project"
          open={true}
          onOpenChange={onOpenChange}
        />,
        { wrapper },
      );

      expect(screen.getByRole('heading', { name: /Withdraw Submission/i })).toBeInTheDocument();
      expect(screen.getByText(/Distributed Consensus Project/i)).toBeInTheDocument();
      expect(screen.getByText(/File: alice_raft_v1.zip/i)).toBeInTheDocument();

      const confirmBtn = screen.getByRole('button', { name: /Withdraw Submission/i });
      fireEvent.click(confirmBtn);

      await waitFor(() => {
        expect(deleteSpy).toHaveBeenCalledWith('/assignments/submissions/sub-404');
        expect(onOpenChange).toHaveBeenCalledWith(false);
      });
    });
  });

  describe('AssignmentSubmissionsSheet', () => {
    it('renders submissions roster and Approach A "Open in Drive" bulk ZIP button', async () => {
      const windowOpenSpy = vi.spyOn(window, 'open').mockImplementation(() => null);

      vi.spyOn(apiClient, 'get').mockResolvedValueOnce({
        data: {
          success: true,
          data: {
            assignment: mockAssignmentActive,
            submissions: {
              items: [
                {
                  id: 'sub-item-1',
                  studentId: '10928374',
                  studentName: 'Alice Turing',
                  fileName: 'solution_alice.zip',
                  submittedAt: '2026-11-03T10:00:00.000Z',
                },
              ],
              meta: { page: 1, limit: 100, total: 1, totalPages: 1 },
            },
          },
        },
      });

      render(
        <AssignmentSubmissionsSheet
          assignment={mockAssignmentActive}
          open={true}
          onOpenChange={vi.fn()}
        />,
        { wrapper },
      );

      expect(screen.getByText('Google Drive Submissions Vault')).toBeInTheDocument();
      const driveBtn = screen.getByRole('button', { name: /Open in Drive/i });
      expect(driveBtn).toBeInTheDocument();

      fireEvent.click(driveBtn);
      expect(windowOpenSpy).toHaveBeenCalledWith(
        'https://drive.google.com/drive/folders/drive-folder-cpen402',
        '_blank',
        'noopener,noreferrer',
      );

      await waitFor(() => {
        expect(screen.getByText('Alice Turing')).toBeInTheDocument();
        expect(screen.getByText('solution_alice.zip')).toBeInTheDocument();
      });
    });
  });
});
