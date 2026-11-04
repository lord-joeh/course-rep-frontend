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
import { useUpdateNotificationMutation } from '@/hooks/use-notifications';
import { useCoursesQuery } from '@/hooks/use-courses';
import { updateNotificationSchema } from '@/lib/notification-validation';
import type { Notification, NotificationType, NotificationPriority } from '@/types';
import { Pencil } from 'lucide-react';

interface EditAnnouncementDialogProps {
  notification: Notification | null;
  isOpen: boolean;
  onClose: () => void;
}

export function EditAnnouncementDialog({
  notification,
  isOpen,
  onClose,
}: EditAnnouncementDialogProps) {
  const { data: coursesData } = useCoursesQuery({ limit: 100 });
  const courses = coursesData?.items || [];

  const updateNotificationMutation = useUpdateNotificationMutation();

  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [type, setType] = useState<NotificationType>('announcement');
  const [priority, setPriority] = useState<NotificationPriority>('normal');
  const [courseId, setCourseId] = useState<string>('');
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (notification && isOpen) {
      setTitle(notification.title);
      setMessage(notification.message);
      setType(notification.type);
      setPriority(notification.priority);
      setCourseId(notification.courseId || '');
      setValidationErrors({});
    }
  }, [notification, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!notification) return;
    setValidationErrors({});

    const payload = {
      title: title.trim(),
      message: message.trim(),
      type,
      priority,
      courseId: courseId || undefined,
    };

    const parsed = updateNotificationSchema.safeParse(payload);
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
      await updateNotificationMutation.mutateAsync({
        id: notification.id,
        dto: parsed.data,
      });
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
            <Pencil className="w-5 h-5 text-primary" />
            Edit Announcement
          </DialogTitle>
          <DialogDescription>
            Modify announcement content, category, or audience scope.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label htmlFor="edit-notif-title">
              Announcement Title <span className="text-destructive">*</span>
            </Label>
            <Input
              id="edit-notif-title"
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
              <Label htmlFor="edit-notif-type">Category</Label>
              <select
                id="edit-notif-type"
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
              <Label htmlFor="edit-notif-priority">Priority</Label>
              <select
                id="edit-notif-priority"
                className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-xs shadow-xs focus:outline-none focus:ring-1 focus:ring-ring"
                value={priority}
                onChange={(e) => setPriority(e.target.value as NotificationPriority)}
              >
                <option value="normal">Normal</option>
                <option value="high">High Priority</option>
                <option value="urgent">Urgent</option>
                <option value="low">Low Priority</option>
              </select>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="edit-notif-course">Target Scope</Label>
            <select
              id="edit-notif-course"
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
            <Label htmlFor="edit-notif-message">
              Announcement Message <span className="text-destructive">*</span>
            </Label>
            <Textarea
              id="edit-notif-message"
              rows={4}
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
            <Button type="submit" disabled={updateNotificationMutation.isPending}>
              {updateNotificationMutation.isPending ? 'Saving...' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

