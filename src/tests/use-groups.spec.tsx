import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  useGroupsQuery,
  useMyGroupsQuery,
  useGroupDetailQuery,
  useStudentGroupsQuery,
  useCreateGroupMutation,
  useAutoDivideGroupsMutation,
  useUpdateGroupMutation,
  useDeleteGroupMutation,
  useAddGroupMemberMutation,
  useRemoveGroupMemberMutation,
  useSetGroupLeaderMutation,
} from '@/hooks/use-groups';
import { apiClient } from '@/lib/api-client';
import type { Group, GroupDetailResponse, AutoDivideResponse } from '@/types';

describe('use-groups hooks', () => {
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
    name: 'Embedded Systems Project Team 1',
    courseId: 'CPEN402',
    isGeneral: false,
    description: 'Hardware build project',
    createdAt: '2026-11-04T08:00:00Z',
    updatedAt: '2026-11-04T08:00:00Z',
    course: { id: 'CPEN402', name: 'Embedded Systems' },
    memberCount: 4,
  };

  const mockDetail: GroupDetailResponse = {
    ...mockGroup,
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

  it('useGroupsQuery fetches paginated study groups with filters', async () => {
    const getSpy = vi.spyOn(apiClient, 'get').mockResolvedValueOnce({
      data: {
        success: true,
        data: {
          items: [mockGroup],
          meta: { page: 1, limit: 20, total: 1, totalPages: 1 },
        },
      },
    });

    const { result } = renderHook(() => useGroupsQuery({ courseId: 'CPEN402' }), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.items).toHaveLength(1);
    expect(getSpy).toHaveBeenCalledWith('/groups', {
      params: expect.objectContaining({ courseId: 'CPEN402', page: 1, limit: 20 }),
    });
  });

  it('useMyGroupsQuery retrieves groups student belongs to', async () => {
    vi.spyOn(apiClient, 'get').mockResolvedValueOnce({
      data: {
        success: true,
        data: [mockGroup],
      },
    });

    const { result } = renderHook(() => useMyGroupsQuery(), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toHaveLength(1);
    expect(result.current.data?.[0].name).toBe('Embedded Systems Project Team 1');
  });

  it('useGroupDetailQuery retrieves group with populated members roster', async () => {
    vi.spyOn(apiClient, 'get').mockResolvedValueOnce({
      data: {
        success: true,
        data: mockDetail,
      },
    });

    const { result } = renderHook(() => useGroupDetailQuery('grp-1'), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.members).toHaveLength(2);
    expect(result.current.data?.members[0].isLeader).toBe(true);
  });

  it('useStudentGroupsQuery fetches groups for specific student', async () => {
    vi.spyOn(apiClient, 'get').mockResolvedValueOnce({
      data: {
        success: true,
        data: [mockGroup],
      },
    });

    const { result } = renderHook(() => useStudentGroupsQuery('10928374'), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toHaveLength(1);
  });

  it('useCreateGroupMutation creates study group and invalidates cache', async () => {
    const postSpy = vi.spyOn(apiClient, 'post').mockResolvedValueOnce({
      data: {
        success: true,
        data: mockGroup,
      },
    });

    const onSuccess = vi.fn();
    const { result } = renderHook(() => useCreateGroupMutation(onSuccess), { wrapper });

    await result.current.mutateAsync({
      name: 'New Group',
      courseId: 'CPEN402',
      isGeneral: false,
    });

    expect(postSpy).toHaveBeenCalledWith('/groups', expect.objectContaining({ name: 'New Group' }));
    expect(onSuccess).toHaveBeenCalled();
  });

  it('useAutoDivideGroupsMutation executes Fisher-Yates algorithmic division', async () => {
    const autoDivideRes: AutoDivideResponse = {
      totalGroups: 4,
      totalStudents: 20,
      groups: [mockGroup],
    };

    const postSpy = vi.spyOn(apiClient, 'post').mockResolvedValueOnce({
      data: {
        success: true,
        data: autoDivideRes,
      },
    });

    const onSuccess = vi.fn();
    const { result } = renderHook(() => useAutoDivideGroupsMutation(onSuccess), { wrapper });

    await result.current.mutateAsync({
      courseId: 'CPEN402',
      isGeneral: false,
      studentsPerGroup: 5,
      autoAssignLeader: true,
    });

    expect(postSpy).toHaveBeenCalledWith('/groups/auto-divide', expect.objectContaining({ studentsPerGroup: 5 }));
    expect(onSuccess).toHaveBeenCalledWith(autoDivideRes);
  });

  it('useUpdateGroupMutation updates group details', async () => {
    const putSpy = vi.spyOn(apiClient, 'put').mockResolvedValueOnce({
      data: {
        success: true,
        data: { ...mockGroup, name: 'Renamed Group' },
      },
    });

    const onSuccess = vi.fn();
    const { result } = renderHook(() => useUpdateGroupMutation(onSuccess), { wrapper });

    await result.current.mutateAsync({
      id: 'grp-1',
      dto: { name: 'Renamed Group' },
    });

    expect(putSpy).toHaveBeenCalledWith('/groups/grp-1', { name: 'Renamed Group' });
    expect(onSuccess).toHaveBeenCalled();
  });

  it('useDeleteGroupMutation deletes group', async () => {
    const deleteSpy = vi.spyOn(apiClient, 'delete').mockResolvedValueOnce({
      data: {
        success: true,
        data: { success: true, message: 'Deleted' },
      },
    });

    const onSuccess = vi.fn();
    const { result } = renderHook(() => useDeleteGroupMutation(onSuccess), { wrapper });

    await result.current.mutateAsync('grp-1');

    expect(deleteSpy).toHaveBeenCalledWith('/groups/grp-1');
    expect(onSuccess).toHaveBeenCalled();
  });

  it('useAddGroupMemberMutation adds student to group', async () => {
    const postSpy = vi.spyOn(apiClient, 'post').mockResolvedValueOnce({
      data: {
        success: true,
        data: { success: true },
      },
    });

    const onSuccess = vi.fn();
    const { result } = renderHook(() => useAddGroupMemberMutation(onSuccess), { wrapper });

    await result.current.mutateAsync({
      id: 'grp-1',
      dto: { studentId: '10928376', isLeader: false },
    });

    expect(postSpy).toHaveBeenCalledWith('/groups/grp-1/members', { studentId: '10928376', isLeader: false });
    expect(onSuccess).toHaveBeenCalled();
  });

  it('useRemoveGroupMemberMutation removes student from group', async () => {
    const deleteSpy = vi.spyOn(apiClient, 'delete').mockResolvedValueOnce({
      data: {
        success: true,
        data: { success: true, message: 'Removed' },
      },
    });

    const onSuccess = vi.fn();
    const { result } = renderHook(() => useRemoveGroupMemberMutation(onSuccess), { wrapper });

    await result.current.mutateAsync({
      id: 'grp-1',
      studentId: '10928376',
    });

    expect(deleteSpy).toHaveBeenCalledWith('/groups/grp-1/members/10928376');
    expect(onSuccess).toHaveBeenCalled();
  });

  it('useSetGroupLeaderMutation assigns leadership to student', async () => {
    const patchSpy = vi.spyOn(apiClient, 'patch').mockResolvedValueOnce({
      data: {
        success: true,
        data: { success: true },
      },
    });

    const onSuccess = vi.fn();
    const { result } = renderHook(() => useSetGroupLeaderMutation(onSuccess), { wrapper });

    await result.current.mutateAsync({
      id: 'grp-1',
      studentId: '10928374',
    });

    expect(patchSpy).toHaveBeenCalledWith('/groups/grp-1/leader/10928374');
    expect(onSuccess).toHaveBeenCalled();
  });
});

