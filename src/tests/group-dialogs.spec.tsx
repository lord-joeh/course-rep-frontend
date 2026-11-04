import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { GroupCard } from '@/components/groups/group-card';
import { CreateGroupDialog } from '@/components/groups/create-group-dialog';
import { EditGroupDialog } from '@/components/groups/edit-group-dialog';
import { DeleteGroupDialog } from '@/components/groups/delete-group-dialog';
import { AutoDivideDialog } from '@/components/groups/auto-divide-dialog';
import { GroupRosterSheet } from '@/components/groups/group-roster-sheet';
import { apiClient } from '@/lib/api-client';
import type { Group } from '@/types';

describe('Group Dialogs & Components', () => {
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

  const mockGroup: Group = {
    id: 'grp-1',
    name: 'Hardware Design Group 1',
    courseId: 'CPEN402',
    isGeneral: false,
    description: 'Embedded system laboratory projects',
    createdAt: '2026-11-04T08:00:00Z',
    updatedAt: '2026-11-04T08:00:00Z',
    course: { id: 'CPEN402', name: 'Embedded Systems' },
    memberCount: 3,
    members: [
      {
        studentId: '10928374',
        isLeader: true,
        student: { id: '10928374', name: 'Alice Turing', indexNumber: '10928374' },
      },
      {
        studentId: '10928375',
        isLeader: false,
        student: { id: '10928375', name: 'Bob Shannon', indexNumber: '10928375' },
      },
    ],
  };

  describe('GroupCard', () => {
    it('renders group information, course badge, and member count', () => {
      const onViewRoster = vi.fn();
      render(
        <GroupCard
          group={mockGroup}
          isRep={true}
          currentUserId="10928374"
          onViewRoster={onViewRoster}
        />,
        { wrapper },
      );

      expect(screen.getByText('Hardware Design Group 1')).toBeInTheDocument();
      expect(screen.getByText('CPEN402')).toBeInTheDocument();
      expect(screen.getByText('Alice Turing')).toBeInTheDocument();
      expect(screen.getByText('You are Leader')).toBeInTheDocument();

      const viewRosterBtn = screen.getByTestId('view-roster-btn');
      fireEvent.click(viewRosterBtn);
      expect(onViewRoster).toHaveBeenCalledWith(mockGroup);
    });

    it('renders General Cohort badge when isGeneral is true', () => {
      const generalGroup: Group = {
        ...mockGroup,
        isGeneral: true,
        courseId: null,
        course: null,
      };

      render(
        <GroupCard
          group={generalGroup}
          isRep={false}
          onViewRoster={vi.fn()}
        />,
        { wrapper },
      );

      expect(screen.getByText('General Cohort')).toBeInTheDocument();
    });
  });

  describe('CreateGroupDialog', () => {
    it('validates required fields on empty submit', async () => {
      render(
        <CreateGroupDialog
          open={true}
          onOpenChange={vi.fn()}
        />,
        { wrapper },
      );

      const submitBtn = screen.getByTestId('create-group-submit-btn');
      fireEvent.click(submitBtn);

      expect(await screen.findByText(/Group name must be at least 2 characters/i)).toBeInTheDocument();
    });

    it('submits valid group payload and triggers mutation', async () => {
      const postSpy = vi.spyOn(apiClient, 'post').mockResolvedValueOnce({
        data: { success: true, data: mockGroup },
      });

      render(
        <CreateGroupDialog
          open={true}
          onOpenChange={vi.fn()}
          defaultCourseId="CPEN402"
        />,
        { wrapper },
      );

      fireEvent.change(screen.getByTestId('group-name-input'), {
        target: { value: 'New Test Group' },
      });

      const submitBtn = screen.getByTestId('create-group-submit-btn');
      fireEvent.click(submitBtn);

      await waitFor(() => {
        expect(postSpy).toHaveBeenCalledWith(
          '/groups',
          expect.objectContaining({ name: 'New Test Group', courseId: 'CPEN402' }),
        );
      });
    });
  });

  describe('AutoDivideDialog', () => {
    it('switches partition modes and validates course selection', async () => {
      render(
        <AutoDivideDialog
          open={true}
          onOpenChange={vi.fn()}
        />,
        { wrapper },
      );

      expect(screen.getByText(/Auto-Divide Students Engine/i)).toBeInTheDocument();

      // Submit without selecting course
      const executeBtn = screen.getByTestId('execute-auto-divide-btn');
      fireEvent.click(executeBtn);

      expect(await screen.findByText(/Please select a course to partition enrolled students/i)).toBeInTheDocument();

      // Switch to General Cohort
      const generalBtn = screen.getByTestId('scope-general-btn');
      fireEvent.click(generalBtn);

      // Now course selection error disappears
      expect(screen.queryByText(/Please select a course to partition enrolled students/i)).not.toBeInTheDocument();
    });

    it('submits auto-division payload with partition parameters', async () => {
      const postSpy = vi.spyOn(apiClient, 'post').mockResolvedValueOnce({
        data: {
          success: true,
          data: { totalGroups: 4, totalStudents: 20, groups: [mockGroup] },
        },
      });

      render(
        <AutoDivideDialog
          open={true}
          onOpenChange={vi.fn()}
          defaultCourseId="CPEN402"
        />,
        { wrapper },
      );

      fireEvent.change(screen.getByTestId('students-per-group-input'), {
        target: { value: '6' },
      });

      fireEvent.change(screen.getByTestId('naming-prefix-input'), {
        target: { value: 'Team' },
      });

      const executeBtn = screen.getByTestId('execute-auto-divide-btn');
      fireEvent.click(executeBtn);

      await waitFor(() => {
        expect(postSpy).toHaveBeenCalledWith(
          '/groups/auto-divide',
          expect.objectContaining({
            courseId: 'CPEN402',
            studentsPerGroup: 6,
            namingPrefix: 'Team',
          }),
        );
      });
    });
  });

  describe('GroupRosterSheet', () => {
    it('renders members roster and allows Course Rep to assign leadership and remove member', async () => {
      vi.spyOn(apiClient, 'get').mockResolvedValueOnce({
        data: {
          success: true,
          data: mockGroup,
        },
      });

      const patchSpy = vi.spyOn(apiClient, 'patch').mockResolvedValueOnce({
        data: { success: true, data: { success: true } },
      });

      const deleteSpy = vi.spyOn(apiClient, 'delete').mockResolvedValueOnce({
        data: { success: true, data: { success: true } },
      });

      render(
        <GroupRosterSheet
          group={mockGroup}
          open={true}
          onOpenChange={vi.fn()}
          isRep={true}
        />,
        { wrapper },
      );

      expect(await screen.findByText('Alice Turing')).toBeInTheDocument();
      expect(screen.getByText('Bob Shannon')).toBeInTheDocument();

      // Promote Bob Shannon to Leader
      const makeLeaderBtn = screen.getByTestId('make-leader-btn-10928375');
      fireEvent.click(makeLeaderBtn);

      await waitFor(() => {
        expect(patchSpy).toHaveBeenCalledWith('/groups/grp-1/leader/10928375');
      });

      // Remove Bob Shannon
      const removeBtn = screen.getByTestId('remove-member-btn-10928375');
      fireEvent.click(removeBtn);

      await waitFor(() => {
        expect(deleteSpy).toHaveBeenCalledWith('/groups/grp-1/members/10928375');
      });
    });
  });
});

