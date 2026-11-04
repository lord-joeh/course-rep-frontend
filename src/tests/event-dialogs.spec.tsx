import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { EventCard } from '@/components/events/event-card';
import { CreateEventDialog } from '@/components/events/create-event-dialog';
import { EditEventDialog } from '@/components/events/edit-event-dialog';
import { CancelEventDialog } from '@/components/events/cancel-event-dialog';
import { DeleteEventDialog } from '@/components/events/delete-event-dialog';
import { CalendarMonthView } from '@/components/events/calendar-month-view';
import * as icsExport from '@/lib/ics-export';
import { apiClient } from '@/lib/api-client';
import type { Event } from '@/types';

describe('Event Components & Dialogs', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
    });
    vi.restoreAllMocks();
  });

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );

  const mockEvent: Event = {
    id: 'evt-101',
    title: 'Distributed Systems Lecture',
    description: 'Consensus protocols and Raft',
    eventType: 'lecture',
    courseId: 'CPEN404',
    course: { id: 'CPEN404', name: 'Distributed Systems' },
    startDate: '2026-11-15T09:00:00.000Z',
    endDate: '2026-11-15T11:00:00.000Z',
    venue: 'Hall 3 Room A',
    meetingLink: 'https://meet.google.com/test-meet',
    isCancelled: false,
    isRecurring: true,
    recurrenceFrequency: 'weekly',
    recurrenceInterval: 1,
    recurrenceDaysOfWeek: [0],
    recurrenceEndDate: null,
    recurrenceCount: 6,
    recurrenceSeriesId: 'series-999',
    createdAt: '2026-11-04T08:00:00.000Z',
    updatedAt: '2026-11-04T08:00:00.000Z',
  };

  describe('EventCard', () => {
    it('renders event title, type badge, venue and time', () => {
      const onViewDetail = vi.fn();
      render(<EventCard event={mockEvent} onViewDetail={onViewDetail} />, { wrapper });

      expect(screen.getByText('Distributed Systems Lecture')).toBeInTheDocument();
      expect(screen.getByText('Lecture')).toBeInTheDocument();
      expect(screen.getByText('Hall 3 Room A')).toBeInTheDocument();
      expect(screen.getByText(/weekly/i)).toBeInTheDocument();
    });

    it('displays cancelled badge when isCancelled is true', () => {
      const cancelledEvent = { ...mockEvent, isCancelled: true };
      render(<EventCard event={cancelledEvent} onViewDetail={vi.fn()} />, { wrapper });

      expect(screen.getByText('Cancelled')).toBeInTheDocument();
    });

    it('triggers .ics download when export button is clicked', () => {
      const downloadSpy = vi.spyOn(icsExport, 'downloadEventIcs').mockImplementation(() => {});
      render(<EventCard event={mockEvent} onViewDetail={vi.fn()} />, { wrapper });

      const downloadBtn = screen.getByText('.ics Export');
      fireEvent.click(downloadBtn);

      expect(downloadSpy).toHaveBeenCalledWith(mockEvent);
    });
  });

  describe('CreateEventDialog', () => {
    it('renders scheduling fields and creates an event', async () => {
      vi.spyOn(apiClient, 'get').mockResolvedValueOnce({
        data: { success: true, statusCode: 200, data: { items: [], meta: { total: 0 } } },
      });
      const postSpy = vi.spyOn(apiClient, 'post').mockResolvedValueOnce({
        data: { success: true, statusCode: 201, data: mockEvent },
      });

      const onClose = vi.fn();
      render(<CreateEventDialog isOpen={true} onClose={onClose} />, { wrapper });

      fireEvent.change(screen.getByLabelText(/Event Title/i), {
        target: { value: 'New Test Lecture' },
      });
      fireEvent.change(screen.getByLabelText(/Venue/i), {
        target: { value: 'Auditorium 1' },
      });

      const submitBtn = screen.getByRole('button', { name: /Schedule Event/i });
      fireEvent.click(submitBtn);

      await waitFor(() => {
        expect(postSpy).toHaveBeenCalled();
      });
      expect(onClose).toHaveBeenCalled();
    });

    it('displays venue collision warning banner when 409 conflict occurs', async () => {
      vi.spyOn(apiClient, 'get').mockResolvedValueOnce({
        data: { success: true, statusCode: 200, data: { items: [], meta: { total: 0 } } },
      });
      vi.spyOn(apiClient, 'post').mockRejectedValueOnce({
        response: {
          status: 409,
          data: {
            message: 'Venue "Auditorium 1" is already booked during this time slot',
          },
        },
      });

      render(<CreateEventDialog isOpen={true} onClose={vi.fn()} />, { wrapper });

      fireEvent.change(screen.getByLabelText(/Event Title/i), {
        target: { value: 'Conflict Lecture' },
      });
      fireEvent.change(screen.getByLabelText(/Venue/i), {
        target: { value: 'Auditorium 1' },
      });

      fireEvent.click(screen.getByRole('button', { name: /Schedule Event/i }));

      await waitFor(() => {
        expect(screen.getByText(/Venue Booking Conflict/i)).toBeInTheDocument();
      });
      expect(screen.getByText(/Force schedule anyway/i)).toBeInTheDocument();
    });
  });

  describe('EditEventDialog', () => {
    it('populates fields and offers updateFutureInSeries toggle for recurring event', async () => {
      vi.spyOn(apiClient, 'get').mockResolvedValueOnce({
        data: { success: true, statusCode: 200, data: { items: [], meta: { total: 0 } } },
      });

      render(<EditEventDialog event={mockEvent} isOpen={true} onClose={vi.fn()} />, { wrapper });

      expect(screen.getByDisplayValue('Distributed Systems Lecture')).toBeInTheDocument();
      expect(screen.getByDisplayValue('Hall 3 Room A')).toBeInTheDocument();
      expect(screen.getByText(/Apply changes to all future events in this recurring series/i)).toBeInTheDocument();
    });
  });

  describe('CancelEventDialog', () => {
    it('allows toggling series cancellation for recurring series', async () => {
      const patchSpy = vi.spyOn(apiClient, 'patch').mockResolvedValueOnce({
        data: { success: true, statusCode: 200, data: { cancelledCount: 4 } },
      });

      const onClose = vi.fn();
      render(<CancelEventDialog event={mockEvent} isOpen={true} onClose={onClose} />, { wrapper });

      const checkbox = screen.getByLabelText(/Cancel all future occurrences in this recurring series/i);
      fireEvent.click(checkbox);

      const cancelBtn = screen.getByRole('button', { name: /Cancel Entire Series/i });
      fireEvent.click(cancelBtn);

      await waitFor(() => {
        expect(patchSpy).toHaveBeenCalledWith('/events/series/series-999/cancel');
      });
      expect(onClose).toHaveBeenCalled();
    });
  });

  describe('DeleteEventDialog', () => {
    it('allows deleting entire series for recurring events', async () => {
      const deleteSpy = vi.spyOn(apiClient, 'delete').mockResolvedValueOnce({
        data: { success: true, statusCode: 200, data: { deletedCount: 6 } },
      });

      const onClose = vi.fn();
      render(<DeleteEventDialog event={mockEvent} isOpen={true} onClose={onClose} />, { wrapper });

      const checkbox = screen.getByLabelText(/Delete entire recurring series/i);
      fireEvent.click(checkbox);

      const deleteBtn = screen.getByRole('button', { name: /Delete Entire Series/i });
      fireEvent.click(deleteBtn);

      await waitFor(() => {
        expect(deleteSpy).toHaveBeenCalledWith('/events/series/series-999');
      });
      expect(onClose).toHaveBeenCalled();
    });
  });

  describe('CalendarMonthView', () => {
    it('renders month name and day event chips', () => {
      const onSelectEvent = vi.fn();
      render(<CalendarMonthView events={[mockEvent]} onSelectEvent={onSelectEvent} />, { wrapper });

      expect(screen.getByTestId('calendar-month-view')).toBeInTheDocument();
      expect(screen.getByText('Sun')).toBeInTheDocument();
      expect(screen.getByText('Today')).toBeInTheDocument();
    });
  });
});

