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
import { useUpdateLecturerMutation } from '@/hooks/use-lecturers';
import { updateLecturerSchema } from '@/lib/lecturer-validation';
import type { Lecturer } from '@/types';
import { UserCheck, Loader2, Mail, Phone, User } from 'lucide-react';

interface EditLecturerDialogProps {
  lecturer: Lecturer | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EditLecturerDialog({
  lecturer,
  open,
  onOpenChange,
}: EditLecturerDialogProps) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [errors, setErrors] = useState<{ name?: string; email?: string; phone?: string }>({});

  useEffect(() => {
    if (lecturer) {
      setName(lecturer.name || '');
      setEmail(lecturer.email || '');
      setPhone(lecturer.phone || '');
      setErrors({});
    }
  }, [lecturer]);

  const updateMutation = useUpdateLecturerMutation(() => {
    onOpenChange(false);
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!lecturer) return;
    setErrors({});

    const validationResult = updateLecturerSchema.safeParse({
      name: name.trim() || undefined,
      email: email.trim() || undefined,
      phone: phone.trim() || undefined,
    });

    if (!validationResult.success) {
      const fieldErrors: { name?: string; email?: string; phone?: string } = {};
      for (const issue of validationResult.error.issues) {
        const path = issue.path[0] as 'name' | 'email' | 'phone';
        if (path && !fieldErrors[path]) {
          fieldErrors[path] = issue.message;
        }
      }
      setErrors(fieldErrors);
      return;
    }

    updateMutation.mutate({
      id: lecturer.id,
      dto: {
        name: validationResult.data.name || undefined,
        email: validationResult.data.email || undefined,
        phone: validationResult.data.phone || undefined,
      },
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <UserCheck className="h-5 w-5" />
            </div>
            <div>
              <DialogTitle>Edit Faculty Member</DialogTitle>
              <DialogDescription>
                Update contact records and directory information for this faculty member.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          {/* Lecturer Name */}
          <div className="space-y-1.5">
            <label htmlFor="edit-lecturer-name" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <User className="h-3.5 w-3.5" />
              Full Name
            </label>
            <Input
              id="edit-lecturer-name"
              placeholder="e.g. Dr. Jane Smith"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (errors.name) setErrors((prev) => ({ ...prev, name: undefined }));
              }}
              aria-invalid={!!errors.name}
              className={errors.name ? 'border-destructive focus-visible:ring-destructive' : ''}
              disabled={updateMutation.isPending}
            />
            {errors.name && (
              <p className="text-xs text-destructive font-medium">{errors.name}</p>
            )}
          </div>

          {/* Email Address */}
          <div className="space-y-1.5">
            <label htmlFor="edit-lecturer-email" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <Mail className="h-3.5 w-3.5" />
              Email Address
            </label>
            <Input
              id="edit-lecturer-email"
              type="email"
              placeholder="e.g. j.smith@university.edu"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (errors.email) setErrors((prev) => ({ ...prev, email: undefined }));
              }}
              aria-invalid={!!errors.email}
              className={errors.email ? 'border-destructive focus-visible:ring-destructive' : ''}
              disabled={updateMutation.isPending}
            />
            {errors.email && (
              <p className="text-xs text-destructive font-medium">{errors.email}</p>
            )}
          </div>

          {/* Phone Number */}
          <div className="space-y-1.5">
            <label htmlFor="edit-lecturer-phone" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <Phone className="h-3.5 w-3.5" />
              Phone Number
            </label>
            <Input
              id="edit-lecturer-phone"
              type="tel"
              placeholder="e.g. +1 (555) 234-5678"
              value={phone}
              onChange={(e) => {
                setPhone(e.target.value);
                if (errors.phone) setErrors((prev) => ({ ...prev, phone: undefined }));
              }}
              aria-invalid={!!errors.phone}
              className={errors.phone ? 'border-destructive focus-visible:ring-destructive' : ''}
              disabled={updateMutation.isPending}
            />
            {errors.phone && (
              <p className="text-xs text-destructive font-medium">{errors.phone}</p>
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
              {updateMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving Changes...
                </>
              ) : (
                'Save Changes'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

