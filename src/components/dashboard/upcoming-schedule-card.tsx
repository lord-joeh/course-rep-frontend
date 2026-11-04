import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Link } from 'react-router-dom';
import type { Event } from '@/types/event.types';
import { Calendar, Clock, MapPin, ChevronRight, Inbox } from 'lucide-react';
import { format, parseISO } from 'date-fns';

interface UpcomingScheduleCardProps {
  events: Event[];
  isLoading?: boolean;
  viewAllHref: string;
}

export function UpcomingScheduleCard({
  events,
  isLoading,
  viewAllHref,
}: UpcomingScheduleCardProps) {
  const safeEvents = Array.isArray(events) ? events : [];

  return (
    <Card className="border border-border bg-card shadow-xs flex flex-col justify-between">
      <CardHeader className="p-4 sm:p-5 pb-3 flex flex-row items-center justify-between space-y-0">
        <CardTitle className="text-sm sm:text-base font-bold text-foreground flex items-center gap-2">
          <Calendar className="w-4 h-4 text-primary" />
          Today's Schedule & Up Next
        </CardTitle>
        <Link
          to={viewAllHref}
          className="text-xs text-primary hover:underline flex items-center gap-0.5 font-medium"
        >
          <span>View Timetable</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </Link>
      </CardHeader>

      <CardContent className="p-4 sm:p-5 pt-0">
        {isLoading ? (
          <div className="space-y-3 py-2 animate-pulse">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 rounded-lg border border-border bg-muted/40" />
            ))}
          </div>
        ) : safeEvents.length === 0 ? (
          <div className="py-8 text-center rounded-lg border border-dashed border-border bg-muted/10 space-y-2">
            <Inbox className="w-7 h-7 text-muted-foreground/50 mx-auto" />
            <p className="text-xs font-medium text-foreground">No upcoming classes scheduled</p>
            <p className="text-[11px] text-muted-foreground">
              You have no pending lectures or timetable events for today.
            </p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {safeEvents.slice(0, 4).map((evt) => {
              const startDate = evt.startDate ? parseISO(evt.startDate) : null;
              const endDate = evt.endDate ? parseISO(evt.endDate) : null;

              return (
                <div
                  key={evt.id}
                  className="flex items-start justify-between gap-3 p-3 rounded-lg border border-border bg-muted/20 hover:bg-muted/40 transition-colors"
                >
                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-bold text-foreground truncate block">
                        {evt.title}
                      </span>
                      {evt.course?.id && (
                        <Badge variant="outline" className="text-[10px] font-mono px-1.5 py-0">
                          {evt.course.id}
                        </Badge>
                      )}
                    </div>

                    <div className="flex items-center gap-3 text-[11px] text-muted-foreground flex-wrap">
                      {startDate && (
                        <span className="flex items-center gap-1 font-mono">
                          <Clock className="w-3 h-3 text-primary" />
                          {format(startDate, 'h:mm a')}
                          {endDate && ` - ${format(endDate, 'h:mm a')}`}
                        </span>
                      )}

                      {evt.venue && (
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-muted-foreground" />
                          <span className="truncate max-w-[140px]">{evt.venue}</span>
                        </span>
                      )}
                    </div>
                  </div>

                  <Badge variant="secondary" className="text-[10px] capitalize shrink-0 font-medium">
                    {evt.eventType || 'Lecture'}
                  </Badge>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

