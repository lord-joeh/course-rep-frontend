import { useState, useMemo } from 'react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  useAttendanceInstanceDetailQuery,
  useManualMarkAttendeeMutation,
} from '@/hooks/use-attendance';
import { exportAttendanceSessionCsv } from '@/lib/attendance-export';
import type { AttendanceInstance, AttendanceStatus } from '@/types';
import {
  Users,
  Search,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Clock,
  Loader2,
  Calendar,
  FileDown,
} from 'lucide-react';

interface SessionRosterSheetProps {
  session: AttendanceInstance | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SessionRosterSheet({
  session,
  open,
  onOpenChange,
}: SessionRosterSheetProps) {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | AttendanceStatus>('all');

  const { data: detailData, isLoading } = useAttendanceInstanceDetailQuery(session?.id, { limit: 1000 });
  const manualMarkMutation = useManualMarkAttendeeMutation();

  const attendees = detailData?.attendees?.items || [];
  const stats = detailData?.stats || {
    totalEnrolled: 0,
    presentCount: 0,
    absentCount: 0,
    excusedCount: 0,
  };

  const filteredAttendees = useMemo(() => {
    return attendees.filter((item) => {
      const studentName = item.student?.name || '';
      const studentId = item.studentId || '';
      const matchesSearch =
        studentName.toLowerCase().includes(search.toLowerCase()) ||
        studentId.toLowerCase().includes(search.toLowerCase());

      const matchesStatus =
        statusFilter === 'all' || item.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [attendees, search, statusFilter]);

  const handleUpdateStatus = (attendanceId: string, status: AttendanceStatus) => {
    manualMarkMutation.mutate({ attendanceId, status });
  };

  if (!session) return null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-2xl bg-card border-l border-border p-0 flex flex-col h-full overflow-hidden"
      >
        <SheetHeader className="p-6 border-b border-border bg-background space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded bg-primary/10 flex items-center justify-center text-primary">
                <Users className="w-4 h-4" />
              </div>
              <SheetTitle className="text-xl font-bold tracking-tight">
                {session.courseId} Attendance Roster
              </SheetTitle>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => exportAttendanceSessionCsv(session, attendees)}
                disabled={attendees.length === 0}
                className="h-8 text-xs border-border"
                title="Export Attendance CSV"
              >
                <FileDown className="w-3.5 h-3.5 mr-1" />
                Export CSV
              </Button>
              <Badge
                variant="outline"
                className={
                  session.isClose
                    ? 'bg-muted text-muted-foreground'
                    : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
                }
              >
                {session.isClose ? 'Closed' : 'Active'}
              </Badge>
            </div>
          </div>
          <SheetDescription className="text-xs text-muted-foreground flex items-center gap-2">
            <Calendar className="w-3.5 h-3.5" />
            Session Date: {new Date(session.date).toLocaleDateString()} at{' '}
            {new Date(session.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </SheetDescription>

          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-4 gap-2 pt-2">
            <div className="p-2 rounded border border-border bg-muted/20 text-center">
              <span className="text-[10px] font-semibold uppercase text-muted-foreground block">
                Total Enrolled
              </span>
              <span className="text-lg font-bold text-foreground">
                {stats.totalEnrolled}
              </span>
            </div>
            <div className="p-2 rounded border border-emerald-500/20 bg-emerald-500/10 text-center">
              <span className="text-[10px] font-semibold uppercase text-emerald-600 dark:text-emerald-400 block">
                Present
              </span>
              <span className="text-lg font-bold text-emerald-600 dark:text-emerald-400">
                {stats.presentCount}
              </span>
            </div>
            <div className="p-2 rounded border border-red-500/20 bg-red-500/10 text-center">
              <span className="text-[10px] font-semibold uppercase text-red-600 dark:text-red-400 block">
                Absent
              </span>
              <span className="text-lg font-bold text-red-600 dark:text-red-400">
                {stats.absentCount}
              </span>
            </div>
            <div className="p-2 rounded border border-amber-500/20 bg-amber-500/10 text-center">
              <span className="text-[10px] font-semibold uppercase text-amber-600 dark:text-amber-400 block">
                Excused
              </span>
              <span className="text-lg font-bold text-amber-600 dark:text-amber-400">
                {stats.excusedCount}
              </span>
            </div>
          </div>
        </SheetHeader>

        {/* Filter & Search Toolbar */}
        <div className="p-4 border-b border-border bg-card space-y-3">
          <div className="relative">
            <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
            <Input
              placeholder="Search student name or index number..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 h-9 text-xs"
            />
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
            <button
              type="button"
              onClick={() => setStatusFilter('all')}
              className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${
                statusFilter === 'all'
                  ? 'bg-primary text-primary-foreground font-semibold'
                  : 'bg-muted text-muted-foreground hover:bg-muted/80'
              }`}
            >
              All Students ({attendees.length})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('present')}
              className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${
                statusFilter === 'present'
                  ? 'bg-emerald-600 text-white font-semibold'
                  : 'bg-muted text-muted-foreground hover:bg-muted/80'
              }`}
            >
              Present ({stats.presentCount})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('absent')}
              className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${
                statusFilter === 'absent'
                  ? 'bg-red-600 text-white font-semibold'
                  : 'bg-muted text-muted-foreground hover:bg-muted/80'
              }`}
            >
              Absent ({stats.absentCount})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('excused')}
              className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${
                statusFilter === 'excused'
                  ? 'bg-amber-600 text-white font-semibold'
                  : 'bg-muted text-muted-foreground hover:bg-muted/80'
              }`}
            >
              Excused ({stats.excusedCount})
            </button>
          </div>
        </div>

        {/* Attendees List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {isLoading ? (
            <div className="py-12 flex flex-col items-center justify-center text-muted-foreground space-y-2">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
              <span className="text-xs">Loading attendee records...</span>
            </div>
          ) : filteredAttendees.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground text-xs">
              No students found matching current filters.
            </div>
          ) : (
            filteredAttendees.map((att) => (
              <div
                key={att.id}
                className="p-3 rounded border border-border bg-card flex items-center justify-between gap-3 text-xs"
              >
                <div className="min-w-0">
                  <div className="font-semibold text-foreground truncate">
                    {att.student?.name || 'Enrolled Student'}
                  </div>
                  <div className="text-[11px] font-mono text-muted-foreground flex items-center gap-2 mt-0.5">
                    <span>ID: {att.studentId}</span>
                    {att.status === 'present' && att.date && (
                      <span className="flex items-center gap-1 text-[10px]">
                        <Clock className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                        {new Date(att.date).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    )}
                  </div>
                </div>

                {/* Status Badges & 1-Click Manual Override Buttons */}
                <div className="flex items-center gap-1.5 shrink-0">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleUpdateStatus(att.id, 'present')}
                    disabled={manualMarkMutation.isPending || att.status === 'present'}
                    className={`h-7 px-2 text-[11px] font-medium border ${
                      att.status === 'present'
                        ? 'bg-emerald-600 text-white border-emerald-600 hover:bg-emerald-600'
                        : 'border-border text-muted-foreground hover:bg-emerald-50 dark:hover:bg-emerald-950/30 hover:text-emerald-600'
                    }`}
                    title="Mark student Present"
                  >
                    <CheckCircle2 className="w-3 h-3 mr-1" /> Present
                  </Button>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleUpdateStatus(att.id, 'absent')}
                    disabled={manualMarkMutation.isPending || att.status === 'absent'}
                    className={`h-7 px-2 text-[11px] font-medium border ${
                      att.status === 'absent'
                        ? 'bg-red-600 text-white border-red-600 hover:bg-red-600'
                        : 'border-border text-muted-foreground hover:bg-red-50 dark:hover:bg-red-950/30 hover:text-red-600'
                    }`}
                    title="Mark student Absent"
                  >
                    <XCircle className="w-3 h-3 mr-1" /> Absent
                  </Button>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleUpdateStatus(att.id, 'excused')}
                    disabled={manualMarkMutation.isPending || att.status === 'excused'}
                    className={`h-7 px-2 text-[11px] font-medium border ${
                      att.status === 'excused'
                        ? 'bg-amber-600 text-white border-amber-600 hover:bg-amber-600'
                        : 'border-border text-muted-foreground hover:bg-amber-50 dark:hover:bg-amber-950/30 hover:text-amber-600'
                    }`}
                    title="Mark student Excused"
                  >
                    <HelpCircle className="w-3 h-3 mr-1" /> Excused
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
