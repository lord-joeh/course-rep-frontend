import React, { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useResetPasswordMutation } from '@/hooks/use-auth-mutations';
import { resetPasswordSchema, type ResetPasswordFormData } from '@/lib/auth-validation';
import { ShieldAlert, Eye, EyeOff, Loader2, ArrowRight } from 'lucide-react';

export function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') || '';

  const [formData, setFormData] = useState<ResetPasswordFormData>({
    token,
    newPassword: '',
    confirmPassword: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showPassword, setShowPassword] = useState(false);

  const resetMutation = useResetPasswordMutation();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    const result = resetPasswordSchema.safeParse({ ...formData, token });
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.issues.forEach((issue) => {
        const path = issue.path[0];
        if (path) fieldErrors[path.toString()] = issue.message;
      });
      setErrors(fieldErrors);
      return;
    }

    resetMutation.mutate({ ...formData, token });
  };

  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-background text-foreground">
        <Card className="w-full max-w-md border border-border shadow-xs bg-card text-center p-6 space-y-4">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-destructive/10 text-destructive">
            <ShieldAlert className="h-6 w-6" />
          </div>
          <CardTitle className="text-xl">Missing Reset Token</CardTitle>
          <CardDescription>
            This password recovery link is missing its authentication token. Please check your email or request a new reset link.
          </CardDescription>
          <Button asChild className="w-full">
            <Link to="/forgot-password">Request New Reset Link</Link>
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background text-foreground">
      <Card className="w-full max-w-md border border-border shadow-xs bg-card">
        <CardHeader className="space-y-2 text-center pb-6">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-xs">
            <ShieldAlert className="h-6 w-6" />
          </div>
          <CardTitle className="text-2xl font-bold tracking-tight text-foreground">
            Create New Password
          </CardTitle>
          <CardDescription className="text-sm text-muted-foreground">
            Please enter your new strong password below to regain access.
          </CardDescription>
        </CardHeader>

        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            {/* New Password */}
            <div className="space-y-1.5">
              <label htmlFor="new-pass" className="text-xs font-semibold text-foreground">
                New Password
              </label>
              <div className="relative">
                <Input
                  id="new-pass"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Min. 8 characters with 1 capital and 1 number"
                  value={formData.newPassword}
                  onChange={(e) => setFormData({ ...formData, newPassword: e.target.value })}
                  disabled={resetMutation.isPending}
                  className={errors.newPassword ? 'border-destructive pr-10' : 'pr-10'}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-2.5 text-muted-foreground hover:text-foreground cursor-pointer"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {errors.newPassword && (
                <p className="text-xs text-destructive font-medium">{errors.newPassword}</p>
              )}
            </div>

            {/* Confirm New Password */}
            <div className="space-y-1.5">
              <label htmlFor="confirm-pass" className="text-xs font-semibold text-foreground">
                Confirm New Password
              </label>
              <Input
                id="confirm-pass"
                type="password"
                placeholder="Re-enter your new password"
                value={formData.confirmPassword}
                onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                disabled={resetMutation.isPending}
                className={errors.confirmPassword ? 'border-destructive' : ''}
              />
              {errors.confirmPassword && (
                <p className="text-xs text-destructive font-medium">{errors.confirmPassword}</p>
              )}
            </div>
          </CardContent>

          <CardFooter className="flex flex-col space-y-4 pt-2">
            <Button
              type="submit"
              className="w-full font-semibold"
              disabled={resetMutation.isPending}
            >
              {resetMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Updating password...
                </>
              ) : (
                <>
                  Save New Password
                  <ArrowRight className="ml-2 h-4 w-4" />
                </>
              )}
            </Button>

            <Link
              to="/login"
              className="text-center text-xs text-muted-foreground hover:text-foreground font-medium"
            >
              Cancel and return to Sign In
            </Link>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}

