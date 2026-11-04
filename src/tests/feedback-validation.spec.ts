import { describe, it, expect } from 'vitest';
import {
  createFeedbackSchema,
  updateFeedbackStatusSchema,
  getFeedbackStatusMeta,
  getFeedbackCategoryMeta,
  getFeedbackPriorityMeta,
} from '@/lib/feedback-validation';

describe('Feedback Validation Schemas & Helpers', () => {
  describe('createFeedbackSchema', () => {
    it('validates a complete valid feedback payload', () => {
      const validData = {
        title: 'Projector broken in Lab 3',
        content: 'The HDMI cable and projector display flickering colors.',
        category: 'facilities',
        courseId: 'CPEN301',
        isAnonymous: true,
        priority: 'high',
      };

      const result = createFeedbackSchema.safeParse(validData);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.title).toBe('Projector broken in Lab 3');
        expect(result.data.isAnonymous).toBe(true);
        expect(result.data.priority).toBe('high');
      }
    });

    it('supplies default category (general), isAnonymous (false), and priority (medium)', () => {
      const minimalData = {
        title: 'More study room access',
        content: 'Could we open the second floor on weekends?',
      };

      const result = createFeedbackSchema.safeParse(minimalData);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.category).toBe('general');
        expect(result.data.isAnonymous).toBe(false);
        expect(result.data.priority).toBe('medium');
      }
    });

    it('rejects title shorter than 3 characters', () => {
      const invalidData = {
        title: 'No',
        content: 'Valid content of sufficient length.',
      };

      const result = createFeedbackSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('at least 3 characters');
      }
    });

    it('rejects content shorter than 5 characters', () => {
      const invalidData = {
        title: 'Valid Title',
        content: 'Bad',
      };

      const result = createFeedbackSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('at least 5 characters');
      }
    });

    it('rejects invalid category enum value', () => {
      const invalidData = {
        title: 'Valid Title',
        content: 'Valid feedback message body.',
        category: 'super-invalid-category',
      };

      const result = createFeedbackSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });
  });

  describe('updateFeedbackStatusSchema', () => {
    it('validates status transition and rep response note', () => {
      const validData = {
        status: 'resolved',
        repResponse: 'Replaced the projector cable with an active HDMI adapter.',
      };

      const result = updateFeedbackStatusSchema.safeParse(validData);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.status).toBe('resolved');
        expect(result.data.repResponse).toContain('HDMI adapter');
      }
    });

    it('rejects invalid status', () => {
      const invalidData = {
        status: 'closed_forever',
      };

      const result = updateFeedbackStatusSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });
  });

  describe('Metadata helpers', () => {
    it('returns correct status labels and badge styling', () => {
      expect(getFeedbackStatusMeta('submitted').label).toBe('Submitted');
      expect(getFeedbackStatusMeta('under_review').label).toBe('Under Review');
      expect(getFeedbackStatusMeta('resolved').label).toBe('Resolved');
      expect(getFeedbackStatusMeta('dismissed').label).toBe('Dismissed');
    });

    it('returns correct category labels and icons', () => {
      expect(getFeedbackCategoryMeta('academic').label).toBe('Academic');
      expect(getFeedbackCategoryMeta('facilities').label).toBe('Facilities');
      expect(getFeedbackCategoryMeta('welfare').label).toBe('Student Welfare');
      expect(getFeedbackCategoryMeta('lecturer').label).toBe('Lecturer');
    });

    it('returns correct priority meta badges', () => {
      expect(getFeedbackPriorityMeta('urgent').label).toBe('Urgent');
      expect(getFeedbackPriorityMeta('high').label).toBe('High');
      expect(getFeedbackPriorityMeta('medium').label).toBe('Medium');
      expect(getFeedbackPriorityMeta('low').label).toBe('Low');
    });
  });
});

