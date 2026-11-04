import { describe, it, expect } from 'vitest';
import {
  sendTestEmailSchema,
  sendTestSmsSchema,
  calculateQueueHealth,
  getQueueHealthMeta,
  QUEUE_REGISTRY,
} from '@/lib/queue-validation';

describe('Queue Validation & Health Utilities', () => {
  it('validates test email schema with optional recipient', () => {
    expect(sendTestEmailSchema.safeParse({}).success).toBe(true);
    expect(sendTestEmailSchema.safeParse({ to: '' }).success).toBe(true);
    expect(sendTestEmailSchema.safeParse({ to: 'rep@university.edu' }).success).toBe(true);
    expect(sendTestEmailSchema.safeParse({ to: 'invalid-email' }).success).toBe(false);
  });

  it('validates test SMS schema with phone number requirements', () => {
    expect(sendTestSmsSchema.safeParse({ to: '0256269405' }).success).toBe(true);
    expect(sendTestSmsSchema.safeParse({ to: '+233241234567', message: 'Hello student' }).success).toBe(true);
    expect(sendTestSmsSchema.safeParse({ to: '123' }).success).toBe(false); // too short
    expect(sendTestSmsSchema.safeParse({ to: 'abcd123456' }).success).toBe(false); // invalid characters
  });

  it('calculates queue health state correctly from BullMQ job counts', () => {
    expect(calculateQueueHealth(undefined)).toBe('idle');
    expect(
      calculateQueueHealth({ active: 0, completed: 0, failed: 0, delayed: 0, waiting: 0, paused: 0 }),
    ).toBe('idle');
    expect(
      calculateQueueHealth({ active: 0, completed: 15, failed: 0, delayed: 0, waiting: 0, paused: 0 }),
    ).toBe('healthy');
    expect(
      calculateQueueHealth({ active: 2, completed: 15, failed: 0, delayed: 0, waiting: 0, paused: 0 }),
    ).toBe('active');
    expect(
      calculateQueueHealth({ active: 0, completed: 15, failed: 1, delayed: 0, waiting: 0, paused: 0 }),
    ).toBe('attention');
  });

  it('provides consistent visual tokens for queue health states', () => {
    const attention = getQueueHealthMeta('attention');
    expect(attention.label).toBe('Failed Jobs');
    expect(attention.badgeClass).toContain('rose');

    const active = getQueueHealthMeta('active');
    expect(active.label).toBe('Processing');
    expect(active.badgeClass).toContain('amber');

    const healthy = getQueueHealthMeta('healthy');
    expect(healthy.label).toBe('Operational');
    expect(healthy.badgeClass).toContain('emerald');

    const idle = getQueueHealthMeta('idle');
    expect(idle.label).toBe('Idle / Standby');
    expect(idle.badgeClass).toContain('slate');
  });

  it('contains registered metadata for all 4 backend queues', () => {
    expect(QUEUE_REGISTRY.email).toBeDefined();
    expect(QUEUE_REGISTRY.sms).toBeDefined();
    expect(QUEUE_REGISTRY['drive-sync']).toBeDefined();
    expect(QUEUE_REGISTRY.attendance).toBeDefined();
  });
});

