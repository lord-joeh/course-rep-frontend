import type { PaginatedResult } from './api.types';

export type NotificationType =
  | 'announcement'
  | 'assignment'
  | 'attendance'
  | 'event'
  | 'feedback'
  | 'system';

export type NotificationPriority = 'low' | 'normal' | 'high' | 'urgent';

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: NotificationType;
  priority: NotificationPriority;
  senderId: string | null;
  sender?: {
    id: string;
    name: string;
    email: string;
  } | null;
  courseId: string | null;
  course?: {
    id: string;
    name: string;
  } | null;
  isRead?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateNotificationDto {
  title: string;
  message: string;
  type?: NotificationType;
  priority?: NotificationPriority;
  courseId?: string;
}

export interface UpdateNotificationDto {
  title?: string;
  message?: string;
  type?: NotificationType;
  priority?: NotificationPriority;
  courseId?: string;
}

export interface DirectNotificationDto {
  studentId: string;
  message: string;
  messageType?: 'in_app' | 'email' | 'sms';
  title?: string;
}

export interface RegisterFcmTokenDto {
  token: string;
  deviceType?: string;
}

export interface NotificationQueryDto {
  type?: NotificationType;
  priority?: NotificationPriority;
  courseId?: string;
  isRead?: boolean;
  search?: string;
  page?: number;
  limit?: number;
}

export interface UnreadNotificationCountResponse {
  unreadCount: number;
}

export interface MarkAllReadResponse {
  message: string;
  markedCount: number;
}

export interface DirectMessagePayload {
  title: string;
  message: string;
  messageType: 'in_app' | 'email' | 'sms';
  senderId: string;
  sentAt: string | Date;
}

export type PaginatedNotifications = PaginatedResult<Notification>;
