import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import {
  useGoogleStatusQuery,
  useGoogleAuthUrlQuery,
  useRevokeGoogleAccessMutation,
  useCreateFolderMutation,
  useFolderFilesQuery,
  useDeleteDriveFileMutation,
  useDownloadDriveFile,
} from '@/hooks/use-google-vault';
import { apiClient } from '@/lib/api-client';

describe('use-google-vault hooks', () => {
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

  it('useGoogleStatusQuery retrieves Google OAuth2 status', async () => {
    const mockStatus = {
      connected: true,
      expiryDate: 1780000000000,
    };

    const getSpy = vi.spyOn(apiClient, 'get').mockResolvedValueOnce({
      data: { success: true, data: mockStatus },
    });

    const { result } = renderHook(() => useGoogleStatusQuery(), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(getSpy).toHaveBeenCalledWith('/google/status');
    expect(result.current.data?.connected).toBe(true);
    expect(result.current.data?.expiryDate).toBe(1780000000000);
  });

  it('useGoogleAuthUrlQuery retrieves Google OAuth authorization URL', async () => {
    const mockAuthUrl = {
      authUrl: 'https://accounts.google.com/o/oauth2/v2/auth?client_id=123',
      state: 'mock-state-token',
    };

    const getSpy = vi.spyOn(apiClient, 'get').mockResolvedValueOnce({
      data: { success: true, data: mockAuthUrl },
    });

    const { result } = renderHook(() => useGoogleAuthUrlQuery(true), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(getSpy).toHaveBeenCalledWith('/google/auth-url');
    expect(result.current.data?.state).toBe('mock-state-token');
  });

  it('useRevokeGoogleAccessMutation revokes access and invalidates status', async () => {
    const postSpy = vi.spyOn(apiClient, 'post').mockResolvedValueOnce({
      data: { success: true, message: 'Google account disconnected successfully' },
    });

    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

    const { result } = renderHook(() => useRevokeGoogleAccessMutation(), { wrapper });

    result.current.mutate();

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(postSpy).toHaveBeenCalledWith('/google/revoke');
    expect(invalidateSpy).toHaveBeenCalled();
  });

  it('useCreateFolderMutation posts folder creation to Google Drive', async () => {
    const mockFolder = {
      id: '1AbC_drive_folder_id',
      name: 'CPEN401 Lecture Materials',
    };

    const postSpy = vi.spyOn(apiClient, 'post').mockResolvedValueOnce({
      data: { success: true, data: mockFolder },
    });

    const { result } = renderHook(() => useCreateFolderMutation(), { wrapper });

    result.current.mutate({
      folderName: 'CPEN401 Lecture Materials',
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(postSpy).toHaveBeenCalledWith('/google/folders', {
      folderName: 'CPEN401 Lecture Materials',
    });
    expect(result.current.data?.id).toBe('1AbC_drive_folder_id');
  });

  it('useFolderFilesQuery retrieves list of files inside folder', async () => {
    const mockFiles = [
      {
        id: 'file-1',
        name: 'Week 1 Lecture Slides.pdf',
        mimeType: 'application/pdf',
        size: '1048576',
        createdTime: '2026-01-01T00:00:00Z',
      },
    ];

    const getSpy = vi.spyOn(apiClient, 'get').mockResolvedValueOnce({
      data: { success: true, data: mockFiles },
    });

    const { result } = renderHook(() => useFolderFilesQuery('folder-123'), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(getSpy).toHaveBeenCalledWith('/google/folders/folder-123/files');
    expect(result.current.data).toHaveLength(1);
    expect(result.current.data?.[0].name).toBe('Week 1 Lecture Slides.pdf');
  });

  it('useDeleteDriveFileMutation deletes file from Google Drive', async () => {
    const deleteSpy = vi.spyOn(apiClient, 'delete').mockResolvedValueOnce({
      data: { success: true, data: { message: 'File deleted', fileId: 'file-123' } },
    });

    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

    const { result } = renderHook(() => useDeleteDriveFileMutation('folder-123'), { wrapper });

    result.current.mutate('file-123');

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(deleteSpy).toHaveBeenCalledWith('/google/files/file-123');
    expect(invalidateSpy).toHaveBeenCalled();
  });

  it('useDownloadDriveFile triggers file streaming download', async () => {
    const mockBlob = new Blob(['binary data'], { type: 'application/pdf' });

    vi.spyOn(apiClient, 'get').mockResolvedValueOnce({
      data: mockBlob,
      headers: {
        'content-type': 'application/pdf',
        'content-disposition': 'attachment; filename="syllabus.pdf"',
      },
    });

    // Mock URL.createObjectURL and revokeObjectURL
    const createObjectUrlMock = vi.fn().mockReturnValue('blob:mock-url');
    const revokeObjectUrlMock = vi.fn();
    window.URL.createObjectURL = createObjectUrlMock;
    window.URL.revokeObjectURL = revokeObjectUrlMock;

    const { result } = renderHook(() => useDownloadDriveFile());

    await result.current.downloadFile('file-99', 'syllabus.pdf');

    expect(createObjectUrlMock).toHaveBeenCalled();
    expect(revokeObjectUrlMock).toHaveBeenCalledWith('blob:mock-url');
  });
});
