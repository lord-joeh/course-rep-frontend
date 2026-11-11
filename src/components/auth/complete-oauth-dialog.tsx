import { useState, useEffect, type FormEvent } from 'react';
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
import { useCompleteOAuthRegistrationMutation } from '@/hooks/use-auth-mutations';
import type { OAuthCompletionRequiredResponse } from '@/types';
import { GraduationCap, Loader2, ArrowRight, CheckCircle2 } from 'lucide-react';

interface CompleteOAuthDialogProps {
  isOpen: boolean;
  onClose: () => void;
  data: OAuthCompletionRequiredResponse | null;
}

export function CompleteOAuthDialog({
  isOpen,
  onClose,
  data,
}: CompleteOAuthDialogProps) {
  const [studentId, setStudentId] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [error, setError] = useState('');

  const completeMutation = useCompleteOAuthRegistrationMutation();

  useEffect(() => {
    if (data) {
      setName(data.name || '');
      setStudentId('');
      setPhone('');
      setError('');
    }
  }, [data]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');

    const trimmedId = studentId.trim();
    if (!trimmedId) {
      setError('Student ID / Index Number is required.');
      return;
    }

    if (!/^[A-Za-z0-9_-]{4,50}$/.test(trimmedId)) {
      setError('Student ID must be 4-50 characters with letters, numbers, hyphens, or underscores.');
      return;
    }

    if (!data?.tempToken) {
      setError('Session expired. Please sign in again.');
      return;
    }

    try {
      await completeMutation.mutateAsync({
        tempToken: data.tempToken,
        studentId: trimmedId,
        name: name.trim() || undefined,
        phone: phone.trim() || undefined,
      });
      onClose();
    } catch {
      // Error handled by mutation onError toast
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader className="space-y-2 text-center sm:text-left">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-xs">
              <GraduationCap className="h-5 w-5" />
            </div>
            <div>
              <DialogTitle className="text-xl font-bold">
                Complete Your Profile
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                First-time {data?.provider === 'google' ? 'Google' : 'Apple'} Sign-In. Link your University ID.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          {/* Linked Account Banner */}
          <div className="rounded-lg border border-border bg-muted/40 p-3 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
              <div className="truncate">
                <span className="font-semibold text-foreground">Verified Email: </span>
                <span className="text-muted-foreground">{data?.email || 'Authenticated via ' + data?.provider}</span>
              </div>
            </div>
            <span className="uppercase text-[10px] font-bold tracking-wider px-2 py-0.5 rounded-full bg-primary/10 text-primary">
              {data?.provider}
            </span>
          </div>

          {/* Student ID Input (Primary Key) */}
          <div className="space-y-1.5">
            <label htmlFor="studentId" className="text-xs font-semibold text-foreground">
              Student ID / Index Number <span className="text-destructive">*</span>
            </label>
            <Input
              id="studentId"
              type="text"
              placeholder="e.g. 10928374 or CPEN2026"
              value={studentId}
              onChange={(e) => setStudentId(e.target.value)}
              disabled={completeMutation.isPending}
              autoFocus
              className={error ? 'border-destructive focus-visible:ring-destructive' : ''}
            />
            {error ? (
              <p className="text-xs text-destructive font-medium">{error}</p>
            ) : (
              <p className="text-[11px] text-muted-foreground">
                Required for classroom attendance, course enrollment, and assignment tracking.
              </p>
            )}
          </div>

          {/* Full Name Input */}
          <div className="space-y-1.5">
            <label htmlFor="name" className="text-xs font-semibold text-foreground">
              Full Name
            </label>
            <Input
              id="name"
              type="text"
              placeholder="e.g. Ama Mensah"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={completeMutation.isPending}
            />
          </div>

          {/* Phone Number Input */}
          <div className="space-y-1.5">
            <label htmlFor="phone" className="text-xs font-semibold text-foreground">
              Mobile Phone <span className="text-muted-foreground font-normal">(Optional)</span>
            </label>
            <Input
              id="phone"
              type="tel"
              placeholder="e.g. +233 20 123 4567"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              disabled={completeMutation.isPending}
            />
          </div>

          <DialogFooter className="pt-2 sm:justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={completeMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={completeMutation.isPending}
              className="font-semibold"
            >
              {completeMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating Account...
                </>
              ) : (
                <>
                  Finish & Launch Portal
                  <ArrowRight className="ml-2 h-4 w-4" />
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

