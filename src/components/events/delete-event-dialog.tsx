import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useDeleteEventMutation, useDeleteSeriesMutation } from '@/hooks/use-events';
import type { Event } from '@/types';
import { Trash2, AlertCircle } from 'lucide-react';

interface DeleteEventDialogProps {
  event: Event | null;
  isOpen: boolean;
  onClose: () => void;
}

export function DeleteEventDialog({ event, isOpen, onClose }: DeleteEventDialogProps) {
  const deleteEventMutation = useDeleteEventMutation();
  const deleteSeriesMutation = useDeleteSeriesMutation();

  const [deleteEntireSeries, setDeleteEntireSeries] = useState(false);

  const isSeriesMember = Boolean(event?.isRecurring || event?.recurrenceSeriesId);

  const handleConfirmDelete = async () => {
    if (!event) return;
    try {
      if (deleteEntireSeries && event.recurrenceSeriesId) {
        await deleteSeriesMutation.mutateAsync(event.recurrenceSeriesId);
      } else {
        await deleteEventMutation.mutateAsync(event.id);
      }
      onClose();
    } catch {
      // Handled by mutation toast
    }
  };

  const isPending = deleteEventMutation.isPending || deleteSeriesMutation.isPending;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-100 dark:bg-red-950/60 mb-2">
            <Trash2 className="h-6 w-6 text-destructive" />
          </div>
          <DialogTitle className="text-center text-lg font-bold">
            Permanently Delete Event
          </DialogTitle>
          <DialogDescription className="text-center text-sm">
            Are you sure you want to delete{' '}
            <span className="font-semibold text-foreground">"{event?.title}"</span>? This action
            cannot be undone.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 py-2 text-sm">
          <div className="flex items-start gap-2.5 p-3 rounded-md bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/40 text-red-900 dark:text-red-200 text-xs">
            <AlertCircle className="w-4 h-4 text-destructive shrink-0 mt-0.5" />
            <div>
              This will completely remove this event from the academic database. Students will no
              longer see this booking.
            </div>
          </div>

          {isSeriesMember && event?.recurrenceSeriesId && (
            <div className="p-3 bg-zinc-50 dark:bg-zinc-900 border border-border rounded-md space-y-2">
              <label className="flex items-center gap-2 cursor-pointer font-medium text-xs text-foreground">
                <input
                  type="checkbox"
                  checked={deleteEntireSeries}
                  onChange={(e) => setDeleteEntireSeries(e.target.checked)}
                  className="rounded border-input text-destructive focus:ring-destructive"
                />
                Delete entire recurring series (all occurrences)
              </label>
              <p className="text-[11px] text-muted-foreground pl-5">
                If checked, every past and future scheduled date in this recurring timetable will
                be permanently removed.
              </p>
            </div>
          )}
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button type="button" variant="outline" onClick={onClose} disabled={isPending}>
            Keep Event
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={handleConfirmDelete}
            disabled={isPending}
          >
            {isPending ? 'Deleting...' : deleteEntireSeries ? 'Delete Entire Series' : 'Delete Event'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
