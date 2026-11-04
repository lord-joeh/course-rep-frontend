import type { PaginatedResult } from './api.types';

export interface GroupMemberItem {
  groupId?: string;
  studentId: string;
  isLeader: boolean;
  createdAt?: string;
  updatedAt?: string;
  student?: {
    id: string;
    name?: string;
    indexNumber?: string;
    email?: string;
    avatarUrl?: string | null;
  };
}

export interface Group {
  id: string;
  name: string;
  courseId: string | null;
  isGeneral: boolean;
  description: string | null;
  createdAt: string;
  updatedAt: string;
  course?: { id: string; name: string } | null;
  members?: GroupMemberItem[];
  memberCount?: number;
}

export interface GroupDetailResponse extends Group {
  members: GroupMemberItem[];
}

export interface CreateGroupDto {
  name: string;
  description?: string;
  isGeneral?: boolean;
  courseId?: string;
}

export interface UpdateGroupDto {
  name?: string;
  description?: string;
  courseId?: string;
}

export interface AutomatedGroupDivisionDto {
  courseId?: string;
  isGeneral?: boolean;
  studentsPerGroup?: number;
  numberOfGroups?: number;
  namingPrefix?: string;
  autoAssignLeader?: boolean;
}

export interface AutoDivideResponse {
  totalGroups: number;
  totalStudents: number;
  groups: Group[];
}

export interface AddGroupMemberDto {
  studentId: string;
  isLeader?: boolean;
}

export interface GroupQueryDto {
  courseId?: string;
  isGeneral?: boolean;
  search?: string;
  page?: number;
  limit?: number;
}

export type PaginatedGroups = PaginatedResult<Group>;

