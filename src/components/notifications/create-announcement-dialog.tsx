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
import { useCreateNotificationMutation } from '@/hooks/use-notifications';
import { useCoursesQuery } from '@/hooks/use-courses';
import { createNotificationSchema } from '@/lib/notification-validation';
import type { NotificationType, NotificationPriority } from '@/types';
import { Megaphone, Flame } from 'lucide-react';

interface CreateAnnouncementDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CreateAnnouncementDialog({
  isOpen,
  onClose,
}: CreateAnnouncementDialogProps) {
  const { data: coursesData } = useCoursesQuery({ limit: 100 });
  const courses = coursesData?.items || [];

  const createNotificationMutation = useCreateNotificationMutation();

  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [type, setType] = useState<NotificationType>('announcement');
  const [priority, setPriority] = useState<NotificationPriority>('normal');
  const [courseId, setCourseId] = useState<string>('');
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (isOpen) {
      setTitle('');
      setMessage('');
      setType('announcement');
      setPriority('normal');
      setCourseId('');
      setValidationErrors({});
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationErrors({});

    const payload = {
      title: title.trim(),
      message: message.trim(),
      type,
      priority,
      courseId: courseId || undefined,
    };

    const parsed = createNotificationSchema.safeParse(payload);
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
      await createNotificationMutation.mutateAsync(parsed.data);
      onClose();
    } catch {
      // Handled by mutation toast
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl font-bold">
            <Megaphone className="w-5 h-5 text-primary" />
            Broadcast Announcement
          </DialogTitle>
          <DialogDescription>
            Dispatch a real-time cohort or course-specific notification to students.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          {priority === 'urgent' && (
            <div className="flex items-start gap-2 p-3 bg-destructive/10 border border-destructive/20 rounded-md text-xs text-destructive">
              <Flame className="w-4 h-4 shrink-0 mt-0.5" />
              <div>
                <strong>Urgent Broadcast:</strong> This notification will trigger immediate high-priority alerts and SMS dispatches to enrolled students.
              </div>
            </div>
          )}

          <div className="space-y-1.5">
            <Label htmlFor="notif-title">
              Announcement Title <span className="text-destructive">*</span>
            </Label>
            <Input
              id="notif-title"
              placeholder="e.g. Venue Change for Linear Algebra Midterm"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
            {validationErrors.title && (
              <p className="text-xs text-destructive">{validationErrors.title}</p>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="notif-type">Category</Label>
              <select
                id="notif-type"
                className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-xs shadow-xs focus:outline-none focus:ring-1 focus:ring-ring"
                value={type}
                onChange={(e) => setType(e.target.value as NotificationType)}
              >
                <option value="announcement">Announcement</option>
                <option value="assignment">Assignment Notice</option>
                <option value="attendance">Attendance Alert</option>
                <option value="event">Timetable / Event</option>
                <option value="feedback">Feedback Update</option>
                <option value="system">System Notice</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="notif-priority">Priority Level</Label>
              <select
                id="notif-priority"
                className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-xs shadow-xs focus:outline-none focus:ring-1 focus:ring-ring"
                value={priority}
                onChange={(e) => setPriority(e.target.value as NotificationPriority)}
              >
                <option value="normal">Normal</option>
                <option value="high">High Priority</option>
                <option value="urgent">Urgent Alert</option>
                <option value="low">Low Priority</option>
              </select>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="notif-course">Target Audience</Label>
            <select
              id="notif-course"
              className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-xs shadow-xs focus:outline-none focus:ring-1 focus:ring-ring"
              value={courseId}
              onChange={(e) => setCourseId(e.target.value)}
            >
              <option value="">Cohort-Wide (All Cohort Students)</option>
              {courses.map((course) => (
                <option key={course.id} value={course.id}>
                  [{course.id}] {course.name}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="notif-message">
              Announcement Message <span className="text-destructive">*</span>
            </Label>
            <Textarea
              id="notif-message"
              rows={4}
              placeholder="Provide complete details, instructions, or deadlines..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              required
            />
            {validationErrors.message && (
              <p className="text-xs text-destructive">{validationErrors.message}</p>
            )}
          </div>

          <DialogFooter className="pt-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={createNotificationMutation.isPending}>
              {createNotificationMutation.isPending ? 'Broadcasting...' : 'Broadcast'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

