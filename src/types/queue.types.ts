export type QueueNameType = 'email' | 'sms' | 'drive-sync' | 'attendance';

export interface BullJobCounts {
  active: number;
  completed: number;
  failed: number;
  delayed: number;
  waiting: number;
  paused: number;
}

export type QueueStatsMap = Record<string, BullJobCounts>;

export interface QueueStatsResponse {
  message: string;
  stats: QueueStatsMap;
}

export interface SendTestEmailDto {
  to?: string;
}

export interface SendTestSmsDto {
  to: string;
  message?: string;
}

export interface EnqueueTestResponse {
  message: string;
  jobId: string;
  recipient: string;
}

export interface QueueMeta {
  name: string;
  key: string;
  description: string;
  iconName: string;
}

