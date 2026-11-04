import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useCreateAssignmentMutation } from '@/hooks/use-assignments';
import { useCoursesQuery } from '@/hooks/use-courses';
import { createAssignmentSchema } from '@/lib/assignment-validation';
import { formatBytes } from '@/components/google/drive-file-list';
import {
  ClipboardPlus,
  BookOpen,
  Calendar,
  FileText,
  UploadCloud,
  X,
  Loader2,
  FolderOpen,
} from 'lucide-react';

interface CreateAssignmentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultCourseId?: string;
}

export function CreateAssignmentDialog({
  open,
  onOpenChange,
  defaultCourseId,
}: CreateAssignmentDialogProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [courseId, setCourseId] = useState(defaultCourseId || '');
  const [deadline, setDeadline] = useState('');
  const [specFile, setSpecFile] = useState<File | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const { data: coursesData } = useCoursesQuery({ limit: 100 });
  const courses = coursesData?.items || [];

  useEffect(() => {
    if (defaultCourseId) {
      setCourseId(defaultCourseId);
    } else if (courses.length > 0 && !courseId) {
      setCourseId(courses[0].id);
    }
  }, [defaultCourseId, courses, courseId]);

  const createMutation = useCreateAssignmentMutation(() => {
    resetForm();
    onOpenChange(false);
  });

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setDeadline('');
    setSpecFile(null);
    setErrors({});
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      resetForm();
    }
    onOpenChange(newOpen);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    // Convert local datetime to ISO 8601 string
    let isoDeadline = '';
    if (deadline) {
      const parsed = new Date(deadline);
      if (!isNaN(parsed.getTime())) {
        isoDeadline = parsed.toISOString();
      }
    }

    const result = createAssignmentSchema.safeParse({
      title,
      description,
      courseId,
      deadline: isoDeadline,
    });

    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      for (const issue of result.error.issues) {
        const path = issue.path[0] as string;
        if (!fieldErrors[path]) {
          fieldErrors[path] = issue.message;
        }
      }
      setErrors(fieldErrors);
      return;
    }

    createMutation.mutate({
      title: result.data.title,
      description: result.data.description,
      courseId: result.data.courseId,
      deadline: result.data.deadline,
      file: specFile || undefined,
    });
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <div className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <ClipboardPlus className="h-5 w-5" />
            </div>
            <div>
              <DialogTitle className="text-lg font-bold text-foreground">
                Create Course Assignment
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                Publish a new assignment with automated Google Drive submission folder provisioning.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          {/* Target Course */}
          <div className="space-y-1.5">
            <label htmlFor="assign-course-select" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <BookOpen className="h-3.5 w-3.5" />
              Course <span className="text-destructive">*</span>
            </label>
            <select
              id="assign-course-select"
              value={courseId}
              onChange={(e) => setCourseId(e.target.value)}
              className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-sm font-medium text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              disabled={createMutation.isPending}
            >
              <option value="">Select a course...</option>
              {courses.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.id} - {c.name}
                </option>
              ))}
            </select>
            {errors.courseId && <p className="text-xs text-destructive">{errors.courseId}</p>}
          </div>

          {/* Title */}
          <div className="space-y-1.5">
            <label htmlFor="assign-title" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Assignment Title <span className="text-destructive">*</span>
            </label>
            <Input
              id="assign-title"
              placeholder="e.g. Problem Set 1: Algorithm Complexity"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              disabled={createMutation.isPending}
            />
            {errors.title && <p className="text-xs text-destructive">{errors.title}</p>}
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <label htmlFor="assign-desc" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Instructions & Description <span className="text-destructive">*</span>
            </label>
            <textarea
              id="assign-desc"
              rows={3}
              placeholder="Provide assignment guidelines, submission requirements, and rubric details..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={createMutation.isPending}
              className="w-full rounded-md border border-input bg-background p-2.5 text-sm text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring resize-y"
            />
            {errors.description && <p className="text-xs text-destructive">{errors.description}</p>}
          </div>

          {/* Deadline Picker */}
          <div className="space-y-1.5">
            <label htmlFor="assign-deadline" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5" />
              Submission Deadline <span className="text-destructive">*</span>
            </label>
            <Input
              id="assign-deadline"
              type="datetime-local"
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
              disabled={createMutation.isPending}
            />
            {errors.deadline && <p className="text-xs text-destructive">{errors.deadline}</p>}
          </div>

          {/* Optional Specification Document Attachment */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <FileText className="h-3.5 w-3.5" />
              Specification Document (Optional Brief)
            </label>

            {specFile ? (
              <div className="flex items-center justify-between rounded-lg border border-border bg-muted/40 p-2.5 text-xs">
                <div className="flex items-center gap-2 min-w-0 pr-2">
                  <FileText className="h-4 w-4 text-primary shrink-0" />
                  <span className="font-semibold text-foreground truncate">{specFile.name}</span>
                  <span className="text-muted-foreground shrink-0">({formatBytes(specFile.size)})</span>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 text-muted-foreground hover:text-destructive"
                  onClick={() => setSpecFile(null)}
                >
                  <X className="h-3.5 w-3.5" />
                </Button>
              </div>
            ) : (
              <label className="flex items-center justify-center gap-2 p-3 border border-dashed border-border rounded-lg bg-card cursor-pointer hover:bg-muted/30 transition-colors text-xs text-muted-foreground">
                <UploadCloud className="h-4 w-4 text-primary" />
                <span>Attach PDF or Document specification</span>
                <input
                  type="file"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) setSpecFile(file);
                  }}
                  accept=".pdf,.docx,.doc,.txt"
                />
              </label>
            )}
          </div>

          {/* Drive Provisioning Banner */}
          <div className="rounded-lg border border-border bg-muted/40 p-2.5 text-[11px] text-muted-foreground flex items-start gap-2">
            <FolderOpen className="h-4 w-4 text-blue-500 shrink-0 mt-0.5" />
            <span>
              <strong>Automated Cloud Storage:</strong> A dedicated Google Drive folder will be automatically provisioned for student solution submissions.
            </span>
          </div>

          <DialogFooter className="pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
              disabled={createMutation.isPending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={createMutation.isPending} className="gap-2">
              {createMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Publishing...
                </>
              ) : (
                <>
                  <ClipboardPlus className="h-4 w-4" />
                  Publish Assignment
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

