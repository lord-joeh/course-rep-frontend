import { useState } from 'react';
import { useAuthStore } from '@/lib/auth-store';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { CohortMetricsRibbon } from '@/components/dashboard/cohort-metrics-ribbon';
import { RepQuickActions } from '@/components/dashboard/rep-quick-actions';
import { UpcomingScheduleCard } from '@/components/dashboard/upcoming-schedule-card';
import { DeadlineTickerCard } from '@/components/dashboard/deadline-ticker-card';
import { RecentAnnouncementsCard } from '@/components/dashboard/recent-announcements-card';
import { PendingFeedbackCard } from '@/components/dashboard/pending-feedback-card';
import { BullBoardLinkButton } from '@/components/queues/bull-board-link-button';
import { InitializeSessionDialog } from '@/components/attendance/initialize-session-dialog';
import { CreateAnnouncementDialog } from '@/components/notifications/create-announcement-dialog';
import { ChangePasswordDialog } from '@/components/auth/change-password-dialog';
import { useStudentsQuery } from '@/hooks/use-students';
import { useCoursesQuery } from '@/hooks/use-courses';
import { useFeedbacksQuery } from '@/hooks/use-feedback';
import { useAttendanceInstancesQuery } from '@/hooks/use-attendance';
import { useUpcomingEventsQuery } from '@/hooks/use-events';
import { useAssignmentsQuery } from '@/hooks/use-assignments';
import { useNotificationsQuery } from '@/hooks/use-notifications';
import { useQueueStatsQuery } from '@/hooks/use-queue-admin';
import { format } from 'date-fns';
import {
  Sparkles,
  RefreshCw,
  Key,
  Activity,
} from 'lucide-react';

export function RepDashboardPage() {
  const { user } = useAuthStore();

  // Dialog States
  const [isPasswordOpen, setIsPasswordOpen] = useState(false);
  const [isAttendanceOpen, setIsAttendanceOpen] = useState(false);
  const [isAnnouncementOpen, setIsAnnouncementOpen] = useState(false);

  // Queries
  const { data: studentsData, isLoading: isStudentsLoading, refetch: refetchStudents } =
    useStudentsQuery({ limit: 1 });
  const { data: coursesData, isLoading: isCoursesLoading, refetch: refetchCourses } =
    useCoursesQuery({ limit: 1 });

  const defaultCourseId = coursesData?.items?.[0]?.id || '';

  const { data: feedbackData, isLoading: isFeedbackLoading, refetch: refetchFeedback } =
    useFeedbacksQuery({ status: 'submitted', limit: 5 });
  const { data: attendanceData, isLoading: isAttendanceLoading, refetch: refetchAttendance } =
    useAttendanceInstancesQuery({ limit: 10 });

  const { data: upcomingEvents, isLoading: isEventsLoading, refetch: refetchEvents } =
    useUpcomingEventsQuery(4);
  const { data: assignmentsData, isLoading: isAssignmentsLoading, refetch: refetchAssignments } =
    useAssignmentsQuery({ courseId: defaultCourseId, limit: 4 });
  const { data: notificationsData, isLoading: isNotifsLoading, refetch: refetchNotifs } =
    useNotificationsQuery({ limit: 4 });
  const { data: queueStats, isLoading: isQueuesLoading, refetch: refetchQueues } =
    useQueueStatsQuery(30000);

  const [isRefetchingAll, setIsRefetchingAll] = useState(false);

  const handleRefreshAll = async () => {
    setIsRefetchingAll(true);
    await Promise.all([
      refetchStudents(),
      refetchCourses(),
      refetchFeedback(),
      refetchAttendance(),
      refetchEvents(),
      refetchAssignments(),
      refetchNotifs(),
      refetchQueues(),
    ]);
    setIsRefetchingAll(false);
  };

  const totalStudents = studentsData?.meta?.total ?? 0;
  const totalCourses = coursesData?.meta?.total ?? 0;
  const pendingFeedbackCount = feedbackData?.meta?.total ?? 0;

  // Active attendance instances (!isClose && expiresAt in the future)
  const activeSessionsCount =
    attendanceData?.items?.filter((s) => !s.isClose && new Date(s.expiresAt) > new Date()).length ?? 0;

  const isMetricsLoading =
    isStudentsLoading || isCoursesLoading || isFeedbackLoading || isAttendanceLoading;

  return (
    <div className="space-y-6 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
      {/* Header & Welcome Greeting */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground flex items-center gap-2">
              <Sparkles className="w-6 h-6 text-primary shrink-0" />
              Welcome back, {user?.name || user?.email || 'Representative'}
            </h1>
            <Badge variant="default" className="text-xs font-semibold uppercase">
              Course Rep
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Cohort Command Center • {format(new Date(), 'EEEE, MMMM do, yyyy')}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefreshAll}
            disabled={isRefetchingAll}
            className="h-9 gap-1.5 text-xs"
            aria-label="Refresh dashboard data"
          >
            <RefreshCw className={`w-4 h-4 ${isRefetchingAll ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Refresh All</span>
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsPasswordOpen(true)}
            className="h-9 gap-1.5 text-xs"
          >
            <Key className="w-4 h-4 text-muted-foreground" />
            <span className="hidden sm:inline">Change Password</span>
          </Button>
        </div>
      </div>

      {/* Top Cohort Metrics Ribbon */}
      <CohortMetricsRibbon
        role="REP"
        repMetrics={{
          totalStudents,
          totalCourses,
          pendingFeedback: pendingFeedbackCount,
          activeSessions: activeSessionsCount,
        }}
        isLoading={isMetricsLoading}
      />

      {/* 1-Click Representative Quick Actions */}
      <RepQuickActions
        onOpenAttendanceSession={() => setIsAttendanceOpen(true)}
        onOpenBroadcast={() => setIsAnnouncementOpen(true)}
      />

      {/* Core Widget Dual-Column Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column: Schedule & Deadlines */}
        <div className="space-y-6">
          <UpcomingScheduleCard
            events={upcomingEvents || []}
            isLoading={isEventsLoading}
            viewAllHref="/reps/events"
          />

          <DeadlineTickerCard
            assignments={assignmentsData?.items || []}
            isLoading={isAssignmentsLoading}
            viewAllHref="/reps/assignments"
          />
        </div>

        {/* Right Column: Feedback Inbox & Announcements */}
        <div className="space-y-6">
          <PendingFeedbackCard
            feedbacks={feedbackData?.items || []}
            isLoading={isFeedbackLoading}
          />

          <RecentAnnouncementsCard
            notifications={notificationsData?.items || []}
            isLoading={isNotifsLoading}
            viewAllHref="/reps/notifications"
          />
        </div>
      </div>

      {/* Background Services & Security Trail Strip */}
      <Card className="border border-border bg-muted/10">
        <CardHeader className="p-4 sm:p-5 pb-3">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <CardTitle className="text-sm font-bold flex items-center gap-2 text-foreground">
              <Activity className="w-4 h-4 text-primary" />
              Background Worker & Security Engine
            </CardTitle>
            <div className="flex items-center gap-2">
              <BullBoardLinkButton />
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-4 sm:p-5 pt-0">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
            <div className="p-2.5 rounded-lg border border-border bg-card">
              <span className="text-[10px] text-muted-foreground block font-medium">Email Queue</span>
              <span className="font-mono font-semibold text-foreground">
                {isQueuesLoading ? '...' : `${queueStats?.email?.completed ?? 0} jobs`}
              </span>
            </div>
            <div className="p-2.5 rounded-lg border border-border bg-card">
              <span className="text-[10px] text-muted-foreground block font-medium">SMS Gateway</span>
              <span className="font-mono font-semibold text-foreground">
                {isQueuesLoading ? '...' : `${queueStats?.sms?.completed ?? 0} jobs`}
              </span>
            </div>
            <div className="p-2.5 rounded-lg border border-border bg-card">
              <span className="text-[10px] text-muted-foreground block font-medium">Drive Sync</span>
              <span className="font-mono font-semibold text-foreground">
                {isQueuesLoading ? '...' : `${queueStats?.['drive-sync']?.completed ?? 0} jobs`}
              </span>
            </div>
            <div className="p-2.5 rounded-lg border border-border bg-card">
              <span className="text-[10px] text-muted-foreground block font-medium">Attendance Queue</span>
              <span className="font-mono font-semibold text-foreground">
                {isQueuesLoading ? '...' : `${queueStats?.attendance?.completed ?? 0} jobs`}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Modal Dialogs */}
      <ChangePasswordDialog
        open={isPasswordOpen}
        onOpenChange={setIsPasswordOpen}
      />

      <InitializeSessionDialog
        open={isAttendanceOpen}
        onOpenChange={setIsAttendanceOpen}
      />

      <CreateAnnouncementDialog
        isOpen={isAnnouncementOpen}
        onClose={() => setIsAnnouncementOpen(false)}
      />
    </div>
  );
}

