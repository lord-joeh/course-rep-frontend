import React, { useState, useEffect } from 'react';
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
import { useUpdateGroupMutation } from '@/hooks/use-groups';
import { useCoursesQuery } from '@/hooks/use-courses';
import { updateGroupSchema } from '@/lib/group-validation';
import type { Group } from '@/types';
import { Edit2, Loader2 } from 'lucide-react';

interface EditGroupDialogProps {
  group: Group | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EditGroupDialog({
  group,
  open,
  onOpenChange,
}: EditGroupDialogProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [courseId, setCourseId] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const { data: coursesData } = useCoursesQuery();
  const courses = coursesData?.items || [];

  useEffect(() => {
    if (group) {
      setName(group.name || '');
      setDescription(group.description || '');
      setCourseId(group.courseId || '');
      setErrors({});
    }
  }, [group, open]);

  const updateMutation = useUpdateGroupMutation(() => {
    onOpenChange(false);
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!group) return;
    setErrors({});

    const result = updateGroupSchema.safeParse({
      name,
      description,
      courseId: courseId || undefined,
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

    updateMutation.mutate({
      id: group.id,
      dto: {
        name: name.trim(),
        description: description.trim() || undefined,
        courseId: courseId || undefined,
      },
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md bg-card text-card-foreground p-6 border border-border shadow-xl">
        <DialogHeader className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded bg-primary/10 flex items-center justify-center text-primary">
              <Edit2 className="w-4 h-4" />
            </div>
            <DialogTitle className="text-xl font-bold tracking-tight">
              Edit Study Group
            </DialogTitle>
          </div>
          <DialogDescription className="text-xs text-muted-foreground">
            Update title, description, or course association for this group.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          <div className="space-y-1.5">
            <Label htmlFor="edit-group-name" className="text-xs font-semibold">
              Group Title <span className="text-destructive">*</span>
            </Label>
            <Input
              id="edit-group-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={`h-9 text-xs border-border ${errors.name ? 'border-destructive' : ''}`}
              data-testid="edit-group-name-input"
            />
            {errors.name && <p className="text-[11px] text-destructive">{errors.name}</p>}
          </div>

          {!group?.isGeneral && (
            <div className="space-y-1.5">
              <Label htmlFor="edit-group-course" className="text-xs font-semibold">
                Associated Course
              </Label>
              <select
                id="edit-group-course"
                value={courseId}
                onChange={(e) => setCourseId(e.target.value)}
                className="w-full h-9 px-3 rounded border border-border bg-background text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                data-testid="edit-group-course-select"
              >
                <option value="">-- No specific course (General) --</option>
                {courses.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.id} - {c.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="space-y-1.5">
            <Label htmlFor="edit-group-description" className="text-xs font-semibold">
              Description
            </Label>
            <Textarea
              id="edit-group-description"
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="text-xs border-border resize-none"
              data-testid="edit-group-description-input"
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
              onClick={() => onOpenChange(false)}
              disabled={updateMutation.isPending}
              className="text-xs border-border"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={updateMutation.isPending}
              className="text-xs bg-primary text-primary-foreground font-medium"
              data-testid="edit-group-submit-btn"
            >
              {updateMutation.isPending ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                  Saving...
                </>
              ) : (
                'Save Changes'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

