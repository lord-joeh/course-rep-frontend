import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import type {
  Group,
  GroupDetailResponse,
  CreateGroupDto,
  UpdateGroupDto,
  AutomatedGroupDivisionDto,
  AutoDivideResponse,
  AddGroupMemberDto,
  GroupQueryDto,
  PaginatedGroups,
  ApiResponse,
} from '@/types';
import { toast } from 'sonner';

export const groupKeys = {
  all: ['groups'] as const,
  lists: () => [...groupKeys.all, 'list'] as const,
  list: (params: GroupQueryDto) => [...groupKeys.lists(), params] as const,
  myGroups: () => [...groupKeys.all, 'my-groups'] as const,
  studentGroups: (studentId: string) => [...groupKeys.all, 'student', studentId] as const,
  details: () => [...groupKeys.all, 'detail'] as const,
  detail: (id: string) => [...groupKeys.details(), id] as const,
};

/**
 * Fetch paginated list of study groups with filters.
 */
export function useGroupsQuery(params: GroupQueryDto = {}) {
  return useQuery({
    queryKey: groupKeys.list(params),
    queryFn: async () => {
      const { data } = await apiClient.get<ApiResponse<PaginatedGroups>>('/groups', {
        params: {
          page: params.page ?? 1,
          limit: params.limit ?? 20,
          courseId: params.courseId || undefined,
          isGeneral: params.isGeneral !== undefined ? params.isGeneral : undefined,
          search: params.search || undefined,
        },
      });
      return data.data;
    },
    staleTime: 1000 * 60 * 2,
  });
}

/**
 * Fetch groups assigned to the currently logged in student.
 */
export function useMyGroupsQuery() {
  return useQuery({
    queryKey: groupKeys.myGroups(),
    queryFn: async () => {
      const { data } = await apiClient.get<ApiResponse<Group[]>>('/groups/my-groups');
      return data.data;
    },
    staleTime: 1000 * 60 * 2,
  });
}

/**
 * Fetch group details with populated members roster.
 */
export function useGroupDetailQuery(id?: string) {
  return useQuery({
    queryKey: groupKeys.detail(id || ''),
    queryFn: async () => {
      if (!id) throw new Error('Group ID is required');
      const { data } = await apiClient.get<ApiResponse<GroupDetailResponse>>(`/groups/${id}`);
      return data.data;
    },
    enabled: Boolean(id),
    staleTime: 1000 * 60 * 2,
  });
}

/**
 * Rep only: Fetch groups for a specific student.
 */
export function useStudentGroupsQuery(studentId?: string) {
  return useQuery({
    queryKey: groupKeys.studentGroups(studentId || ''),
    queryFn: async () => {
      if (!studentId) throw new Error('Student ID is required');
      const { data } = await apiClient.get<ApiResponse<Group[]>>(`/groups/student/${studentId}`);
      return data.data;
    },
    enabled: Boolean(studentId),
    staleTime: 1000 * 60 * 2,
  });
}

/**
 * Rep only: Create a single study group.
 */
export function useCreateGroupMutation(onSuccessCallback?: (group: Group) => void) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (dto: CreateGroupDto) => {
      const { data } = await apiClient.post<ApiResponse<Group>>('/groups', dto);
      return data.data;
    },
    onSuccess: (newGroup) => {
      toast.success('Study group created successfully');
      queryClient.invalidateQueries({ queryKey: groupKeys.all });
      if (onSuccessCallback) onSuccessCallback(newGroup);
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to create study group');
    },
  });
}

/**
 * Rep only: Algorithmic division using Fisher-Yates engine.
 */
export function useAutoDivideGroupsMutation(
  onSuccessCallback?: (result: AutoDivideResponse) => void,
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (dto: AutomatedGroupDivisionDto) => {
      const { data } = await apiClient.post<ApiResponse<AutoDivideResponse>>(
        '/groups/auto-divide',
        dto,
      );
      return data.data;
    },
    onSuccess: (res) => {
      toast.success(
        `Automated division complete: ${res.totalGroups} groups created with ${res.totalStudents} students`,
      );
      queryClient.invalidateQueries({ queryKey: groupKeys.all });
      if (onSuccessCallback) onSuccessCallback(res);
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Automated group division failed');
    },
  });
}

/**
 * Rep only: Update group title, description, or course.
 */
export function useUpdateGroupMutation(onSuccessCallback?: (group: Group) => void) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, dto }: { id: string; dto: UpdateGroupDto }) => {
      const { data } = await apiClient.put<ApiResponse<Group>>(`/groups/${id}`, dto);
      return data.data;
    },
    onSuccess: (updated) => {
      toast.success('Group updated successfully');
      queryClient.invalidateQueries({ queryKey: groupKeys.all });
      if (onSuccessCallback) onSuccessCallback(updated);
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to update group');
    },
  });
}

/**
 * Rep only: Delete group and cascade memberships.
 */
export function useDeleteGroupMutation(onSuccessCallback?: () => void) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { data } = await apiClient.delete<ApiResponse<{ success: boolean; message: string }>>(
        `/groups/${id}`,
      );
      return data.data;
    },
    onSuccess: () => {
      toast.success('Study group deleted successfully');
      queryClient.invalidateQueries({ queryKey: groupKeys.all });
      if (onSuccessCallback) onSuccessCallback();
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to delete study group');
    },
  });
}

/**
 * Rep only: Add student member to group.
 */
export function useAddGroupMemberMutation(onSuccessCallback?: () => void) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, dto }: { id: string; dto: AddGroupMemberDto }) => {
      const { data } = await apiClient.post<ApiResponse<any>>(`/groups/${id}/members`, dto);
      return data.data;
    },
    onSuccess: () => {
      toast.success('Member added to group');
      queryClient.invalidateQueries({ queryKey: groupKeys.all });
      if (onSuccessCallback) onSuccessCallback();
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to add student to group');
    },
  });
}

/**
 * Rep only: Remove student member from group.
 */
export function useRemoveGroupMemberMutation(onSuccessCallback?: () => void) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, studentId }: { id: string; studentId: string }) => {
      const { data } = await apiClient.delete<ApiResponse<{ success: boolean; message: string }>>(
        `/groups/${id}/members/${studentId}`,
      );
      return data.data;
    },
    onSuccess: () => {
      toast.success('Member removed from group');
      queryClient.invalidateQueries({ queryKey: groupKeys.all });
      if (onSuccessCallback) onSuccessCallback();
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to remove member from group');
    },
  });
}

/**
 * Rep only: Designate or transfer group leadership.
 */
export function useSetGroupLeaderMutation(onSuccessCallback?: () => void) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, studentId }: { id: string; studentId: string }) => {
      const { data } = await apiClient.patch<ApiResponse<any>>(
        `/groups/${id}/leader/${studentId}`,
      );
      return data.data;
    },
    onSuccess: () => {
      toast.success('Group leadership assigned');
      queryClient.invalidateQueries({ queryKey: groupKeys.all });
      if (onSuccessCallback) onSuccessCallback();
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to update group leadership');
    },
  });
}

