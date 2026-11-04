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
import { useSendDirectNotificationMutation } from '@/hooks/use-notifications';
import { useStudentsQuery } from '@/hooks/use-students';
import { directNotificationSchema } from '@/lib/notification-validation';
import { Send, User } from 'lucide-react';

interface DirectMessageDialogProps {
  isOpen: boolean;
  onClose: () => void;
  defaultStudentId?: string;
  defaultStudentName?: string;
}

export function DirectMessageDialog({
  isOpen,
  onClose,
  defaultStudentId = '',
  defaultStudentName = '',
}: DirectMessageDialogProps) {
  const { data: studentsData } = useStudentsQuery({ limit: 100 });
  const students = studentsData?.items || [];

  const sendDirectMutation = useSendDirectNotificationMutation();

  const [studentId, setStudentId] = useState(defaultStudentId);
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<'in_app' | 'email' | 'sms'>('in_app');
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (isOpen) {
      setStudentId(defaultStudentId);
      setTitle('');
      setMessage('');
      setMessageType('in_app');
      setValidationErrors({});
    }
  }, [isOpen, defaultStudentId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationErrors({});

    const payload = {
      studentId: studentId.trim(),
      title: title.trim() || undefined,
      message: message.trim(),
      messageType,
    };

    const parsed = directNotificationSchema.safeParse(payload);
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
      await sendDirectMutation.mutateAsync(parsed.data);
      onClose();
    } catch {
      // Handled by mutation toast
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl font-bold">
            <Send className="w-5 h-5 text-primary" />
            Send Direct Student Alert
          </DialogTitle>
          <DialogDescription>
            Dispatch a targeted, private notification to a specific student.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          {defaultStudentName ? (
            <div className="flex items-center gap-2 p-2.5 rounded-md bg-muted/40 border border-border text-xs">
              <User className="w-4 h-4 text-primary shrink-0" />
              <div>
                Recipient: <strong className="text-foreground">{defaultStudentName}</strong> ({defaultStudentId})
              </div>
            </div>
          ) : (
            <div className="space-y-1.5">
              <Label htmlFor="direct-student">
                Select Recipient Student <span className="text-destructive">*</span>
              </Label>
              <select
                id="direct-student"
                className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-xs shadow-xs focus:outline-none focus:ring-1 focus:ring-ring"
                value={studentId}
                onChange={(e) => setStudentId(e.target.value)}
                required
              >
                <option value="">-- Choose Student --</option>
                {students.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.id})
                  </option>
                ))}
              </select>
              {validationErrors.studentId && (
                <p className="text-xs text-destructive">{validationErrors.studentId}</p>
              )}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="direct-title">Title (Optional)</Label>
              <Input
                id="direct-title"
                placeholder="e.g. Lab Attendance Warning"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="direct-type">Channel</Label>
              <select
                id="direct-type"
                className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-xs shadow-xs focus:outline-none focus:ring-1 focus:ring-ring"
                value={messageType}
                onChange={(e) => setMessageType(e.target.value as 'in_app' | 'email' | 'sms')}
              >
                <option value="in_app">In-App & Push (Default)</option>
                <option value="email">Email</option>
                <option value="sms">SMS</option>
              </select>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="direct-message">
              Direct Message <span className="text-destructive">*</span>
            </Label>
            <Textarea
              id="direct-message"
              rows={4}
              placeholder="Write your private message to the student..."
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
            <Button type="submit" disabled={sendDirectMutation.isPending}>
              {sendDirectMutation.isPending ? 'Sending...' : 'Send Message'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
