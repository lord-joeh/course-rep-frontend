import { useState, useMemo, useEffect } from 'react';
import { useAuthStore } from '@/lib/auth-store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  useFeedbacksQuery,
  useMyFeedbacksQuery,
} from '@/hooks/use-feedback';
import { useCoursesQuery } from '@/hooks/use-courses';
import { FeedbackCard } from '@/components/feedback/feedback-card';
import { SubmitFeedbackDialog } from '@/components/feedback/submit-feedback-dialog';
import { FeedbackDetailsSheet } from '@/components/feedback/feedback-details-sheet';
import { DeleteFeedbackDialog } from '@/components/feedback/delete-feedback-dialog';
import type {
  Feedback,
  FeedbackCategory,
  FeedbackPriority,
  FeedbackStatus,
} from '@/types';
import {
  getFeedbackStatusMeta,
  getFeedbackCategoryMeta,
  getFeedbackPriorityMeta,
} from '@/lib/feedback-validation';
import {
  MessageSquare,
  Plus,
  RefreshCw,
  Search,
  LayoutGrid,
  List,
  Inbox,
  Shield,
  Clock,
  CheckCircle2,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  User,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

export function FeedbackPage() {
  const { user } = useAuthStore();
  const isRep = Boolean(user?.isRep);

  // Student active tab state ('my-submissions' vs 'cohort-board')
  const [studentTab, setStudentTab] = useState<'my-submissions' | 'cohort-board'>('my-submissions');

  // Filter & Search States
  const [searchInput, setSearchInput] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedPriority, setSelectedPriority] = useState<string>('all');
  const [selectedCourse, setSelectedCourse] = useState<string>('all');
  const [anonymousFilter, setAnonymousFilter] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  const [page, setPage] = useState(1);

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchInput);
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  // Dialog States
  const [isSubmitOpen, setIsSubmitOpen] = useState(false);
  const [activeFeedback, setActiveFeedback] = useState<Feedback | null>(null);
  const [feedbackToDelete, setFeedbackToDelete] = useState<Feedback | null>(null);

  // Queries
  const { data: coursesData } = useCoursesQuery({ limit: 100 });
  const courses = coursesData?.items || [];

  // Cohort Feedbacks Query (used by Reps and Student Cohort Board tab)
  const isCohortQueryActive = isRep || studentTab === 'cohort-board';
  const {
    data: cohortData,
    isLoading: isCohortLoading,
    refetch: refetchCohort,
    isRefetching: isCohortRefetching,
  } = useFeedbacksQuery({
    page,
    limit: 12,
    search: debouncedSearch.trim() || undefined,
    status: selectedStatus !== 'all' ? (selectedStatus as FeedbackStatus) : undefined,
    category: selectedCategory !== 'all' ? (selectedCategory as FeedbackCategory) : undefined,
    priority: selectedPriority !== 'all' ? (selectedPriority as FeedbackPriority) : undefined,
    courseId: selectedCourse !== 'all' && selectedCourse !== 'general' ? selectedCourse : undefined,
    isAnonymous:
      anonymousFilter === 'anonymous' ? true : anonymousFilter === 'identified' ? false : undefined,
  });

  // Personal Submissions Query (used by Students)
  const {
    data: myFeedbacksData,
    isLoading: isMyLoading,
    refetch: refetchMyFeedbacks,
    isRefetching: isMyRefetching,
  } = useMyFeedbacksQuery({ page, limit: 12 });

  const activeLoading = isCohortQueryActive ? isCohortLoading : isMyLoading;
  const activeRefetching = isCohortQueryActive ? isCohortRefetching : isMyRefetching;
  const activeRefetch = () => {
    if (isCohortQueryActive) {
      refetchCohort();
    } else {
      refetchMyFeedbacks();
    }
  };

  const feedbacks: Feedback[] = useMemo(() => {
    if (isCohortQueryActive) {
      return cohortData?.items || [];
    }
    return myFeedbacksData?.items || [];
  }, [isCohortQueryActive, cohortData, myFeedbacksData]);

  const totalItems = (isCohortQueryActive ? cohortData?.meta?.total : myFeedbacksData?.meta?.total) ?? 0;
  const totalPages = (isCohortQueryActive ? cohortData?.meta?.totalPages : myFeedbacksData?.meta?.totalPages) ?? 1;

  // KPI Metrics Calculation (for Reps)
  const rawCohortItems = cohortData?.items || [];
  const submittedCount = useMemo(
    () => rawCohortItems.filter((f) => f.status === 'submitted').length,
    [rawCohortItems],
  );
  const underReviewCount = useMemo(
    () => rawCohortItems.filter((f) => f.status === 'under_review').length,
    [rawCohortItems],
  );
  const resolvedCount = useMemo(
    () => rawCohortItems.filter((f) => f.status === 'resolved').length,
    [rawCohortItems],
  );

  return (
    <div className="space-y-6 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground flex items-center gap-2">
              <MessageSquare className="w-7 h-7 text-primary shrink-0" />
              {isRep ? 'Cohort Feedback Box' : 'Student Feedback & Suggestions'}
            </h1>
            <Badge variant="secondary" className="font-mono text-xs font-semibold">
              {totalItems} {totalItems === 1 ? 'entry' : 'entries'}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            {isRep
              ? 'Triage student feedback, investigate classroom concerns, and dispatch official rep responses.'
              : 'Voice questions, complaints, and constructive ideas directly to your Course Representatives.'}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={activeRefetch}
            disabled={activeRefetching}
            className="h-9 gap-1.5 text-xs"
            aria-label="Refresh feedback list"
          >
            <RefreshCw className={`w-4 h-4 ${activeRefetching ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Refresh</span>
          </Button>

          <Button
            size="sm"
            onClick={() => setIsSubmitOpen(true)}
            className="h-9 gap-1.5 shadow-xs text-xs"
          >
            <Plus className="w-4 h-4" />
            <span>Submit Feedback</span>
          </Button>
        </div>
      </div>

      {/* Course Rep KPI Metrics Summary Cards */}
      {isRep && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
          <Card className="border border-border bg-card">
            <CardHeader className="p-4 pb-2">
              <CardTitle className="text-xs font-medium text-muted-foreground">
                Total Submissions
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0 flex items-center justify-between">
              <span className="text-2xl font-bold text-foreground">{totalItems}</span>
              <Inbox className="w-5 h-5 text-muted-foreground/60" />
            </CardContent>
          </Card>

          <Card className="border border-amber-500/20 bg-amber-500/5">
            <CardHeader className="p-4 pb-2">
              <CardTitle className="text-xs font-medium text-amber-700 dark:text-amber-400">
                Pending Triage
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0 flex items-center justify-between">
              <span className="text-2xl font-bold text-amber-600 dark:text-amber-400">
                {submittedCount}
              </span>
              <Clock className="w-5 h-5 text-amber-500/70" />
            </CardContent>
          </Card>

          <Card className="border border-blue-500/20 bg-blue-500/5">
            <CardHeader className="p-4 pb-2">
              <CardTitle className="text-xs font-medium text-blue-700 dark:text-blue-400">
                Under Investigation
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0 flex items-center justify-between">
              <span className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                {underReviewCount}
              </span>
              <AlertCircle className="w-5 h-5 text-blue-500/70" />
            </CardContent>
          </Card>

          <Card className="border border-emerald-500/20 bg-emerald-500/5">
            <CardHeader className="p-4 pb-2">
              <CardTitle className="text-xs font-medium text-emerald-700 dark:text-emerald-400">
                Resolved
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0 flex items-center justify-between">
              <span className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                {resolvedCount}
              </span>
              <CheckCircle2 className="w-5 h-5 text-emerald-500/70" />
            </CardContent>
          </Card>
        </div>
      )}

      {/* Student View Navigation Tabs */}
      {!isRep && (
        <div className="flex items-center gap-1 bg-muted/60 p-1 rounded-lg border border-border w-fit">
          <button
            type="button"
            onClick={() => {
              setStudentTab('my-submissions');
              setPage(1);
            }}
            className={`px-4 py-1.5 rounded-md text-xs font-medium transition-colors ${
              studentTab === 'my-submissions'
                ? 'bg-card text-foreground shadow-xs font-semibold'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            My Submissions
          </button>
          <button
            type="button"
            onClick={() => {
              setStudentTab('cohort-board');
              setPage(1);
            }}
            className={`px-4 py-1.5 rounded-md text-xs font-medium transition-colors ${
              studentTab === 'cohort-board'
                ? 'bg-card text-foreground shadow-xs font-semibold'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Cohort Suggestions Board
          </button>
        </div>
      )}

      {/* Filter Toolbar (Cohort View) */}
      {(isRep || studentTab === 'cohort-board') && (
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2 flex-1">
            {/* Search Input */}
            <div className="relative flex-1 min-w-[200px]">
              <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-2.5" />
              <Input
                placeholder="Search by title, description, or keyword..."
                className="pl-9 h-9 text-xs"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
              />
            </div>

            {/* Category Dropdown */}
            <select
              className="h-9 rounded-md border border-input bg-background px-3 py-1 text-xs shadow-xs focus:outline-none focus:ring-1 focus:ring-ring min-w-[130px]"
              value={selectedCategory}
              onChange={(e) => {
                setSelectedCategory(e.target.value);
                setPage(1);
              }}
              aria-label="Filter by category"
            >
              <option value="all">All Categories</option>
              <option value="academic">Academic</option>
              <option value="facilities">Facilities</option>
              <option value="lecturer">Lecturer</option>
              <option value="welfare">Student Welfare</option>
              <option value="general">General</option>
              <option value="other">Other</option>
            </select>

            {/* Course Scope Dropdown */}
            <select
              className="h-9 rounded-md border border-input bg-background px-3 py-1 text-xs shadow-xs focus:outline-none focus:ring-1 focus:ring-ring min-w-[140px]"
              value={selectedCourse}
              onChange={(e) => {
                setSelectedCourse(e.target.value);
                setPage(1);
              }}
              aria-label="Filter by course"
            >
              <option value="all">All Courses</option>
              <option value="general">General / Cohort-Wide</option>
              {courses.map((c) => (
                <option key={c.id} value={c.id}>
                  [{c.id}] {c.name}
                </option>
              ))}
            </select>

            {/* Priority Filter */}
            <select
              className="h-9 rounded-md border border-input bg-background px-3 py-1 text-xs shadow-xs focus:outline-none focus:ring-1 focus:ring-ring min-w-[120px]"
              value={selectedPriority}
              onChange={(e) => {
                setSelectedPriority(e.target.value);
                setPage(1);
              }}
              aria-label="Filter by priority"
            >
              <option value="all">All Priorities</option>
              <option value="urgent">Urgent</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>

            {/* Anonymous Toggle Dropdown */}
            {isRep && (
              <select
                className="h-9 rounded-md border border-input bg-background px-3 py-1 text-xs shadow-xs focus:outline-none focus:ring-1 focus:ring-ring min-w-[130px]"
                value={anonymousFilter}
                onChange={(e) => {
                  setAnonymousFilter(e.target.value);
                  setPage(1);
                }}
                aria-label="Filter by anonymity"
              >
                <option value="all">All Authors</option>
                <option value="anonymous">Anonymous Only</option>
                <option value="identified">Identified Students</option>
              </select>
            )}
          </div>

          {/* View Mode Toggle Buttons */}
          <div className="flex items-center gap-1 border border-border rounded-lg p-0.5 bg-muted/40 self-end md:self-auto shrink-0">
            <Button
              variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
              size="icon"
              className="h-7 w-7"
              onClick={() => setViewMode('grid')}
              aria-label="Grid view"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
            </Button>
            <Button
              variant={viewMode === 'table' ? 'secondary' : 'ghost'}
              size="icon"
              className="h-7 w-7"
              onClick={() => setViewMode('table')}
              aria-label="Table view"
            >
              <List className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>
      )}

      {/* Status Filter Tabs (Cohort View) */}
      {(isRep || studentTab === 'cohort-board') && (
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
          {[
            { id: 'all', label: 'All Statuses' },
            { id: 'submitted', label: 'Submitted' },
            { id: 'under_review', label: 'Under Review' },
            { id: 'resolved', label: 'Resolved' },
            { id: 'dismissed', label: 'Dismissed' },
          ].map((statusTab) => (
            <button
              key={statusTab.id}
              type="button"
              onClick={() => {
                setSelectedStatus(statusTab.id);
                setPage(1);
              }}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-colors shrink-0 ${
                selectedStatus === statusTab.id
                  ? 'bg-primary text-primary-foreground font-semibold shadow-xs'
                  : 'bg-muted/40 text-muted-foreground hover:bg-muted hover:text-foreground'
              }`}
            >
              {statusTab.label}
            </button>
          ))}
        </div>
      )}

      {/* Main Content Area */}
      {activeLoading ? (
        <div className="py-20 text-center text-sm text-muted-foreground space-y-2">
          <RefreshCw className="w-6 h-6 animate-spin mx-auto text-primary" />
          <p>Loading feedback entries...</p>
        </div>
      ) : feedbacks.length === 0 ? (
        <div className="py-16 text-center rounded-xl border border-dashed border-border bg-muted/10 space-y-3">
          <Inbox className="w-10 h-10 text-muted-foreground/50 mx-auto" />
          <h3 className="text-base font-semibold text-foreground">No feedback found</h3>
          <p className="text-xs text-muted-foreground max-w-sm mx-auto">
            {searchInput || selectedStatus !== 'all' || selectedCategory !== 'all'
              ? 'No feedback entries match your current search and filter criteria.'
              : !isRep && studentTab === 'my-submissions'
              ? "You haven't submitted any feedback yet. Voice questions or ideas to your Course Reps!"
              : 'There are no active feedback submissions in this category.'}
          </p>
          <Button size="sm" onClick={() => setIsSubmitOpen(true)} className="gap-1 text-xs">
            <Plus className="w-3.5 h-3.5" />
            <span>Submit New Feedback</span>
          </Button>
        </div>
      ) : viewMode === 'grid' || (!isRep && studentTab === 'my-submissions') ? (
        // Grid View
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4" data-testid="feedback-grid">
          {feedbacks.map((item) => (
            <FeedbackCard
              key={item.id}
              feedback={item}
              onClick={() => setActiveFeedback(item)}
              isRep={isRep}
              onDelete={(f) => setFeedbackToDelete(f)}
            />
          ))}
        </div>
      ) : (
        // Table View (Rep / Cohort Board)
        <div className="rounded-xl border border-border bg-card overflow-hidden shadow-xs">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/30">
                <TableHead className="text-xs">Subject & Content</TableHead>
                <TableHead className="text-xs">Category</TableHead>
                <TableHead className="text-xs">Author</TableHead>
                <TableHead className="text-xs">Status</TableHead>
                <TableHead className="text-xs">Priority</TableHead>
                <TableHead className="text-xs">Submitted</TableHead>
                <TableHead className="text-xs text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {feedbacks.map((item) => {
                const statusMeta = getFeedbackStatusMeta(item.status);
                const categoryMeta = getFeedbackCategoryMeta(item.category);
                const priorityMeta = getFeedbackPriorityMeta(item.priority);
                const CategoryIcon = categoryMeta.icon;

                return (
                  <TableRow
                    key={item.id}
                    onClick={() => setActiveFeedback(item)}
                    className="cursor-pointer hover:bg-muted/40 transition-colors"
                  >
                    <TableCell className="max-w-xs">
                      <div className="font-semibold text-xs text-foreground truncate">
                        {item.title}
                      </div>
                      <div className="text-[11px] text-muted-foreground truncate">
                        {item.content}
                      </div>
                    </TableCell>

                    <TableCell>
                      <Badge
                        variant="outline"
                        className={`text-[10px] px-1.5 py-0 gap-1 border ${categoryMeta.badgeClass}`}
                      >
                        <CategoryIcon className="w-3 h-3" />
                        <span>{categoryMeta.label}</span>
                      </Badge>
                    </TableCell>

                    <TableCell>
                      {item.isAnonymous ? (
                        <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground font-medium">
                          <Shield className="w-3 h-3 text-primary" />
                          <span>Anonymous</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] text-foreground font-medium truncate max-w-[130px]">
                          <User className="w-3 h-3 text-muted-foreground" />
                          <span className="truncate">{item.student?.name || 'Registered'}</span>
                        </span>
                      )}
                    </TableCell>

                    <TableCell>
                      <Badge
                        variant="outline"
                        className={`text-[10px] px-1.5 py-0 border ${statusMeta.badgeClass}`}
                      >
                        {statusMeta.label}
                      </Badge>
                    </TableCell>

                    <TableCell>
                      <Badge
                        variant="outline"
                        className={`text-[10px] px-1.5 py-0 border ${priorityMeta.badgeClass}`}
                      >
                        {priorityMeta.label}
                      </Badge>
                    </TableCell>

                    <TableCell className="text-[11px] text-muted-foreground whitespace-nowrap">
                      {formatDistanceToNow(new Date(item.createdAt), { addSuffix: true })}
                    </TableCell>

                    <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setActiveFeedback(item)}
                        className="h-7 text-xs px-2"
                      >
                        Review
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Pagination Footer */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-2 text-xs text-muted-foreground">
          <span>
            Page <strong className="text-foreground">{page}</strong> of{' '}
            <strong className="text-foreground">{totalPages}</strong> ({totalItems} total)
          </span>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="h-8 text-xs gap-1"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              <span>Previous</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => p + 1)}
              className="h-8 text-xs gap-1"
            >
              <span>Next</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>
      )}

      {/* Dialogs & Sheets */}
      <SubmitFeedbackDialog
        isOpen={isSubmitOpen}
        onClose={() => setIsSubmitOpen(false)}
      />

      <FeedbackDetailsSheet
        feedback={activeFeedback}
        isOpen={Boolean(activeFeedback)}
        onClose={() => setActiveFeedback(null)}
        isRep={isRep}
        onDelete={(f) => {
          setActiveFeedback(null);
          setFeedbackToDelete(f);
        }}
      />

      <DeleteFeedbackDialog
        feedback={feedbackToDelete}
        isOpen={Boolean(feedbackToDelete)}
        onClose={() => setFeedbackToDelete(null)}
      />
    </div>
  );
}

