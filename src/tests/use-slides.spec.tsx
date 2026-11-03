import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import {
  useCourseSlidesQuery,
  useUploadSlidesMutation,
  useDeleteSlideMutation,
  useDownloadSlide,
} from '@/hooks/use-slides';
import { apiClient } from '@/lib/api-client';

describe('use-slides hooks', () => {
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

  it('useCourseSlidesQuery fetches paginated slides for a valid course ID', async () => {
    const mockSlides = [
      {
        id: 'slide-1',
        driveFileId: 'drive-file-1',
        fileName: 'Lecture-1-Intro.pptx',
        courseId: 'CSC401',
        hash: 'abc123hash',
        createdAt: '2026-11-01T10:00:00.000Z',
        updatedAt: '2026-11-01T10:00:00.000Z',
      },
      {
        id: 'slide-2',
        driveFileId: 'drive-file-2',
        fileName: 'Lecture-1-Recording.mp4',
        courseId: 'CSC401',
        hash: 'def456hash',
        createdAt: '2026-11-01T12:00:00.000Z',
        updatedAt: '2026-11-01T12:00:00.000Z',
      },
    ];

    const getSpy = vi.spyOn(apiClient, 'get').mockResolvedValueOnce({
      data: {
        success: true,
        data: {
          items: mockSlides,
          meta: { page: 1, limit: 20, total: 2, totalPages: 1, hasNextPage: false, hasPreviousPage: false },
        },
      },
    });

    const { result } = renderHook(
      () => useCourseSlidesQuery({ courseId: 'CSC401', page: 1, limit: 20, search: 'Lecture' }),
      { wrapper },
    );

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(getSpy).toHaveBeenCalledWith('/slides', {
      params: {
        courseId: 'CSC401',
        page: 1,
        limit: 20,
        search: 'Lecture',
      },
    });
    expect(result.current.data?.items).toHaveLength(2);
    expect(result.current.data?.items[0].fileName).toBe('Lecture-1-Intro.pptx');
    expect(result.current.data?.items[1].fileName).toBe('Lecture-1-Recording.mp4');
  });

  it('useCourseSlidesQuery is disabled when courseId is empty', async () => {
    const getSpy = vi.spyOn(apiClient, 'get');

    const { result } = renderHook(
      () => useCourseSlidesQuery({ courseId: '' }),
      { wrapper },
    );

    expect(result.current.fetchStatus).toBe('idle');
    expect(getSpy).not.toHaveBeenCalled();
  });

  it('useUploadSlidesMutation posts FormData with files and triggers progress callback', async () => {
    const onSuccessCb = vi.fn();
    const progressCb = vi.fn();

    const mockResponseData = {
      uploaded: [
        {
          id: 'slide-new-1',
          driveFileId: 'drive-new-1',
          fileName: 'Week-2-Algorithms.pdf',
          courseId: 'CSC401',
          hash: 'hash999',
          createdAt: '2026-11-02T10:00:00.000Z',
          updatedAt: '2026-11-02T10:00:00.000Z',
        },
      ],
      duplicatesSkipped: [],
      failed: [],
    };

    const postSpy = vi.spyOn(apiClient, 'post').mockImplementation((url, data, config) => {
      // Simulate progress event
      if (config?.onUploadProgress) {
        config.onUploadProgress({ loaded: 500, total: 1000 } as any);
      }
      return Promise.resolve({
        data: { success: true, data: mockResponseData },
      });
    });

    const { result } = renderHook(() => useUploadSlidesMutation(onSuccessCb), { wrapper });

    const dummyFile = new window.File(['dummy-content'], 'Week-2-Algorithms.pdf', {
      type: 'application/pdf',
    });

    await act(async () => {
      await result.current.mutateAsync({
        files: [dummyFile],
        courseId: 'csc401',
        folderId: 'folder-123',
        onProgress: progressCb,
      });
    });

    expect(postSpy).toHaveBeenCalled();
    const [callUrl, callData, callConfig] = postSpy.mock.calls[0];
    expect(callUrl).toBe('/slides/upload');
    expect(callData).toBeInstanceOf(FormData);
    expect(callConfig?.headers?.['Content-Type']).toBe('multipart/form-data');

    expect(progressCb).toHaveBeenCalledWith(50, 500, 1000);
    expect(onSuccessCb).toHaveBeenCalledWith(mockResponseData);
  });

  it('useDeleteSlideMutation deletes slide by ID and triggers callback', async () => {
    const onSuccessCb = vi.fn();
    const deleteSpy = vi.spyOn(apiClient, 'delete').mockResolvedValueOnce({
      data: { success: true, message: 'Slide deleted successfully' },
    });

    const { result } = renderHook(
      () => useDeleteSlideMutation('CSC401', onSuccessCb),
      { wrapper },
    );

    await act(async () => {
      await result.current.mutateAsync('slide-to-delete-123');
    });

    expect(deleteSpy).toHaveBeenCalledWith('/slides/slide-to-delete-123');
    expect(onSuccessCb).toHaveBeenCalled();
  });

  it('useDownloadSlide streams file and handles download via temporary anchor', async () => {
    const createObjectURLMock = vi.fn(() => 'blob:mock-url');
    const revokeObjectURLMock = vi.fn();
    window.URL.createObjectURL = createObjectURLMock;
    window.URL.revokeObjectURL = revokeObjectURLMock;

    const appendChildSpy = vi.spyOn(document.body, 'appendChild');
    const removeChildSpy = vi.spyOn(document.body, 'removeChild');

    vi.spyOn(apiClient, 'get').mockResolvedValueOnce({
      data: new Blob(['file-content'], { type: 'application/pdf' }),
      headers: {
        'content-disposition': 'attachment; filename="Distributed-Systems.pdf"',
        'content-type': 'application/pdf',
      },
    });

    const { result } = renderHook(() => useDownloadSlide(), { wrapper });

    await act(async () => {
      await result.current.downloadSlide('slide-id-777', 'fallback.pdf');
    });

    expect(createObjectURLMock).toHaveBeenCalled();
    expect(appendChildSpy).toHaveBeenCalled();
    expect(removeChildSpy).toHaveBeenCalled();
    expect(revokeObjectURLMock).toHaveBeenCalledWith('blob:mock-url');
    expect(result.current.isDownloading).toBe(false);
  });
});

