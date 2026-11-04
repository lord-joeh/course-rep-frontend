import { useState, useEffect, useMemo } from 'react';
import { PageHeader } from '@/components/common/page-header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useAuthStore } from '@/lib/auth-store';
import {
  useCoursesQuery,
  useMyCoursesQuery,
  useEnrollCourseMutation,
  useUnenrollCourseMutation,
} from '@/hooks/use-courses';
import { CourseCard } from '@/components/courses/course-card';
import { CreateCourseDialog } from '@/components/courses/create-course-dialog';
import { EditCourseDialog } from '@/components/courses/edit-course-dialog';
import { DeleteCourseDialog } from '@/components/courses/delete-course-dialog';
import { CourseRosterSheet } from '@/components/courses/course-roster-sheet';
import type { Course } from '@/types';
import {
  Search,
  X,
  BookPlus,
  LayoutGrid,
  List,
  ChevronLeft,
  ChevronRight,
  BookOpen,
  Calendar,
  GraduationCap,
  Users,
  MoreVertical,
  Edit2,
  Trash2,
  RotateCw,
  Check,
  UserPlus,
  Loader2,
} from 'lucide-react';

const DAYS_OF_WEEK = [
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
];

const SEMESTERS = ['First Semester', 'Second Semester'];

export function CourseCatalogPage() {
  const { user } = useAuthStore();
  const isRep = !!user?.isRep;

  // Tab mode for students: 'all' or 'my-courses'
  const [tabMode, setTabMode] = useState<'all' | 'my-courses'>('all');

  // View state: 'grid' or 'table'
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');

  // Query filters state
  const [searchInput, setSearchInput] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [semesterFilter, setSemesterFilter] = useState('');
  const [dayFilter, setDayFilter] = useState('');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);

  // Dialog state
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editCourse, setEditCourse] = useState<Course | null>(null);
  const [deleteCourse, setDeleteCourse] = useState<Course | null>(null);
  const [rosterCourse, setRosterCourse] = useState<Course | null>(null);
  const [enrollingCourseId, setEnrollingCourseId] = useState<string | null>(null);

  // 300ms Search Debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchInput);
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  // Query: All catalog courses
  const {
    data: catalogData,
    isLoading: isLoadingCatalog,
    isFetching: isFetchingCatalog,
    refetch: refetchCatalog,
  } = useCoursesQuery({
    page,
    limit,
    search: debouncedSearch || undefined,
    semester: semesterFilter || undefined,
    day: dayFilter || undefined,
  });

  // Query: Student's enrolled courses
  const {
    data: myCourses = [],
    isLoading: isLoadingMyCourses,
    refetch: refetchMyCourses,
  } = useMyCoursesQuery();

  const enrolledCourseIds = useMemo(() => {
    return new Set(myCourses.map((c) => c.id));
  }, [myCourses]);

  // Enrollment Mutations
  const enrollMutation = useEnrollCourseMutation(() => {
    setEnrollingCourseId(null);
  });
  const unenrollMutation = useUnenrollCourseMutation(() => {
    setEnrollingCourseId(null);
  });

  const handleEnroll = (course: Course) => {
    setEnrollingCourseId(course.id);
    enrollMutation.mutate(course.id);
  };

  const handleUnenroll = (course: Course) => {
    setEnrollingCourseId(course.id);
    unenrollMutation.mutate(course.id);
  };

  const handleClearFilters = () => {
    setSearchInput('');
    setDebouncedSearch('');
    setSemesterFilter('');
    setDayFilter('');
    setPage(1);
  };

  // Determine active dataset
  const displayedCourses = useMemo(() => {
    if (tabMode === 'my-courses') {
      let filtered = myCourses;
      if (debouncedSearch) {
        const q = debouncedSearch.toLowerCase();
        filtered = filtered.filter(
          (c) => c.id.toLowerCase().includes(q) || c.name.toLowerCase().includes(q),
        );
      }
      if (semesterFilter) {
        filtered = filtered.filter((c) => c.semester.toLowerCase() === semesterFilter.toLowerCase());
      }
      if (dayFilter) {
        filtered = filtered.filter((c) => c.day?.toLowerCase() === dayFilter.toLowerCase());
      }
      return filtered;
    }
    return catalogData?.items || [];
  }, [tabMode, myCourses, catalogData, debouncedSearch, semesterFilter, dayFilter]);

  const total = tabMode === 'my-courses'
    ? displayedCourses.length
    : (catalogData?.meta?.total ?? catalogData?.total ?? 0);
  const totalPages = tabMode === 'my-courses'
    ? 1
    : (catalogData?.meta?.totalPages ?? catalogData?.totalPages ?? 1);

  const isLoading = tabMode === 'my-courses' ? isLoadingMyCourses : isLoadingCatalog;
  const isFetching = isFetchingCatalog;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <PageHeader
        title="Course Management & Catalog"
        description="Comprehensive curriculum overview, lecture scheduling, faculty assignments, and transactional student enrollment."
      >
        <Button
          variant="outline"
          size="icon"
          onClick={() => {
            refetchCatalog();
            refetchMyCourses();
          }}
          disabled={isFetching}
          title="Refresh Courses"
        >
          <RotateCw className={`h-4 w-4 ${isFetching ? 'animate-spin' : ''}`} />
        </Button>
        {isRep && (
          <Button onClick={() => setCreateDialogOpen(true)}>
            <BookPlus className="mr-2 h-4 w-4" />
            Add Course
          </Button>
        )}
      </PageHeader>

      {/* Scope Tabs (All Catalog vs My Enrolled Courses) */}
      <div className="flex border-b border-border">
        <button
          type="button"
          onClick={() => setTabMode('all')}
          className={`pb-3 px-4 text-sm font-semibold transition-colors border-b-2 -mb-px ${
            tabMode === 'all'
              ? 'border-primary text-foreground'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          Course Catalog
        </button>
        <button
          type="button"
          onClick={() => setTabMode('my-courses')}
          className={`pb-3 px-4 text-sm font-semibold transition-colors border-b-2 -mb-px flex items-center gap-2 ${
            tabMode === 'my-courses'
              ? 'border-primary text-foreground'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          <span>My Enrolled Courses</span>
          <Badge variant="secondary" className="px-1.5 py-0.2 text-xs">
            {myCourses.length}
          </Badge>
        </button>
      </div>

      {/* Filter and Control Toolbar */}
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        {/* Search Input */}
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by course code or title..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="pl-9 pr-9"
          />
          {searchInput && (
            <button
              type="button"
              onClick={() => {
                setSearchInput('');
                setDebouncedSearch('');
              }}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Dropdown Filters & View Controls */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Semester Filter */}
          <select
            value={semesterFilter}
            onChange={(e) => {
              setSemesterFilter(e.target.value);
              setPage(1);
            }}
            className="h-9 rounded-md border border-input bg-background px-3 py-1 text-xs text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          >
            <option value="">All Semesters</option>
            {SEMESTERS.map((sem) => (
              <option key={sem} value={sem}>{sem}</option>
            ))}
          </select>

          {/* Day Filter */}
          <select
            value={dayFilter}
            onChange={(e) => {
              setDayFilter(e.target.value);
              setPage(1);
            }}
            className="h-9 rounded-md border border-input bg-background px-3 py-1 text-xs text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          >
            <option value="">All Days</option>
            {DAYS_OF_WEEK.map((d) => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>

          {/* Page Limit Selector (only in Catalog mode) */}
          {tabMode === 'all' && (
            <select
              value={limit}
              onChange={(e) => {
                setLimit(Number(e.target.value));
                setPage(1);
              }}
              className="h-9 rounded-md border border-input bg-background px-2 py-1 text-xs text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              title="Items per page"
            >
              <option value={10}>10 / page</option>
              <option value={20}>20 / page</option>
              <option value={50}>50 / page</option>
            </select>
          )}

          {/* Grid vs Table View Switch */}
          <div className="flex items-center rounded-lg border border-border bg-muted/40 p-0.5">
            <Button
              type="button"
              variant={viewMode === 'grid' ? 'default' : 'ghost'}
              size="sm"
              className="h-8 px-2.5"
              onClick={() => setViewMode('grid')}
              title="Grid View"
            >
              <LayoutGrid className="h-4 w-4" />
              <span className="sr-only">Grid View</span>
            </Button>
            <Button
              type="button"
              variant={viewMode === 'table' ? 'default' : 'ghost'}
              size="sm"
              className="h-8 px-2.5"
              onClick={() => setViewMode('table')}
              title="Table View"
            >
              <List className="h-4 w-4" />
              <span className="sr-only">Table View</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      {isLoading ? (
        // Loading Skeletons
        viewMode === 'grid' ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="rounded-lg border border-border p-5 space-y-4">
                <div className="space-y-2">
                  <div className="flex gap-2">
                    <Skeleton className="h-5 w-16" />
                    <Skeleton className="h-5 w-24" />
                  </div>
                  <Skeleton className="h-6 w-3/4" />
                </div>
                <div className="space-y-2 pt-2 border-t border-border">
                  <Skeleton className="h-4 w-2/3" />
                  <Skeleton className="h-4 w-1/2" />
                </div>
                <Skeleton className="h-8 w-full" />
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-lg border border-border bg-card">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Code</TableHead>
                  <TableHead>Course Title</TableHead>
                  <TableHead>Semester</TableHead>
                  <TableHead>Faculty</TableHead>
                  <TableHead>Schedule</TableHead>
                  <TableHead className="w-[120px] text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell><Skeleton className="h-5 w-16" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-48" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-32" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-36" /></TableCell>
                    <TableCell><Skeleton className="h-8 w-20 ml-auto" /></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )
      ) : displayedCourses.length === 0 ? (
        // Empty State
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border bg-card p-12 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary mb-3">
            <BookOpen className="h-6 w-6" />
          </div>
          <h3 className="text-base font-semibold text-foreground">
            {tabMode === 'my-courses'
              ? 'No courses enrolled'
              : debouncedSearch || semesterFilter || dayFilter
              ? 'No matching courses found'
              : 'Course catalog is empty'}
          </h3>
          <p className="mt-1 text-sm text-muted-foreground max-w-sm">
            {tabMode === 'my-courses'
              ? 'You have not enrolled in any courses yet. Switch to the Course Catalog tab to enroll.'
              : debouncedSearch || semesterFilter || dayFilter
              ? 'No courses matched your current filter criteria. Try broadening your search or resetting filters.'
              : 'There are currently no courses registered in the institutional catalog.'}
          </p>
          <div className="mt-4 flex gap-2">
            {debouncedSearch || semesterFilter || dayFilter ? (
              <Button variant="outline" size="sm" onClick={handleClearFilters}>
                Clear All Filters
              </Button>
            ) : tabMode === 'my-courses' ? (
              <Button size="sm" onClick={() => setTabMode('all')}>
                Browse Catalog
              </Button>
            ) : isRep ? (
              <Button size="sm" onClick={() => setCreateDialogOpen(true)}>
                <BookPlus className="mr-2 h-4 w-4" />
                Add First Course
              </Button>
            ) : null}
          </div>
        </div>
      ) : viewMode === 'grid' ? (
        // Grid View
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {displayedCourses.map((course) => {
            const isEnrolled = enrolledCourseIds.has(course.id);
            const isEnrolling = enrollingCourseId === course.id;

            return (
              <CourseCard
                key={course.id}
                course={course}
                isRep={isRep}
                isEnrolled={isEnrolled}
                isEnrolling={isEnrolling}
                onEnroll={handleEnroll}
                onUnenroll={handleUnenroll}
                onViewRoster={(c) => setRosterCourse(c)}
                onEdit={(c) => setEditCourse(c)}
                onDelete={(c) => setDeleteCourse(c)}
              />
            );
          })}
        </div>
      ) : (
        // Table View
        <div className="rounded-lg border border-border bg-card overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[100px]">Code</TableHead>
                <TableHead>Course Title</TableHead>
                <TableHead>Semester</TableHead>
                <TableHead>Assigned Faculty</TableHead>
                <TableHead>Schedule</TableHead>
                <TableHead className="w-[180px] text-right">
                  Status / Actions
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {displayedCourses.map((course) => {
                const isEnrolled = enrolledCourseIds.has(course.id);
                const isEnrolling = enrollingCourseId === course.id;

                return (
                  <TableRow key={course.id}>
                    <TableCell className="font-mono font-bold text-foreground">
                      <Badge className="bg-primary text-primary-foreground font-mono text-xs">
                        {course.id}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-medium text-foreground">
                      <span className="truncate max-w-[240px] block" title={course.name}>
                        {course.name}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-xs">
                        {course.semester}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {course.lecturer ? (
                        <div className="flex items-center gap-1.5 text-xs text-foreground">
                          <GraduationCap className="h-3.5 w-3.5 text-muted-foreground" />
                          <span className="truncate max-w-[150px]">{course.lecturer.name}</span>
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground italic">Unassigned</span>
                      )}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {course.day ? (
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                          <span>{course.day}</span>
                          {course.startTime && (
                            <span className="text-[11px] font-mono">
                              ({course.startTime} - {course.endTime || 'TBD'})
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="italic">TBD</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {isEnrolled ? (
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-xs h-7 hover:border-destructive hover:text-destructive"
                            onClick={() => handleUnenroll(course)}
                            disabled={isEnrolling}
                          >
                            {isEnrolling ? (
                              <Loader2 className="h-3 w-3 animate-spin" />
                            ) : (
                              <>
                                <Check className="mr-1 h-3 w-3 text-primary" />
                                Enrolled
                              </>
                            )}
                          </Button>
                        ) : (
                          <Button
                            size="sm"
                            className="text-xs h-7"
                            onClick={() => handleEnroll(course)}
                            disabled={isEnrolling}
                          >
                            {isEnrolling ? (
                              <Loader2 className="h-3 w-3 animate-spin" />
                            ) : (
                              <>
                                <UserPlus className="mr-1 h-3 w-3" />
                                Enroll
                              </>
                            )}
                          </Button>
                        )}

                        {isRep && (
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <MoreVertical className="h-4 w-4" />
                                <span className="sr-only">Course actions</span>
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => setRosterCourse(course)}>
                                <Users className="mr-2 h-4 w-4" />
                                View Enrolled Roster
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => setEditCourse(course)}>
                                <Edit2 className="mr-2 h-4 w-4" />
                                Edit Course
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onClick={() => setDeleteCourse(course)}
                                className="text-destructive focus:text-destructive"
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete Course
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
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

      {/* Pagination Footer (Catalog Mode Only) */}
      {tabMode === 'all' && total > 0 && (
        <div className="flex flex-col items-center justify-between gap-4 border-t border-border pt-4 sm:flex-row text-sm text-muted-foreground">
          <div>
            Showing <span className="font-medium text-foreground">{Math.min((page - 1) * limit + 1, total)}</span> to{' '}
            <span className="font-medium text-foreground">{Math.min(page * limit, total)}</span> of{' '}
            <span className="font-medium text-foreground">{total}</span> courses
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1 || isFetching}
            >
              <ChevronLeft className="mr-1 h-4 w-4" />
              Previous
            </Button>
            <span className="px-2 text-xs font-medium">
              Page {page} of {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages || isFetching}
            >
              Next
              <ChevronRight className="ml-1 h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Modals & Sheets */}
      <CreateCourseDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
      />

      <EditCourseDialog
        course={editCourse}
        open={!!editCourse}
        onOpenChange={(open) => {
          if (!open) setEditCourse(null);
        }}
      />

      <DeleteCourseDialog
        course={deleteCourse}
        open={!!deleteCourse}
        onOpenChange={(open) => {
          if (!open) setDeleteCourse(null);
        }}
      />

      <CourseRosterSheet
        course={rosterCourse}
        open={!!rosterCourse}
        onOpenChange={(open) => {
          if (!open) setRosterCourse(null);
        }}
      />
    </div>
  );
}
