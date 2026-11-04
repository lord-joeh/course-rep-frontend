import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { CohortMetricsRibbon } from '@/components/dashboard/cohort-metrics-ribbon';
import { RepQuickActions } from '@/components/dashboard/rep-quick-actions';
import { StudentQuickActions } from '@/components/dashboard/student-quick-actions';
import { UpcomingScheduleCard } from '@/components/dashboard/upcoming-schedule-card';
import { DeadlineTickerCard } from '@/components/dashboard/deadline-ticker-card';
import { RecentAnnouncementsCard } from '@/components/dashboard/recent-announcements-card';
import { PendingFeedbackCard } from '@/components/dashboard/pending-feedback-card';
import type { Event, Assignment, Notification, Feedback } from '@/types';

const renderWithRouter = (ui: React.ReactElement) =>
  render(<BrowserRouter>{ui}</BrowserRouter>);

describe('Dashboard Widget Components', () => {
  it('renders CohortMetricsRibbon for Course Rep', () => {
    renderWithRouter(
      <CohortMetricsRibbon
        role="REP"
        repMetrics={{
          totalStudents: 125,
          totalCourses: 6,
          pendingFeedback: 3,
          activeSessions: 1,
        }}
      />,
    );

    expect(screen.getByText('Cohort Students')).toBeInTheDocument();
    expect(screen.getByText('125')).toBeInTheDocument();
    expect(screen.getByText('Active Courses')).toBeInTheDocument();
    expect(screen.getByText('6')).toBeInTheDocument();
    expect(screen.getByText('Feedback Pending')).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument();
    expect(screen.getByText('Active QR Sessions')).toBeInTheDocument();
    expect(screen.getByText('1')).toBeInTheDocument();
  });

  it('renders CohortMetricsRibbon for Student', () => {
    renderWithRouter(
      <CohortMetricsRibbon
        role="STUDENT"
        studentMetrics={{
          enrolledCourses: 5,
          upcomingDeadlines: 2,
          unreadNotifications: 4,
          attendedSessions: 18,
        }}
      />,
    );

    expect(screen.getByText('My Courses')).toBeInTheDocument();
    expect(screen.getByText('5')).toBeInTheDocument();
    expect(screen.getByText('Upcoming Deadlines')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument();
    expect(screen.getByText('Unread Notices')).toBeInTheDocument();
    expect(screen.getByText('4')).toBeInTheDocument();
    expect(screen.getByText('Attended Sessions')).toBeInTheDocument();
    expect(screen.getByText('18')).toBeInTheDocument();
  });

  it('renders RepQuickActions and triggers callbacks', () => {
    const handleStartSession = vi.fn();
    const handleBroadcast = vi.fn();

    renderWithRouter(
      <RepQuickActions
        onOpenAttendanceSession={handleStartSession}
        onOpenBroadcast={handleBroadcast}
      />,
    );

    expect(screen.getByText('Start QR Session')).toBeInTheDocument();
    expect(screen.getByText('Broadcast Notice')).toBeInTheDocument();
    expect(screen.getByText('Schedule Class')).toBeInTheDocument();
    expect(screen.getByText('New Assignment')).toBeInTheDocument();

    fireEvent.click(screen.getByText('Start QR Session'));
    expect(handleStartSession).toHaveBeenCalled();

    fireEvent.click(screen.getByText('Broadcast Notice'));
    expect(handleBroadcast).toHaveBeenCalled();
  });

  it('renders StudentQuickActions and triggers scanner callback', () => {
    const handleScanner = vi.fn();
    const handleFeedback = vi.fn();

    renderWithRouter(
      <StudentQuickActions
        onOpenScanner={handleScanner}
        onOpenFeedback={handleFeedback}
      />,
    );

    expect(screen.getByText('Scan Attendance')).toBeInTheDocument();
    expect(screen.getByText('Voice Feedback')).toBeInTheDocument();
    expect(screen.getByText('Course Slides')).toBeInTheDocument();

    fireEvent.click(screen.getByText('Scan Attendance'));
    expect(handleScanner).toHaveBeenCalled();

    fireEvent.click(screen.getByText('Voice Feedback'));
    expect(handleFeedback).toHaveBeenCalled();
  });

  it('renders UpcomingScheduleCard with event data and empty state', () => {
    const mockEvents: Event[] = [
      {
        id: 'evt-1',
        title: 'Operating Systems Lecture',
        description: null,
        courseId: 'cpen305',
        course: { id: 'CPEN 305', name: 'Operating Systems' },
        startDate: '2026-11-04T10:00:00.000Z',
        endDate: '2026-11-04T12:00:00.000Z',
        venue: 'Engineering Lab 3',
        meetingLink: null,
        eventType: 'lecture',
        isCancelled: false,
        isRecurring: false,
        recurrenceFrequency: null,
        recurrenceInterval: 1,
        recurrenceDaysOfWeek: null,
        recurrenceEndDate: null,
        recurrenceSeriesId: null,
        createdBy: 'rep-1',
        createdAt: '2026-01-01',
        updatedAt: '2026-01-01',
      },
    ];

    const { rerender } = renderWithRouter(
      <UpcomingScheduleCard events={mockEvents} viewAllHref="/reps/events" />,
    );

    expect(screen.getByText('Operating Systems Lecture')).toBeInTheDocument();
    expect(screen.getByText('CPEN 305')).toBeInTheDocument();
    expect(screen.getByText('Engineering Lab 3')).toBeInTheDocument();

    rerender(<BrowserRouter><UpcomingScheduleCard events={[]} viewAllHref="/reps/events" /></BrowserRouter>);
    expect(screen.getByText('No upcoming classes scheduled')).toBeInTheDocument();
  });

  it('renders DeadlineTickerCard with assignments and countdowns', () => {
    const mockAssignments: Assignment[] = [
      {
        id: 'asgn-1',
        title: 'Kernel Threads Lab Report',
        courseId: 'cpen305',
        course: { id: 'CPEN 305', name: 'Operating Systems', createdAt: '2026-01-01', updatedAt: '2026-01-01' },
        deadline: '2026-11-10T23:59:59.000Z',
        submissionCount: 20,
        submissionFolderId: null,
        fileId: null,
        fileName: null,
        description: 'Implement user threads in C',
        createdAt: '2026-01-01',
        updatedAt: '2026-01-01',
      },
    ];

    const { rerender } = renderWithRouter(
      <DeadlineTickerCard assignments={mockAssignments} viewAllHref="/reps/assignments" />,
    );

    expect(screen.getByText('Kernel Threads Lab Report')).toBeInTheDocument();
    expect(screen.getByText('20 subs')).toBeInTheDocument();

    rerender(<BrowserRouter><DeadlineTickerCard assignments={[]} viewAllHref="/reps/assignments" /></BrowserRouter>);
    expect(screen.getByText('No pending deadlines')).toBeInTheDocument();
  });

  it('renders RecentAnnouncementsCard with priority notice', () => {
    const mockNotifs: Notification[] = [
      {
        id: 'notif-1',
        title: 'Emergency Room Change',
        message: 'Midterm will now take place in Hall B.',
        type: 'academic',
        priority: 'urgent',
        courseId: null,
        targetType: 'cohort',
        isRead: false,
        createdAt: '2026-11-04T12:00:00.000Z',
      },
    ];

    renderWithRouter(
      <RecentAnnouncementsCard notifications={mockNotifs} viewAllHref="/reps/notifications" />,
    );

    expect(screen.getByText('Emergency Room Change')).toBeInTheDocument();
    expect(screen.getByText('Midterm will now take place in Hall B.')).toBeInTheDocument();
    expect(screen.getByText('Urgent')).toBeInTheDocument();
  });

  it('renders PendingFeedbackCard with unreviewed items', () => {
    const mockFeedbacks: Feedback[] = [
      {
        id: 'fb-1',
        title: 'Lab Air Conditioner Broken',
        content: 'It is extremely hot in Room 402 during afternoon lab sessions.',
        category: 'facilities',
        priority: 'high',
        status: 'submitted',
        isAnonymous: true,
        studentId: null,
        courseId: null,
        repResponse: null,
        resolvedAt: null,
        createdAt: '2026-11-04T12:00:00.000Z',
        updatedAt: '2026-11-04T12:00:00.000Z',
      },
    ];

    const { rerender } = renderWithRouter(
      <PendingFeedbackCard feedbacks={mockFeedbacks} />,
    );

    expect(screen.getByText('Lab Air Conditioner Broken')).toBeInTheDocument();
    expect(screen.getByText('Anon')).toBeInTheDocument();

    rerender(<BrowserRouter><PendingFeedbackCard feedbacks={[]} /></BrowserRouter>);
    expect(screen.getByText('Feedback inbox is all clear')).toBeInTheDocument();
  });
});

