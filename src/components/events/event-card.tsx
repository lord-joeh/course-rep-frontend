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
    badgeClass: 'bg-blue-100 text-blue-900 dark:bg-blue-950 dark:text-blue-200 border-blue-200',
    icon: BookOpen,
  },
  tutorial: {
    label: 'Tutorial',
    badgeClass: 'bg-cyan-100 text-cyan-900 dark:bg-cyan-950 dark:text-cyan-200 border-cyan-200',
    icon: GraduationCap,
  },
  exam: {
    label: 'Exam',
    badgeClass: 'bg-red-100 text-red-900 dark:bg-red-950 dark:text-red-200 border-red-200 font-semibold',
    icon: AlertCircle,
  },
  deadline: {
    label: 'Deadline',
    badgeClass: 'bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-200 border-amber-200 font-semibold',
    icon: Clock,
  },
  meeting: {
    label: 'Meeting',
    badgeClass: 'bg-purple-100 text-purple-900 dark:bg-purple-950 dark:text-purple-200 border-purple-200',
    icon: Users,
  },
  seminar: {
    label: 'Seminar',
    badgeClass: 'bg-emerald-100 text-emerald-900 dark:bg-emerald-950 dark:text-emerald-200 border-emerald-200',
    icon: Sparkles,
  },
  other: {
    label: 'Other',
    badgeClass: 'bg-zinc-100 text-zinc-900 dark:bg-zinc-800 dark:text-zinc-200 border-zinc-200',
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
        event.isCancelled ? 'opacity-70 bg-zinc-50/50 dark:bg-zinc-900/50 border-red-200 dark:border-red-900/40' : ''
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
