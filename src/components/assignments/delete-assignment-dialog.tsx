import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useDeleteAssignmentMutation } from '@/hooks/use-assignments';
import type { Assignment } from '@/types';
import { Trash2, AlertTriangle, Loader2 } from 'lucide-react';

interface DeleteAssignmentDialogProps {
  assignment: Assignment | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function DeleteAssignmentDialog({
  assignment,
  open,
  onOpenChange,
}: DeleteAssignmentDialogProps) {
  const deleteMutation = useDeleteAssignmentMutation(() => {
    onOpenChange(false);
  });

  if (!assignment) return null;

  const handleDelete = () => {
    deleteMutation.mutate(assignment.id);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-destructive/10 text-destructive">
              <AlertTriangle className="h-5 w-5" />
            </div>
            <div>
              <DialogTitle className="text-lg font-bold text-foreground">
                Delete Assignment
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                Permanently remove this assignment, all student submissions, and cloud assets.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-3 py-3">
          <div className="rounded-lg border border-border bg-muted/40 p-3 space-y-1.5">
            <div className="flex items-center gap-2">
              <Badge className="font-mono text-[10px] bg-primary text-primary-foreground font-bold">
                {assignment.courseId}
              </Badge>
              {assignment.submissionCount !== undefined && (
                <Badge variant="outline" className="text-[10px]">
                  {assignment.submissionCount} Submission{assignment.submissionCount === 1 ? '' : 's'}
                </Badge>
              )}
            </div>
            <p className="font-bold text-sm text-foreground break-words">
              {assignment.title}
            </p>
          </div>

          <div className="rounded-md bg-destructive/10 p-3 text-xs text-destructive flex items-start gap-2">
            <Trash2 className="h-4 w-4 shrink-0 mt-0.5" />
            <span>
              Are you sure? This action is irreversible. All student submissions and the Google Drive submission folder will be permanently purged via the background queue.
            </span>
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={deleteMutation.isPending}
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={handleDelete}
            disabled={deleteMutation.isPending}
            className="gap-2"
          >
            {deleteMutation.isPending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Deleting...
              </>
            ) : (
              <>
                <Trash2 className="h-4 w-4" />
                Delete Assignment
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

