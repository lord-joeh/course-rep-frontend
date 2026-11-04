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
import { Label } from '@/components/ui/label';
import { useSendTestEmailMutation } from '@/hooks/use-queue-admin';
import { useAuthStore } from '@/lib/auth-store';
import { sendTestEmailSchema } from '@/lib/queue-validation';
import { Mail, Send, Loader2 } from 'lucide-react';

interface TestEmailDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

export function TestEmailDialog({ isOpen, onClose }: TestEmailDialogProps) {
  const { user } = useAuthStore();
  const [recipient, setRecipient] = useState('');
  const [error, setError] = useState<string | null>(null);

  const testEmailMutation = useSendTestEmailMutation();

  useEffect(() => {
    if (isOpen) {
      setRecipient(user?.email || '');
      setError(null);
    }
  }, [isOpen, user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const parsed = sendTestEmailSchema.safeParse({ to: recipient.trim() || undefined });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message || 'Invalid email address');
      return;
    }

    try {
      await testEmailMutation.mutateAsync({
        to: recipient.trim() || undefined,
      });
      onClose();
    } catch {
      // Toast handled by mutation
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md w-full p-4 sm:p-6">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg sm:text-xl font-bold">
            <Mail className="w-5 h-5 text-primary" />
            Dispatch Test Email Probe
          </DialogTitle>
          <DialogDescription className="text-xs sm:text-sm">
            Enqueue a synthetic verification job into BullMQ to verify the Nodemailer background
            worker and SMTP transport pipeline.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label htmlFor="email-recipient" className="text-xs font-semibold">
              Recipient Email (Optional)
            </Label>
            <Input
              id="email-recipient"
              type="email"
              placeholder={user?.email || 'e.g. rep@university.edu'}
              value={recipient}
              onChange={(e) => setRecipient(e.target.value)}
              className="h-9 text-xs"
            />
            {error && <p className="text-xs text-destructive">{error}</p>}
            <p className="text-[11px] text-muted-foreground">
              Leave blank to automatically deliver the probe message to your authenticated email.
            </p>
          </div>

          <DialogFooter className="pt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onClose}
              disabled={testEmailMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={testEmailMutation.isPending}
              className="gap-1.5"
            >
              {testEmailMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Enqueuing...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  Submit Probe Job
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

