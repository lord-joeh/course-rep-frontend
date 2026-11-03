import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useUpdateStudentMutation } from '@/hooks/use-students';
import type { Student, StudentStatus } from '@/types';
import { UserCheck, ShieldAlert, Loader2 } from 'lucide-react';

interface EditStudentDialogProps {
  student: Student | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EditStudentDialog({
  student,
  open,
  onOpenChange,
}: EditStudentDialogProps) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [status, setStatus] = useState<StudentStatus>('active');
  const [isRep, setIsRep] = useState(false);

  useEffect(() => {
    if (student) {
      setName(student.name);
      setEmail(student.email);
      setPhone(student.phone || '');
      setStatus(student.status);
      setIsRep(student.isRep);
    }
  }, [student]);

  const updateMutation = useUpdateStudentMutation(() => {
    onOpenChange(false);
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!student) return;

    updateMutation.mutate({
      id: student.id,
      dto: {
        name: name.trim() || undefined,
        email: email.trim() || undefined,
        phone: phone.trim() || undefined,
        status,
        isRep,
      },
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserCheck className="h-5 w-5 text-primary" />
            Edit Student Profile
          </DialogTitle>
          <DialogDescription>
            Update administrative records for Student ID: <span className="font-mono font-medium text-foreground">{student?.id}</span>
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          {/* Full Name */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground">Full Name</label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Full name"
              required
            />
          </div>

          {/* Email */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground">University Email</label>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="student@univ.edu"
              required
            />
          </div>

          {/* Phone */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground">Phone Number</label>
            <Input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+1234567890"
            />
          </div>

          {/* Account Status Select */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground">Account Status</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as StudentStatus)}
              className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-xs transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring text-foreground"
            >
              <option value="active">Active (Full access)</option>
              <option value="suspended">Suspended (Access blocked)</option>
              <option value="pending">Pending (Awaiting verification)</option>
            </select>
          </div>

          {/* Role Elevation Switch */}
          <div className="rounded-md border border-border p-3 space-y-2 bg-muted/40">
            <div className="flex items-center justify-between">
              <div>
                <label htmlFor="is-rep-toggle" className="text-xs font-semibold text-foreground block cursor-pointer">
                  Course Representative Privileges
                </label>
                <p className="text-[11px] text-muted-foreground">
                  Grants administrative authority over courses, attendance, and slides.
                </p>
              </div>
              <input
                id="is-rep-toggle"
                type="checkbox"
                checked={isRep}
                onChange={(e) => setIsRep(e.target.checked)}
                className="h-4 w-4 rounded border-border text-primary focus:ring-primary cursor-pointer"
              />
            </div>

            {isRep && (
              <div className="flex items-start gap-2 rounded bg-amber-50 dark:bg-amber-950/40 p-2 text-[11px] text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-900">
                <ShieldAlert className="h-4 w-4 shrink-0 mt-0.5" />
                <span>Caution: This user will have full Course Representative administrative permissions.</span>
              </div>
            )}
          </div>

          <DialogFooter className="pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={updateMutation.isPending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={updateMutation.isPending}>
              {updateMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Changes
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

