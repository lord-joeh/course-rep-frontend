import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type { Event, EventType } from '@/types';
import { downloadEventIcs } from '@/lib/ics-export';
import {
  BookOpen,
  GraduationCap,
  AlertCircle,
  Clock,
  Users,
  Sparkles,
  Calendar,
  MapPin,
  Repeat,
  Video,
  CalendarPlus,
  MoreVertical,
  Pencil,
  Ban,
  Trash2,
  ExternalLink,
} from 'lucide-react';
import { format } from 'date-fns';

export const EVENT_TYPE_CONFIG: Record<
  EventType,
  { label: string; badgeClass: string; icon: any }
> = {
  lecture: {
    label: 'Lecture',
    badgeClass: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20',
    icon: BookOpen,
  },
  tutorial: {
    label: 'Tutorial',
    badgeClass: 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border-cyan-500/20',
    icon: GraduationCap,
  },
  exam: {
    label: 'Exam',
    badgeClass: 'bg-destructive/10 text-destructive border-destructive/20 font-semibold',
    icon: AlertCircle,
  },
  deadline: {
    label: 'Deadline',
    badgeClass: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20 font-semibold',
    icon: Clock,
  },
  meeting: {
    label: 'Meeting',
    badgeClass: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20',
    icon: Users,
  },
  seminar: {
    label: 'Seminar',
    badgeClass: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
    icon: Sparkles,
  },
  other: {
    label: 'Other',
    badgeClass: 'bg-muted text-muted-foreground border-border',
    icon: Calendar,
  },
};

interface EventCardProps {
  event: Event;
  isRep?: boolean;
  onViewDetail: (event: Event) => void;
  onEdit?: (event: Event) => void;
  onCancel?: (event: Event) => void;
  onDelete?: (event: Event) => void;
}

export function EventCard({
  event,
  isRep = false,
  onViewDetail,
  onEdit,
  onCancel,
  onDelete,
}: EventCardProps) {
  const typeConfig = EVENT_TYPE_CONFIG[event.eventType] || EVENT_TYPE_CONFIG.other;
  const TypeIcon = typeConfig.icon;

  const startDate = new Date(event.startDate);
  const endDate = new Date(event.endDate);

  const formattedDate = format(startDate, 'EEE, MMM d, yyyy');
  const formattedTime = `${format(startDate, 'h:mm a')} - ${format(endDate, 'h:mm a')}`;

  const handleDownloadIcs = (e: React.MouseEvent) => {
    e.stopPropagation();
    downloadEventIcs(event);
  };

  return (
    <Card
      className={`flex flex-col justify-between hover:shadow-md transition-shadow border-border bg-card cursor-pointer ${
        event.isCancelled ? 'opacity-75 bg-muted/30 border-destructive/20' : ''
      }`}
      onClick={() => onViewDetail(event)}
      data-testid={`event-card-${event.id}`}
    >
      <CardHeader className="p-5 pb-3">
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1.5 flex-1 min-w-0">
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
                  {event.recurrenceFrequency ? `${event.recurrenceFrequency}` : 'Recurring'}
                </Badge>
              )}

              {event.isCancelled && (
                <Badge variant="destructive" className="text-xs px-2 py-0.5">
                  Cancelled
                </Badge>
              )}
            </div>

            <CardTitle className={`text-base font-semibold leading-tight line-clamp-1 ${event.isCancelled ? 'line-through text-muted-foreground' : 'text-foreground'}`}>
              {event.title}
            </CardTitle>

            {event.description && (
              <CardDescription className="text-xs text-muted-foreground line-clamp-2">
                {event.description}
              </CardDescription>
            )}
          </div>

          {isRep && (
            <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0" aria-label="Event options">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  {onEdit && (
                    <DropdownMenuItem onClick={() => onEdit(event)}>
                      <Pencil className="mr-2 h-4 w-4" />
                      Edit Event
                    </DropdownMenuItem>
                  )}
                  {onCancel && !event.isCancelled && (
                    <DropdownMenuItem onClick={() => onCancel(event)} className="text-amber-600 dark:text-amber-400">
                      <Ban className="mr-2 h-4 w-4" />
                      Cancel Event
                    </DropdownMenuItem>
                  )}
                  {onDelete && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => onDelete(event)} className="text-destructive">
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete Event
                      </DropdownMenuItem>
                    </>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          )}
        </div>
      </CardHeader>

      <CardContent className="p-5 pt-0 space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-muted-foreground pt-2 border-t border-border">
          <div className="flex items-center gap-1.5 min-w-0">
            <Calendar className="w-3.5 h-3.5 shrink-0 text-foreground" />
            <span className="font-medium text-foreground truncate">{formattedDate}</span>
          </div>

          <div className="flex items-center gap-1.5 min-w-0">
            <Clock className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">{formattedTime}</span>
          </div>

          <div className="flex items-center gap-1.5 min-w-0 sm:col-span-2">
            <MapPin className="w-3.5 h-3.5 shrink-0 text-primary" />
            <span className="truncate font-medium text-foreground">{event.venue}</span>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 pt-2" onClick={(e) => e.stopPropagation()}>
          <div className="flex items-center gap-2">
            {event.meetingLink && (
              <a
                href={event.meetingLink}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-xs text-primary hover:underline font-medium"
              >
                <Video className="w-3.5 h-3.5" />
                Join Online
                <ExternalLink className="w-3 h-3" />
              </a>
            )}
          </div>

          <div className="flex items-center gap-2 ml-auto">
            <Button
              variant="outline"
              size="sm"
              className="h-7 text-xs gap-1.5"
              onClick={handleDownloadIcs}
              title="Add to Google Calendar, Apple Calendar or Outlook"
            >
              <CalendarPlus className="w-3.5 h-3.5" />
              .ics Export
            </Button>
            <Button
              variant="secondary"
              size="sm"
              className="h-7 text-xs"
              onClick={() => onViewDetail(event)}
            >
              Details
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

