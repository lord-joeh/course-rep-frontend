import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useForgotPasswordMutation } from '@/hooks/use-auth-mutations';
import { forgotPasswordSchema, type ForgotPasswordFormData } from '@/lib/auth-validation';
import { KeyRound, Loader2, ArrowLeft, Send } from 'lucide-react';

export function ForgotPasswordPage() {
  const [formData, setFormData] = useState<ForgotPasswordFormData>({
    identifier: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);

  const mutation = useForgotPasswordMutation();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    const result = forgotPasswordSchema.safeParse(formData);
    if (!result.success) {
      setErrors({ identifier: result.error.issues[0]?.message || 'Invalid identifier' });
      return;
    }

    mutation.mutate(formData, {
      onSuccess: () => {
        setSubmitted(true);
      },
    });
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background text-foreground">
      <Card className="w-full max-w-md border border-border shadow-xs bg-card">
        <CardHeader className="space-y-2 text-center pb-6">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-xs">
            <KeyRound className="h-6 w-6" />
          </div>
          <CardTitle className="text-2xl font-bold tracking-tight text-foreground">
            Reset Password
          </CardTitle>
          <CardDescription className="text-sm text-muted-foreground">
            Enter your Student ID or registered email to receive password recovery instructions.
          </CardDescription>
        </CardHeader>

        {submitted ? (
          <CardContent className="space-y-4 text-center py-4">
            <div className="rounded-md bg-muted p-4 border border-border text-sm text-muted-foreground">
              <p className="font-semibold text-foreground mb-1">Check Your Inbox</p>
              <p>
                If an account exists matching <span className="font-mono text-foreground font-medium">{formData.identifier}</span>,
                we have dispatched a password reset link.
              </p>
            </div>
            <Button
              variant="outline"
              className="w-full"
              onClick={() => {
                setSubmitted(false);
                setFormData({ identifier: '' });
              }}
            >
              Try another ID / Email
            </Button>
          </CardContent>
        ) : (
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4">
              <div className="space-y-1.5">
                <label htmlFor="reset-identifier" className="text-xs font-semibold text-foreground">
                  Student ID or University Email
                </label>
                <Input
                  id="reset-identifier"
                  placeholder="e.g. 10928374 or student@univ.edu"
                  value={formData.identifier}
                  onChange={(e) => setFormData({ identifier: e.target.value })}
                  disabled={mutation.isPending}
                  className={errors.identifier ? 'border-destructive' : ''}
                />
                {errors.identifier && (
                  <p className="text-xs text-destructive font-medium">{errors.identifier}</p>
                )}
              </div>
            </CardContent>

            <CardFooter className="flex flex-col space-y-4 pt-2">
              <Button
                type="submit"
                className="w-full font-semibold"
                disabled={mutation.isPending}
              >
                {mutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Sending instructions...
                  </>
                ) : (
                  <>
                    Send Recovery Link
                    <Send className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>

              <Link
                to="/login"
                className="inline-flex items-center justify-center text-xs text-muted-foreground hover:text-foreground font-medium"
              >
                <ArrowLeft className="mr-1.5 h-3.5 w-3.5" />
                Back to Sign In
              </Link>
            </CardFooter>
          </form>
        )}
      </Card>
    </div>
  );
}

