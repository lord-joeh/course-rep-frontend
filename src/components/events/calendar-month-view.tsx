import { useState } from 'react';
import type { Event } from '@/types';
import { EVENT_TYPE_CONFIG } from './event-card';
import { Button } from '@/components/ui/button';
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  isToday,
  addMonths,
  subMonths,
} from 'date-fns';
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react';

interface CalendarMonthViewProps {
  events: Event[];
  onSelectEvent: (event: Event) => void;
  onSelectDate?: (date: Date) => void;
  isRep?: boolean;
}

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export function CalendarMonthView({
  events,
  onSelectEvent,
  onSelectDate,
  isRep = false,
}: CalendarMonthViewProps) {
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date());

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(monthStart);
  const startDate = startOfWeek(monthStart);
  const endDate = endOfWeek(monthEnd);

  const days = eachDayOfInterval({ start: startDate, end: endDate });

  const prevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));
  const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));
  const goToToday = () => setCurrentMonth(new Date());

  return (
    <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden" data-testid="calendar-month-view">
      {/* Month Navigation Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-4 border-b border-border bg-zinc-50/50 dark:bg-zinc-900/50">
        <div className="flex items-center gap-2">
          <h2 className="text-lg font-bold text-foreground">
            {format(currentMonth, 'MMMM yyyy')}
          </h2>
          <Button
            variant="outline"
            size="sm"
            onClick={goToToday}
            className="h-7 text-xs px-2.5 font-medium ml-2"
          >
            Today
          </Button>
        </div>

        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={prevMonth}
            className="h-8 w-8 p-0"
            aria-label="Previous month"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={nextMonth}
            className="h-8 w-8 p-0"
            aria-label="Next month"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Weekday Headers */}
      <div className="grid grid-cols-7 border-b border-border bg-muted/40 text-center text-xs font-semibold text-muted-foreground py-2">
        {WEEKDAYS.map((day) => (
          <div key={day} className="tracking-wide">
            {day}
          </div>
        ))}
      </div>

      {/* Days Grid */}
      <div className="grid grid-cols-7 divide-x divide-y divide-border/60">
        {days.map((day) => {
          const isCurrentMonth = isSameMonth(day, currentMonth);
          const isCurrentDay = isToday(day);

          // Get events matching this date
          const dayEvents = events.filter((e) => isSameDay(new Date(e.startDate), day));

          return (
            <div
              key={day.toISOString()}
              className={`min-h-[110px] p-1.5 transition-colors flex flex-col group relative ${
                !isCurrentMonth ? 'bg-zinc-50/40 dark:bg-zinc-950/40 text-muted-foreground/60' : 'bg-card'
              }`}
            >
              {/* Day Header */}
              <div className="flex items-center justify-between mb-1">
                <span
                  className={`inline-flex items-center justify-center text-xs font-medium w-6 h-6 rounded-full ${
                    isCurrentDay
                      ? 'bg-primary text-primary-foreground font-bold'
                      : isCurrentMonth
                      ? 'text-foreground'
                      : 'text-muted-foreground'
                  }`}
                >
                  {format(day, 'd')}
                </span>

                {isRep && onSelectDate && (
                  <button
                    type="button"
                    onClick={() => onSelectDate(day)}
                    className="opacity-0 group-hover:opacity-100 p-0.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-opacity"
                    title={`Schedule event on ${format(day, 'MMM d')}`}
                    aria-label={`Schedule event on ${format(day, 'MMM d')}`}
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Event Chips List */}
              <div className="space-y-1 flex-1 overflow-y-auto max-h-[90px] pr-0.5">
                {dayEvents.map((event) => {
                  const typeConfig =
                    EVENT_TYPE_CONFIG[event.eventType] || EVENT_TYPE_CONFIG.other;
                  const timeStr = format(new Date(event.startDate), 'h:mm a');

                  return (
                    <button
                      key={event.id}
                      type="button"
                      onClick={() => onSelectEvent(event)}
                      className={`w-full text-left px-1.5 py-0.5 rounded text-[11px] truncate flex items-center gap-1 border transition-all ${
                        event.isCancelled
                          ? 'bg-red-50 text-red-700 dark:bg-red-950/60 dark:text-red-300 border-red-200 line-through opacity-70'
                          : `${typeConfig.badgeClass} hover:opacity-85 shadow-xs`
                      }`}
                      title={`${event.title} (${timeStr})`}
                    >
                      <span className="font-semibold shrink-0 text-[10px]">{timeStr}</span>
                      <span className="truncate">{event.title}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
