import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useDeleteFeedbackMutation } from '@/hooks/use-feedback';
import type { Feedback } from '@/types';
import { AlertTriangle, Loader2 } from 'lucide-react';

interface DeleteFeedbackDialogProps {
  feedback: Feedback | null;
  isOpen: boolean;
  onClose: () => void;
}

export function DeleteFeedbackDialog({
  feedback,
  isOpen,
  onClose,
}: DeleteFeedbackDialogProps) {
  const deleteMutation = useDeleteFeedbackMutation();

  if (!feedback) return null;

  const handleDelete = async () => {
    try {
      await deleteMutation.mutateAsync(feedback.id);
      onClose();
    } catch {
      // Toast handled by mutation
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md w-full p-4 sm:p-6 space-y-3">
        <DialogHeader className="space-y-2">
          <div className="flex items-center gap-2 text-destructive">
            <div className="w-9 h-9 rounded-full bg-destructive/10 flex items-center justify-center shrink-0">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <DialogTitle className="text-base sm:text-lg font-bold">
              Permanently Delete Feedback?
            </DialogTitle>
          </div>
          <DialogDescription className="text-xs sm:text-sm">
            Are you sure you want to delete this feedback entry? This action cannot be undone.
          </DialogDescription>
        </DialogHeader>

        <div className="rounded-lg border border-border bg-muted/30 p-3 space-y-1 text-xs">
          <div className="font-semibold text-foreground line-clamp-1">{feedback.title}</div>
          <p className="text-muted-foreground line-clamp-2">{feedback.content}</p>
        </div>

        <DialogFooter className="gap-2 sm:gap-0 pt-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onClose}
            disabled={deleteMutation.isPending}
            className="text-xs h-9"
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="destructive"
            size="sm"
            onClick={handleDelete}
            disabled={deleteMutation.isPending}
            className="gap-1.5 text-xs h-9"
          >
            {deleteMutation.isPending ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Deleting...</span>
              </>
            ) : (
              <span>Confirm Delete</span>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

