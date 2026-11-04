import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { useNavigate } from 'react-router-dom';
import {
  QrCode,
  Bell,
  CalendarPlus,
  ClipboardPlus,
  FileUp,
  Network,
  Zap,
} from 'lucide-react';

interface RepQuickActionsProps {
  onOpenAttendanceSession?: () => void;
  onOpenBroadcast?: () => void;
}

export function RepQuickActions({
  onOpenAttendanceSession,
  onOpenBroadcast,
}: RepQuickActionsProps) {
  const navigate = useNavigate();

  return (
    <Card className="border border-border bg-card shadow-xs">
      <CardHeader className="p-4 sm:p-5 pb-3">
        <CardTitle className="text-sm sm:text-base font-bold text-foreground flex items-center gap-2">
          <Zap className="w-4 h-4 text-primary" />
          Representative Quick Actions
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4 sm:p-5 pt-0">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 sm:gap-3">
          {/* New QR Attendance */}
          <Button
            variant="outline"
            className="h-auto py-3 px-2 flex flex-col items-center justify-center gap-1.5 border-border hover:border-primary/50 hover:bg-primary/5"
            onClick={() => {
              if (onOpenAttendanceSession) {
                onOpenAttendanceSession();
              } else {
                navigate('/reps/attendance');
              }
            }}
            aria-label="Initialize attendance QR session"
          >
            <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <QrCode className="w-5 h-5" />
            </div>
            <span className="text-[11px] font-semibold text-center leading-tight">
              Start QR Session
            </span>
          </Button>

          {/* Broadcast Announcement */}
          <Button
            variant="outline"
            className="h-auto py-3 px-2 flex flex-col items-center justify-center gap-1.5 border-border hover:border-primary/50 hover:bg-primary/5"
            onClick={() => {
              if (onOpenBroadcast) {
                onOpenBroadcast();
              } else {
                navigate('/reps/notifications');
              }
            }}
            aria-label="Broadcast cohort announcement"
          >
            <div className="p-2 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400">
              <Bell className="w-5 h-5" />
            </div>
            <span className="text-[11px] font-semibold text-center leading-tight">
              Broadcast Notice
            </span>
          </Button>

          {/* Schedule Lecture/Event */}
          <Button
            variant="outline"
            className="h-auto py-3 px-2 flex flex-col items-center justify-center gap-1.5 border-border hover:border-primary/50 hover:bg-primary/5"
            onClick={() => navigate('/reps/events')}
            aria-label="Schedule class or academic event"
          >
            <div className="p-2 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400">
              <CalendarPlus className="w-5 h-5" />
            </div>
            <span className="text-[11px] font-semibold text-center leading-tight">
              Schedule Class
            </span>
          </Button>

          {/* Create Assignment */}
          <Button
            variant="outline"
            className="h-auto py-3 px-2 flex flex-col items-center justify-center gap-1.5 border-border hover:border-primary/50 hover:bg-primary/5"
            onClick={() => navigate('/reps/assignments')}
            aria-label="Publish new assignment"
          >
            <div className="p-2 rounded-lg bg-purple-500/10 text-purple-600 dark:text-purple-400">
              <ClipboardPlus className="w-5 h-5" />
            </div>
            <span className="text-[11px] font-semibold text-center leading-tight">
              New Assignment
            </span>
          </Button>

          {/* Upload Course Slides */}
          <Button
            variant="outline"
            className="h-auto py-3 px-2 flex flex-col items-center justify-center gap-1.5 border-border hover:border-primary/50 hover:bg-primary/5"
            onClick={() => navigate('/reps/slides')}
            aria-label="Upload lecture slides and media"
          >
            <div className="p-2 rounded-lg bg-sky-500/10 text-sky-600 dark:text-sky-400">
              <FileUp className="w-5 h-5" />
            </div>
            <span className="text-[11px] font-semibold text-center leading-tight">
              Upload Slides
            </span>
          </Button>

          {/* Divide Study Groups */}
          <Button
            variant="outline"
            className="h-auto py-3 px-2 flex flex-col items-center justify-center gap-1.5 border-border hover:border-primary/50 hover:bg-primary/5"
            onClick={() => navigate('/reps/groups')}
            aria-label="Divide student study groups"
          >
            <div className="p-2 rounded-lg bg-rose-500/10 text-rose-600 dark:text-rose-400">
              <Network className="w-5 h-5" />
            </div>
            <span className="text-[11px] font-semibold text-center leading-tight">
              Study Groups
            </span>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

