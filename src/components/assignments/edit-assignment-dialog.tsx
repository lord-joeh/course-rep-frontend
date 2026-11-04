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
import { useUpdateAssignmentMutation } from '@/hooks/use-assignments';
import { updateAssignmentSchema } from '@/lib/assignment-validation';
import type { Assignment } from '@/types';
import { Edit2, Calendar, Loader2 } from 'lucide-react';

interface EditAssignmentDialogProps {
  assignment: Assignment | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EditAssignmentDialog({
  assignment,
  open,
  onOpenChange,
}: EditAssignmentDialogProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [deadline, setDeadline] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (assignment) {
      setTitle(assignment.title);
      setDescription(assignment.description);
      if (assignment.deadline) {
        // Format ISO date to local datetime-local format: YYYY-MM-DDTHH:mm
        const d = new Date(assignment.deadline);
        if (!isNaN(d.getTime())) {
          const pad = (n: number) => String(n).padStart(2, '0');
          const localString = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
          setDeadline(localString);
        }
      }
      setErrors({});
    }
  }, [assignment]);

  const updateMutation = useUpdateAssignmentMutation(assignment?.id || '', () => {
    onOpenChange(false);
  });

  if (!assignment) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    let isoDeadline = undefined;
    if (deadline) {
      const parsed = new Date(deadline);
      if (!isNaN(parsed.getTime())) {
        isoDeadline = parsed.toISOString();
      }
    }

    const result = updateAssignmentSchema.safeParse({
      title,
      description,
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

    updateMutation.mutate({
      title: result.data.title,
      description: result.data.description,
      deadline: result.data.deadline,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <div className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Edit2 className="h-5 w-5" />
            </div>
            <div>
              <DialogTitle className="text-lg font-bold text-foreground">
                Edit Assignment
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                Update instructions, title, or extend the submission deadline.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          {/* Title */}
          <div className="space-y-1.5">
            <label htmlFor="edit-assign-title" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Assignment Title <span className="text-destructive">*</span>
            </label>
            <Input
              id="edit-assign-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              disabled={updateMutation.isPending}
            />
            {errors.title && <p className="text-xs text-destructive">{errors.title}</p>}
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <label htmlFor="edit-assign-desc" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Instructions & Description <span className="text-destructive">*</span>
            </label>
            <textarea
              id="edit-assign-desc"
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={updateMutation.isPending}
              className="w-full rounded-md border border-input bg-background p-2.5 text-sm text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring resize-y"
            />
            {errors.description && <p className="text-xs text-destructive">{errors.description}</p>}
          </div>

          {/* Deadline Picker */}
          <div className="space-y-1.5">
            <label htmlFor="edit-assign-deadline" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5" />
              Submission Deadline
            </label>
            <Input
              id="edit-assign-deadline"
              type="datetime-local"
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
              disabled={updateMutation.isPending}
            />
            {errors.deadline && <p className="text-xs text-destructive">{errors.deadline}</p>}
          </div>

          <DialogFooter className="pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={updateMutation.isPending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={updateMutation.isPending} className="gap-2">
              {updateMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>Save Changes</>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

