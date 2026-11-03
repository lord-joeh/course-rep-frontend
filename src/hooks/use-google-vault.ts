import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { toast } from 'sonner';
import type {
  ApiResponse,
  GoogleStatusResponse,
  GoogleAuthUrlResponse,
  CreateFolderDto,
  CreateFolderResponse,
  DriveFileItem,
  DeleteDriveFileResponse,
} from '@/types';
import type { AxiosError, AxiosResponse } from 'axios';

export const googleKeys = {
  all: ['google'] as const,
  status: () => [...googleKeys.all, 'status'] as const,
  authUrl: () => [...googleKeys.all, 'auth-url'] as const,
  folders: () => [...googleKeys.all, 'folders'] as const,
  folderFiles: (folderId: string) => [...googleKeys.folders(), folderId, 'files'] as const,
};

export function useGoogleStatusQuery() {
  return useQuery({
    queryKey: googleKeys.status(),
    queryFn: async () => {
      const response = await apiClient.get<ApiResponse<GoogleStatusResponse>>('/google/status');
      return response.data?.data;
    },
    staleTime: 30 * 1000,
  });
}

export function useGoogleAuthUrlQuery(enabled = false) {
  return useQuery({
    queryKey: googleKeys.authUrl(),
    queryFn: async () => {
      const response = await apiClient.get<ApiResponse<GoogleAuthUrlResponse>>('/google/auth-url');
      return response.data?.data;
    },
    enabled,
    staleTime: 5 * 60 * 1000,
  });
}

export function useRevokeGoogleAccessMutation(onSuccessCallback?: () => void) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const response = await apiClient.post<ApiResponse<{ message: string }>>('/google/revoke');
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: googleKeys.status() });
      toast.success('Google Drive Disconnected', {
        description: 'Institutional access has been revoked and tokens cleared.',
      });
      if (onSuccessCallback) {
        onSuccessCallback();
      }
    },
    onError: (error: AxiosError<{ message?: string }>) => {
      const message =
        error.response?.data?.message || 'Failed to revoke Google Drive access. Please try again.';
      toast.error('Revocation Failed', { description: message });
    },
  });
}

export function useCreateFolderMutation(
  onSuccessCallback?: (data?: CreateFolderResponse) => void,
) {
  return useMutation({
    mutationFn: async (dto: CreateFolderDto) => {
      const response = await apiClient.post<ApiResponse<CreateFolderResponse>>(
        '/google/folders',
        dto,
      );
      return response.data?.data;
    },
    onSuccess: (data) => {
      toast.success('Folder Created in Google Drive', {
        description: `Created "${data?.name}" (ID: ${data?.id}).`,
      });
      if (onSuccessCallback) {
        onSuccessCallback(data);
      }
    },
    onError: (error: AxiosError<{ message?: string }>) => {
      const message =
        error.response?.data?.message || 'Failed to create folder on Google Drive.';
      toast.error('Folder Creation Failed', { description: message });
    },
  });
}

export function useFolderFilesQuery(folderId?: string) {
  return useQuery({
    queryKey: googleKeys.folderFiles(folderId || ''),
    queryFn: async () => {
      if (!folderId || !folderId.trim()) return [];
      const response = await apiClient.get<ApiResponse<DriveFileItem[]>>(
        `/google/folders/${encodeURIComponent(folderId.trim())}/files`,
      );
      return response.data?.data || [];
    },
    enabled: Boolean(folderId && folderId.trim()),
    staleTime: 30 * 1000,
  });
}

export function useDeleteDriveFileMutation(
  folderId?: string,
  onSuccessCallback?: () => void,
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (fileId: string) => {
      const response = await apiClient.delete<ApiResponse<DeleteDriveFileResponse>>(
        `/google/files/${fileId}`,
      );
      return response.data?.data;
    },
    onSuccess: (data) => {
      if (folderId) {
        queryClient.invalidateQueries({ queryKey: googleKeys.folderFiles(folderId) });
      }
      toast.success('File Deleted from Google Drive', {
        description: data?.message || 'File has been removed from cloud storage.',
      });
      if (onSuccessCallback) {
        onSuccessCallback();
      }
    },
    onError: (error: AxiosError<{ message?: string }>) => {
      const message =
        error.response?.data?.message || 'Failed to delete file from Google Drive.';
      toast.error('Deletion Failed', { description: message });
    },
  });
}

export function useDownloadDriveFile() {
  const [downloadingFileId, setDownloadingFileId] = useState<string | null>(null);

  const downloadFile = async (fileId: string, fallbackName = 'download') => {
    try {
      setDownloadingFileId(fileId);
      const response: AxiosResponse<Blob> = await apiClient.get(
        `/google/files/${fileId}/download`,
        { responseType: 'blob' },
      );

      // Extract filename from Content-Disposition header
      const disposition = String(response.headers['content-disposition'] || '');
      let filename = fallbackName;
      const filenameMatch = disposition.match(/filename="?([^";]+)"?/i);
      if (filenameMatch && filenameMatch[1]) {
        filename = decodeURIComponent(filenameMatch[1]);
      }

      // Create blob URL and simulate download
      const blob = new Blob([response.data], {
        type: String(response.headers['content-type'] || 'application/octet-stream'),
      });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast.success('Download Complete', { description: `Downloaded ${filename}` });
    } catch {
      toast.error('Download Failed', {
        description: 'Unable to stream file from Google Drive.',
      });
    } finally {
      setDownloadingFileId(null);
    }
  };

  return { downloadFile, isDownloading: downloadingFileId !== null, downloadingFileId };
}
