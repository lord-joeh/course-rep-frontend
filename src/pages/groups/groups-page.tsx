import { useState, useMemo } from 'react';
import { useAuthStore } from '@/lib/auth-store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from '@/components/ui/table';
import {
  useGroupsQuery,
  useMyGroupsQuery,
} from '@/hooks/use-groups';
import { useCoursesQuery } from '@/hooks/use-courses';
import { GroupCard } from '@/components/groups/group-card';
import { CreateGroupDialog } from '@/components/groups/create-group-dialog';
import { EditGroupDialog } from '@/components/groups/edit-group-dialog';
import { DeleteGroupDialog } from '@/components/groups/delete-group-dialog';
import { AutoDivideDialog } from '@/components/groups/auto-divide-dialog';
import { GroupRosterSheet } from '@/components/groups/group-roster-sheet';
import type { Group } from '@/types';
import {
  Users,
  Network,
  Plus,
  Sparkles,
  Search,
  LayoutGrid,
  List,
  RefreshCw,
  Crown,
  BookOpen,
  Globe,
  MoreVertical,
  Edit2,
  Trash2,
  Calendar,
} from 'lucide-react';
import { format } from 'date-fns';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export function GroupsPage() {
  const { user } = useAuthStore();
  const isRep = Boolean(user?.isRep);

  // Common View States
  const [repViewTab, setRepViewTab] = useState<'management' | 'personal'>('management');
  const [studentTab, setStudentTab] = useState<'my-groups' | 'all-groups'>('my-groups');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  const [search, setSearch] = useState('');
  const [courseFilter, setCourseFilter] = useState('all');
  const [scopeFilter, setScopeFilter] = useState<'all' | 'course' | 'general'>('all');

  // Dialog & Sheet States
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isAutoDivideOpen, setIsAutoDivideOpen] = useState(false);
  const [groupToEdit, setGroupToEdit] = useState<Group | null>(null);
  const [groupToDelete, setGroupToDelete] = useState<Group | null>(null);
  const [groupForRoster, setGroupForRoster] = useState<Group | null>(null);

  // Queries
  const { data: coursesData } = useCoursesQuery();
  const courses = coursesData?.items || [];

  const {
    data: allGroupsData,
    isLoading: isLoadingAll,
    refetch: refetchAll,
  } = useGroupsQuery({
    courseId: courseFilter !== 'all' ? courseFilter : undefined,
    isGeneral: scopeFilter === 'general' ? true : scopeFilter === 'course' ? false : undefined,
    search: search || undefined,
    limit: 100,
  });

  const {
    data: myGroups = [],
    isLoading: isLoadingMyGroups,
    refetch: refetchMyGroups,
  } = useMyGroupsQuery();

  // Active perspective determination
  const showPersonalView = isRep ? repViewTab === 'personal' : studentTab === 'my-groups';
  const allGroups = allGroupsData?.items || [];

  // Filter personal groups in memory if needed
  const filteredPersonalGroups = useMemo(() => {
    return myGroups.filter((group) => {
      const matchSearch =
        !search ||
        group.name.toLowerCase().includes(search.toLowerCase()) ||
        group.course?.name?.toLowerCase().includes(search.toLowerCase()) ||
        group.courseId?.toLowerCase().includes(search.toLowerCase());

      const matchCourse = courseFilter === 'all' || group.courseId === courseFilter;
      const matchScope =
        scopeFilter === 'all' ||
        (scopeFilter === 'general' && group.isGeneral) ||
        (scopeFilter === 'course' && !group.isGeneral);

      return matchSearch && matchCourse && matchScope;
    });
  }, [myGroups, search, courseFilter, scopeFilter]);

  const groupsToRender = showPersonalView ? filteredPersonalGroups : allGroups;

  // Metrics calculation
  const metrics = useMemo(() => {
    const total = allGroups.length;
    const courseCount = allGroups.filter((g) => !g.isGeneral).length;
    const generalCount = allGroups.filter((g) => g.isGeneral).length;
    const totalStudentsInGroups = allGroups.reduce(
      (sum, g) => sum + (g.members?.length || g.memberCount || 0),
      0,
    );
    return { total, courseCount, generalCount, totalStudentsInGroups };
  }, [allGroups]);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <Network className="w-6 h-6 text-primary" />
            {!showPersonalView ? 'Study Groups Administration' : 'My Study Groups Portal'}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {!showPersonalView
              ? 'Form collaborative study groups, partition cohorts using Fisher-Yates shuffle, and manage student rosters.'
              : 'View your assigned project teams, fellow group members, and leadership responsibilities.'}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {isRep ? (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  refetchAll();
                  refetchMyGroups();
                }}
                className="h-9 border-border"
                title="Refresh groups"
                data-testid="refresh-groups-btn"
              >
                <RefreshCw className="w-4 h-4 mr-1 text-muted-foreground" /> Refresh
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsAutoDivideOpen(true)}
                className="h-9 border-primary/30 text-primary hover:bg-primary/5 font-semibold"
                data-testid="open-auto-divide-btn"
              >
                <Sparkles className="w-4 h-4 mr-1.5" /> Auto-Divide
              </Button>
              <Button
                size="sm"
                onClick={() => setIsCreateOpen(true)}
                className="h-9 bg-primary text-primary-foreground hover:bg-primary/90 font-medium"
                data-testid="open-create-group-btn"
              >
                <Plus className="w-4 h-4 mr-1.5" /> Create Group
              </Button>
            </>
          ) : (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                refetchAll();
                refetchMyGroups();
              }}
              className="h-9 border-border"
            >
              <RefreshCw className="w-4 h-4 mr-1 text-muted-foreground" /> Refresh
            </Button>
          )}
        </div>
      </div>

      {/* Scope Switcher Tabs for Rep */}
      {isRep && (
        <div className="flex border-b border-border">
          <button
            type="button"
            onClick={() => setRepViewTab('management')}
            className={`pb-3 px-4 text-sm font-semibold transition-colors border-b-2 -mb-px flex items-center gap-2 ${
              repViewTab === 'management'
                ? 'border-primary text-foreground'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
            data-testid="tab-all-groups"
          >
            <Users className="w-4 h-4" />
            <span>All Study Groups</span>
            <Badge variant="secondary" className="px-1.5 py-0.2 text-xs">
              {allGroups.length}
            </Badge>
          </button>
          <button
            type="button"
            onClick={() => setRepViewTab('personal')}
            className={`pb-3 px-4 text-sm font-semibold transition-colors border-b-2 -mb-px flex items-center gap-2 ${
              repViewTab === 'personal'
                ? 'border-primary text-foreground'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
            data-testid="tab-my-groups"
          >
            <Crown className="w-4 h-4" />
            <span>My Groups</span>
            <Badge variant="secondary" className="px-1.5 py-0.2 text-xs">
              {myGroups.length}
            </Badge>
          </button>
        </div>
      )}

      {/* Scope Switcher Tabs for Student */}
      {!isRep && (
        <div className="flex border-b border-border">
          <button
            type="button"
            onClick={() => setStudentTab('my-groups')}
            className={`pb-3 px-4 text-sm font-semibold transition-colors border-b-2 -mb-px flex items-center gap-2 ${
              studentTab === 'my-groups'
                ? 'border-primary text-foreground'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
            data-testid="student-tab-my-groups"
          >
            <Crown className="w-4 h-4" />
            <span>My Assigned Groups</span>
            <Badge variant="secondary" className="px-1.5 py-0.2 text-xs">
              {myGroups.length}
            </Badge>
          </button>
          <button
            type="button"
            onClick={() => setStudentTab('all-groups')}
            className={`pb-3 px-4 text-sm font-semibold transition-colors border-b-2 -mb-px flex items-center gap-2 ${
              studentTab === 'all-groups'
                ? 'border-primary text-foreground'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
            data-testid="student-tab-all-groups"
          >
            <Users className="w-4 h-4" />
            <span>Browse All Groups</span>
            <Badge variant="secondary" className="px-1.5 py-0.2 text-xs">
              {allGroups.length}
            </Badge>
          </button>
        </div>
      )}

      {/* Course Rep Metrics Row */}
      {isRep && repViewTab === 'management' && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-4 rounded border border-border bg-card">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block">
              Total Groups
            </span>
            <span className="text-2xl font-bold text-foreground mt-1 block">
              {metrics.total}
            </span>
          </div>
          <div className="p-4 rounded border border-border bg-card">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block">
              Course Cohorts
            </span>
            <span className="text-2xl font-bold text-primary mt-1 block">
              {metrics.courseCount}
            </span>
          </div>
          <div className="p-4 rounded border border-border bg-card">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block">
              General Cohorts
            </span>
            <span className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-1 block">
              {metrics.generalCount}
            </span>
          </div>
          <div className="p-4 rounded border border-border bg-card">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block">
              Total Group Memberships
            </span>
            <span className="text-2xl font-bold text-foreground mt-1 block">
              {metrics.totalStudentsInGroups}
            </span>
          </div>
        </div>
      )}

      {/* Filter and View Controls Toolbar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-2 flex-1">
          {/* Search Box */}
          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search by group or course..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-9 pl-9 text-xs border-border bg-background"
              data-testid="groups-search-input"
            />
          </div>

          {/* Scope Filters */}
          <div className="flex items-center gap-1 border border-border rounded p-1 bg-muted/20">
            <button
              type="button"
              onClick={() => setScopeFilter('all')}
              className={`px-2.5 py-1 text-xs rounded font-medium transition-colors ${
                scopeFilter === 'all'
                  ? 'bg-background shadow-xs text-foreground font-semibold'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              All Scopes
            </button>
            <button
              type="button"
              onClick={() => setScopeFilter('course')}
              className={`px-2.5 py-1 text-xs rounded font-medium transition-colors ${
                scopeFilter === 'course'
                  ? 'bg-background shadow-xs text-foreground font-semibold'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Course Groups
            </button>
            <button
              type="button"
              onClick={() => setScopeFilter('general')}
              className={`px-2.5 py-1 text-xs rounded font-medium transition-colors ${
                scopeFilter === 'general'
                  ? 'bg-background shadow-xs text-foreground font-semibold'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              General Cohort
            </button>
          </div>

          {/* Course Dropdown */}
          <select
            value={courseFilter}
            onChange={(e) => setCourseFilter(e.target.value)}
            className="h-9 px-3 rounded border border-border bg-background text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
            data-testid="groups-course-filter"
          >
            <option value="all">All Courses</option>
            {courses.map((c) => (
              <option key={c.id} value={c.id}>
                {c.id} - {c.name}
              </option>
            ))}
          </select>
        </div>

        {/* View Switcher Toggle (Grid vs Table) */}
        <div className="flex items-center border border-border rounded bg-muted/20 p-1 self-end md:self-auto">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setViewMode('grid')}
            className={`h-7 px-2 text-xs ${
              viewMode === 'grid'
                ? 'bg-background text-foreground shadow-xs font-semibold'
                : 'text-muted-foreground'
            }`}
            data-testid="view-grid-btn"
          >
            <LayoutGrid className="w-3.5 h-3.5 mr-1" /> Grid
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setViewMode('table')}
            className={`h-7 px-2 text-xs ${
              viewMode === 'table'
                ? 'bg-background text-foreground shadow-xs font-semibold'
                : 'text-muted-foreground'
            }`}
            data-testid="view-table-btn"
          >
            <List className="w-3.5 h-3.5 mr-1" /> Table
          </Button>
        </div>
      </div>

      {/* Main Groups View Content */}
      {isLoadingAll || isLoadingMyGroups ? (
        <div className="py-20 flex flex-col items-center justify-center space-y-2 text-muted-foreground text-xs">
          <RefreshCw className="w-6 h-6 animate-spin text-primary" />
          <span>Loading study groups...</span>
        </div>
      ) : groupsToRender.length === 0 ? (
        <div className="py-20 text-center rounded border border-dashed border-border p-8 bg-card space-y-3">
          <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary mx-auto">
            <Users className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-foreground">No Study Groups Found</h3>
          <p className="text-xs text-muted-foreground max-w-sm mx-auto">
            {showPersonalView
              ? 'You are not currently assigned to any study group.'
              : search || courseFilter !== 'all' || scopeFilter !== 'all'
              ? 'No groups match your current filter selection.'
              : 'No study groups have been created yet.'}
          </p>
          {isRep && !showPersonalView && (
            <div className="flex items-center justify-center gap-2 pt-2">
              <Button
                size="sm"
                onClick={() => setIsAutoDivideOpen(true)}
                className="text-xs bg-primary text-primary-foreground font-semibold"
              >
                <Sparkles className="w-3.5 h-3.5 mr-1.5" /> Auto-Divide Cohort
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsCreateOpen(true)}
                className="text-xs border-border"
              >
                <Plus className="w-3.5 h-3.5 mr-1" /> Create Group Manually
              </Button>
            </div>
          )}
        </div>
      ) : viewMode === 'grid' ? (
        /* Grid Cards View */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {groupsToRender.map((group) => (
            <GroupCard
              key={group.id}
              group={group}
              isRep={isRep}
              currentUserId={user?.id}
              onViewRoster={(g) => setGroupForRoster(g)}
              onEdit={(g) => setGroupToEdit(g)}
              onDelete={(g) => setGroupToDelete(g)}
            />
          ))}
        </div>
      ) : (
        /* Table View */
        <div className="rounded border border-border bg-card overflow-hidden">
          <Table>
            <TableHeader className="bg-muted/40">
              <TableRow>
                <TableHead className="text-xs font-bold text-foreground">Group Name</TableHead>
                <TableHead className="text-xs font-bold text-foreground">Cohort / Course</TableHead>
                <TableHead className="text-xs font-bold text-foreground">Leader</TableHead>
                <TableHead className="text-xs font-bold text-foreground text-center">Members</TableHead>
                <TableHead className="text-xs font-bold text-foreground">Created</TableHead>
                <TableHead className="text-xs font-bold text-foreground text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {groupsToRender.map((group) => {
                const leader = group.members?.find((m) => m.isLeader);
                const count = group.members?.length ?? group.memberCount ?? 0;

                return (
                  <TableRow key={group.id} className="hover:bg-muted/20 text-xs">
                    <TableCell className="font-semibold text-foreground py-3">
                      <div>
                        <span>{group.name}</span>
                        {group.description && (
                          <p className="text-[11px] text-muted-foreground truncate max-w-xs font-normal">
                            {group.description}
                          </p>
                        )}
                      </div>
                    </TableCell>

                    <TableCell className="py-3">
                      {group.isGeneral ? (
                        <Badge
                          variant="outline"
                          className="font-mono text-[10px] border-border bg-muted/30"
                        >
                          <Globe className="w-3 h-3 mr-1 text-muted-foreground" /> General
                        </Badge>
                      ) : (
                        <Badge
                          variant="outline"
                          className="font-mono text-[10px] border-border bg-primary/10 text-primary font-semibold"
                        >
                          <BookOpen className="w-3 h-3 mr-1" />
                          {group.courseId}
                        </Badge>
                      )}
                    </TableCell>

                    <TableCell className="py-3">
                      {leader ? (
                        <div className="flex items-center gap-1 font-semibold text-amber-600 dark:text-amber-400">
                          <Crown className="w-3 h-3 fill-amber-500 text-amber-500 shrink-0" />
                          <span>{leader.student?.name || leader.studentId}</span>
                        </div>
                      ) : (
                        <span className="text-muted-foreground italic text-[11px]">Unassigned</span>
                      )}
                    </TableCell>

                    <TableCell className="text-center font-bold text-foreground py-3">
                      {count}
                    </TableCell>

                    <TableCell className="text-muted-foreground py-3">
                      <div className="flex items-center gap-1 text-[11px]">
                        <Calendar className="w-3 h-3" />
                        <span>
                          {group.createdAt
                            ? format(new Date(group.createdAt), 'MMM d, yyyy')
                            : 'N/A'}
                        </span>
                      </div>
                    </TableCell>

                    <TableCell className="text-right py-3">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setGroupForRoster(group)}
                          className="h-7 text-xs border-border"
                        >
                          Roster
                        </Button>

                        {isRep && (
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-7 w-7 p-0 text-muted-foreground"
                              >
                                <MoreVertical className="w-3.5 h-3.5" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-36">
                              <DropdownMenuItem
                                onClick={() => setGroupToEdit(group)}
                                className="text-xs cursor-pointer"
                              >
                                <Edit2 className="w-3.5 h-3.5 mr-2" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => setGroupToDelete(group)}
                                className="text-xs cursor-pointer text-destructive focus:text-destructive"
                              >
                                <Trash2 className="w-3.5 h-3.5 mr-2" />
                                Delete
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

      {/* Dialogs and Slide-Over Sheet */}
      <CreateGroupDialog
        open={isCreateOpen}
        onOpenChange={setIsCreateOpen}
        defaultCourseId={courseFilter !== 'all' ? courseFilter : ''}
      />

      <EditGroupDialog
        group={groupToEdit}
        open={Boolean(groupToEdit)}
        onOpenChange={(open) => {
          if (!open) setGroupToEdit(null);
        }}
      />

      <DeleteGroupDialog
        group={groupToDelete}
        open={Boolean(groupToDelete)}
        onOpenChange={(open) => {
          if (!open) setGroupToDelete(null);
        }}
      />

      <AutoDivideDialog
        open={isAutoDivideOpen}
        onOpenChange={setIsAutoDivideOpen}
        defaultCourseId={courseFilter !== 'all' ? courseFilter : ''}
      />

      <GroupRosterSheet
        group={groupForRoster}
        open={Boolean(groupForRoster)}
        onOpenChange={(open) => {
          if (!open) setGroupForRoster(null);
        }}
        isRep={isRep}
      />
    </div>
  );
}

