import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useDeleteLecturerMutation } from '@/hooks/use-lecturers';
import type { Lecturer } from '@/types';
import { AlertTriangle, Loader2 } from 'lucide-react';

interface DeleteLecturerDialogProps {
  lecturer: Lecturer | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function DeleteLecturerDialog({
  lecturer,
  open,
  onOpenChange,
}: DeleteLecturerDialogProps) {
  const deleteMutation = useDeleteLecturerMutation(() => {
    onOpenChange(false);
  });

  const handleDelete = () => {
    if (!lecturer) return;
    deleteMutation.mutate(lecturer.id);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[440px]">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-destructive/10 text-destructive">
              <AlertTriangle className="h-5 w-5" />
            </div>
            <div>
              <DialogTitle>Remove Faculty Member</DialogTitle>
              <DialogDescription>
                Confirm deletion of this lecturer from the system.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-3 py-2 text-sm text-foreground">
          <p>
            Are you sure you want to delete{' '}
            <strong className="text-foreground">{lecturer?.name || 'this faculty member'}</strong>?
          </p>

          <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-3 text-xs text-destructive space-y-1">
            <p className="font-semibold flex items-center gap-1.5">
              <AlertTriangle className="h-3.5 w-3.5" />
              Cascade Warning
            </p>
            <p>
              Courses associated with this faculty member will lose their assigned instructor. This
              action is permanent and cannot be undone.
            </p>
          </div>
        </div>

        <DialogFooter className="pt-2">
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
          >
            {deleteMutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Deleting...
              </>
            ) : (
              'Delete Faculty Member'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

