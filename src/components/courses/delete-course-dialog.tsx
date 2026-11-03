import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useDeleteCourseMutation } from '@/hooks/use-courses';
import type { Course } from '@/types';
import { AlertTriangle, Loader2 } from 'lucide-react';

interface DeleteCourseDialogProps {
  course: Course | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function DeleteCourseDialog({
  course,
  open,
  onOpenChange,
}: DeleteCourseDialogProps) {
  const deleteMutation = useDeleteCourseMutation(() => {
    onOpenChange(false);
  });

  const handleDelete = () => {
    if (!course) return;
    deleteMutation.mutate(course.id);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[460px]">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-destructive/10 text-destructive">
              <AlertTriangle className="h-5 w-5" />
            </div>
            <div>
              <DialogTitle>Delete Academic Course</DialogTitle>
              <DialogDescription>
                Confirm deletion of {course?.id} from the institutional system.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-3 py-2 text-sm text-foreground">
          <p>
            Are you sure you want to delete course{' '}
            <strong className="text-foreground">{course?.id} - {course?.name}</strong>?
          </p>

          <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-3 text-xs text-destructive space-y-1">
            <p className="font-semibold flex items-center gap-1.5">
              <AlertTriangle className="h-3.5 w-3.5" />
              Critical Cascade Warning
            </p>
            <p>
              Deleting this course permanently removes all associated slides, assignment submissions,
              attendance sessions, and student enrollment records. This action cannot be undone.
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
                Deleting Course...
              </>
            ) : (
              'Delete Course'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
