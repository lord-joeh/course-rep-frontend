import { useState, useMemo, useEffect } from 'react';
import { useAuthStore } from '@/lib/auth-store';
import { useCoursesQuery, useMyCoursesQuery } from '@/hooks/use-courses';
import { useCourseSlidesQuery, useDownloadSlide } from '@/hooks/use-slides';
import { isVideoFile, isPresentationFile, isPdfFile } from '@/lib/slide-validation';
import { SlideCard } from '@/components/slides/slide-card';
import { UploadSlidesDialog } from '@/components/slides/upload-slides-dialog';
import { MaterialPreviewDialog } from '@/components/slides/material-preview-dialog';
import { DeleteSlideDialog } from '@/components/slides/delete-slide-dialog';
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
import type { Slide, MaterialType } from '@/types';
import {
  UploadCloud,
  Search,
  LayoutGrid,
  List,
  Video,
  FileText,
  Presentation,
  File,
  Eye,
  Download,
  Trash2,
  Loader2,
  FolderOpen,
  Calendar,
  RefreshCw,
} from 'lucide-react';

export function CourseSlidesPage() {
  const { user } = useAuthStore();
  const isRep = Boolean(user?.isRep);

  // Course Selection state
  const [selectedCourseId, setSelectedCourseId] = useState<string>('');

  // Filtering & Search
  const [searchInput, setSearchInput] = useState<string>('');
  const [debouncedSearch, setDebouncedSearch] = useState<string>('');
  const [materialFilter, setMaterialFilter] = useState<MaterialType>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  const [page, setPage] = useState<number>(1);

  // Dialog states
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [previewSlide, setPreviewSlide] = useState<Slide | null>(null);
  const [deleteSlide, setDeleteSlide] = useState<Slide | null>(null);

  // Download action hook
  const { downloadSlide, isDownloading, downloadingSlideId } = useDownloadSlide();

  // Queries
  const { data: allCoursesData, isLoading: isLoadingCourses } = useCoursesQuery({ limit: 100 });
  const { data: myCourses } = useMyCoursesQuery();

  // Determine available courses based on role
  const availableCourses = useMemo(() => {
    if (isRep) {
      return allCoursesData?.items || [];
    }
    // Student: show enrolled courses first, fall back to all courses if none enrolled
    if (myCourses && myCourses.length > 0) {
      return myCourses;
    }
    return allCoursesData?.items || [];
  }, [isRep, allCoursesData, myCourses]);

  // Set default selected course once loaded
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

  // Slides Query for selected course
  const {
    data: slidesData,
    isLoading: isLoadingSlides,
    isFetching: isFetchingSlides,
    refetch: refetchSlides,
  } = useCourseSlidesQuery({
    courseId: selectedCourseId,
    page,
    limit: 50,
    search: debouncedSearch || undefined,
  });

  const rawSlides = slidesData?.items || [];
  const activeCourse = availableCourses.find((c) => c.id === selectedCourseId);

  // Filter slides by client-side material type (slides vs videos)
  const filteredSlides = useMemo(() => {
    if (materialFilter === 'all') return rawSlides;
    if (materialFilter === 'videos') {
      return rawSlides.filter((s) => isVideoFile(s.fileName));
    }
    if (materialFilter === 'slides') {
      return rawSlides.filter((s) => !isVideoFile(s.fileName));
    }
    return rawSlides;
  }, [rawSlides, materialFilter]);

  const videoCount = rawSlides.filter((s) => isVideoFile(s.fileName)).length;
  const slideCount = rawSlides.filter((s) => !isVideoFile(s.fileName)).length;

  const getMediaIcon = (fileName: string) => {
    if (isVideoFile(fileName)) {
      return <Video className="h-4 w-4 text-cyan-500" />;
    }
    if (isPresentationFile(fileName)) {
      return <Presentation className="h-4 w-4 text-amber-500" />;
    }
    if (isPdfFile(fileName)) {
      return <FileText className="h-4 w-4 text-red-500" />;
    }
    return <File className="h-4 w-4 text-muted-foreground" />;
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Course Slides & Video Recordings
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Browse, preview, and download course curriculum materials, lecture decks, and video sessions.
          </p>
        </div>

        {isRep && (
          <Button
            onClick={() => setIsUploadOpen(true)}
            disabled={!selectedCourseId}
            className="gap-2 shrink-0"
          >
            <UploadCloud className="h-4 w-4" />
            Upload Materials
          </Button>
        )}
      </div>

      {/* Course Selector & Metadata Ribbon */}
      <div className="rounded-xl border border-border bg-card p-4 sm:p-5 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            <label htmlFor="course-select" className="text-xs font-semibold text-muted-foreground uppercase tracking-wider shrink-0">
              Select Course:
            </label>
            <div className="relative min-w-[280px]">
              <select
                id="course-select"
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
              ) : (
                <Badge variant="secondary" className="text-[11px] text-muted-foreground">
                  Default Drive Folder
                </Badge>
              )}
            </div>
          )}
        </div>

        {/* Filter and View Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-border">
          {/* Search Bar */}
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search materials by filename..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="pl-9 h-9 text-sm"
            />
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Category Pills */}
            <div className="flex items-center bg-muted/60 p-0.5 rounded-lg border border-border text-xs">
              <button
                type="button"
                onClick={() => setMaterialFilter('all')}
                className={`px-3 py-1.5 rounded-md font-medium transition-all ${
                  materialFilter === 'all'
                    ? 'bg-background text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                All ({rawSlides.length})
              </button>
              <button
                type="button"
                onClick={() => setMaterialFilter('slides')}
                className={`px-3 py-1.5 rounded-md font-medium transition-all ${
                  materialFilter === 'slides'
                    ? 'bg-background text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Slides ({slideCount})
              </button>
              <button
                type="button"
                onClick={() => setMaterialFilter('videos')}
                className={`px-3 py-1.5 rounded-md font-medium transition-all ${
                  materialFilter === 'videos'
                    ? 'bg-background text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Videos ({videoCount})
              </button>
            </div>

            {/* View Toggle */}
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
              onClick={() => refetchSlides()}
              disabled={isFetchingSlides}
              title="Refresh materials"
            >
              <RefreshCw className={`h-4 w-4 ${isFetchingSlides ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      {isLoadingSlides ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div
              key={i}
              className="h-44 rounded-xl border border-border bg-card animate-pulse p-5 space-y-4"
            >
              <div className="flex gap-3">
                <div className="h-10 w-10 rounded-lg bg-muted" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-20 bg-muted rounded" />
                  <div className="h-4 w-3/4 bg-muted rounded" />
                </div>
              </div>
              <div className="h-3 w-1/2 bg-muted rounded pt-4" />
              <div className="h-8 bg-muted rounded" />
            </div>
          ))}
        </div>
      ) : filteredSlides.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-card p-12 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-muted/60 text-muted-foreground mb-4">
            <FolderOpen className="h-7 w-7" />
          </div>
          <h3 className="text-lg font-bold text-foreground">No Materials Found</h3>
          <p className="text-sm text-muted-foreground max-w-sm mt-1 mb-5">
            {debouncedSearch
              ? `No slides or video recordings matched "${debouncedSearch}".`
              : materialFilter !== 'all'
              ? `No ${materialFilter} uploaded yet for ${selectedCourseId || 'this course'}.`
              : `No course materials uploaded yet for ${selectedCourseId || 'this course'}.`}
          </p>
          {isRep && selectedCourseId && (
            <Button onClick={() => setIsUploadOpen(true)} className="gap-2">
              <UploadCloud className="h-4 w-4" />
              Upload First Material
            </Button>
          )}
        </div>
      ) : viewMode === 'grid' ? (
        /* Grid View */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredSlides.map((slide) => (
            <SlideCard
              key={slide.id}
              slide={slide}
              isRep={isRep}
              onPreview={(s) => setPreviewSlide(s)}
              onDelete={(s) => setDeleteSlide(s)}
            />
          ))}
        </div>
      ) : (
        /* Table View */
        <div className="rounded-xl border border-border bg-card overflow-hidden shadow-sm">
          <Table>
            <TableHeader className="bg-muted/40">
              <TableRow>
                <TableHead className="w-12 text-center">Type</TableHead>
                <TableHead>File Name</TableHead>
                <TableHead className="hidden md:table-cell">Integrity Hash</TableHead>
                <TableHead className="hidden sm:table-cell">Date Added</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredSlides.map((slide) => {
                const isVideo = isVideoFile(slide.fileName);
                const isCurrentDownloading = downloadingSlideId === slide.id;

                return (
                  <TableRow key={slide.id} className="hover:bg-muted/20">
                    <TableCell className="text-center">
                      <div className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-muted/60 border border-border">
                        {getMediaIcon(slide.fileName)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-semibold text-sm text-foreground hover:underline cursor-pointer" onClick={() => setPreviewSlide(slide)}>
                          {slide.fileName}
                        </span>
                        <div className="flex items-center gap-1.5 mt-0.5 sm:hidden">
                          <span className="text-[11px] text-muted-foreground">
                            {new Date(slide.createdAt).toLocaleDateString()}
                          </span>
                          {isVideo && (
                            <Badge variant="secondary" className="text-[9px] px-1 py-0 bg-cyan-500/10 text-cyan-600">
                              Video
                            </Badge>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      {slide.hash ? (
                        <span className="font-mono text-xs text-muted-foreground" title={slide.hash}>
                          {slide.hash.slice(0, 10)}...{slide.hash.slice(-6)}
                        </span>
                      ) : (
                        <span className="text-xs text-muted-foreground/60">—</span>
                      )}
                    </TableCell>
                    <TableCell className="hidden sm:table-cell text-xs text-muted-foreground">
                      <span className="flex items-center gap-1.5">
                        <Calendar className="h-3.5 w-3.5" />
                        {new Date(slide.createdAt).toLocaleDateString()}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-foreground"
                          onClick={() => setPreviewSlide(slide)}
                          title="Preview in Browser"
                        >
                          <Eye className="h-4 w-4" />
                          <span className="sr-only">Preview</span>
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-foreground"
                          onClick={() => downloadSlide(slide.id, slide.fileName)}
                          disabled={isDownloading}
                          title="Download File"
                        >
                          {isCurrentDownloading ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Download className="h-4 w-4" />
                          )}
                          <span className="sr-only">Download</span>
                        </Button>
                        {isRep && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive hover:bg-destructive/10 hover:text-destructive"
                            onClick={() => setDeleteSlide(slide)}
                            title="Delete Material"
                          >
                            <Trash2 className="h-4 w-4" />
                            <span className="sr-only">Delete</span>
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

      {/* Upload Dialog */}
      <UploadSlidesDialog
        open={isUploadOpen}
        onOpenChange={setIsUploadOpen}
        defaultCourseId={selectedCourseId}
      />

      {/* Material Preview Dialog */}
      <MaterialPreviewDialog
        slide={previewSlide}
        open={Boolean(previewSlide)}
        onOpenChange={(open) => !open && setPreviewSlide(null)}
      />

      {/* Delete Slide Confirmation Dialog */}
      <DeleteSlideDialog
        slide={deleteSlide}
        open={Boolean(deleteSlide)}
        onOpenChange={(open) => !open && setDeleteSlide(null)}
      />
    </div>
  );
}

