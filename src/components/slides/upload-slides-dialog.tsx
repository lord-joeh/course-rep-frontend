import React, { useState, useRef, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useUploadSlidesMutation } from '@/hooks/use-slides';
import { useCoursesQuery } from '@/hooks/use-courses';
import { formatBytes } from '@/components/google/drive-file-list';
import { isVideoFile, isPresentationFile, isPdfFile } from '@/lib/slide-validation';
import {
  UploadCloud,
  FileText,
  Video,
  Presentation,
  File,
  X,
  Loader2,
  BookOpen,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';

interface UploadSlidesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultCourseId?: string;
}

const MAX_FILES = 10;
const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB

export function UploadSlidesDialog({
  open,
  onOpenChange,
  defaultCourseId,
}: UploadSlidesDialogProps) {
  const [courseId, setCourseId] = useState(defaultCourseId || '');
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [bytesUploaded, setBytesUploaded] = useState(0);
  const [bytesTotal, setBytesTotal] = useState(0);
  const [validationError, setValidationError] = useState('');
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: coursesData } = useCoursesQuery({ limit: 100 });
  const courses = coursesData?.items || [];

  useEffect(() => {
    if (defaultCourseId) {
      setCourseId(defaultCourseId);
    } else if (courses.length > 0 && !courseId) {
      setCourseId(courses[0].id);
    }
  }, [defaultCourseId, courses, courseId]);

  const selectedCourse = courses.find((c) => c.id === courseId);

  const uploadMutation = useUploadSlidesMutation(() => {
    resetForm();
    onOpenChange(false);
  });

  const resetForm = () => {
    setSelectedFiles([]);
    setUploadProgress(0);
    setBytesUploaded(0);
    setBytesTotal(0);
    setValidationError('');
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      resetForm();
    }
    onOpenChange(newOpen);
  };

  const handleFilesAdded = (files: FileList | null) => {
    if (!files) return;
    setValidationError('');

    const newFiles = Array.from(files);
    const combined = [...selectedFiles, ...newFiles];

    if (combined.length > MAX_FILES) {
      setValidationError(`Maximum ${MAX_FILES} files allowed per batch upload.`);
      return;
    }

    for (const f of newFiles) {
      if (f.size > MAX_FILE_SIZE) {
        setValidationError(`"${f.name}" exceeds the 50MB per-file limit.`);
        return;
      }
    }

    setSelectedFiles(combined);
  };

  const handleRemoveFile = (index: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError('');

    if (!courseId) {
      setValidationError('Please select a course for this material upload.');
      return;
    }

    if (selectedFiles.length === 0) {
      setValidationError('Please select at least one file to upload.');
      return;
    }

    setUploadProgress(0);

    uploadMutation.mutate({
      files: selectedFiles,
      courseId,
      folderId: selectedCourse?.slidesFolderId || undefined,
      onProgress: (percent, loaded, total) => {
        setUploadProgress(percent);
        setBytesUploaded(loaded);
        setBytesTotal(total);
      },
    });
  };

  const getFileIcon = (fileName: string) => {
    if (isVideoFile(fileName)) return <Video className="h-4 w-4 text-cyan-500 shrink-0" />;
    if (isPresentationFile(fileName)) return <Presentation className="h-4 w-4 text-amber-500 shrink-0" />;
    if (isPdfFile(fileName)) return <FileText className="h-4 w-4 text-red-500 shrink-0" />;
    return <File className="h-4 w-4 text-muted-foreground shrink-0" />;
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[560px]">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <UploadCloud className="h-5 w-5" />
            </div>
            <div>
              <DialogTitle>Upload Course Materials & Videos</DialogTitle>
              <DialogDescription>
                Bulk upload lecture slides, documents, and video recordings to cloud storage.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          {/* Target Course Selector */}
          <div className="space-y-1.5">
            <label htmlFor="upload-course-select" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <BookOpen className="h-3.5 w-3.5" />
              Target Course <span className="text-destructive">*</span>
            </label>
            <select
              id="upload-course-select"
              value={courseId}
              onChange={(e) => setCourseId(e.target.value)}
              className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-sm text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              disabled={uploadMutation.isPending}
            >
              <option value="">Select a course...</option>
              {courses.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.id} - {c.name} {c.slidesFolderId ? '(Drive linked)' : ''}
                </option>
              ))}
            </select>
          </div>

          {/* Drag & Drop Upload Zone */}
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragOver(true);
            }}
            onDragLeave={() => setIsDragOver(false)}
            onDrop={(e) => {
              e.preventDefault();
              setIsDragOver(false);
              handleFilesAdded(e.dataTransfer.files);
            }}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
              isDragOver
                ? 'border-primary bg-primary/5'
                : 'border-border hover:border-primary/50 hover:bg-muted/20'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept=".pdf,.ppt,.pptx,.mp4,.webm,.mov,.mkv,.docx,.zip"
              className="hidden"
              onChange={(e) => handleFilesAdded(e.target.files)}
              disabled={uploadMutation.isPending}
            />
            <UploadCloud className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
            <p className="text-sm font-semibold text-foreground">
              Click to browse or drag and drop files here
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Supports PDF, PPTX, Word documents, and MP4/WebM video recordings (up to 10 files, max 50MB each)
            </p>
          </div>

          {/* Validation Error Message */}
          {validationError && (
            <div className="flex items-center gap-2 p-2.5 rounded-lg border border-destructive/20 bg-destructive/5 text-destructive text-xs">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{validationError}</span>
            </div>
          )}

          {/* Selected Files Queue */}
          {selectedFiles.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span className="font-semibold text-foreground">
                  Selected Files ({selectedFiles.length}/{MAX_FILES})
                </span>
                <span>
                  Total:{' '}
                  {formatBytes(selectedFiles.reduce((acc, f) => acc + f.size, 0))}
                </span>
              </div>

              <div className="max-h-36 overflow-y-auto space-y-1.5 pr-1 divide-y divide-border/40 rounded-lg border border-border p-2 bg-muted/20">
                {selectedFiles.map((file, i) => (
                  <div key={i} className="flex items-center justify-between py-1 text-xs gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      {getFileIcon(file.name)}
                      <span className="truncate text-foreground font-medium" title={file.name}>
                        {file.name}
                      </span>
                      <span className="text-muted-foreground shrink-0 font-mono text-[11px]">
                        ({formatBytes(file.size)})
                      </span>
                    </div>
                    {!uploadMutation.isPending && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRemoveFile(i);
                        }}
                        className="text-muted-foreground hover:text-destructive shrink-0"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Live Visual Upload Progress Bar */}
          {uploadMutation.isPending && (
            <div className="space-y-2 rounded-lg border border-primary/20 bg-primary/5 p-3.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-foreground flex items-center gap-1.5">
                  <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />
                  Uploading & Deduplicating...
                </span>
                <span className="font-mono font-bold text-primary">{uploadProgress}%</span>
              </div>

              {/* Progress track */}
              <div className="h-2 w-full rounded-full bg-border overflow-hidden">
                <div
                  className="h-full bg-primary transition-all duration-300 ease-out"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>

              <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                <span>Streaming in-memory to Google Drive</span>
                {bytesTotal > 0 && (
                  <span className="font-mono">
                    {formatBytes(bytesUploaded)} / {formatBytes(bytesTotal)}
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Deduplication & Security Notice */}
          <div className="rounded-lg border border-border bg-muted/40 p-2.5 text-[11px] text-muted-foreground flex items-start gap-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
            <span>
              <strong>Zero-Waste SHA-256 Deduplication:</strong> Files are hashed in-memory before persisting.
              Identical materials previously uploaded to this course will be safely skipped.
            </span>
          </div>

          <DialogFooter className="pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
              disabled={uploadMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={uploadMutation.isPending || selectedFiles.length === 0}
            >
              {uploadMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Uploading ({uploadProgress}%)
                </>
              ) : (
                `Upload ${selectedFiles.length > 0 ? `(${selectedFiles.length})` : ''}`
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

