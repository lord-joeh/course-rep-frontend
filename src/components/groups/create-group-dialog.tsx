import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useCreateGroupMutation } from '@/hooks/use-groups';
import { useCoursesQuery } from '@/hooks/use-courses';
import { createGroupSchema } from '@/lib/group-validation';
import { Users, Loader2, BookOpen, Globe } from 'lucide-react';

interface CreateGroupDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultCourseId?: string;
}

export function CreateGroupDialog({
  open,
  onOpenChange,
  defaultCourseId = '',
}: CreateGroupDialogProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isGeneral, setIsGeneral] = useState(false);
  const [courseId, setCourseId] = useState(defaultCourseId);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const { data: coursesData } = useCoursesQuery();
  const courses = coursesData?.items || [];

  const createMutation = useCreateGroupMutation(() => {
    handleClose();
  });

  const handleClose = () => {
    setName('');
    setDescription('');
    setIsGeneral(false);
    setCourseId(defaultCourseId);
    setErrors({});
    onOpenChange(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    const result = createGroupSchema.safeParse({
      name,
      description,
      isGeneral,
      courseId: isGeneral ? undefined : courseId,
    });

    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      for (const issue of result.error.issues) {
        const path = issue.path[0]?.toString() || 'form';
        fieldErrors[path] = issue.message;
      }
      setErrors(fieldErrors);
      return;
    }

    createMutation.mutate({
      name: name.trim(),
      description: description.trim() || undefined,
      isGeneral,
      courseId: isGeneral ? undefined : courseId,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md bg-card text-card-foreground p-6 border border-border shadow-xl">
        <DialogHeader className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded bg-primary/10 flex items-center justify-center text-primary">
              <Users className="w-4 h-4" />
            </div>
            <DialogTitle className="text-xl font-bold tracking-tight">
              Create Study Group
            </DialogTitle>
          </div>
          <DialogDescription className="text-xs text-muted-foreground">
            Form a collaborative study group for a specific course or general cohort.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          {/* Group Name */}
          <div className="space-y-1.5">
            <Label htmlFor="group-name" className="text-xs font-semibold">
              Group Title <span className="text-destructive">*</span>
            </Label>
            <Input
              id="group-name"
              placeholder="e.g. Embedded Systems Team Alpha"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={`h-9 text-xs border-border ${errors.name ? 'border-destructive' : ''}`}
              data-testid="group-name-input"
            />
            {errors.name && <p className="text-[11px] text-destructive">{errors.name}</p>}
          </div>

          {/* Group Type Selector (Course-Specific vs General Cohort) */}
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold">Group Scope</Label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => {
                  setIsGeneral(false);
                  setErrors((prev) => {
                    const next = { ...prev };
                    delete next.courseId;
                    return next;
                  });
                }}
                className={`flex items-center justify-center gap-1.5 p-2 rounded border text-xs font-semibold transition-colors ${
                  !isGeneral
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'border-border bg-muted/20 text-muted-foreground hover:bg-muted/40'
                }`}
              >
                <BookOpen className="w-3.5 h-3.5" />
                Course Specific
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsGeneral(true);
                  setErrors((prev) => {
                    const next = { ...prev };
                    delete next.courseId;
                    return next;
                  });
                }}
                className={`flex items-center justify-center gap-1.5 p-2 rounded border text-xs font-semibold transition-colors ${
                  isGeneral
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'border-border bg-muted/20 text-muted-foreground hover:bg-muted/40'
                }`}
              >
                <Globe className="w-3.5 h-3.5" />
                General Cohort
              </button>
            </div>
          </div>

          {/* Course Selection (only if Course Specific) */}
          {!isGeneral && (
            <div className="space-y-1.5">
              <Label htmlFor="group-course" className="text-xs font-semibold">
                Associated Course <span className="text-destructive">*</span>
              </Label>
              <select
                id="group-course"
                value={courseId}
                onChange={(e) => setCourseId(e.target.value)}
                className={`w-full h-9 px-3 rounded border border-border bg-background text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-ring ${
                  errors.courseId ? 'border-destructive' : ''
                }`}
                data-testid="group-course-select"
              >
                <option value="">-- Select Enrolled Course --</option>
                {courses.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.id} - {c.name}
                  </option>
                ))}
              </select>
              {errors.courseId && <p className="text-[11px] text-destructive">{errors.courseId}</p>}
            </div>
          )}

          {/* Description */}
          <div className="space-y-1.5">
            <Label htmlFor="group-description" className="text-xs font-semibold">
              Description / Objectives <span className="text-muted-foreground font-normal">(optional)</span>
            </Label>
            <Textarea
              id="group-description"
              placeholder="e.g. Focus on laboratory assignments and mid-semester revision."
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="text-xs border-border resize-none"
              data-testid="group-description-input"
            />
            {errors.description && (
              <p className="text-[11px] text-destructive">{errors.description}</p>
            )}
          </div>

          <DialogFooter className="pt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleClose}
              disabled={createMutation.isPending}
              className="text-xs border-border"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={createMutation.isPending}
              className="text-xs bg-primary text-primary-foreground font-medium"
              data-testid="create-group-submit-btn"
            >
              {createMutation.isPending ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                  Creating...
                </>
              ) : (
                'Create Group'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

