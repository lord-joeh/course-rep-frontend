import React, { useState } from 'react';
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
import { useCreateLecturerMutation } from '@/hooks/use-lecturers';
import { createLecturerSchema } from '@/lib/lecturer-validation';
import { UserPlus, Loader2, Mail, Phone, User } from 'lucide-react';

interface CreateLecturerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreateLecturerDialog({
  open,
  onOpenChange,
}: CreateLecturerDialogProps) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [errors, setErrors] = useState<{ name?: string; email?: string; phone?: string }>({});

  const createMutation = useCreateLecturerMutation(() => {
    resetForm();
    onOpenChange(false);
  });

  const resetForm = () => {
    setName('');
    setEmail('');
    setPhone('');
    setErrors({});
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      resetForm();
    }
    onOpenChange(newOpen);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    const validationResult = createLecturerSchema.safeParse({
      name: name.trim(),
      email: email.trim(),
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

    createMutation.mutate(validationResult.data);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <UserPlus className="h-5 w-5" />
            </div>
            <div>
              <DialogTitle>Add Faculty Member</DialogTitle>
              <DialogDescription>
                Register a new lecturer into the institutional faculty directory.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          {/* Lecturer Name */}
          <div className="space-y-1.5">
            <label htmlFor="create-lecturer-name" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <User className="h-3.5 w-3.5" />
              Full Name <span className="text-destructive">*</span>
            </label>
            <Input
              id="create-lecturer-name"
              placeholder="e.g. Dr. Jane Smith"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (errors.name) setErrors((prev) => ({ ...prev, name: undefined }));
              }}
              aria-invalid={!!errors.name}
              className={errors.name ? 'border-destructive focus-visible:ring-destructive' : ''}
              disabled={createMutation.isPending}
              autoFocus
            />
            {errors.name && (
              <p className="text-xs text-destructive font-medium">{errors.name}</p>
            )}
          </div>

          {/* Email Address */}
          <div className="space-y-1.5">
            <label htmlFor="create-lecturer-email" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <Mail className="h-3.5 w-3.5" />
              Email Address <span className="text-destructive">*</span>
            </label>
            <Input
              id="create-lecturer-email"
              type="email"
              placeholder="e.g. j.smith@university.edu"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (errors.email) setErrors((prev) => ({ ...prev, email: undefined }));
              }}
              aria-invalid={!!errors.email}
              className={errors.email ? 'border-destructive focus-visible:ring-destructive' : ''}
              disabled={createMutation.isPending}
            />
            {errors.email && (
              <p className="text-xs text-destructive font-medium">{errors.email}</p>
            )}
          </div>

          {/* Phone Number */}
          <div className="space-y-1.5">
            <label htmlFor="create-lecturer-phone" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <Phone className="h-3.5 w-3.5" />
              Phone Number <span className="text-muted-foreground font-normal">(Optional)</span>
            </label>
            <Input
              id="create-lecturer-phone"
              type="tel"
              placeholder="e.g. +1 (555) 234-5678"
              value={phone}
              onChange={(e) => {
                setPhone(e.target.value);
                if (errors.phone) setErrors((prev) => ({ ...prev, phone: undefined }));
              }}
              aria-invalid={!!errors.phone}
              className={errors.phone ? 'border-destructive focus-visible:ring-destructive' : ''}
              disabled={createMutation.isPending}
            />
            {errors.phone && (
              <p className="text-xs text-destructive font-medium">{errors.phone}</p>
            )}
          </div>

          <DialogFooter className="pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
              disabled={createMutation.isPending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={createMutation.isPending}>
              {createMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                'Save Faculty Member'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

