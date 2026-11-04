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
import { useUpdateEventMutation } from '@/hooks/use-events';
import { useCoursesQuery } from '@/hooks/use-courses';
import { updateEventSchema } from '@/lib/event-validation';
import type { Event, EventType } from '@/types';
import { format } from 'date-fns';
import { AlertCircle, Clock, MapPin, Pencil, Repeat } from 'lucide-react';

interface EditEventDialogProps {
  event: Event | null;
  isOpen: boolean;
  onClose: () => void;
}

export function EditEventDialog({ event, isOpen, onClose }: EditEventDialogProps) {
  const { data: coursesData } = useCoursesQuery({ limit: 100 });
  const courses = coursesData?.items || [];

  const updateEventMutation = useUpdateEventMutation();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [eventType, setEventType] = useState<EventType>('lecture');
  const [courseId, setCourseId] = useState<string>('');
  const [startDateStr, setStartDateStr] = useState('');
  const [endDateStr, setEndDateStr] = useState('');
  const [venue, setVenue] = useState('');
  const [meetingLink, setMeetingLink] = useState('');

  // Series propagation & collision handling
  const [updateFutureInSeries, setUpdateFutureInSeries] = useState(false);
  const [collisionWarning, setCollisionWarning] = useState<string | null>(null);
  const [allowOverlap, setAllowOverlap] = useState(false);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  const isSeriesMember = Boolean(event?.isRecurring || event?.recurrenceSeriesId);

  useEffect(() => {
    if (event && isOpen) {
      setTitle(event.title);
      setDescription(event.description || '');
      setEventType(event.eventType);
      setCourseId(event.courseId || '');
      setStartDateStr(format(new Date(event.startDate), "yyyy-MM-dd'T'HH:mm"));
      setEndDateStr(format(new Date(event.endDate), "yyyy-MM-dd'T'HH:mm"));
      setVenue(event.venue);
      setMeetingLink(event.meetingLink || '');
      setUpdateFutureInSeries(false);
      setCollisionWarning(null);
      setAllowOverlap(false);
      setValidationErrors({});
    }
  }, [event, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!event) return;
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
      updateFutureInSeries: isSeriesMember ? updateFutureInSeries : undefined,
    };

    const parsed = updateEventSchema.safeParse(payload);
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
      await updateEventMutation.mutateAsync({
        id: event.id,
        dto: parsed.data,
      });
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
      <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl font-bold">
            <Pencil className="w-5 h-5 text-primary" />
            Edit Academic Event
          </DialogTitle>
          <DialogDescription>
            Update event scheduling, venue, or online details.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          {collisionWarning && (
            <div className="p-3 bg-red-50 dark:bg-red-950/40 border border-red-300 dark:border-red-900 rounded-md text-sm text-red-800 dark:text-red-200 space-y-2">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-destructive shrink-0 mt-0.5" />
                <div className="font-semibold">Venue Booking Conflict</div>
              </div>
              <p className="text-xs">{collisionWarning}</p>
              <label className="flex items-center gap-2 pt-1 font-medium cursor-pointer text-xs">
                <input
                  type="checkbox"
                  checked={allowOverlap}
                  onChange={(e) => setAllowOverlap(e.target.checked)}
                  className="rounded border-red-400 text-destructive focus:ring-destructive"
                />
                Force schedule anyway (Allow Overlap)
              </label>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2 space-y-1.5">
              <Label htmlFor="edit-event-title">
                Event Title <span className="text-destructive">*</span>
              </Label>
              <Input
                id="edit-event-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
              {validationErrors.title && (
                <p className="text-xs text-destructive">{validationErrors.title}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="edit-event-type">Event Type</Label>
              <select
                id="edit-event-type"
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
              <Label htmlFor="edit-course-id">Associated Course</Label>
              <select
                id="edit-course-id"
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
              <Label htmlFor="edit-venue">
                Venue / Room <span className="text-destructive">*</span>
              </Label>
              <div className="relative">
                <MapPin className="w-4 h-4 text-muted-foreground absolute left-3 top-2.5" />
                <Input
                  id="edit-venue"
                  className="pl-9"
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
              <Label htmlFor="edit-start-date" className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" />
                Start Time <span className="text-destructive">*</span>
              </Label>
              <Input
                id="edit-start-date"
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
              <Label htmlFor="edit-end-date" className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" />
                End Time <span className="text-destructive">*</span>
              </Label>
              <Input
                id="edit-end-date"
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
            <Label htmlFor="edit-meeting-link">Online Meeting Link (Optional)</Label>
            <Input
              id="edit-meeting-link"
              type="url"
              placeholder="https://meet.google.com/xyz"
              value={meetingLink}
              onChange={(e) => setMeetingLink(e.target.value)}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="edit-description">Description (Optional)</Label>
            <Textarea
              id="edit-description"
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          {isSeriesMember && (
            <div className="p-3 bg-zinc-50 dark:bg-zinc-900 border border-border rounded-lg space-y-1.5">
              <label className="flex items-center gap-2 cursor-pointer font-medium text-sm">
                <input
                  type="checkbox"
                  checked={updateFutureInSeries}
                  onChange={(e) => setUpdateFutureInSeries(e.target.checked)}
                  className="rounded border-input text-primary focus:ring-primary"
                />
                <span className="flex items-center gap-1.5">
                  <Repeat className="w-4 h-4 text-primary" />
                  Apply changes to all future events in this recurring series
                </span>
              </label>
              <p className="text-xs text-muted-foreground pl-6">
                If checked, upcoming occurrences belonging to this series will also be updated.
              </p>
            </div>
          )}

          <DialogFooter className="pt-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={updateEventMutation.isPending}>
              {updateEventMutation.isPending ? 'Saving...' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
