import { describe, it, expect } from 'vitest';
import {
  createGroupSchema,
  updateGroupSchema,
  autoDivideGroupsSchema,
  addGroupMemberSchema,
} from '@/lib/group-validation';

describe('group-validation schemas', () => {
  describe('createGroupSchema', () => {
    it('validates course-specific group requires courseId', () => {
      const res = createGroupSchema.safeParse({
        name: 'Study Group 1',
        isGeneral: false,
        courseId: '',
      });
      expect(res.success).toBe(false);
      if (!res.success) {
        expect(res.error.issues.some((i) => i.path.includes('courseId'))).toBe(true);
      }
    });

    it('validates general cohort group succeeds without courseId', () => {
      const res = createGroupSchema.safeParse({
        name: 'General Cohort Alpha',
        isGeneral: true,
      });
      expect(res.success).toBe(true);
    });

    it('rejects group name shorter than 2 characters', () => {
      const res = createGroupSchema.safeParse({
        name: 'A',
        isGeneral: true,
      });
      expect(res.success).toBe(false);
    });
  });

  describe('updateGroupSchema', () => {
    it('accepts valid update payload', () => {
      const res = updateGroupSchema.safeParse({
        name: 'Updated Group Name',
        description: 'New topic discussion',
      });
      expect(res.success).toBe(true);
    });
  });

  describe('autoDivideGroupsSchema', () => {
    it('requires courseId when dividing in course-specific mode', () => {
      const res = autoDivideGroupsSchema.safeParse({
        isGeneral: false,
        partitionMode: 'bySize',
        studentsPerGroup: 4,
      });
      expect(res.success).toBe(false);
      if (!res.success) {
        expect(res.error.issues.some((i) => i.path.includes('courseId'))).toBe(true);
      }
    });

    it('validates partition bySize requires studentsPerGroup >= 2', () => {
      const res = autoDivideGroupsSchema.safeParse({
        isGeneral: true,
        partitionMode: 'bySize',
        studentsPerGroup: 1,
      });
      expect(res.success).toBe(false);
      if (!res.success) {
        expect(res.error.issues.some((i) => i.path.includes('studentsPerGroup'))).toBe(true);
      }
    });

    it('validates partition byCount requires numberOfGroups >= 2', () => {
      const res = autoDivideGroupsSchema.safeParse({
        isGeneral: true,
        partitionMode: 'byCount',
        numberOfGroups: 0,
      });
      expect(res.success).toBe(false);
      if (!res.success) {
        expect(res.error.issues.some((i) => i.path.includes('numberOfGroups'))).toBe(true);
      }
    });

    it('accepts valid auto-divide configuration with default naming prefix and leader assignment', () => {
      const res = autoDivideGroupsSchema.safeParse({
        isGeneral: false,
        courseId: 'CPEN402',
        partitionMode: 'bySize',
        studentsPerGroup: 5,
        namingPrefix: 'Team',
        autoAssignLeader: true,
      });
      expect(res.success).toBe(true);
    });
  });

  describe('addGroupMemberSchema', () => {
    it('rejects empty studentId', () => {
      const res = addGroupMemberSchema.safeParse({
        studentId: '',
        isLeader: false,
      });
      expect(res.success).toBe(false);
    });

    it('accepts valid studentId and leadership status', () => {
      const res = addGroupMemberSchema.safeParse({
        studentId: '10928374',
        isLeader: true,
      });
      expect(res.success).toBe(true);
    });
  });
});

