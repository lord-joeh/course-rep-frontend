import { useState, useEffect } from 'react';
import { PageHeader } from '@/components/common/page-header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
import { useLecturersQuery } from '@/hooks/use-lecturers';
import { LecturerCard } from '@/components/lecturers/lecturer-card';
import { CreateLecturerDialog } from '@/components/lecturers/create-lecturer-dialog';
import { EditLecturerDialog } from '@/components/lecturers/edit-lecturer-dialog';
import { DeleteLecturerDialog } from '@/components/lecturers/delete-lecturer-dialog';
import type { Lecturer } from '@/types';
import {
  Search,
  X,
  UserPlus,
  LayoutGrid,
  List,
  ChevronLeft,
  ChevronRight,
  GraduationCap,
  Mail,
  Phone,
  MoreVertical,
  Edit2,
  Trash2,
  RotateCw,
} from 'lucide-react';

export function LecturerDirectoryPage() {
  const { user } = useAuthStore();
  const isRep = !!user?.isRep;

  // View state: 'grid' or 'table'
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');

  // Query params state
  const [searchInput, setSearchInput] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);

  // Dialog state
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editLecturer, setEditLecturer] = useState<Lecturer | null>(null);
  const [deleteLecturer, setDeleteLecturer] = useState<Lecturer | null>(null);

  // 300ms Debounce on Search Input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchInput);
      setPage(1); // Reset to page 1 on search change
    }, 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const {
    data,
    isLoading,
    isFetching,
    refetch,
  } = useLecturersQuery({
    page,
    limit,
    search: debouncedSearch || undefined,
  });

  const lecturers = data?.items || [];
  const total = data?.meta?.total ?? data?.total ?? 0;
  const totalPages = data?.meta?.totalPages ?? data?.totalPages ?? 1;

  const handleClearSearch = () => {
    setSearchInput('');
    setDebouncedSearch('');
    setPage(1);
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <PageHeader
        title="Faculty Directory"
        description="Institutional faculty roster, verified contact information, and instructor profiles."
      >
        <Button
          variant="outline"
          size="icon"
          onClick={() => refetch()}
          disabled={isFetching}
          title="Refresh Directory"
        >
          <RotateCw className={`h-4 w-4 ${isFetching ? 'animate-spin' : ''}`} />
        </Button>
        {isRep && (
          <Button onClick={() => setCreateDialogOpen(true)}>
            <UserPlus className="mr-2 h-4 w-4" />
            Add Faculty
          </Button>
        )}
      </PageHeader>

      {/* Filter and Control Toolbar */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        {/* Search Bar */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by name, email, or phone..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="pl-9 pr-9"
          />
          {searchInput && (
            <button
              type="button"
              onClick={handleClearSearch}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              title="Clear search"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* View Switch & Page Size Selector */}
        <div className="flex items-center gap-3">
          {/* Limit selector */}
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span>Show</span>
            <select
              value={limit}
              onChange={(e) => {
                setLimit(Number(e.target.value));
                setPage(1);
              }}
              className="h-9 rounded-md border border-input bg-background px-2 py-1 text-sm text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            >
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={50}>50</option>
            </select>
          </div>

          {/* Grid vs Table toggle */}
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
                <div className="flex items-center gap-3">
                  <Skeleton className="h-12 w-12 rounded-full" />
                  <div className="space-y-2 flex-1">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-3 w-1/2" />
                  </div>
                </div>
                <div className="space-y-2 pt-2 border-t border-border">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-2/3" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-lg border border-border bg-card">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Faculty Member</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Added Date</TableHead>
                  {isRep && <TableHead className="w-[80px]">Actions</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell><Skeleton className="h-5 w-32" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-44" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-28" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                    {isRep && <TableCell><Skeleton className="h-5 w-10" /></TableCell>}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )
      ) : lecturers.length === 0 ? (
        // Empty State
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border bg-card p-12 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary mb-3">
            <GraduationCap className="h-6 w-6" />
          </div>
          <h3 className="text-base font-semibold text-foreground">
            {debouncedSearch ? 'No faculty members found' : 'Faculty directory is empty'}
          </h3>
          <p className="mt-1 text-sm text-muted-foreground max-w-sm">
            {debouncedSearch
              ? `No faculty members matched the search "${debouncedSearch}". Try checking the spelling or clear the filter.`
              : 'There are currently no faculty members registered in the directory.'}
          </p>
          <div className="mt-4 flex gap-2">
            {debouncedSearch ? (
              <Button variant="outline" size="sm" onClick={handleClearSearch}>
                Clear Search
              </Button>
            ) : isRep ? (
              <Button size="sm" onClick={() => setCreateDialogOpen(true)}>
                <UserPlus className="mr-2 h-4 w-4" />
                Add First Faculty Member
              </Button>
            ) : null}
          </div>
        </div>
      ) : viewMode === 'grid' ? (
        // Grid View
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {lecturers.map((lecturer) => (
            <LecturerCard
              key={lecturer.id}
              lecturer={lecturer}
              isRep={isRep}
              onEdit={(l) => setEditLecturer(l)}
              onDelete={(l) => setDeleteLecturer(l)}
            />
          ))}
        </div>
      ) : (
        // Table View
        <div className="rounded-lg border border-border bg-card overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Faculty Member</TableHead>
                <TableHead>Email Address</TableHead>
                <TableHead>Phone Number</TableHead>
                <TableHead>Registered</TableHead>
                {isRep && <TableHead className="w-[80px] text-right">Actions</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {lecturers.map((lecturer) => (
                <TableRow key={lecturer.id}>
                  <TableCell className="font-medium text-foreground">
                    <div className="flex items-center gap-2">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground font-semibold text-xs">
                        {lecturer.name.slice(0, 2).toUpperCase()}
                      </div>
                      <span className="truncate max-w-[200px]" title={lecturer.name}>
                        {lecturer.name}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <a
                      href={`mailto:${lecturer.email}`}
                      className="text-foreground hover:text-primary hover:underline flex items-center gap-1.5"
                    >
                      <Mail className="h-3.5 w-3.5 text-muted-foreground" />
                      {lecturer.email}
                    </a>
                  </TableCell>
                  <TableCell>
                    {lecturer.phone ? (
                      <a
                        href={`tel:${lecturer.phone}`}
                        className="text-foreground hover:text-primary hover:underline flex items-center gap-1.5"
                      >
                        <Phone className="h-3.5 w-3.5 text-muted-foreground" />
                        {lecturer.phone}
                      </a>
                    ) : (
                      <span className="text-muted-foreground italic text-xs">None</span>
                    )}
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {new Date(lecturer.createdAt).toLocaleDateString()}
                  </TableCell>
                  {isRep && (
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreVertical className="h-4 w-4" />
                            <span className="sr-only">Actions</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => setEditLecturer(lecturer)}>
                            <Edit2 className="mr-2 h-4 w-4" />
                            Edit Details
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => setDeleteLecturer(lecturer)}
                            className="text-destructive focus:text-destructive"
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete Faculty
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Pagination Footer */}
      {total > 0 && (
        <div className="flex flex-col items-center justify-between gap-4 border-t border-border pt-4 sm:flex-row text-sm text-muted-foreground">
          <div>
            Showing <span className="font-medium text-foreground">{Math.min((page - 1) * limit + 1, total)}</span> to{' '}
            <span className="font-medium text-foreground">{Math.min(page * limit, total)}</span> of{' '}
            <span className="font-medium text-foreground">{total}</span> faculty members
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

      {/* Modals */}
      <CreateLecturerDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
      />

      <EditLecturerDialog
        lecturer={editLecturer}
        open={!!editLecturer}
        onOpenChange={(open) => {
          if (!open) setEditLecturer(null);
        }}
      />

      <DeleteLecturerDialog
        lecturer={deleteLecturer}
        open={!!deleteLecturer}
        onOpenChange={(open) => {
          if (!open) setDeleteLecturer(null);
        }}
      />
    </div>
  );
}
