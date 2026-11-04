import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useCreateEventMutation } from '@/hooks/use-events';
import { useCoursesQuery } from '@/hooks/use-courses';
import { createEventSchema } from '@/lib/event-validation';
import type { EventType, RecurrenceFrequency } from '@/types';
import { format } from 'date-fns';
import { AlertCircle, Calendar, Clock, MapPin, Repeat } from 'lucide-react';

interface CreateEventDialogProps {
  isOpen: boolean;
  onClose: () => void;
  defaultDate?: Date;
}

const DAYS_OF_WEEK = [
  { label: 'Sun', value: 0 },
  { label: 'Mon', value: 1 },
  { label: 'Tue', value: 2 },
  { label: 'Wed', value: 3 },
  { label: 'Thu', value: 4 },
  { label: 'Fri', value: 5 },
  { label: 'Sat', value: 6 },
];

export function CreateEventDialog({
  isOpen,
  onClose,
  defaultDate,
}: CreateEventDialogProps) {
  const { data: coursesData } = useCoursesQuery({ limit: 100 });
  const courses = coursesData?.items || [];

  const createEventMutation = useCreateEventMutation();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [eventType, setEventType] = useState<EventType>('lecture');
  const [courseId, setCourseId] = useState<string>('');
  const [startDateStr, setStartDateStr] = useState('');
  const [endDateStr, setEndDateStr] = useState('');
  const [venue, setVenue] = useState('');
  const [meetingLink, setMeetingLink] = useState('');

  // Recurrence state
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurrenceFrequency, setRecurrenceFrequency] =
    useState<RecurrenceFrequency>('weekly');
  const [recurrenceInterval, setRecurrenceInterval] = useState(1);
  const [recurrenceDaysOfWeek, setRecurrenceDaysOfWeek] = useState<number[]>([]);
  const [recurrenceCount, setRecurrenceCount] = useState<number>(4);

  // Collision handling state
  const [collisionWarning, setCollisionWarning] = useState<string | null>(null);
  const [allowOverlap, setAllowOverlap] = useState(false);

  // Validation errors
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (isOpen) {
      const base = defaultDate || new Date();
      // Set to nearest hour
      base.setMinutes(0, 0, 0);
      const start = new Date(base);
      if (!defaultDate) {
        start.setHours(start.getHours() + 1);
      } else {
        start.setHours(9, 0, 0);
      }
      const end = new Date(start);
      end.setHours(end.getHours() + 2);

      setTitle('');
      setDescription('');
      setEventType('lecture');
      setCourseId('');
      setStartDateStr(format(start, "yyyy-MM-dd'T'HH:mm"));
      setEndDateStr(format(end, "yyyy-MM-dd'T'HH:mm"));
      setVenue('');
      setMeetingLink('');
      setIsRecurring(false);
      setRecurrenceFrequency('weekly');
      setRecurrenceInterval(1);
      setRecurrenceDaysOfWeek([start.getDay()]);
      setRecurrenceCount(4);
      setCollisionWarning(null);
      setAllowOverlap(false);
      setValidationErrors({});
    }
  }, [isOpen, defaultDate]);

  const toggleDayOfWeek = (day: number) => {
    setRecurrenceDaysOfWeek((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day],
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationErrors({});

    const startIso = new Date(startDateStr).toISOString();
    const endIso = new Date(endDateStr).toISOString();

    const payload = {
      title: title.trim(),
      description: description.trim() || undefined,
      eventType,
      courseId: courseId || undefined,
      startDate: startIso,
      endDate: endIso,
      venue: venue.trim(),
      meetingLink: meetingLink.trim() || undefined,
      allowOverlap,
      isRecurring,
      recurrenceFrequency: isRecurring ? recurrenceFrequency : undefined,
      recurrenceInterval: isRecurring ? recurrenceInterval : undefined,
      recurrenceDaysOfWeek:
        isRecurring && recurrenceDaysOfWeek.length > 0 ? recurrenceDaysOfWeek : undefined,
      recurrenceCount: isRecurring ? recurrenceCount : undefined,
    };

    const parsed = createEventSchema.safeParse(payload);
    if (!parsed.success) {
      const errMap: Record<string, string> = {};
      parsed.error.issues.forEach((issue) => {
        const key = issue.path[0]?.toString() || 'general';
        errMap[key] = issue.message;
      });
      setValidationErrors(errMap);
      return;
    }

    try {
      await createEventMutation.mutateAsync(parsed.data);
      onClose();
    } catch (err: any) {
      if (err.response?.status === 409) {
        setCollisionWarning(
          err.response?.data?.message ||
            'Venue collision detected! The selected room is already booked for another event.',
        );
      }
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl font-bold">
            <Calendar className="w-5 h-5 text-primary" />
            Schedule Academic Event
          </DialogTitle>
          <DialogDescription>
            Create single or recurring lectures, tutorials, deadlines, or cohort meetings.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          {collisionWarning && (
            <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-md text-sm text-destructive space-y-2">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-destructive shrink-0 mt-0.5" />
                <div className="font-semibold text-foreground">Venue Booking Conflict</div>
              </div>
              <p className="text-xs text-muted-foreground">{collisionWarning}</p>
              <label className="flex items-center gap-2 pt-1 font-medium cursor-pointer text-xs text-foreground">
                <input
                  type="checkbox"
                  checked={allowOverlap}
                  onChange={(e) => setAllowOverlap(e.target.checked)}
                  className="rounded border-destructive/40 text-destructive focus:ring-destructive"
                />
                Force schedule anyway (Allow Overlap)
              </label>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2 space-y-1.5">
              <Label htmlFor="event-title">
                Event Title <span className="text-destructive">*</span>
              </Label>
              <Input
                id="event-title"
                placeholder="e.g. Linear Algebra Midterm Exam"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
              {validationErrors.title && (
                <p className="text-xs text-destructive">{validationErrors.title}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="event-type">Event Type</Label>
              <select
                id="event-type"
                className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
                value={eventType}
                onChange={(e) => setEventType(e.target.value as EventType)}
              >
                <option value="lecture">Lecture</option>
                <option value="tutorial">Tutorial / Lab</option>
                <option value="exam">Exam</option>
                <option value="deadline">Deadline</option>
                <option value="meeting">Meeting</option>
                <option value="seminar">Seminar</option>
                <option value="other">Other</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="course-id">Associated Course</Label>
              <select
                id="course-id"
                className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
                value={courseId}
                onChange={(e) => setCourseId(e.target.value)}
              >
                <option value="">General (No Course Assigned)</option>
                {courses.map((course) => (
                  <option key={course.id} value={course.id}>
                    [{course.id}] {course.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="venue">
                Venue / Room <span className="text-destructive">*</span>
              </Label>
              <div className="relative">
                <MapPin className="w-4 h-4 text-muted-foreground absolute left-3 top-2.5" />
                <Input
                  id="venue"
                  className="pl-9"
                  placeholder="e.g. Great Hall or LT 101"
                  value={venue}
                  onChange={(e) => setVenue(e.target.value)}
                  required
                />
              </div>
              {validationErrors.venue && (
                <p className="text-xs text-destructive">{validationErrors.venue}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="start-date" className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" />
                Start Time <span className="text-destructive">*</span>
              </Label>
              <Input
                id="start-date"
                type="datetime-local"
                value={startDateStr}
                onChange={(e) => setStartDateStr(e.target.value)}
                required
              />
              {validationErrors.startDate && (
                <p className="text-xs text-destructive">{validationErrors.startDate}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="end-date" className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" />
                End Time <span className="text-destructive">*</span>
              </Label>
              <Input
                id="end-date"
                type="datetime-local"
                value={endDateStr}
                onChange={(e) => setEndDateStr(e.target.value)}
                required
              />
              {validationErrors.endDate && (
                <p className="text-xs text-destructive">{validationErrors.endDate}</p>
              )}
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="meeting-link">Online Meeting Link (Optional)</Label>
            <Input
              id="meeting-link"
              type="url"
              placeholder="https://meet.google.com/xyz or https://zoom.us/j/..."
              value={meetingLink}
              onChange={(e) => setMeetingLink(e.target.value)}
            />
            {validationErrors.meetingLink && (
              <p className="text-xs text-destructive">{validationErrors.meetingLink}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="description">Event Description (Optional)</Label>
            <Textarea
              id="description"
              rows={2}
              placeholder="Topics covered, prerequisite reading, exam instructions..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          {/* Recurring Event Configuration */}
          <div className="p-3 bg-muted/40 border border-border rounded-lg space-y-3">
            <label className="flex items-center gap-2 cursor-pointer font-medium text-sm">
              <input
                type="checkbox"
                checked={isRecurring}
                onChange={(e) => setIsRecurring(e.target.checked)}
                className="rounded border-input text-primary focus:ring-primary"
              />
              <span className="flex items-center gap-1.5">
                <Repeat className="w-4 h-4 text-primary" />
                Repeat this event (Recurring Timetable Schedule)
              </span>
            </label>

            {isRecurring && (
              <div className="space-y-3 pt-2 border-t border-border/60">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs">Frequency</Label>
                    <select
                      className="w-full h-8 rounded-md border border-input bg-background px-2 text-xs"
                      value={recurrenceFrequency}
                      onChange={(e) =>
                        setRecurrenceFrequency(e.target.value as RecurrenceFrequency)
                      }
                    >
                      <option value="weekly">Weekly</option>
                      <option value="biweekly">Bi-weekly (Every 2 weeks)</option>
                      <option value="daily">Daily</option>
                      <option value="monthly">Monthly</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <Label className="text-xs">Repeat Count (Occurrences)</Label>
                    <Input
                      type="number"
                      min={1}
                      max={52}
                      className="h-8 text-xs"
                      value={recurrenceCount}
                      onChange={(e) => setRecurrenceCount(Number(e.target.value))}
                    />
                  </div>
                </div>

                {recurrenceFrequency === 'weekly' && (
                  <div className="space-y-1.5">
                    <Label className="text-xs">Repeat on Days of Week</Label>
                    <div className="flex flex-wrap gap-1">
                      {DAYS_OF_WEEK.map((d) => {
                        const isSelected = recurrenceDaysOfWeek.includes(d.value);
                        return (
                          <button
                            key={d.value}
                            type="button"
                            onClick={() => toggleDayOfWeek(d.value)}
                            className={`px-2.5 py-1 text-xs rounded border transition-colors ${
                              isSelected
                                ? 'bg-primary text-primary-foreground border-primary font-semibold'
                                : 'bg-background text-foreground border-input hover:bg-accent'
                            }`}
                          >
                            {d.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          <DialogFooter className="pt-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={createEventMutation.isPending}>
              {createEventMutation.isPending ? 'Scheduling...' : 'Schedule Event'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

