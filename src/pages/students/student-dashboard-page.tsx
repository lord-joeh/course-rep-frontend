import { useState } from 'react';
import { useAuthStore } from '@/lib/auth-store';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { CohortMetricsRibbon } from '@/components/dashboard/cohort-metrics-ribbon';
import { StudentQuickActions } from '@/components/dashboard/student-quick-actions';
import { UpcomingScheduleCard } from '@/components/dashboard/upcoming-schedule-card';
import { DeadlineTickerCard } from '@/components/dashboard/deadline-ticker-card';
import { RecentAnnouncementsCard } from '@/components/dashboard/recent-announcements-card';
import { QRScannerDialog } from '@/components/attendance/qr-scanner-dialog';
import { SubmitFeedbackDialog } from '@/components/feedback/submit-feedback-dialog';
import { useCoursesQuery } from '@/hooks/use-courses';
import { useAssignmentsQuery } from '@/hooks/use-assignments';
import { useNotificationsQuery, useUnreadNotificationCountQuery } from '@/hooks/use-notifications';
import { useUpcomingEventsQuery } from '@/hooks/use-events';
import { useMyAttendanceRecordsQuery } from '@/hooks/use-attendance';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import {
  GraduationCap,
  RefreshCw,
  BookOpen,
  ChevronRight,
} from 'lucide-react';

export function StudentDashboardPage() {
  const { user } = useAuthStore();

  // Dialog States
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [isFeedbackOpen, setIsFeedbackOpen] = useState(false);

  // Queries
  const { data: coursesData, isLoading: isCoursesLoading, refetch: refetchCourses } =
    useCoursesQuery({ limit: 10 });

  const defaultCourseId = coursesData?.items?.[0]?.id || '';

  const { data: assignmentsData, isLoading: isAssignmentsLoading, refetch: refetchAssignments } =
    useAssignmentsQuery({ courseId: defaultCourseId, limit: 4 });
  const { data: notificationsData, isLoading: isNotifsLoading, refetch: refetchNotifs } =
    useNotificationsQuery({ limit: 4 });
  const { data: unreadCountData, refetch: refetchUnread } = useUnreadNotificationCountQuery();
  const { data: upcomingEvents, isLoading: isEventsLoading, refetch: refetchEvents } =
    useUpcomingEventsQuery(4);
  const { data: myAttendanceData, isLoading: isAttendanceLoading, refetch: refetchAttendance } =
    useMyAttendanceRecordsQuery({ limit: 50 });

  const [isRefetchingAll, setIsRefetchingAll] = useState(false);

  const handleRefreshAll = async () => {
    setIsRefetchingAll(true);
    await Promise.all([
      refetchCourses(),
      refetchAssignments(),
      refetchNotifs(),
      refetchUnread(),
      refetchEvents(),
      refetchAttendance(),
    ]);
    setIsRefetchingAll(false);
  };

  const courses = coursesData?.items || [];
  const enrolledCount = courses.length;
  const upcomingDeadlinesCount = assignmentsData?.items?.length || 0;
  const unreadNotifsCount = unreadCountData?.unreadCount ?? 0;
  const attendedCount = myAttendanceData?.items?.length || 0;

  const isMetricsLoading = isCoursesLoading || isAssignmentsLoading || isAttendanceLoading;

  return (
    <div className="space-y-6 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
      {/* Header & Welcome Greeting */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground flex items-center gap-2">
              <GraduationCap className="w-6 h-6 text-primary shrink-0" />
              Welcome back, {user?.name || user?.email || 'Student'}
            </h1>
            <Badge variant="secondary" className="text-xs font-semibold uppercase">
              Student
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Student Academic Portal • {format(new Date(), 'EEEE, MMMM do, yyyy')}
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
        </div>
      </div>

      {/* Top Student Metrics Ribbon */}
      <CohortMetricsRibbon
        role="STUDENT"
        studentMetrics={{
          enrolledCourses: enrolledCount,
          upcomingDeadlines: upcomingDeadlinesCount,
          unreadNotifications: unreadNotifsCount,
          attendedSessions: attendedCount,
        }}
        isLoading={isMetricsLoading}
      />

      {/* 1-Click Student Quick Actions */}
      <StudentQuickActions
        onOpenScanner={() => setIsScannerOpen(true)}
        onOpenFeedback={() => setIsFeedbackOpen(true)}
      />

      {/* Core Widget Dual-Column Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column: Today's Schedule & Deadlines */}
        <div className="space-y-6">
          <UpcomingScheduleCard
            events={upcomingEvents || []}
            isLoading={isEventsLoading}
            viewAllHref="/students/events"
          />

          <DeadlineTickerCard
            assignments={assignmentsData?.items || []}
            isLoading={isAssignmentsLoading}
            viewAllHref="/students/assignments"
          />
        </div>

        {/* Right Column: Announcements & Enrolled Courses */}
        <div className="space-y-6">
          <RecentAnnouncementsCard
            notifications={notificationsData?.items || []}
            isLoading={isNotifsLoading}
            viewAllHref="/students/notifications"
          />

          {/* Quick Enrolled Courses Snippet */}
          <Card className="border border-border bg-card shadow-xs flex flex-col justify-between">
            <CardHeader className="p-4 sm:p-5 pb-3 flex flex-row items-center justify-between space-y-0">
              <CardTitle className="text-sm sm:text-base font-bold text-foreground flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-primary" />
                My Enrolled Courses
              </CardTitle>
              <Link
                to="/students/courses"
                className="text-xs text-primary hover:underline flex items-center gap-0.5 font-medium"
              >
                <span>Browse All</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </CardHeader>
            <CardContent className="p-4 sm:p-5 pt-0">
              {isCoursesLoading ? (
                <div className="space-y-2 py-2 animate-pulse">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="h-12 rounded-lg border border-border bg-muted/40" />
                  ))}
                </div>
              ) : courses.length === 0 ? (
                <div className="py-6 text-center text-xs text-muted-foreground">
                  You are not enrolled in any active courses yet.
                </div>
              ) : (
                <div className="space-y-2">
                  {courses.slice(0, 4).map((c) => (
                    <div
                      key={c.id}
                      className="flex items-center justify-between p-2.5 rounded-lg border border-border bg-muted/20 hover:bg-muted/40 transition-colors"
                    >
                      <div className="min-w-0">
                        <span className="font-semibold text-xs text-foreground block truncate">
                          {c.name}
                        </span>
                        <span className="font-mono text-[11px] text-muted-foreground uppercase">
                          {c.id}
                        </span>
                      </div>
                      <Link
                        to="/students/slides"
                        className="text-xs text-primary hover:underline font-medium shrink-0 ml-2"
                      >
                        Slides &rarr;
                      </Link>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Modal Dialogs */}
      <QRScannerDialog
        open={isScannerOpen}
        onOpenChange={setIsScannerOpen}
      />

      <SubmitFeedbackDialog
        isOpen={isFeedbackOpen}
        onClose={() => setIsFeedbackOpen(false)}
      />
    </div>
  );
}

