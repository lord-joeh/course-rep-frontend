import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { AxiosError } from 'axios';
import { apiClient } from '@/lib/api-client';
import type {
  ApiResponse,
  PaginatedResult,
  AttendanceInstance,
  AttendanceRecord,
  AttendanceDetailResponse,
  InitializeAttendanceDto,
  MarkAttendanceDto,
  MarkAttendanceResponse,
  ManualMarkAttendeeDto,
  AttendanceInstanceFilterParams,
  AttendanceRecordFilterParams,
} from '@/types';

export const attendanceKeys = {
  all: ['attendance'] as const,
  instances: (params?: AttendanceInstanceFilterParams) =>
    [...attendanceKeys.all, 'instances', params] as const,
  instanceDetail: (id: string, params?: AttendanceRecordFilterParams) =>
    [...attendanceKeys.all, 'instance', id, params] as const,
  myRecords: (params?: AttendanceRecordFilterParams) =>
    [...attendanceKeys.all, 'my-records', params] as const,
};

export function useAttendanceInstancesQuery(params?: AttendanceInstanceFilterParams) {
  return useQuery({
    queryKey: attendanceKeys.instances(params),
    queryFn: async () => {
      const response = await apiClient.get<ApiResponse<PaginatedResult<AttendanceInstance>>>(
        '/attendance/instances',
        { params },
      );
      return response.data?.data;
    },
    staleTime: 1000 * 30, // 30 seconds
  });
}

export function useAttendanceInstanceDetailQuery(
  instanceId?: string,
  params?: AttendanceRecordFilterParams,
) {
  return useQuery({
    queryKey: instanceId ? attendanceKeys.instanceDetail(instanceId, params) : ['attendance', 'instance', 'null'],
    queryFn: async () => {
      if (!instanceId) return null;
      const response = await apiClient.get<ApiResponse<AttendanceDetailResponse>>(
        `/attendance/instances/${instanceId}`,
        { params },
      );
      return response.data?.data;
    },
    enabled: Boolean(instanceId),
    staleTime: 1000 * 10,
  });
}

export function useMyAttendanceRecordsQuery(params?: AttendanceRecordFilterParams) {
  return useQuery({
    queryKey: attendanceKeys.myRecords(params),
    queryFn: async () => {
      const response = await apiClient.get<ApiResponse<PaginatedResult<AttendanceRecord>>>(
        '/attendance/my-records',
        { params },
      );
      return response.data?.data;
    },
    staleTime: 1000 * 30,
  });
}

export function useInitializeAttendanceMutation(
  onSuccessCallback?: (data?: AttendanceInstance) => void,
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: InitializeAttendanceDto) => {
      const response = await apiClient.post<ApiResponse<AttendanceInstance>>(
        '/attendance/initialize',
        payload,
      );
      return response.data?.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: attendanceKeys.all });
      toast.success('Attendance Session Started', {
        description: `Session initiated. Dynamic QR rotation active (${data?.classType || 'in-person'}).`,
      });
      if (onSuccessCallback) {
        onSuccessCallback(data);
      }
    },
    onError: (error: AxiosError<{ message?: string }>) => {
      const message =
        error.response?.data?.message || 'Failed to initialize attendance session.';
      toast.error('Session Initialization Failed', { description: message });
    },
  });
}

export function useCloseAttendanceMutation(onSuccessCallback?: () => void) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (instanceId: string) => {
      const response = await apiClient.post<ApiResponse<{ message: string }>>(
        `/attendance/close/${instanceId}`,
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: attendanceKeys.all });
      toast.success('Session Closed', {
        description: 'Attendance session terminated. Dynamic QR codes invalidated.',
      });
      if (onSuccessCallback) {
        onSuccessCallback();
      }
    },
    onError: (error: AxiosError<{ message?: string }>) => {
      const message = error.response?.data?.message || 'Failed to close attendance session.';
      toast.error('Session Closure Failed', { description: message });
    },
  });
}

export function useMarkAttendanceMutation(
  onSuccessCallback?: (data?: MarkAttendanceResponse) => void,
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: MarkAttendanceDto) => {
      const response = await apiClient.post<ApiResponse<MarkAttendanceResponse>>(
        '/attendance/mark',
        payload,
      );
      return response.data?.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: attendanceKeys.all });
      toast.success('Attendance Verified', {
        description: 'Your attendance has been recorded successfully.',
      });
      if (onSuccessCallback) {
        onSuccessCallback(data);
      }
    },
    onError: (error: AxiosError<{ message?: string }>) => {
      const message =
        error.response?.data?.message ||
        'Failed to mark attendance. Ensure valid QR token and location.';
      toast.error('Attendance Check-In Failed', { description: message });
    },
  });
}

export function useManualMarkAttendeeMutation(onSuccessCallback?: () => void) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: ManualMarkAttendeeDto) => {
      const response = await apiClient.put<ApiResponse<AttendanceRecord>>(
        '/attendance/attendee',
        payload,
      );
      return response.data?.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: attendanceKeys.all });
      toast.success('Attendee Status Updated', {
        description: `Student marked as ${data?.status.toUpperCase()}.`,
      });
      if (onSuccessCallback) {
        onSuccessCallback();
      }
    },
    onError: (error: AxiosError<{ message?: string }>) => {
      const message = error.response?.data?.message || 'Failed to update attendee status.';
      toast.error('Status Update Failed', { description: message });
    },
  });
}

export function useDeleteAttendanceInstanceMutation(onSuccessCallback?: () => void) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (instanceId: string) => {
      const response = await apiClient.delete<ApiResponse<{ message: string }>>(
        `/attendance/instances/${instanceId}`,
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: attendanceKeys.all });
      toast.success('Attendance Session Deleted', {
        description: 'Session and all attendee logs removed.',
      });
      if (onSuccessCallback) {
        onSuccessCallback();
      }
    },
    onError: (error: AxiosError<{ message?: string }>) => {
      const message = error.response?.data?.message || 'Failed to delete attendance session.';
      toast.error('Deletion Failed', { description: message });
    },
  });
}

export function useDeleteAttendanceRecordMutation(onSuccessCallback?: () => void) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (attendanceId: string) => {
      const response = await apiClient.delete<ApiResponse<{ message: string }>>(
        `/attendance/records/${attendanceId}`,
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: attendanceKeys.all });
      toast.success('Record Deleted', {
        description: 'Attendance entry removed.',
      });
      if (onSuccessCallback) {
        onSuccessCallback();
      }
    },
    onError: (error: AxiosError<{ message?: string }>) => {
      const message = error.response?.data?.message || 'Failed to delete attendance entry.';
      toast.error('Deletion Failed', { description: message });
    },
  });
}

