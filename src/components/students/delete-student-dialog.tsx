import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useDeleteStudentMutation } from '@/hooks/use-students';
import type { Student } from '@/types';
import { AlertTriangle, Loader2 } from 'lucide-react';

interface DeleteStudentDialogProps {
  student: Student | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDeleted?: () => void;
}

export function DeleteStudentDialog({
  student,
  open,
  onOpenChange,
  onDeleted,
}: DeleteStudentDialogProps) {
  const deleteMutation = useDeleteStudentMutation(() => {
    onOpenChange(false);
    if (onDeleted) onDeleted();
  });

  const handleDelete = () => {
    if (!student) return;
    deleteMutation.mutate(student.id);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-100 dark:bg-red-950 text-destructive mb-2">
            <AlertTriangle className="h-6 w-6" />
          </div>
          <DialogTitle className="text-center text-lg">
            Delete Student Record?
          </DialogTitle>
          <DialogDescription className="text-center text-sm">
            Are you sure you want to permanently delete{' '}
            <span className="font-semibold text-foreground">{student?.name}</span> (ID:{' '}
            <span className="font-mono font-medium text-foreground">{student?.id}</span>)? This action
            removes their course enrollments, attendance history, and submission records.
          </DialogDescription>
        </DialogHeader>

        <DialogFooter className="sm:justify-center gap-2 pt-2">
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
            {deleteMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Confirm Deletion
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

