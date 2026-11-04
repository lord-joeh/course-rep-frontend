import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { useNavigate } from 'react-router-dom';
import {
  QrCode,
  MessageSquarePlus,
  FileText,
  Network,
  Calendar,
  Compass,
} from 'lucide-react';

interface StudentQuickActionsProps {
  onOpenScanner?: () => void;
  onOpenFeedback?: () => void;
}

export function StudentQuickActions({
  onOpenScanner,
  onOpenFeedback,
}: StudentQuickActionsProps) {
  const navigate = useNavigate();

  return (
    <Card className="border border-border bg-card shadow-xs">
      <CardHeader className="p-4 sm:p-5 pb-3">
        <CardTitle className="text-sm sm:text-base font-bold text-foreground flex items-center gap-2">
          <Compass className="w-4 h-4 text-primary" />
          Quick Actions & Short-Cuts
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4 sm:p-5 pt-0">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 sm:gap-3">
          {/* Scan Attendance QR */}
          <Button
            variant="outline"
            className="h-auto py-3 px-2 flex flex-col items-center justify-center gap-1.5 border-emerald-500/30 bg-emerald-500/5 hover:border-emerald-500/60 hover:bg-emerald-500/10"
            onClick={() => {
              if (onOpenScanner) {
                onOpenScanner();
              } else {
                navigate('/students/attendance');
              }
            }}
            aria-label="Scan classroom attendance QR code"
          >
            <div className="p-2 rounded-lg bg-emerald-500 text-white shadow-xs">
              <QrCode className="w-5 h-5" />
            </div>
            <span className="text-[11px] font-bold text-center leading-tight text-emerald-800 dark:text-emerald-300">
              Scan Attendance
            </span>
          </Button>

          {/* Voice Feedback */}
          <Button
            variant="outline"
            className="h-auto py-3 px-2 flex flex-col items-center justify-center gap-1.5 border-border hover:border-primary/50 hover:bg-primary/5"
            onClick={() => {
              if (onOpenFeedback) {
                onOpenFeedback();
              } else {
                navigate('/students/feedback');
              }
            }}
            aria-label="Voice feedback or suggestions to Course Reps"
          >
            <div className="p-2 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400">
              <MessageSquarePlus className="w-5 h-5" />
            </div>
            <span className="text-[11px] font-semibold text-center leading-tight">
              Voice Feedback
            </span>
          </Button>

          {/* Course Slides */}
          <Button
            variant="outline"
            className="h-auto py-3 px-2 flex flex-col items-center justify-center gap-1.5 border-border hover:border-primary/50 hover:bg-primary/5"
            onClick={() => navigate('/students/slides')}
            aria-label="View course slides and materials"
          >
            <div className="p-2 rounded-lg bg-purple-500/10 text-purple-600 dark:text-purple-400">
              <FileText className="w-5 h-5" />
            </div>
            <span className="text-[11px] font-semibold text-center leading-tight">
              Course Slides
            </span>
          </Button>

          {/* Study Groups */}
          <Button
            variant="outline"
            className="h-auto py-3 px-2 flex flex-col items-center justify-center gap-1.5 border-border hover:border-primary/50 hover:bg-primary/5"
            onClick={() => navigate('/students/groups')}
            aria-label="View assigned study groups"
          >
            <div className="p-2 rounded-lg bg-rose-500/10 text-rose-600 dark:text-rose-400">
              <Network className="w-5 h-5" />
            </div>
            <span className="text-[11px] font-semibold text-center leading-tight">
              My Groups
            </span>
          </Button>

          {/* Timetable */}
          <Button
            variant="outline"
            className="h-auto py-3 px-2 flex flex-col items-center justify-center gap-1.5 border-border hover:border-primary/50 hover:bg-primary/5"
            onClick={() => navigate('/students/events')}
            aria-label="View timetable and events"
          >
            <div className="p-2 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400">
              <Calendar className="w-5 h-5" />
            </div>
            <span className="text-[11px] font-semibold text-center leading-tight">
              Timetable
            </span>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

