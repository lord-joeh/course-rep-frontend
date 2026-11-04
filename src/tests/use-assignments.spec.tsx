import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import {
  useAssignmentsQuery,
  useAssignmentDetailQuery,
  useCreateAssignmentMutation,
  useUpdateAssignmentMutation,
  useDeleteAssignmentMutation,
  useSubmitAssignmentMutation,
  useDeleteSubmissionMutation,
  useDownloadAssignmentSpec,
  useDownloadSubmission,
} from '@/hooks/use-assignments';
import { apiClient } from '@/lib/api-client';

describe('use-assignments hooks', () => {
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

  const mockAssignment = {
    id: 'assign-uuid-1',
    title: 'Operating Systems Kernel Assignment',
    description: 'Implement a memory paging simulation in C/C++',
    courseId: 'CSC401',
    deadline: '2026-12-01T23:59:59.000Z',
    submissionFolderId: 'folder-drive-123',
    fileId: 'spec-drive-456',
    fileName: 'OS-Spec-2026.pdf',
    submissionCount: 15,
    hasSubmitted: true,
    studentSubmission: {
      id: 'sub-uuid-1',
      submittedAt: '2026-11-03T10:00:00.000Z',
      fileName: 'student_solution.zip',
    },
    createdAt: '2026-11-01T10:00:00.000Z',
    updatedAt: '2026-11-01T10:00:00.000Z',
  };

  it('useAssignmentsQuery fetches paginated assignments for a valid course ID', async () => {
    const getSpy = vi.spyOn(apiClient, 'get').mockResolvedValueOnce({
      data: {
        success: true,
        data: {
          items: [mockAssignment],
          meta: { page: 1, limit: 20, total: 1, totalPages: 1, hasNextPage: false, hasPreviousPage: false },
        },
      },
    });

    const { result } = renderHook(
      () => useAssignmentsQuery({ courseId: 'CSC401', page: 1, limit: 20, search: 'Kernel' }),
      { wrapper },
    );

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(getSpy).toHaveBeenCalledWith('/assignments', {
      params: {
        courseId: 'CSC401',
        page: 1,
        limit: 20,
        search: 'Kernel',
      },
    });
    expect(result.current.data?.items).toHaveLength(1);
    expect(result.current.data?.items[0].title).toBe('Operating Systems Kernel Assignment');
  });

  it('useAssignmentsQuery is idle when courseId is empty', async () => {
    const getSpy = vi.spyOn(apiClient, 'get');

    const { result } = renderHook(
      () => useAssignmentsQuery({ courseId: '' }),
      { wrapper },
    );

    expect(result.current.fetchStatus).toBe('idle');
    expect(getSpy).not.toHaveBeenCalled();
  });

  it('useAssignmentDetailQuery retrieves detailed assignment with submissions', async () => {
    const detailResponse = {
      assignment: mockAssignment,
      submissions: {
        items: [
          {
            id: 'sub-uuid-1',
            studentId: '10928374',
            studentName: 'Alice Turing',
            studentEmail: 'alice@univ.edu',
            fileId: 'drive-sub-1',
            fileName: 'alice_kernel.zip',
            submittedAt: '2026-11-03T12:00:00.000Z',
          },
        ],
        meta: { page: 1, limit: 50, total: 1, totalPages: 1, hasNextPage: false, hasPreviousPage: false },
      },
    };

    const getSpy = vi.spyOn(apiClient, 'get').mockResolvedValueOnce({
      data: { success: true, data: detailResponse },
    });

    const { result } = renderHook(
      () => useAssignmentDetailQuery('assign-uuid-1'),
      { wrapper },
    );

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(getSpy).toHaveBeenCalledWith('/assignments/assign-uuid-1', {
      params: { page: 1, limit: 50 },
    });
    expect(result.current.data?.submissions?.items).toHaveLength(1);
    expect(result.current.data?.submissions?.items[0].studentName).toBe('Alice Turing');
  });

  it('useCreateAssignmentMutation posts FormData with assignment payload and optional file', async () => {
    const onSuccess = vi.fn();
    const postSpy = vi.spyOn(apiClient, 'post').mockResolvedValueOnce({
      data: { success: true, data: mockAssignment },
    });

    const { result } = renderHook(() => useCreateAssignmentMutation(onSuccess), { wrapper });

    const dummyFile = new window.File(['dummy spec'], 'Spec.pdf', { type: 'application/pdf' });

    await act(async () => {
      await result.current.mutateAsync({
        title: 'New Homework',
        description: 'Read Chapter 4',
        courseId: 'csc401',
        deadline: '2026-12-15T23:59:59.000Z',
        file: dummyFile,
      });
    });

    expect(postSpy).toHaveBeenCalled();
    const [url, data, config] = postSpy.mock.calls[0];
    expect(url).toBe('/assignments');
    expect(data).toBeInstanceOf(FormData);
    expect(config?.headers?.['Content-Type']).toBe('multipart/form-data');
    expect(onSuccess).toHaveBeenCalled();
  });

  it('useUpdateAssignmentMutation updates metadata via PUT', async () => {
    const onSuccess = vi.fn();
    const putSpy = vi.spyOn(apiClient, 'put').mockResolvedValueOnce({
      data: { success: true, data: mockAssignment },
    });

    const { result } = renderHook(
      () => useUpdateAssignmentMutation('assign-uuid-1', onSuccess),
      { wrapper },
    );

    await act(async () => {
      await result.current.mutateAsync({
        title: 'Updated Title',
        description: 'Updated Description',
      });
    });

    expect(putSpy).toHaveBeenCalledWith('/assignments/assign-uuid-1', {
      title: 'Updated Title',
      description: 'Updated Description',
    });
    expect(onSuccess).toHaveBeenCalled();
  });

  it('useDeleteAssignmentMutation deletes assignment by ID', async () => {
    const onSuccess = vi.fn();
    const deleteSpy = vi.spyOn(apiClient, 'delete').mockResolvedValueOnce({
      data: { success: true },
    });

    const { result } = renderHook(() => useDeleteAssignmentMutation(onSuccess), { wrapper });

    await act(async () => {
      await result.current.mutateAsync('assign-uuid-1');
    });

    expect(deleteSpy).toHaveBeenCalledWith('/assignments/assign-uuid-1');
    expect(onSuccess).toHaveBeenCalled();
  });

  it('useSubmitAssignmentMutation posts solution file via /assignments/submit', async () => {
    const onSuccess = vi.fn();
    const postSpy = vi.spyOn(apiClient, 'post').mockResolvedValueOnce({
      data: { success: true, data: { id: 'sub-new' } },
    });

    const { result } = renderHook(() => useSubmitAssignmentMutation(onSuccess), { wrapper });

    const solutionFile = new window.File(['code contents'], 'solution.zip', {
      type: 'application/zip',
    });

    await act(async () => {
      await result.current.mutateAsync({
        assignmentId: 'assign-uuid-1',
        file: solutionFile,
      });
    });

    expect(postSpy).toHaveBeenCalled();
    const [url, data] = postSpy.mock.calls[0];
    expect(url).toBe('/assignments/submit');
    expect(data).toBeInstanceOf(FormData);
    expect(onSuccess).toHaveBeenCalled();
  });

  it('useDeleteSubmissionMutation calls DELETE /assignments/submissions/:id', async () => {
    const onSuccess = vi.fn();
    const deleteSpy = vi.spyOn(apiClient, 'delete').mockResolvedValueOnce({
      data: { success: true },
    });

    const { result } = renderHook(() => useDeleteSubmissionMutation(onSuccess), { wrapper });

    await act(async () => {
      await result.current.mutateAsync('sub-to-delete-123');
    });

    expect(deleteSpy).toHaveBeenCalledWith('/assignments/submissions/sub-to-delete-123');
    expect(onSuccess).toHaveBeenCalled();
  });

  it('useDownloadAssignmentSpec downloads specification brief via blob stream', async () => {
    const createObjectURLMock = vi.fn(() => 'blob:mock-spec-url');
    const revokeObjectURLMock = vi.fn();
    window.URL.createObjectURL = createObjectURLMock;
    window.URL.revokeObjectURL = revokeObjectURLMock;

    vi.spyOn(apiClient, 'get').mockResolvedValueOnce({
      data: new Blob(['spec pdf data']),
      headers: {
        'content-disposition': 'attachment; filename="SpecDoc.pdf"',
        'content-type': 'application/pdf',
      },
    });

    const { result } = renderHook(() => useDownloadAssignmentSpec(), { wrapper });

    await act(async () => {
      await result.current.downloadSpec('assign-uuid-1', 'fallback-spec.pdf');
    });

    expect(createObjectURLMock).toHaveBeenCalled();
    expect(revokeObjectURLMock).toHaveBeenCalledWith('blob:mock-spec-url');
    expect(result.current.isDownloading).toBe(false);
  });

  it('useDownloadSubmission downloads student solution file via blob stream', async () => {
    const createObjectURLMock = vi.fn(() => 'blob:mock-sub-url');
    const revokeObjectURLMock = vi.fn();
    window.URL.createObjectURL = createObjectURLMock;
    window.URL.revokeObjectURL = revokeObjectURLMock;

    vi.spyOn(apiClient, 'get').mockResolvedValueOnce({
      data: new Blob(['solution zip data']),
      headers: {
        'content-disposition': 'attachment; filename="10928374_solution.zip"',
        'content-type': 'application/zip',
      },
    });

    const { result } = renderHook(() => useDownloadSubmission(), { wrapper });

    await act(async () => {
      await result.current.downloadSubmission('sub-uuid-1', 'fallback.zip');
    });

    expect(createObjectURLMock).toHaveBeenCalled();
    expect(revokeObjectURLMock).toHaveBeenCalledWith('blob:mock-sub-url');
    expect(result.current.isDownloading).toBe(false);
  });
});

