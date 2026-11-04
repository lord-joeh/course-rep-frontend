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
import { useCancelEventMutation, useCancelSeriesMutation } from '@/hooks/use-events';
import type { Event } from '@/types';
import { Ban, AlertTriangle } from 'lucide-react';

interface CancelEventDialogProps {
  event: Event | null;
  isOpen: boolean;
  onClose: () => void;
}

export function CancelEventDialog({ event, isOpen, onClose }: CancelEventDialogProps) {
  const cancelEventMutation = useCancelEventMutation();
  const cancelSeriesMutation = useCancelSeriesMutation();

  const [cancelEntireSeries, setCancelEntireSeries] = useState(false);

  const isSeriesMember = Boolean(event?.isRecurring || event?.recurrenceSeriesId);

  const handleConfirmCancel = async () => {
    if (!event) return;
    try {
      if (cancelEntireSeries && event.recurrenceSeriesId) {
        await cancelSeriesMutation.mutateAsync(event.recurrenceSeriesId);
      } else {
        await cancelEventMutation.mutateAsync(event.id);
      }
      onClose();
    } catch {
      // Handled by mutation toast
    }
  };

  const isPending = cancelEventMutation.isPending || cancelSeriesMutation.isPending;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-amber-500/10 border border-amber-500/20 mb-2">
            <Ban className="h-6 w-6 text-amber-600 dark:text-amber-400" />
          </div>
          <DialogTitle className="text-center text-lg font-bold">
            Cancel Academic Event
          </DialogTitle>
          <DialogDescription className="text-center text-sm">
            Are you sure you want to cancel{' '}
            <span className="font-semibold text-foreground">"{event?.title}"</span>?
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 py-2 text-sm">
          <div className="flex items-start gap-2.5 p-3 rounded-md bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 text-xs">
            <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
            <div>
              Cancelled events remain visible on student calendars with a cancelled badge so
              students know not to attend.
            </div>
          </div>

          {isSeriesMember && event?.recurrenceSeriesId && (
            <div className="p-3 bg-muted/40 border border-border rounded-md space-y-2">
              <label className="flex items-center gap-2 cursor-pointer font-medium text-xs text-foreground">
                <input
                  type="checkbox"
                  checked={cancelEntireSeries}
                  onChange={(e) => setCancelEntireSeries(e.target.checked)}
                  className="rounded border-input text-amber-600 focus:ring-amber-500"
                />
                Cancel all future occurrences in this recurring series
              </label>
              <p className="text-[11px] text-muted-foreground pl-5">
                If checked, all future scheduled dates in this recurring timetable series will be
                marked as cancelled.
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
            className="bg-amber-600 hover:bg-amber-700 text-white"
            onClick={handleConfirmCancel}
            disabled={isPending}
          >
            {isPending ? 'Cancelling...' : cancelEntireSeries ? 'Cancel Entire Series' : 'Cancel Event'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

