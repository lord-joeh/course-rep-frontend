import { useState, useMemo } from 'react';
import { useAuthStore } from '@/lib/auth-store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useEventsQuery, useUpcomingEventsQuery } from '@/hooks/use-events';
import { useCoursesQuery } from '@/hooks/use-courses';
import { EventCard, EVENT_TYPE_CONFIG } from '@/components/events/event-card';
import { CreateEventDialog } from '@/components/events/create-event-dialog';
import { EditEventDialog } from '@/components/events/edit-event-dialog';
import { CancelEventDialog } from '@/components/events/cancel-event-dialog';
import { DeleteEventDialog } from '@/components/events/delete-event-dialog';
import { EventDetailDialog } from '@/components/events/event-detail-dialog';
import { CalendarMonthView } from '@/components/events/calendar-month-view';
import type { Event, EventType } from '@/types';
import {
  Calendar as CalendarIcon,
  Clock,
  Search,
  Plus,
  RefreshCw,
  LayoutGrid,
  List,
  Sparkles,
  MapPin,
} from 'lucide-react';
import {
  isToday,
  isTomorrow,
  isThisWeek,
  isPast,
  format,
} from 'date-fns';

export function EventsPage() {
  const { user } = useAuthStore();
  const isRep = Boolean(user?.isRep);

  // View States
  const [viewMode, setViewMode] = useState<'calendar' | 'agenda'>('calendar');
  const [search, setSearch] = useState('');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [selectedCourse, setSelectedCourse] = useState<string>('all');

  // Dialog States
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [createDefaultDate, setCreateDefaultDate] = useState<Date | undefined>(undefined);
  const [selectedEventDetail, setSelectedEventDetail] = useState<Event | null>(null);
  const [eventToEdit, setEventToEdit] = useState<Event | null>(null);
  const [eventToCancel, setEventToCancel] = useState<Event | null>(null);
  const [eventToDelete, setEventToDelete] = useState<Event | null>(null);

  // Queries
  const {
    data: eventsData,
    isLoading,
    refetch,
    isRefetching,
  } = useEventsQuery({
    limit: 100,
    search: search.trim() || undefined,
    eventType: selectedType !== 'all' ? (selectedType as EventType) : undefined,
    courseId:
      selectedCourse !== 'all' && selectedCourse !== 'general' ? selectedCourse : undefined,
    isGeneral: selectedCourse === 'general' ? true : undefined,
  });

  const { data: upcomingEvents = [] } = useUpcomingEventsQuery(4);
  const { data: coursesData } = useCoursesQuery({ limit: 100 });
  const courses = coursesData?.items || [];

  const rawEvents = eventsData?.items || [];

  // Local Client Filtering
  const filteredEvents = useMemo(() => {
    let result = [...rawEvents];

    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (e) =>
          e.title.toLowerCase().includes(q) ||
          e.venue.toLowerCase().includes(q) ||
          (e.description && e.description.toLowerCase().includes(q)) ||
          (e.course && e.course.name.toLowerCase().includes(q)) ||
          (e.course && e.course.id.toLowerCase().includes(q)),
      );
    }

    if (selectedType !== 'all') {
      result = result.filter((e) => e.eventType === selectedType);
    }

    if (selectedCourse === 'general') {
      result = result.filter((e) => !e.courseId);
    } else if (selectedCourse !== 'all') {
      result = result.filter((e) => e.courseId === selectedCourse);
    }

    return result.sort(
      (a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime(),
    );
  }, [rawEvents, search, selectedType, selectedCourse]);

  // Grouped Agenda Items
  const agendaGroups = useMemo(() => {
    const todayGroup: Event[] = [];
    const tomorrowGroup: Event[] = [];
    const thisWeekGroup: Event[] = [];
    const upcomingGroup: Event[] = [];
    const pastGroup: Event[] = [];

    filteredEvents.forEach((ev) => {
      const start = new Date(ev.startDate);
      const end = new Date(ev.endDate);

      if (isPast(end) && !isToday(start)) {
        pastGroup.push(ev);
      } else if (isToday(start)) {
        todayGroup.push(ev);
      } else if (isTomorrow(start)) {
        tomorrowGroup.push(ev);
      } else if (isThisWeek(start)) {
        thisWeekGroup.push(ev);
      } else {
        upcomingGroup.push(ev);
      }
    });

    return [
      { title: 'Today', events: todayGroup },
      { title: 'Tomorrow', events: tomorrowGroup },
      { title: 'This Week', events: thisWeekGroup },
      { title: 'Upcoming Events', events: upcomingGroup },
      { title: 'Past Events', events: pastGroup },
    ].filter((g) => g.events.length > 0);
  }, [filteredEvents]);

  const handleOpenCreateOnDate = (date: Date) => {
    setCreateDefaultDate(date);
    setIsCreateOpen(true);
  };

  const handleOpenStandardCreate = () => {
    setCreateDefaultDate(undefined);
    setIsCreateOpen(true);
  };

  return (
    <div className="space-y-6 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <CalendarIcon className="w-7 h-7 text-primary shrink-0" />
            Academic Calendar & Timetable
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Master schedule for lectures, tutorials, deadlines, exams, and cohort meetings.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            disabled={isRefetching}
            className="h-9 gap-1.5"
            aria-label="Refresh timetable"
          >
            <RefreshCw className={`w-4 h-4 ${isRefetching ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Refresh</span>
          </Button>

          {isRep && (
            <Button
              size="sm"
              onClick={handleOpenStandardCreate}
              className="h-9 gap-1.5 shadow-sm"
            >
              <Plus className="w-4 h-4" />
              Schedule Event
            </Button>
          )}
        </div>
      </div>

      {/* Upcoming Highlights Strip */}
      {upcomingEvents.length > 0 && (
        <div className="rounded-xl border border-border bg-muted/40 p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              <Sparkles className="w-4 h-4 text-primary" />
              Upcoming in the next 48 hours
            </div>
            <span className="text-xs text-muted-foreground">
              {upcomingEvents.length} session{upcomingEvents.length > 1 ? 's' : ''} queued
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {upcomingEvents.map((evt) => {
              const typeCfg = EVENT_TYPE_CONFIG[evt.eventType] || EVENT_TYPE_CONFIG.other;
              const isUrgent = evt.eventType === 'exam' || evt.eventType === 'deadline';
              return (
                <div
                  key={evt.id}
                  onClick={() => setSelectedEventDetail(evt)}
                  className={`p-3 rounded-lg border bg-card hover:border-primary/50 transition-all cursor-pointer shadow-xs flex flex-col justify-between ${
                    isUrgent
                      ? 'border-destructive/30 bg-destructive/5'
                      : 'border-border'
                  }`}
                >
                  <div className="space-y-1">
                    <div className="flex items-center justify-between gap-1">
                      <Badge
                        variant="outline"
                        className={`text-[10px] px-1.5 py-0 border ${typeCfg.badgeClass}`}
                      >
                        {typeCfg.label}
                      </Badge>
                      <span className="text-[11px] font-medium text-foreground">
                        {format(new Date(evt.startDate), 'EEE, h:mm a')}
                      </span>
                    </div>
                    <h4 className="text-xs font-semibold text-foreground line-clamp-1">
                      {evt.title}
                    </h4>
                  </div>
                  <div className="flex items-center gap-1 text-[11px] text-muted-foreground mt-2 truncate">
                    <MapPin className="w-3 h-3 text-primary shrink-0" />
                    <span className="truncate">{evt.venue}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Filter and View Switcher Toolbar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        {/* Search & Course Selector */}
        <div className="flex flex-wrap items-center gap-2 flex-1">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-2.5" />
            <Input
              placeholder="Search by title, course, or venue..."
              className="pl-9 h-9"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <select
            className="h-9 rounded-md border border-input bg-background px-3 py-1 text-xs shadow-xs focus:outline-none focus:ring-1 focus:ring-ring min-w-[140px]"
            value={selectedCourse}
            onChange={(e) => setSelectedCourse(e.target.value)}
          >
            <option value="all">All Courses</option>
            <option value="general">General / Non-Course Only</option>
            {courses.map((c) => (
              <option key={c.id} value={c.id}>
                {c.id} - {c.name}
              </option>
            ))}
          </select>
        </div>

        {/* View Switcher: Calendar vs Agenda */}
        <div className="flex items-center justify-end gap-1 shrink-0 bg-muted/60 p-0.5 rounded-lg border border-border">
          <Button
            variant={viewMode === 'calendar' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setViewMode('calendar')}
            className="h-8 px-3 text-xs gap-1.5"
          >
            <LayoutGrid className="w-3.5 h-3.5" />
            Calendar Grid
          </Button>
          <Button
            variant={viewMode === 'agenda' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setViewMode('agenda')}
            className="h-8 px-3 text-xs gap-1.5"
          >
            <List className="w-3.5 h-3.5" />
            Agenda Timeline
          </Button>
        </div>
      </div>

      {/* Event Type Filter Pills */}
      <div className="flex flex-wrap items-center gap-1.5 pb-1 border-b border-border">
        <button
          type="button"
          onClick={() => setSelectedType('all')}
          className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
            selectedType === 'all'
              ? 'bg-primary text-primary-foreground'
              : 'bg-muted/60 text-muted-foreground hover:bg-muted'
          }`}
        >
          All Types ({rawEvents.length})
        </button>

        {(
          [
            'lecture',
            'tutorial',
            'exam',
            'deadline',
            'meeting',
            'seminar',
            'other',
          ] as EventType[]
        ).map((type) => {
          const cfg = EVENT_TYPE_CONFIG[type];
          const isSelected = selectedType === type;
          const count = rawEvents.filter((e) => e.eventType === type).length;
          return (
            <button
              key={type}
              type="button"
              onClick={() => setSelectedType(type)}
              className={`px-2.5 py-1 rounded-full text-xs font-medium transition-colors flex items-center gap-1 ${
                isSelected
                  ? 'bg-primary text-primary-foreground font-semibold shadow-xs'
                  : 'bg-muted/40 text-muted-foreground hover:bg-muted hover:text-foreground'
              }`}
            >
              <span>{cfg.label}</span>
              {count > 0 && <span className="text-[10px] opacity-75">({count})</span>}
            </button>
          );
        })}
      </div>

      {/* Content Area */}
      {isLoading ? (
        <div className="py-20 text-center text-sm text-muted-foreground space-y-2">
          <RefreshCw className="w-6 h-6 animate-spin mx-auto text-primary" />
          <p>Loading academic schedule...</p>
        </div>
      ) : filteredEvents.length === 0 ? (
        <div className="py-16 text-center rounded-xl border border-dashed border-border bg-muted/10 space-y-3">
          <CalendarIcon className="w-10 h-10 text-muted-foreground/50 mx-auto" />
          <h3 className="text-base font-semibold text-foreground">No events found</h3>
          <p className="text-xs text-muted-foreground max-w-sm mx-auto">
            {search || selectedType !== 'all' || selectedCourse !== 'all'
              ? 'No scheduled events match your current filter criteria.'
              : 'There are no academic events or timetable bookings scheduled yet.'}
          </p>
          {isRep && (
            <Button size="sm" onClick={handleOpenStandardCreate} className="gap-1 text-xs">
              <Plus className="w-3.5 h-3.5" />
              Schedule First Event
            </Button>
          )}
        </div>
      ) : viewMode === 'calendar' ? (
        <CalendarMonthView
          events={filteredEvents}
          onSelectEvent={(evt) => setSelectedEventDetail(evt)}
          onSelectDate={handleOpenCreateOnDate}
          isRep={isRep}
        />
      ) : (
        /* Agenda Timeline Mode */
        <div className="space-y-6" data-testid="agenda-timeline-view">
          {agendaGroups.map((group) => (
            <div key={group.title} className="space-y-3">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-primary" />
                <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
                  {group.title}
                </h3>
                <div className="flex-1 h-px bg-border/60" />
                <span className="text-xs text-muted-foreground">
                  {group.events.length} event{group.events.length > 1 ? 's' : ''}
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {group.events.map((evt) => (
                  <EventCard
                    key={evt.id}
                    event={evt}
                    isRep={isRep}
                    onViewDetail={(e) => setSelectedEventDetail(e)}
                    onEdit={(e) => setEventToEdit(e)}
                    onCancel={(e) => setEventToCancel(e)}
                    onDelete={(e) => setEventToDelete(e)}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Dialogs */}
      <CreateEventDialog
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        defaultDate={createDefaultDate}
      />

      <EditEventDialog
        event={eventToEdit}
        isOpen={Boolean(eventToEdit)}
        onClose={() => setEventToEdit(null)}
      />

      <CancelEventDialog
        event={eventToCancel}
        isOpen={Boolean(eventToCancel)}
        onClose={() => setEventToCancel(null)}
      />

      <DeleteEventDialog
        event={eventToDelete}
        isOpen={Boolean(eventToDelete)}
        onClose={() => setEventToDelete(null)}
      />

      <EventDetailDialog
        event={selectedEventDetail}
        isOpen={Boolean(selectedEventDetail)}
        onClose={() => setSelectedEventDetail(null)}
        isRep={isRep}
        onEdit={(e) => setEventToEdit(e)}
        onCancel={(e) => setEventToCancel(e)}
      />
    </div>
  );
}
