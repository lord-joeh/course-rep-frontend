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
import { Textarea } from '@/components/ui/textarea';
import { useSendTestSmsMutation } from '@/hooks/use-queue-admin';
import { sendTestSmsSchema } from '@/lib/queue-validation';
import { MessageSquare, Send, Loader2 } from 'lucide-react';

interface TestSmsDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

export function TestSmsDialog({ isOpen, onClose }: TestSmsDialogProps) {
  const [phone, setPhone] = useState('');
  const [message, setMessage] = useState('Course Rep System: Background queue SMS pipeline probe test.');
  const [error, setError] = useState<string | null>(null);

  const testSmsMutation = useSendTestSmsMutation();

  useEffect(() => {
    if (isOpen) {
      setPhone('');
      setMessage('Course Rep System: Background queue SMS pipeline probe test.');
      setError(null);
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const payload = {
      to: phone.trim(),
      message: message.trim() || undefined,
    };

    const parsed = sendTestSmsSchema.safeParse(payload);
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message || 'Invalid SMS parameters');
      return;
    }

    try {
      await testSmsMutation.mutateAsync(parsed.data);
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
            <MessageSquare className="w-5 h-5 text-primary" />
            Dispatch Test SMS Probe
          </DialogTitle>
          <DialogDescription className="text-xs sm:text-sm">
            Enqueue a verification SMS into BullMQ to test carrier-grade delivery via the Arkesel
            V1/V2 SMS processor.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          {/* Phone */}
          <div className="space-y-1.5">
            <Label htmlFor="sms-recipient" className="text-xs font-semibold">
              Recipient Phone Number <span className="text-destructive">*</span>
            </Label>
            <Input
              id="sms-recipient"
              type="tel"
              placeholder="e.g. 0256269405 or +233241234567"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="h-9 text-xs font-mono"
              required
            />
          </div>

          {/* Message */}
          <div className="space-y-1.5">
            <div className="flex justify-between items-center">
              <Label htmlFor="sms-message" className="text-xs font-semibold">
                Test Message
              </Label>
              <span className="text-[10px] text-muted-foreground">{message.length}/160 chars</span>
            </div>
            <Textarea
              id="sms-message"
              rows={3}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              maxLength={160}
              className="text-xs resize-none"
            />
          </div>

          {error && <p className="text-xs text-destructive">{error}</p>}

          <DialogFooter className="pt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onClose}
              disabled={testSmsMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={testSmsMutation.isPending}
              className="gap-1.5"
            >
              {testSmsMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Enqueuing SMS...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  Submit Probe SMS
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

