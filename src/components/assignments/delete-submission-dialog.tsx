import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useDeleteSubmissionMutation } from '@/hooks/use-assignments';
import { Trash2, AlertTriangle, Loader2 } from 'lucide-react';

interface DeleteSubmissionDialogProps {
  submissionId: string | null;
  fileName?: string | null;
  assignmentTitle?: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function DeleteSubmissionDialog({
  submissionId,
  fileName,
  assignmentTitle,
  open,
  onOpenChange,
}: DeleteSubmissionDialogProps) {
  const deleteMutation = useDeleteSubmissionMutation(() => {
    onOpenChange(false);
  });

  if (!submissionId) return null;

  const handleDelete = () => {
    deleteMutation.mutate(submissionId);
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
                Withdraw Submission
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                Delete your submitted solution file before the deadline.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-3 py-3">
          <div className="rounded-lg border border-border bg-muted/40 p-3 space-y-1">
            <p className="text-xs text-muted-foreground">Assignment:</p>
            <p className="font-semibold text-sm text-foreground">
              {assignmentTitle || 'Course Assignment'}
            </p>
            {fileName && (
              <p className="text-xs font-mono text-muted-foreground pt-1 truncate">
                File: {fileName}
              </p>
            )}
          </div>

          <div className="rounded-md bg-destructive/10 p-3 text-xs text-destructive flex items-start gap-2">
            <Trash2 className="h-4 w-4 shrink-0 mt-0.5" />
            <span>
              Are you sure you want to withdraw your submission? Your file will be deleted from cloud storage. You may submit a new file anytime before the deadline.
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
                Withdrawing...
              </>
            ) : (
              <>
                <Trash2 className="h-4 w-4" />
                Withdraw Submission
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
