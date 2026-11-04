import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useDeleteGroupMutation } from '@/hooks/use-groups';
import type { Group } from '@/types';
import { AlertTriangle, Loader2 } from 'lucide-react';

interface DeleteGroupDialogProps {
  group: Group | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function DeleteGroupDialog({
  group,
  open,
  onOpenChange,
  onSuccess,
}: DeleteGroupDialogProps) {
  const deleteMutation = useDeleteGroupMutation(() => {
    onOpenChange(false);
    if (onSuccess) onSuccess();
  });

  const handleDelete = () => {
    if (!group) return;
    deleteMutation.mutate(group.id);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md bg-card text-card-foreground p-6 border border-border shadow-xl">
        <DialogHeader className="space-y-1">
          <div className="flex items-center gap-2 text-destructive">
            <div className="w-8 h-8 rounded bg-destructive/10 flex items-center justify-center">
              <AlertTriangle className="w-4 h-4" />
            </div>
            <DialogTitle className="text-xl font-bold tracking-tight">
              Delete Study Group
            </DialogTitle>
          </div>
          <DialogDescription className="text-xs text-muted-foreground pt-1">
            Are you sure you want to delete{' '}
            <span className="font-semibold text-foreground">
              &ldquo;{group?.name}&rdquo;
            </span>
            ? This action cannot be undone and will disband the study group and remove all member
            associations.
          </DialogDescription>
        </DialogHeader>

        <DialogFooter className="pt-4">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onOpenChange(false)}
            disabled={deleteMutation.isPending}
            className="text-xs border-border"
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="destructive"
            size="sm"
            onClick={handleDelete}
            disabled={deleteMutation.isPending}
            className="text-xs font-semibold"
            data-testid="confirm-delete-group-btn"
          >
            {deleteMutation.isPending ? (
              <>
                <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                Deleting...
              </>
            ) : (
              'Delete Group'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

