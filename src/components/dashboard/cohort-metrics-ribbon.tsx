import { Link } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Users, BookOpen, MessageSquare, QrCode, ClipboardList, Bell, CheckCircle2 } from 'lucide-react';

interface RepMetrics {
  totalStudents: number;
  totalCourses: number;
  pendingFeedback: number;
  activeSessions: number;
}

interface StudentMetrics {
  enrolledCourses: number;
  upcomingDeadlines: number;
  unreadNotifications: number;
  attendedSessions: number;
}

interface CohortMetricsRibbonProps {
  role: 'REP' | 'STUDENT';
  repMetrics?: RepMetrics;
  studentMetrics?: StudentMetrics;
  isLoading?: boolean;
}

export function CohortMetricsRibbon({
  role,
  repMetrics,
  studentMetrics,
  isLoading,
}: CohortMetricsRibbonProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 animate-pulse">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-24 rounded-xl border border-border bg-card/60" />
        ))}
      </div>
    );
  }

  if (role === 'REP') {
    const students = repMetrics?.totalStudents ?? 0;
    const courses = repMetrics?.totalCourses ?? 0;
    const feedback = repMetrics?.pendingFeedback ?? 0;
    const sessions = repMetrics?.activeSessions ?? 0;

    return (
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Cohort Size */}
        <Link to="/reps/students" className="block group">
          <Card className="border border-border bg-card transition-all group-hover:border-primary/50 group-hover:shadow-xs">
            <CardHeader className="p-4 pb-2">
              <CardTitle className="text-xs font-medium text-muted-foreground group-hover:text-primary transition-colors">
                Cohort Students
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0 flex items-center justify-between">
              <span className="text-2xl font-bold text-foreground">{students}</span>
              <Users className="w-5 h-5 text-muted-foreground/60 group-hover:text-primary transition-colors" />
            </CardContent>
          </Card>
        </Link>

        {/* Active Courses */}
        <Link to="/reps/courses" className="block group">
          <Card className="border border-border bg-card transition-all group-hover:border-primary/50 group-hover:shadow-xs">
            <CardHeader className="p-4 pb-2">
              <CardTitle className="text-xs font-medium text-muted-foreground group-hover:text-primary transition-colors">
                Active Courses
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0 flex items-center justify-between">
              <span className="text-2xl font-bold text-foreground">{courses}</span>
              <BookOpen className="w-5 h-5 text-muted-foreground/60 group-hover:text-primary transition-colors" />
            </CardContent>
          </Card>
        </Link>

        {/* Pending Feedback */}
        <Link to="/reps/feedback" className="block group">
          <Card
            className={`border transition-all group-hover:shadow-xs ${
              feedback > 0
                ? 'border-amber-500/30 bg-amber-500/5 group-hover:border-amber-500/60'
                : 'border-border bg-card group-hover:border-primary/50'
            }`}
          >
            <CardHeader className="p-4 pb-2">
              <CardTitle
                className={`text-xs font-medium ${
                  feedback > 0 ? 'text-amber-700 dark:text-amber-400' : 'text-muted-foreground'
                }`}
              >
                Feedback Pending
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0 flex items-center justify-between">
              <span
                className={`text-2xl font-bold ${
                  feedback > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-foreground'
                }`}
              >
                {feedback}
              </span>
              <MessageSquare
                className={`w-5 h-5 ${
                  feedback > 0 ? 'text-amber-500/80' : 'text-muted-foreground/60'
                }`}
              />
            </CardContent>
          </Card>
        </Link>

        {/* Active Attendance Sessions */}
        <Link to="/reps/attendance" className="block group">
          <Card
            className={`border transition-all group-hover:shadow-xs ${
              sessions > 0
                ? 'border-emerald-500/30 bg-emerald-500/5 group-hover:border-emerald-500/60'
                : 'border-border bg-card group-hover:border-primary/50'
            }`}
          >
            <CardHeader className="p-4 pb-2">
              <CardTitle
                className={`text-xs font-medium ${
                  sessions > 0 ? 'text-emerald-700 dark:text-emerald-400' : 'text-muted-foreground'
                }`}
              >
                Active QR Sessions
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0 flex items-center justify-between">
              <span
                className={`text-2xl font-bold ${
                  sessions > 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-foreground'
                }`}
              >
                {sessions}
              </span>
              <QrCode
                className={`w-5 h-5 ${
                  sessions > 0 ? 'text-emerald-600' : 'text-muted-foreground/60'
                }`}
              />
            </CardContent>
          </Card>
        </Link>
      </div>
    );
  }

  // Student Role
  const enrolled = studentMetrics?.enrolledCourses ?? 0;
  const deadlines = studentMetrics?.upcomingDeadlines ?? 0;
  const unreadNotifs = studentMetrics?.unreadNotifications ?? 0;
  const attended = studentMetrics?.attendedSessions ?? 0;

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
      {/* Enrolled Courses */}
      <Link to="/students/courses" className="block group">
        <Card className="border border-border bg-card transition-all group-hover:border-primary/50 group-hover:shadow-xs">
          <CardHeader className="p-4 pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground group-hover:text-primary transition-colors">
              My Courses
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0 flex items-center justify-between">
            <span className="text-2xl font-bold text-foreground">{enrolled}</span>
            <BookOpen className="w-5 h-5 text-muted-foreground/60 group-hover:text-primary transition-colors" />
          </CardContent>
        </Card>
      </Link>

      {/* Upcoming Deadlines */}
      <Link to="/students/assignments" className="block group">
        <Card
          className={`border transition-all group-hover:shadow-xs ${
            deadlines > 0
              ? 'border-amber-500/30 bg-amber-500/5 group-hover:border-amber-500/60'
              : 'border-border bg-card group-hover:border-primary/50'
          }`}
        >
          <CardHeader className="p-4 pb-2">
            <CardTitle
              className={`text-xs font-medium ${
                deadlines > 0 ? 'text-amber-700 dark:text-amber-400' : 'text-muted-foreground'
              }`}
            >
              Upcoming Deadlines
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0 flex items-center justify-between">
            <span
              className={`text-2xl font-bold ${
                deadlines > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-foreground'
              }`}
            >
              {deadlines}
            </span>
            <ClipboardList
              className={`w-5 h-5 ${
                deadlines > 0 ? 'text-amber-500/80' : 'text-muted-foreground/60'
              }`}
            />
          </CardContent>
        </Card>
      </Link>

      {/* Unread Announcements */}
      <Link to="/students/notifications" className="block group">
        <Card
          className={`border transition-all group-hover:shadow-xs ${
            unreadNotifs > 0
              ? 'border-blue-500/30 bg-blue-500/5 group-hover:border-blue-500/60'
              : 'border-border bg-card group-hover:border-primary/50'
          }`}
        >
          <CardHeader className="p-4 pb-2">
            <CardTitle
              className={`text-xs font-medium ${
                unreadNotifs > 0 ? 'text-blue-700 dark:text-blue-400' : 'text-muted-foreground'
              }`}
            >
              Unread Notices
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0 flex items-center justify-between">
            <span
              className={`text-2xl font-bold ${
                unreadNotifs > 0 ? 'text-blue-600 dark:text-blue-400' : 'text-foreground'
              }`}
            >
              {unreadNotifs}
            </span>
            <Bell
              className={`w-5 h-5 ${
                unreadNotifs > 0 ? 'text-blue-500/80' : 'text-muted-foreground/60'
              }`}
            />
          </CardContent>
        </Card>
      </Link>

      {/* Attended Sessions */}
      <Link to="/students/attendance" className="block group">
        <Card className="border border-border bg-card transition-all group-hover:border-primary/50 group-hover:shadow-xs">
          <CardHeader className="p-4 pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground group-hover:text-primary transition-colors">
              Attended Sessions
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0 flex items-center justify-between">
            <span className="text-2xl font-bold text-foreground">{attended}</span>
            <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 group-hover:text-emerald-500 transition-colors" />
          </CardContent>
        </Card>
      </Link>
    </div>
  );
}

