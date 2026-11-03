import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useRegisterMutation } from '@/hooks/use-auth-mutations';
import { registerSchema, type RegisterFormData } from '@/lib/auth-validation';
import { UserPlus, Eye, EyeOff, Loader2, ArrowRight, ShieldCheck } from 'lucide-react';

export function RegisterPage() {
  const [formData, setFormData] = useState<RegisterFormData>({
    id: '',
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showPassword, setShowPassword] = useState(false);

  const registerMutation = useRegisterMutation();

  const getPasswordStrength = (pass: string) => {
    if (!pass) return { score: 0, label: 'Empty', color: 'bg-muted' };
    let score = 0;
    if (pass.length >= 8) score++;
    if (/[A-Z]/.test(pass)) score++;
    if (/[0-9]/.test(pass)) score++;
    if (/[^A-Za-z0-9]/.test(pass)) score++;

    switch (score) {
      case 1:
        return { score: 25, label: 'Weak', color: 'bg-red-500' };
      case 2:
        return { score: 50, label: 'Fair', color: 'bg-amber-500' };
      case 3:
        return { score: 75, label: 'Good', color: 'bg-blue-600' };
      case 4:
        return { score: 100, label: 'Strong', color: 'bg-emerald-600' };
      default:
        return { score: 0, label: 'Weak', color: 'bg-red-500' };
    }
  };

  const strength = getPasswordStrength(formData.password);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    const result = registerSchema.safeParse(formData);
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.issues.forEach((issue) => {
        const path = issue.path[0];
        if (path) fieldErrors[path.toString()] = issue.message;
      });
      setErrors(fieldErrors);
      return;
    }

    registerMutation.mutate(formData);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background text-foreground py-10">
      <Card className="w-full max-w-lg border border-border shadow-xs bg-card">
        <CardHeader className="space-y-2 text-center pb-6">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-xs">
            <UserPlus className="h-6 w-6" />
          </div>
          <CardTitle className="text-2xl font-bold tracking-tight text-foreground">
            Create Student Account
          </CardTitle>
          <CardDescription className="text-sm text-muted-foreground">
            Register to access course materials, submit assignments, and log attendance.
          </CardDescription>
        </CardHeader>

        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              {/* Student ID */}
              <div className="space-y-1.5">
                <label htmlFor="reg-id" className="text-xs font-semibold text-foreground">
                  Student ID <span className="text-destructive">*</span>
                </label>
                <Input
                  id="reg-id"
                  placeholder="e.g. 10928374"
                  value={formData.id}
                  onChange={(e) => setFormData({ ...formData, id: e.target.value })}
                  disabled={registerMutation.isPending}
                  className={errors.id ? 'border-destructive' : ''}
                />
                {errors.id && <p className="text-xs text-destructive font-medium">{errors.id}</p>}
              </div>

              {/* Full Name */}
              <div className="space-y-1.5">
                <label htmlFor="reg-name" className="text-xs font-semibold text-foreground">
                  Full Name <span className="text-destructive">*</span>
                </label>
                <Input
                  id="reg-name"
                  placeholder="e.g. Jane Doe"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  disabled={registerMutation.isPending}
                  className={errors.name ? 'border-destructive' : ''}
                />
                {errors.name && <p className="text-xs text-destructive font-medium">{errors.name}</p>}
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              {/* Email */}
              <div className="space-y-1.5">
                <label htmlFor="reg-email" className="text-xs font-semibold text-foreground">
                  University Email <span className="text-destructive">*</span>
                </label>
                <Input
                  id="reg-email"
                  type="email"
                  placeholder="student@univ.edu"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  disabled={registerMutation.isPending}
                  className={errors.email ? 'border-destructive' : ''}
                />
                {errors.email && <p className="text-xs text-destructive font-medium">{errors.email}</p>}
              </div>

              {/* Phone (Optional) */}
              <div className="space-y-1.5">
                <label htmlFor="reg-phone" className="text-xs font-semibold text-foreground">
                  Phone Number <span className="text-muted-foreground font-normal">(Optional)</span>
                </label>
                <Input
                  id="reg-phone"
                  placeholder="e.g. +1234567890"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  disabled={registerMutation.isPending}
                  className={errors.phone ? 'border-destructive' : ''}
                />
                {errors.phone && <p className="text-xs text-destructive font-medium">{errors.phone}</p>}
              </div>
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <label htmlFor="reg-pass" className="text-xs font-semibold text-foreground">
                Password <span className="text-destructive">*</span>
              </label>
              <div className="relative">
                <Input
                  id="reg-pass"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Min. 8 characters with 1 capital and 1 number"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  disabled={registerMutation.isPending}
                  className={errors.password ? 'border-destructive pr-10' : 'pr-10'}
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

              {/* Password Strength Indicator */}
              {formData.password && (
                <div className="space-y-1 pt-1">
                  <div className="flex justify-between text-[11px] text-muted-foreground">
                    <span>Strength: {strength.label}</span>
                    <span>{strength.score}%</span>
                  </div>
                  <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
                    <div
                      className={`h-full transition-all duration-300 ${strength.color}`}
                      style={{ width: `${strength.score}%` }}
                    />
                  </div>
                </div>
              )}
              {errors.password && (
                <p className="text-xs text-destructive font-medium">{errors.password}</p>
              )}
            </div>

            {/* Confirm Password */}
            <div className="space-y-1.5">
              <label htmlFor="reg-confirm" className="text-xs font-semibold text-foreground">
                Confirm Password <span className="text-destructive">*</span>
              </label>
              <Input
                id="reg-confirm"
                type="password"
                placeholder="Re-type your password"
                value={formData.confirmPassword}
                onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                disabled={registerMutation.isPending}
                className={errors.confirmPassword ? 'border-destructive' : ''}
              />
              {errors.confirmPassword && (
                <p className="text-xs text-destructive font-medium">{errors.confirmPassword}</p>
              )}
            </div>

            {/* Security Notice */}
            <div className="rounded-md bg-muted/60 p-3 border border-border flex items-start gap-2.5 text-xs text-muted-foreground">
              <ShieldCheck className="h-4 w-4 text-primary shrink-0 mt-0.5" />
              <span>
                All new registrations are enrolled as student accounts. Course representative privileges are
                assigned by existing representatives through academic verification.
              </span>
            </div>
          </CardContent>

          <CardFooter className="flex flex-col space-y-4 pt-2">
            <Button
              type="submit"
              className="w-full font-semibold"
              disabled={registerMutation.isPending}
            >
              {registerMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating account...
                </>
              ) : (
                <>
                  Complete Registration
                  <ArrowRight className="ml-2 h-4 w-4" />
                </>
              )}
            </Button>

            <div className="text-center text-xs text-muted-foreground">
              Already have an account?{' '}
              <Link to="/login" className="font-semibold text-primary hover:underline">
                Sign in
              </Link>
            </div>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}

