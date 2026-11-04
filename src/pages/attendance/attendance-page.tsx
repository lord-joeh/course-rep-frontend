import { useState, useMemo } from 'react';
import { useAuthStore } from '@/lib/auth-store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  useAttendanceInstancesQuery,
  useMyAttendanceRecordsQuery,
  useCloseAttendanceMutation,
  useDeleteAttendanceInstanceMutation,
} from '@/hooks/use-attendance';
import { SessionCard } from '@/components/attendance/session-card';
import { InitializeSessionDialog } from '@/components/attendance/initialize-session-dialog';
import { ProjectorModal } from '@/components/attendance/projector-modal';
import { QRScannerDialog } from '@/components/attendance/qr-scanner-dialog';
import { SessionRosterSheet } from '@/components/attendance/session-roster-sheet';
import type { AttendanceInstance, ClassType } from '@/types';
import {
  QrCode,
  Camera,
  Plus,
  Search,
  LayoutGrid,
  List,
  RefreshCw,
  Calendar,
  CheckCircle2,
  XCircle,
  HelpCircle,
  AlertTriangle,
  Tv,
  Users,
  PowerOff,
  Trash2,
} from 'lucide-react';

export function AttendancePage() {
  const { user } = useAuthStore();
  const isRep = Boolean(user?.isRep);

  // Common View States
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'closed'>('all');
  const [classTypeFilter, setClassTypeFilter] = useState<'all' | ClassType>('all');

  // Rep Dialog States
  const [isInitializeOpen, setIsInitializeOpen] = useState(false);
  const [projectorSession, setProjectorSession] = useState<AttendanceInstance | null>(null);
  const [rosterSession, setRosterSession] = useState<AttendanceInstance | null>(null);
  const [sessionToDelete, setSessionToDelete] = useState<AttendanceInstance | null>(null);
  const [sessionToClose, setSessionToClose] = useState<AttendanceInstance | null>(null);

  // Student Dialog States
  const [isScannerOpen, setIsScannerOpen] = useState(false);

  // Queries
  const {
    data: instancesData,
    isLoading: isLoadingInstances,
    refetch: refetchInstances,
  } = useAttendanceInstancesQuery();

  const {
    data: myRecordsData,
    isLoading: isLoadingMyRecords,
    refetch: refetchMyRecords,
  } = useMyAttendanceRecordsQuery();

  // Mutations
  const closeMutation = useCloseAttendanceMutation(() => {
    setSessionToClose(null);
  });

  const deleteMutation = useDeleteAttendanceInstanceMutation(() => {
    setSessionToDelete(null);
  });

  // Rep Filtering Logic
  const allInstances = instancesData?.items || [];
  const filteredInstances = useMemo(() => {
    return allInstances.filter((instance) => {
      const courseIdMatch = instance.courseId.toLowerCase().includes(search.toLowerCase());
      const courseNameMatch = instance.course?.name?.toLowerCase().includes(search.toLowerCase());
      const matchesSearch = !search || courseIdMatch || courseNameMatch;

      const matchesStatus =
        statusFilter === 'all' ||
        (statusFilter === 'active' && !instance.isClose) ||
        (statusFilter === 'closed' && instance.isClose);

      const matchesClassType =
        classTypeFilter === 'all' || instance.classType === classTypeFilter;

      return matchesSearch && matchesStatus && matchesClassType;
    });
  }, [allInstances, search, statusFilter, classTypeFilter]);

  // Student Attendance Stats
  const myRecords = myRecordsData?.items || [];
  const studentStats = useMemo(() => {
    const total = myRecords.length;
    const present = myRecords.filter((r) => r.status === 'present').length;
    const absent = myRecords.filter((r) => r.status === 'absent').length;
    const excused = myRecords.filter((r) => r.status === 'excused').length;
    const rate = total > 0 ? Math.round((present / total) * 100) : 0;
    return { total, present, absent, excused, rate };
  }, [myRecords]);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <QrCode className="w-6 h-6 text-primary" />
            {isRep ? 'Classroom Attendance Management' : 'My Attendance Portal'}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {isRep
              ? 'Manage dynamic QR attendance sessions, fullscreen projector screens, and geofence verification.'
              : 'View your verified lecture attendance records and scan classroom QR codes.'}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {isRep ? (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={() => refetchInstances()}
                className="h-9 border-border"
                title="Refresh sessions"
              >
                <RefreshCw className="w-4 h-4 mr-1 text-muted-foreground" /> Refresh
              </Button>
              <Button
                size="sm"
                onClick={() => setIsInitializeOpen(true)}
                className="h-9 bg-primary text-primary-foreground hover:bg-primary/90 font-medium"
              >
                <Plus className="w-4 h-4 mr-1.5" /> Initialize Session
              </Button>
            </>
          ) : (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={() => refetchMyRecords()}
                className="h-9 border-border"
                title="Refresh attendance records"
              >
                <RefreshCw className="w-4 h-4 mr-1 text-muted-foreground" /> Refresh
              </Button>
              <Button
                size="sm"
                onClick={() => setIsScannerOpen(true)}
                className="h-9 bg-primary text-primary-foreground hover:bg-primary/90 font-medium"
              >
                <Camera className="w-4 h-4 mr-1.5" /> Scan Classroom QR
              </Button>
            </>
          )}
        </div>
      </div>

      {/* STUDENT VIEW METRICS */}
      {!isRep && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-4 rounded border border-border bg-card">
            <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Attendance Rate
            </div>
            <div className="text-2xl font-extrabold text-foreground mt-1">
              {studentStats.rate}%
            </div>
            <p className="text-[11px] text-muted-foreground mt-0.5">Across all enrolled courses</p>
          </div>

          <div className="p-4 rounded border border-emerald-500/20 bg-emerald-500/10">
            <div className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
              Classes Attended
            </div>
            <div className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400 mt-1">
              {studentStats.present}
            </div>
            <p className="text-[11px] text-emerald-600/80 dark:text-emerald-400/80 mt-0.5">
              Verified in person or remote
            </p>
          </div>

          <div className="p-4 rounded border border-red-500/20 bg-red-500/10">
            <div className="text-xs font-semibold text-red-600 dark:text-red-400 uppercase tracking-wider">
              Missed Lectures
            </div>
            <div className="text-2xl font-extrabold text-red-600 dark:text-red-400 mt-1">
              {studentStats.absent}
            </div>
            <p className="text-[11px] text-red-600/80 dark:text-red-400/80 mt-0.5">
              Recorded as absent
            </p>
          </div>

          <div className="p-4 rounded border border-amber-500/20 bg-amber-500/10">
            <div className="text-xs font-semibold text-amber-600 dark:text-amber-400 uppercase tracking-wider">
              Excused Absences
            </div>
            <div className="text-2xl font-extrabold text-amber-600 dark:text-amber-400 mt-1">
              {studentStats.excused}
            </div>
            <p className="text-[11px] text-amber-600/80 dark:text-amber-400/80 mt-0.5">
              Approved by Course Rep
            </p>
          </div>
        </div>
      )}

      {/* REPS FILTER & SEARCH BAR */}
      {isRep && (
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 p-3 bg-card rounded border border-border">
          <div className="flex flex-1 items-center gap-2">
            <div className="relative flex-1 max-w-sm">
              <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
              <Input
                placeholder="Filter by course code or title..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 h-9 text-xs"
              />
            </div>

            {/* Status Filter Pills */}
            <div className="flex items-center gap-1 text-xs">
              <button
                type="button"
                onClick={() => setStatusFilter('all')}
                className={`px-2.5 py-1.5 rounded text-xs font-medium transition-colors ${
                  statusFilter === 'all'
                    ? 'bg-primary text-primary-foreground font-semibold'
                    : 'bg-muted text-muted-foreground hover:bg-muted/80'
                }`}
              >
                All ({allInstances.length})
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter('active')}
                className={`px-2.5 py-1.5 rounded text-xs font-medium transition-colors ${
                  statusFilter === 'active'
                    ? 'bg-emerald-600 text-white font-semibold'
                    : 'bg-muted text-muted-foreground hover:bg-muted/80'
                }`}
              >
                Active
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter('closed')}
                className={`px-2.5 py-1.5 rounded text-xs font-medium transition-colors ${
                  statusFilter === 'closed'
                    ? 'bg-muted-foreground text-background font-semibold'
                    : 'bg-muted text-muted-foreground hover:bg-muted/80'
                }`}
              >
                Closed
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {/* Class Type Selector */}
            <select
              value={classTypeFilter}
              onChange={(e) => setClassTypeFilter(e.target.value as any)}
              className="h-9 px-2.5 text-xs rounded border border-input bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            >
              <option value="all">All Class Types</option>
              <option value="in-person">In-Person Only</option>
              <option value="online">Online Only</option>
            </select>

            {/* View Mode Toggle */}
            <div className="flex items-center border border-border rounded overflow-hidden">
              <Button
                variant={viewMode === 'grid' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('grid')}
                className="h-9 w-9 p-0 rounded-none"
                title="Grid View"
              >
                <LayoutGrid className="w-4 h-4" />
              </Button>
              <Button
                variant={viewMode === 'table' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('table')}
                className="h-9 w-9 p-0 rounded-none"
                title="Table View"
              >
                <List className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* MAIN CONTENT AREA */}
      {isRep ? (
        /* COURSE REP SESSIONS */
        isLoadingInstances ? (
          <div className="py-20 text-center text-muted-foreground text-xs flex flex-col items-center justify-center space-y-2">
            <RefreshCw className="w-6 h-6 animate-spin text-primary" />
            <span>Loading attendance sessions...</span>
          </div>
        ) : filteredInstances.length === 0 ? (
          <div className="py-16 text-center border border-dashed border-border rounded-lg p-8 space-y-3">
            <QrCode className="w-10 h-10 text-muted-foreground mx-auto" />
            <h3 className="text-base font-bold">No Attendance Sessions Found</h3>
            <p className="text-xs text-muted-foreground max-w-sm mx-auto">
              Initialize a session to generate rotating QR codes and project them to students in the classroom.
            </p>
            <Button
              size="sm"
              onClick={() => setIsInitializeOpen(true)}
              className="bg-primary text-primary-foreground hover:bg-primary/90 text-xs font-medium"
            >
              <Plus className="w-3.5 h-3.5 mr-1.5" /> Initialize First Session
            </Button>
          </div>
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredInstances.map((session) => (
              <SessionCard
                key={session.id}
                session={session}
                onLaunchProjector={(s) => setProjectorSession(s)}
                onViewRoster={(s) => setRosterSession(s)}
                onCloseSession={(s) => setSessionToClose(s)}
                onDeleteSession={(s) => setSessionToDelete(s)}
              />
            ))}
          </div>
        ) : (
          /* Tabular View for Rep */
          <div className="rounded border border-border bg-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-muted/50 border-b border-border font-semibold text-muted-foreground uppercase text-[10px]">
                  <tr>
                    <th className="p-3">Course</th>
                    <th className="p-3">Date & Time</th>
                    <th className="p-3">Class Type</th>
                    <th className="p-3">Status</th>
                    <th className="p-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filteredInstances.map((session) => (
                    <tr key={session.id} className="hover:bg-muted/20 transition-colors">
                      <td className="p-3 font-semibold text-foreground">
                        {session.courseId}
                        <span className="text-[11px] font-normal text-muted-foreground block">
                          {session.course?.name || ''}
                        </span>
                      </td>
                      <td className="p-3 text-muted-foreground">
                        {new Date(session.date).toLocaleDateString()} at{' '}
                        {new Date(session.date).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </td>
                      <td className="p-3">
                        <Badge variant="outline" className="text-[11px] border-border">
                          {session.classType === 'in-person' ? 'In-Person (50m)' : 'Online'}
                        </Badge>
                      </td>
                      <td className="p-3">
                        <Badge
                          variant="outline"
                          className={
                            session.isClose
                              ? 'bg-muted text-muted-foreground text-[11px]'
                              : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 text-[11px]'
                          }
                        >
                          {session.isClose ? 'Closed' : 'Active'}
                        </Badge>
                      </td>
                      <td className="p-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <Button
                            size="sm"
                            onClick={() => setProjectorSession(session)}
                            className="h-7 text-xs bg-primary text-primary-foreground hover:bg-primary/90"
                          >
                            <Tv className="w-3 h-3 mr-1" /> Projector
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setRosterSession(session)}
                            className="h-7 text-xs border-border"
                          >
                            <Users className="w-3 h-3 mr-1" /> Roster
                          </Button>
                          {!session.isClose && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setSessionToClose(session)}
                              className="h-7 text-xs border-border text-amber-600 hover:text-amber-700"
                              title="Close Session"
                            >
                              <PowerOff className="w-3 h-3" />
                            </Button>
                          )}
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setSessionToDelete(session)}
                            className="h-7 text-xs border-border text-destructive hover:text-destructive"
                            title="Delete Session"
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )
      ) : (
        /* STUDENT ATTENDANCE HISTORY */
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-foreground flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-primary" />
              Course Attendance History
            </h3>
            <span className="text-xs text-muted-foreground">
              Total Recorded Lectures: {myRecords.length}
            </span>
          </div>

          {isLoadingMyRecords ? (
            <div className="py-16 text-center text-muted-foreground text-xs flex flex-col items-center justify-center space-y-2">
              <RefreshCw className="w-6 h-6 animate-spin text-primary" />
              <span>Loading attendance history...</span>
            </div>
          ) : myRecords.length === 0 ? (
            <div className="py-16 text-center border border-dashed border-border rounded-lg p-8 space-y-3">
              <QrCode className="w-10 h-10 text-muted-foreground mx-auto" />
              <h3 className="text-base font-bold">No Attendance Records Yet</h3>
              <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                When you attend lectures and scan the classroom projector QR code, your records will appear here.
              </p>
              <Button
                size="sm"
                onClick={() => setIsScannerOpen(true)}
                className="bg-primary text-primary-foreground hover:bg-primary/90 text-xs font-medium"
              >
                <Camera className="w-3.5 h-3.5 mr-1.5" /> Open Scanner
              </Button>
            </div>
          ) : (
            <div className="rounded border border-border bg-card overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="bg-muted/50 border-b border-border font-semibold text-muted-foreground uppercase text-[10px]">
                    <tr>
                      <th className="p-3">Course</th>
                      <th className="p-3">Lecture Date</th>
                      <th className="p-3">Recorded Status</th>
                      <th className="p-3 text-right">Verification Time</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {myRecords.map((record) => (
                      <tr key={record.id} className="hover:bg-muted/20 transition-colors">
                        <td className="p-3 font-semibold text-foreground">
                          {record.courseId}
                          <span className="text-[11px] font-normal text-muted-foreground block">
                            {record.course?.name || ''}
                          </span>
                        </td>
                        <td className="p-3 text-muted-foreground">
                          {new Date(record.date).toLocaleDateString()}
                        </td>
                        <td className="p-3">
                          {record.status === 'present' ? (
                            <Badge
                              variant="outline"
                              className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 text-[11px]"
                            >
                              <CheckCircle2 className="w-3 h-3 mr-1" /> Present
                            </Badge>
                          ) : record.status === 'absent' ? (
                            <Badge
                              variant="outline"
                              className="bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20 text-[11px]"
                            >
                              <XCircle className="w-3 h-3 mr-1" /> Absent
                            </Badge>
                          ) : (
                            <Badge
                              variant="outline"
                              className="bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20 text-[11px]"
                            >
                              <HelpCircle className="w-3 h-3 mr-1" /> Excused
                            </Badge>
                          )}
                        </td>
                        <td className="p-3 text-right font-mono text-[11px] text-muted-foreground">
                          {record.status === 'present' && record.date ? (
                            new Date(record.date).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit',
                            })
                          ) : (
                            '—'
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* DIALOGS & MODALS */}

      {/* Course Rep: Initialize Session Dialog */}
      <InitializeSessionDialog
        open={isInitializeOpen}
        onOpenChange={setIsInitializeOpen}
        onSessionCreated={(session) => {
          setProjectorSession(session);
        }}
      />

      {/* Course Rep: Classroom Projector Modal */}
      <ProjectorModal
        session={projectorSession}
        open={Boolean(projectorSession)}
        onOpenChange={(open) => {
          if (!open) setProjectorSession(null);
        }}
      />

      {/* Course Rep: Attendee Roster Sheet */}
      <SessionRosterSheet
        session={rosterSession}
        open={Boolean(rosterSession)}
        onOpenChange={(open) => {
          if (!open) setRosterSession(null);
        }}
      />

      {/* Student: Strictly Camera-Driven QR Scanner Dialog */}
      <QRScannerDialog
        open={isScannerOpen}
        onOpenChange={setIsScannerOpen}
        onSuccess={() => {
          refetchMyRecords();
        }}
      />

      {/* Confirmation Dialog: Close Session */}
      <Dialog
        open={Boolean(sessionToClose)}
        onOpenChange={(open) => {
          if (!open) setSessionToClose(null);
        }}
      >
        <DialogContent className="max-w-md bg-card text-card-foreground p-6 border border-border shadow-md">
          <DialogHeader className="space-y-1">
            <div className="flex items-center gap-2 text-amber-600">
              <PowerOff className="w-5 h-5" />
              <DialogTitle className="text-lg font-bold">Close Attendance Session?</DialogTitle>
            </div>
            <DialogDescription className="text-xs text-muted-foreground">
              Closing will terminate dynamic QR rotation and prevent any subsequent check-ins.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="pt-3 border-t border-border flex items-center justify-end gap-2">
            <Button variant="outline" onClick={() => setSessionToClose(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              disabled={closeMutation.isPending}
              onClick={() => {
                if (sessionToClose) closeMutation.mutate(sessionToClose.id);
              }}
            >
              Confirm Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirmation Dialog: Delete Session */}
      <Dialog
        open={Boolean(sessionToDelete)}
        onOpenChange={(open) => {
          if (!open) setSessionToDelete(null);
        }}
      >
        <DialogContent className="max-w-md bg-card text-card-foreground p-6 border border-border shadow-md">
          <DialogHeader className="space-y-1">
            <div className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="w-5 h-5" />
              <DialogTitle className="text-lg font-bold">Delete Attendance Session?</DialogTitle>
            </div>
            <DialogDescription className="text-xs text-muted-foreground">
              Are you sure? This action permanently removes this session and all linked attendee logs.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="pt-3 border-t border-border flex items-center justify-end gap-2">
            <Button variant="outline" onClick={() => setSessionToDelete(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              disabled={deleteMutation.isPending}
              onClick={() => {
                if (sessionToDelete) deleteMutation.mutate(sessionToDelete.id);
              }}
            >
              Delete Session
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
