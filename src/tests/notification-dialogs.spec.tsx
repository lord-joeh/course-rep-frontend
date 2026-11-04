import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import { NotificationCard } from '@/components/notifications/notification-card';
import { CreateAnnouncementDialog } from '@/components/notifications/create-announcement-dialog';
import { EditAnnouncementDialog } from '@/components/notifications/edit-announcement-dialog';
import { DirectMessageDialog } from '@/components/notifications/direct-message-dialog';
import { NotificationPopover } from '@/components/notifications/notification-popover';
import { apiClient } from '@/lib/api-client';
import type { Notification, Student } from '@/types';

describe('Notification Dialogs & Components', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
    });
    vi.restoreAllMocks();
  });

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>{children}</BrowserRouter>
    </QueryClientProvider>
  );

  const mockNotification: Notification = {
    id: 'notif-200',
    title: 'Midterm Room Rescheduled',
    message: 'Please proceed to Examination Hall B.',
    type: 'academic',
    priority: 'urgent',
    senderId: 'rep-01',
    sender: { id: 'rep-01', name: 'Course Rep', email: 'rep@univ.edu' },
    courseId: 'CPEN301',
    course: { id: 'CPEN301', name: 'Data Communications' },
    isRead: false,
    createdAt: '2026-11-04T12:00:00.000Z',
    updatedAt: '2026-11-04T12:00:00.000Z',
  };

  const mockStudent: Student = {
    id: '10982736',
    name: 'Kwame Mensah',
    email: 'kmensah@st.ug.edu.gh',
    status: 'ACTIVE',
    isRep: false,
    createdAt: '2026-01-01',
    updatedAt: '2026-01-01',
  };

  describe('NotificationCard', () => {
    it('renders announcement title, message, and urgent priority badge', () => {
      render(<NotificationCard notification={mockNotification} />, { wrapper });

      expect(screen.getByText('Midterm Room Rescheduled')).toBeInTheDocument();
      expect(screen.getByText('Please proceed to Examination Hall B.')).toBeInTheDocument();
      expect(screen.getByText('Urgent')).toBeInTheDocument();
      expect(screen.getByText('New')).toBeInTheDocument();
    });

    it('triggers mark as read mutation when Mark Read button is clicked', async () => {
      const patchSpy = vi.spyOn(apiClient, 'patch').mockResolvedValueOnce({
        data: { success: true, statusCode: 200, data: { message: 'Marked read' } },
      });

      render(<NotificationCard notification={mockNotification} />, { wrapper });

      const markReadBtn = screen.getByTitle('Mark as read');
      fireEvent.click(markReadBtn);

      await waitFor(() => {
        expect(patchSpy).toHaveBeenCalledWith('/notifications/notif-200/read');
      });
    });
  });

  describe('CreateAnnouncementDialog', () => {
    it('renders form inputs and displays urgent alert banner when priority is urgent', async () => {
      vi.spyOn(apiClient, 'get').mockResolvedValueOnce({
        data: { success: true, statusCode: 200, data: { items: [], meta: { total: 0 } } },
      });

      render(<CreateAnnouncementDialog isOpen={true} onClose={vi.fn()} />, { wrapper });

      expect(screen.getByLabelText(/Announcement Title/i)).toBeInTheDocument();

      const prioritySelect = screen.getByLabelText(/Priority Level/i);
      fireEvent.change(prioritySelect, { target: { value: 'urgent' } });

      await waitFor(() => {
        expect(screen.getByText(/Urgent Broadcast:/i)).toBeInTheDocument();
      });
    });

    it('submits valid announcement and triggers mutation', async () => {
      vi.spyOn(apiClient, 'get').mockResolvedValueOnce({
        data: { success: true, statusCode: 200, data: { items: [], meta: { total: 0 } } },
      });
      const postSpy = vi.spyOn(apiClient, 'post').mockResolvedValueOnce({
        data: { success: true, statusCode: 201, data: mockNotification },
      });

      const onClose = vi.fn();
      render(<CreateAnnouncementDialog isOpen={true} onClose={onClose} />, { wrapper });

      fireEvent.change(screen.getByLabelText(/Announcement Title/i), {
        target: { value: 'Important Cohort Meeting' },
      });
      fireEvent.change(screen.getByLabelText(/Announcement Message/i), {
        target: { value: 'All students are expected to attend.' },
      });

      const submitBtn = screen.getByRole('button', { name: /^Broadcast$/i });
      fireEvent.click(submitBtn);

      await waitFor(() => {
        expect(postSpy).toHaveBeenCalled();
      });
      expect(onClose).toHaveBeenCalled();
    });
  });

  describe('EditAnnouncementDialog', () => {
    it('pre-populates notification details', () => {
      vi.spyOn(apiClient, 'get').mockResolvedValueOnce({
        data: { success: true, statusCode: 200, data: { items: [], meta: { total: 0 } } },
      });

      render(
        <EditAnnouncementDialog
          notification={mockNotification}
          isOpen={true}
          onClose={vi.fn()}
        />,
        { wrapper },
      );

      expect(screen.getByDisplayValue('Midterm Room Rescheduled')).toBeInTheDocument();
      expect(screen.getByDisplayValue('Please proceed to Examination Hall B.')).toBeInTheDocument();
    });
  });

  describe('DirectMessageDialog', () => {
    it('submits direct student message when pre-selected recipient is provided', async () => {
      vi.spyOn(apiClient, 'get').mockResolvedValueOnce({
        data: { success: true, statusCode: 200, data: { items: [], meta: { total: 0 } } },
      });
      const postSpy = vi.spyOn(apiClient, 'post').mockResolvedValueOnce({
        data: { success: true, statusCode: 201, data: { message: 'Direct message sent' } },
      });

      const onClose = vi.fn();
      render(
        <DirectMessageDialog
          isOpen={true}
          onClose={onClose}
          defaultStudentId="10982736"
          defaultStudentName="Kwame Mensah"
        />,
        { wrapper },
      );

      expect(screen.getByText('Kwame Mensah')).toBeInTheDocument();
      expect(screen.getByText(/ID: 10982736/i)).toBeInTheDocument();

      fireEvent.change(screen.getByLabelText(/Direct Message/i), {
        target: { value: 'Reminder to submit your lab assignment.' },
      });

      const submitBtn = screen.getByRole('button', { name: /Dispatch Alert/i });
      fireEvent.click(submitBtn);

      await waitFor(() => {
        expect(postSpy).toHaveBeenCalledWith('/notifications/direct', {
          studentId: '10982736',
          message: 'Reminder to submit your lab assignment.',
          messageType: 'in_app',
        });
      });
      expect(onClose).toHaveBeenCalled();
    });

    it('searches students with debounced input and selects recipient', async () => {
      vi.spyOn(apiClient, 'get').mockImplementation(async (url: string, config?: any) => {
        if (config?.params?.search === 'Kwame') {
          return {
            data: {
              success: true,
              statusCode: 200,
              data: { items: [mockStudent], meta: { total: 1 } },
            },
          };
        }
        return {
          data: {
            success: true,
            statusCode: 200,
            data: { items: [], meta: { total: 0 } },
          },
        };
      });

      render(<DirectMessageDialog isOpen={true} onClose={vi.fn()} />, { wrapper });

      const searchInput = screen.getByPlaceholderText(/search by name, student id/i);
      fireEvent.change(searchInput, { target: { value: 'Kwame' } });

      await waitFor(() => {
        expect(screen.getByText('Kwame Mensah')).toBeInTheDocument();
      });

      // Click on student result to select
      fireEvent.click(screen.getByText('Kwame Mensah'));

      // Recipient card is now active
      expect(screen.getByText(/ID: 10982736/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Change/i })).toBeInTheDocument();
    });
  });

  describe('NotificationPopover', () => {
    it('renders unread count badge and notification items with responsive layout', async () => {
      vi.spyOn(apiClient, 'get').mockImplementation(async (url: string) => {
        if (url.includes('/notifications/unread-count')) {
          return { data: { success: true, statusCode: 200, data: { unreadCount: 3 } } };
        }
        if (url.includes('/notifications')) {
          return {
            data: {
              success: true,
              statusCode: 200,
              data: { items: [mockNotification], meta: { total: 1, page: 1, limit: 5 } },
            },
          };
        }
        return { data: { success: true, statusCode: 200, data: [] } };
      });

      render(<NotificationPopover isRep={false} />, { wrapper });

      await waitFor(() => {
        expect(screen.getByText('3')).toBeInTheDocument();
      });
    });
  });
});
