import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { toast } from 'sonner';
import type {
  ApiResponse,
  PaginatedResult,
  Slide,
  SlideUploadResult,
  SlideQueryDto,
} from '@/types';
import type { AxiosError, AxiosResponse } from 'axios';

export const slideKeys = {
  all: ['slides'] as const,
  courseSlides: (courseId: string, params?: Partial<SlideQueryDto>) =>
    [...slideKeys.all, 'course', courseId, params] as const,
};

export function useCourseSlidesQuery(query: SlideQueryDto) {
  return useQuery({
    queryKey: slideKeys.courseSlides(query.courseId, query),
    queryFn: async () => {
      if (!query.courseId) {
        return { items: [], meta: { page: 1, limit: 20, total: 0, totalPages: 0, hasNextPage: false, hasPreviousPage: false } };
      }
      const response = await apiClient.get<ApiResponse<PaginatedResult<Slide>>>('/slides', {
        params: {
          courseId: query.courseId,
          page: query.page || 1,
          limit: query.limit || 20,
          search: query.search || undefined,
        },
      });
      return response.data?.data;
    },
    enabled: Boolean(query.courseId && query.courseId.trim()),
    placeholderData: (previousData) => previousData,
    staleTime: 30 * 1000,
  });
}

export interface UploadSlidesPayload {
  files: File[];
  courseId: string;
  folderId?: string;
  onProgress?: (percent: number, loaded: number, total: number) => void;
}

export function useUploadSlidesMutation(
  onSuccessCallback?: (result: SlideUploadResult) => void,
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      files,
      courseId,
      folderId,
      onProgress,
    }: UploadSlidesPayload) => {
      const formData = new FormData();
      for (const file of files) {
        formData.append('files', file);
      }
      formData.append('courseId', courseId.trim().toUpperCase());
      if (folderId && folderId.trim()) {
        formData.append('folderId', folderId.trim());
      }

      const response = await apiClient.post<ApiResponse<SlideUploadResult>>(
        '/slides/upload',
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
          onUploadProgress: (progressEvent) => {
            const total = progressEvent.total || 0;
            const loaded = progressEvent.loaded || 0;
            const percent = total > 0 ? Math.round((loaded * 100) / total) : 0;
            if (onProgress) {
              onProgress(percent, loaded, total);
            }
          },
        },
      );
      return response.data?.data;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: slideKeys.all });

      const uploadedCount = data?.uploaded?.length || 0;
      const skippedCount = data?.duplicatesSkipped?.length || 0;

      if (uploadedCount > 0 && skippedCount > 0) {
        toast.success('Materials Uploaded with Deduplication', {
          description: `Uploaded ${uploadedCount} file(s). Skipped ${skippedCount} duplicate file(s) already in repository.`,
        });
      } else if (uploadedCount > 0) {
        toast.success('Materials Uploaded Successfully', {
          description: `Successfully uploaded ${uploadedCount} file(s) to ${variables.courseId}.`,
        });
      } else if (skippedCount > 0) {
        toast.info('Duplicate Materials Skipped', {
          description: `All ${skippedCount} file(s) matched existing SHA-256 hashes in this course.`,
        });
      }

      if (onSuccessCallback && data) {
        onSuccessCallback(data);
      }
    },
    onError: (error: AxiosError<{ message?: string }>) => {
      const message =
        error.response?.data?.message || 'Failed to upload course materials. Please try again.';
      toast.error('Upload Failed', { description: message });
    },
  });
}

export function useDeleteSlideMutation(
  _courseId?: string,
  onSuccessCallback?: () => void,
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (slideId: string) => {
      const response = await apiClient.delete<ApiResponse<{ message: string; slideId: string }>>(
        `/slides/${slideId}`,
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: slideKeys.all });
      toast.success('Material Deleted', {
        description: 'The material has been removed and scheduled for cloud storage deletion.',
      });
      if (onSuccessCallback) {
        onSuccessCallback();
      }
    },
    onError: (error: AxiosError<{ message?: string }>) => {
      const message =
        error.response?.data?.message || 'Failed to delete slide. Please try again.';
      toast.error('Deletion Failed', { description: message });
    },
  });
}

export function useDownloadSlide() {
  const [downloadingSlideId, setDownloadingSlideId] = useState<string | null>(null);

  const downloadSlide = async (slideId: string, fallbackName = 'material') => {
    try {
      setDownloadingSlideId(slideId);
      const response: AxiosResponse<Blob> = await apiClient.get(
        `/slides/${slideId}/download`,
        { responseType: 'blob' },
      );

      // Extract filename from Content-Disposition header
      const disposition = String(response.headers['content-disposition'] || '');
      let filename = fallbackName;
      const filenameMatch = disposition.match(/filename="?([^";]+)"?/i);
      if (filenameMatch && filenameMatch[1]) {
        filename = decodeURIComponent(filenameMatch[1]);
      }

      // Create blob URL and trigger download
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
        description: 'Unable to stream material from cloud storage.',
      });
    } finally {
      setDownloadingSlideId(null);
    }
  };

  return {
    downloadSlide,
    isDownloading: downloadingSlideId !== null,
    downloadingSlideId,
  };
}

