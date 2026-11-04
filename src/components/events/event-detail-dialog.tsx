import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type { Event } from '@/types';
import { EVENT_TYPE_CONFIG } from './event-card';
import { downloadEventIcs } from '@/lib/ics-export';
import { format, differenceInMinutes } from 'date-fns';
import {
  Calendar,
  Clock,
  MapPin,
  Video,
  Repeat,
  ExternalLink,
  CalendarPlus,
  BookOpen,
} from 'lucide-react';

interface EventDetailDialogProps {
  event: Event | null;
  isOpen: boolean;
  onClose: () => void;
  isRep?: boolean;
  onEdit?: (event: Event) => void;
  onCancel?: (event: Event) => void;
}

export function EventDetailDialog({
  event,
  isOpen,
  onClose,
  isRep = false,
  onEdit,
  onCancel,
}: EventDetailDialogProps) {
  if (!event) return null;

  const typeConfig = EVENT_TYPE_CONFIG[event.eventType] || EVENT_TYPE_CONFIG.other;
  const TypeIcon = typeConfig.icon;

  const startDate = new Date(event.startDate);
  const endDate = new Date(event.endDate);

  const durationMin = differenceInMinutes(endDate, startDate);
  const durationStr =
    durationMin >= 60
      ? `${Math.floor(durationMin / 60)}h ${durationMin % 60 > 0 ? `${durationMin % 60}m` : ''}`
      : `${durationMin} mins`;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader className="space-y-2">
          <div className="flex flex-wrap items-center gap-1.5">
            <Badge variant="outline" className={`gap-1 text-xs px-2 py-0.5 border ${typeConfig.badgeClass}`}>
              <TypeIcon className="w-3 h-3" />
              {typeConfig.label}
            </Badge>

            {event.course && (
              <Badge variant="secondary" className="text-xs px-2 py-0.5 font-mono">
                {event.course.name || event.course.id}
              </Badge>
            )}

            {event.isRecurring && (
              <Badge variant="outline" className="text-xs px-2 py-0.5 gap-1 text-muted-foreground border-border">
                <Repeat className="w-3 h-3" />
                {event.recurrenceFrequency || 'Recurring'}
              </Badge>
            )}

            {event.isCancelled && (
              <Badge variant="destructive" className="text-xs px-2 py-0.5">
                Cancelled
              </Badge>
            )}
          </div>

          <DialogTitle className={`text-xl font-bold leading-tight ${event.isCancelled ? 'line-through text-muted-foreground' : 'text-foreground'}`}>
            {event.title}
          </DialogTitle>
          {event.course && (
            <DialogDescription className="text-xs font-mono text-muted-foreground">
              Course Code: {event.course.id}
            </DialogDescription>
          )}
        </DialogHeader>

        <div className="space-y-4 py-2 text-sm">
          <div className="rounded-lg border border-border bg-muted/40 p-3.5 space-y-2.5">
            <div className="flex items-center gap-2 text-xs">
              <Calendar className="w-4 h-4 text-primary shrink-0" />
              <span className="font-semibold text-foreground">
                {format(startDate, 'EEEE, MMMM d, yyyy')}
              </span>
            </div>

            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Clock className="w-4 h-4 shrink-0" />
              <span>
                {format(startDate, 'h:mm a')} - {format(endDate, 'h:mm a')} ({durationStr})
              </span>
            </div>

            <div className="flex items-center gap-2 text-xs">
              <MapPin className="w-4 h-4 text-primary shrink-0" />
              <span className="font-medium text-foreground">{event.venue}</span>
            </div>

            {event.course && (
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <BookOpen className="w-4 h-4 shrink-0" />
                <span>{event.course.name}</span>
              </div>
            )}
          </div>

          {event.meetingLink && (
            <div className="flex items-center justify-between p-3 rounded-md bg-blue-500/10 border border-blue-500/20 text-blue-600 dark:text-blue-400">
              <div className="flex items-center gap-2 text-xs min-w-0">
                <Video className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
                <span className="font-medium truncate text-foreground">{event.meetingLink}</span>
              </div>
              <a
                href={event.meetingLink}
                target="_blank"
                rel="noreferrer"
                className="shrink-0"
              >
                <Button size="sm" className="h-7 text-xs gap-1">
                  Join <ExternalLink className="w-3 h-3" />
                </Button>
              </a>
            </div>
          )}

          {event.description ? (
            <div className="space-y-1">
              <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Event Description
              </h4>
              <p className="text-xs text-foreground whitespace-pre-wrap leading-relaxed">
                {event.description}
              </p>
            </div>
          ) : (
            <p className="text-xs text-muted-foreground italic">No additional notes provided.</p>
          )}

          {event.isRecurring && (
            <div className="text-xs text-muted-foreground border-t border-border pt-2 flex items-center gap-1.5">
              <Repeat className="w-3.5 h-3.5" />
              <span>Part of a recurring schedule ({event.recurrenceFrequency || 'regular'})</span>
            </div>
          )}
        </div>

        <DialogFooter className="flex-wrap items-center justify-between gap-2 pt-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="gap-1.5 text-xs"
            onClick={() => downloadEventIcs(event)}
          >
            <CalendarPlus className="w-3.5 h-3.5" />
            Add to My Calendar (.ics)
          </Button>

          <div className="flex items-center gap-2">
            {isRep && onEdit && (
              <Button
                type="button"
                variant="secondary"
                size="sm"
                className="text-xs"
                onClick={() => {
                  onClose();
                  onEdit(event);
                }}
              >
                Edit
              </Button>
            )}
            {isRep && onCancel && !event.isCancelled && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="text-xs text-amber-600 hover:text-amber-700 dark:text-amber-400"
                onClick={() => {
                  onClose();
                  onCancel(event);
                }}
              >
                Cancel
              </Button>
            )}
            <Button type="button" variant="default" size="sm" className="text-xs" onClick={onClose}>
              Close
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

