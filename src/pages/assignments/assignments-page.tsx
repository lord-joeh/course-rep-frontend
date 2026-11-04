import { useState, useMemo, useEffect } from 'react';
import { useAuthStore } from '@/lib/auth-store';
import { useCoursesQuery, useMyCoursesQuery } from '@/hooks/use-courses';
import { useAssignmentsQuery, useDownloadAssignmentSpec } from '@/hooks/use-assignments';
import { isPastDeadline, formatDeadlineRemaining, getDeadlineStatusMeta } from '@/lib/assignment-validation';
import { AssignmentCard } from '@/components/assignments/assignment-card';
import { CreateAssignmentDialog } from '@/components/assignments/create-assignment-dialog';
import { EditAssignmentDialog } from '@/components/assignments/edit-assignment-dialog';
import { DeleteAssignmentDialog } from '@/components/assignments/delete-assignment-dialog';
import { SubmitAssignmentDialog } from '@/components/assignments/submit-assignment-dialog';
import { DeleteSubmissionDialog } from '@/components/assignments/delete-submission-dialog';
import { AssignmentSubmissionsSheet } from '@/components/assignments/assignment-submissions-sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import type { Assignment, AssignmentFilterStatus } from '@/types';
import {
  ClipboardList,
  Search,
  LayoutGrid,
  List,
  Calendar,
  Clock,
  Plus,
  RefreshCw,
  FolderOpen,
  FileDown,
  UploadCloud,
  Users,
  Edit2,
  Trash2,
  CheckCircle2,
} from 'lucide-react';

export function AssignmentsPage() {
  const { user } = useAuthStore();
  const isRep = Boolean(user?.isRep);

  // Course selection
  const [selectedCourseId, setSelectedCourseId] = useState<string>('');

  // Filtering & Search
  const [searchInput, setSearchInput] = useState<string>('');
  const [debouncedSearch, setDebouncedSearch] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<AssignmentFilterStatus>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  const [page, setPage] = useState<number>(1);

  // Dialog & Sheet States
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editAssignment, setEditAssignment] = useState<Assignment | null>(null);
  const [deleteAssignment, setDeleteAssignment] = useState<Assignment | null>(null);
  const [submitAssignment, setSubmitAssignment] = useState<Assignment | null>(null);
  const [inspectAssignment, setInspectAssignment] = useState<Assignment | null>(null);
  const [withdrawSubmission, setWithdrawSubmission] = useState<{
    id: string;
    fileName?: string | null;
    title?: string;
  } | null>(null);

  // Spec file download hook
  const { downloadSpec } = useDownloadAssignmentSpec();

  // Queries
  const { data: allCoursesData, isLoading: isLoadingCourses } = useCoursesQuery({ limit: 100 });
  const { data: myCourses } = useMyCoursesQuery();

  // Determine available courses based on role
  const availableCourses = useMemo(() => {
    if (isRep) {
      return allCoursesData?.items || [];
    }
    if (myCourses && myCourses.length > 0) {
      return myCourses;
    }
    return allCoursesData?.items || [];
  }, [isRep, allCoursesData, myCourses]);

  // Set default selected course
  useEffect(() => {
    if (!selectedCourseId && availableCourses.length > 0) {
      setSelectedCourseId(availableCourses[0].id);
    }
  }, [selectedCourseId, availableCourses]);

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchInput);
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  // Assignments Query
  const {
    data: assignmentsData,
    isLoading: isLoadingAssignments,
    isFetching: isFetchingAssignments,
    refetch: refetchAssignments,
  } = useAssignmentsQuery({
    courseId: selectedCourseId,
    page,
    limit: 50,
    search: debouncedSearch || undefined,
  });

  const rawAssignments = assignmentsData?.items || [];
  const activeCourse = availableCourses.find((c) => c.id === selectedCourseId);

  // Client-side status filtering
  const filteredAssignments = useMemo(() => {
    return rawAssignments.filter((a) => {
      const isPast = isPastDeadline(a.deadline);
      const hasSub = a.hasSubmitted || Boolean(a.studentSubmission);

      if (statusFilter === 'active') {
        return !isPast;
      }
      if (statusFilter === 'submitted') {
        return isRep ? (a.submissionCount ?? 0) > 0 : hasSub;
      }
      if (statusFilter === 'past') {
        return isPast;
      }
      return true;
    });
  }, [rawAssignments, statusFilter, isRep]);

  const activeCount = rawAssignments.filter((a) => !isPastDeadline(a.deadline)).length;
  const submittedCount = rawAssignments.filter((a) =>
    isRep ? (a.submissionCount ?? 0) > 0 : a.hasSubmitted || Boolean(a.studentSubmission),
  ).length;
  const pastCount = rawAssignments.filter((a) => isPastDeadline(a.deadline)).length;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Course Assignments
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Publish course tasks, upload solution briefs, track submission deadlines, and manage student repositories.
          </p>
        </div>

        {isRep && (
          <Button
            onClick={() => setIsCreateOpen(true)}
            disabled={!selectedCourseId}
            className="gap-2 shrink-0"
          >
            <Plus className="h-4 w-4" />
            Create Assignment
          </Button>
        )}
      </div>

      {/* Course Selector & Metadata Ribbon */}
      <div className="rounded-xl border border-border bg-card p-4 sm:p-5 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            <label htmlFor="course-select-assignment" className="text-xs font-semibold text-muted-foreground uppercase tracking-wider shrink-0">
              Select Course:
            </label>
            <div className="relative min-w-[280px]">
              <select
                id="course-select-assignment"
                aria-label="Select Course"
                value={selectedCourseId}
                onChange={(e) => {
                  setSelectedCourseId(e.target.value);
                  setPage(1);
                }}
                disabled={isLoadingCourses}
                className="w-full h-10 px-3 pr-8 rounded-md border border-input bg-background text-sm font-medium focus:outline-none focus:ring-2 focus:ring-ring"
              >
                {isLoadingCourses ? (
                  <option value="">Loading courses...</option>
                ) : availableCourses.length === 0 ? (
                  <option value="">No courses available</option>
                ) : (
                  availableCourses.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.id} - {c.name}
                    </option>
                  ))
                )}
              </select>
            </div>
          </div>

          {activeCourse && (
            <div className="flex items-center gap-2 flex-wrap text-xs">
              <Badge variant="outline" className="font-mono bg-muted/50">
                {activeCourse.id}
              </Badge>
              <span className="font-medium text-foreground">{activeCourse.name}</span>
              {activeCourse.slidesFolderId ? (
                <Badge variant="secondary" className="gap-1 text-[11px] bg-blue-500/10 text-blue-600 dark:text-blue-400">
                  <FolderOpen className="h-3 w-3" /> Drive Linked
                </Badge>
              ) : null}
            </div>
          )}
        </div>

        {/* Filter and View Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-border">
          {/* Search Bar */}
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search assignments by title..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="pl-9 h-9 text-sm"
            />
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Status Filter Pills */}
            <div className="flex items-center bg-muted/60 p-0.5 rounded-lg border border-border text-xs">
              <button
                type="button"
                onClick={() => setStatusFilter('all')}
                className={`px-3 py-1.5 rounded-md font-medium transition-all ${
                  statusFilter === 'all'
                    ? 'bg-background text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                All ({rawAssignments.length})
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter('active')}
                className={`px-3 py-1.5 rounded-md font-medium transition-all ${
                  statusFilter === 'active'
                    ? 'bg-background text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Active ({activeCount})
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter('submitted')}
                className={`px-3 py-1.5 rounded-md font-medium transition-all ${
                  statusFilter === 'submitted'
                    ? 'bg-background text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {isRep ? 'With Submissions' : 'Submitted'} ({submittedCount})
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter('past')}
                className={`px-3 py-1.5 rounded-md font-medium transition-all ${
                  statusFilter === 'past'
                    ? 'bg-background text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Closed ({pastCount})
              </button>
            </div>

            {/* View Mode Toggle */}
            <div className="flex items-center bg-muted/60 p-0.5 rounded-lg border border-border">
              <button
                type="button"
                aria-label="Grid View"
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded-md transition-all ${
                  viewMode === 'grid'
                    ? 'bg-background text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
                title="Grid View"
              >
                <LayoutGrid className="h-4 w-4" />
              </button>
              <button
                type="button"
                aria-label="Table View"
                onClick={() => setViewMode('table')}
                className={`p-1.5 rounded-md transition-all ${
                  viewMode === 'table'
                    ? 'bg-background text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
                title="Table View"
              >
                <List className="h-4 w-4" />
              </button>
            </div>

            <Button
              variant="outline"
              size="icon"
              className="h-9 w-9 shrink-0"
              onClick={() => refetchAssignments()}
              disabled={isFetchingAssignments}
              title="Refresh assignments"
            >
              <RefreshCw className={`h-4 w-4 ${isFetchingAssignments ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      {isLoadingAssignments ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div
              key={i}
              className="h-56 rounded-xl border border-border bg-card animate-pulse p-5 space-y-4"
            >
              <div className="space-y-2">
                <div className="h-4 w-24 bg-muted rounded" />
                <div className="h-5 w-3/4 bg-muted rounded" />
                <div className="h-3 w-full bg-muted rounded" />
              </div>
              <div className="h-4 w-1/2 bg-muted rounded pt-4" />
              <div className="h-8 bg-muted rounded" />
            </div>
          ))}
        </div>
      ) : filteredAssignments.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-card p-12 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-muted/60 text-muted-foreground mb-4">
            <ClipboardList className="h-7 w-7" />
          </div>
          <h3 className="text-lg font-bold text-foreground">No Assignments Found</h3>
          <p className="text-sm text-muted-foreground max-w-sm mt-1 mb-5">
            {debouncedSearch
              ? `No assignments matched "${debouncedSearch}".`
              : statusFilter !== 'all'
              ? `No ${statusFilter} assignments found for ${selectedCourseId || 'this course'}.`
              : `No assignments have been published yet for ${selectedCourseId || 'this course'}.`}
          </p>
          {isRep && selectedCourseId && (
            <Button onClick={() => setIsCreateOpen(true)} className="gap-2">
              <Plus className="h-4 w-4" />
              Create First Assignment
            </Button>
          )}
        </div>
      ) : viewMode === 'grid' ? (
        /* Grid View */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredAssignments.map((assignment) => (
            <AssignmentCard
              key={assignment.id}
              assignment={assignment}
              isRep={isRep}
              onEdit={(a) => setEditAssignment(a)}
              onDelete={(a) => setDeleteAssignment(a)}
              onViewSubmissions={(a) => setInspectAssignment(a)}
              onSubmit={(a) => setSubmitAssignment(a)}
              onWithdraw={(subId, fileName, title) =>
                setWithdrawSubmission({ id: subId, fileName, title })
              }
            />
          ))}
        </div>
      ) : (
        /* Table View */
        <div className="rounded-xl border border-border bg-card overflow-hidden shadow-sm">
          <Table>
            <TableHeader className="bg-muted/40">
              <TableRow>
                <TableHead className="w-24">Status</TableHead>
                <TableHead>Assignment</TableHead>
                <TableHead className="hidden md:table-cell">Deadline</TableHead>
                <TableHead className="hidden sm:table-cell">Brief</TableHead>
                <TableHead className="hidden lg:table-cell">Submissions</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredAssignments.map((assignment) => {
                const isPast = isPastDeadline(assignment.deadline);
                const hasSub = assignment.hasSubmitted || Boolean(assignment.studentSubmission);
                const statusMeta = getDeadlineStatusMeta(assignment.deadline, hasSub);

                return (
                  <TableRow key={assignment.id} className="hover:bg-muted/20">
                    <TableCell>
                      <Badge
                        variant={statusMeta.badgeVariant}
                        className={`text-[10px] font-semibold border ${statusMeta.colorClass}`}
                      >
                        {statusMeta.label}
                      </Badge>
                    </TableCell>

                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-semibold text-sm text-foreground">
                          {assignment.title}
                        </span>
                        <span className="text-xs text-muted-foreground line-clamp-1">
                          {assignment.description}
                        </span>
                      </div>
                    </TableCell>

                    <TableCell className="hidden md:table-cell text-xs text-muted-foreground">
                      <div className="flex flex-col">
                        <span className="flex items-center gap-1 font-medium text-foreground">
                          <Calendar className="h-3 w-3" />
                          {new Date(assignment.deadline).toLocaleDateString()}
                        </span>
                        <span className="flex items-center gap-1 text-[11px] text-muted-foreground mt-0.5">
                          <Clock className="h-2.5 w-2.5" />
                          {formatDeadlineRemaining(assignment.deadline)}
                        </span>
                      </div>
                    </TableCell>

                    <TableCell className="hidden sm:table-cell text-xs">
                      {assignment.fileName ? (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 text-xs gap-1 px-2"
                          onClick={() => downloadSpec(assignment.id, assignment.fileName || 'brief')}
                          title={`Download brief: ${assignment.fileName}`}
                        >
                          <FileDown className="h-3.5 w-3.5 text-primary" />
                          <span className="truncate max-w-[120px]">{assignment.fileName}</span>
                        </Button>
                      ) : (
                        <span className="text-muted-foreground/60">—</span>
                      )}
                    </TableCell>

                    <TableCell className="hidden lg:table-cell text-xs">
                      {isRep ? (
                        <Badge variant="outline" className="text-xs">
                          {assignment.submissionCount ?? 0} Submissions
                        </Badge>
                      ) : hasSub ? (
                        <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-medium text-xs">
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          Submitted
                        </span>
                      ) : isPast ? (
                        <span className="text-destructive text-xs">Closed</span>
                      ) : (
                        <span className="text-muted-foreground text-xs">Pending</span>
                      )}
                    </TableCell>

                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {isRep ? (
                          <>
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-8 text-xs gap-1"
                              onClick={() => setInspectAssignment(assignment)}
                              title="View all submissions"
                            >
                              <Users className="h-3.5 w-3.5" />
                              <span className="hidden sm:inline">Roster</span>
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-muted-foreground hover:text-foreground"
                              onClick={() => setEditAssignment(assignment)}
                              title="Edit Assignment"
                            >
                              <Edit2 className="h-4 w-4" />
                              <span className="sr-only">Edit</span>
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-destructive hover:bg-destructive/10 hover:text-destructive"
                              onClick={() => setDeleteAssignment(assignment)}
                              title="Delete Assignment"
                            >
                              <Trash2 className="h-4 w-4" />
                              <span className="sr-only">Delete</span>
                            </Button>
                          </>
                        ) : (
                          <Button
                            size="sm"
                            className="h-8 text-xs gap-1"
                            disabled={isPast}
                            variant={hasSub ? 'outline' : 'default'}
                            onClick={() => setSubmitAssignment(assignment)}
                          >
                            <UploadCloud className="h-3.5 w-3.5" />
                            <span>{hasSub ? 'Re-Submit' : 'Submit'}</span>
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Create Assignment Dialog */}
      <CreateAssignmentDialog
        open={isCreateOpen}
        onOpenChange={setIsCreateOpen}
        defaultCourseId={selectedCourseId}
      />

      {/* Edit Assignment Dialog */}
      <EditAssignmentDialog
        assignment={editAssignment}
        open={Boolean(editAssignment)}
        onOpenChange={(open) => !open && setEditAssignment(null)}
      />

      {/* Delete Assignment Dialog */}
      <DeleteAssignmentDialog
        assignment={deleteAssignment}
        open={Boolean(deleteAssignment)}
        onOpenChange={(open) => !open && setDeleteAssignment(null)}
      />

      {/* Submit Assignment Dialog */}
      <SubmitAssignmentDialog
        assignment={submitAssignment}
        open={Boolean(submitAssignment)}
        onOpenChange={(open) => !open && setSubmitAssignment(null)}
      />

      {/* Withdraw Submission Dialog */}
      <DeleteSubmissionDialog
        submissionId={withdrawSubmission?.id || null}
        fileName={withdrawSubmission?.fileName}
        assignmentTitle={withdrawSubmission?.title}
        open={Boolean(withdrawSubmission)}
        onOpenChange={(open) => !open && setWithdrawSubmission(null)}
      />

      {/* Rep Submissions Inspection Sheet (Approach A) */}
      <AssignmentSubmissionsSheet
        assignment={inspectAssignment}
        open={Boolean(inspectAssignment)}
        onOpenChange={(open) => !open && setInspectAssignment(null)}
      />
    </div>
  );
}
