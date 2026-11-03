import { useState } from 'react';
import { useMyProfileQuery } from '@/hooks/use-students';
import { PageHeader } from '@/components/common/page-header';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ChangePasswordDialog } from '@/components/auth/change-password-dialog';
import {
  Mail,
  Phone,
  Calendar,
  ShieldCheck,
  Key,
  Info,
  Clock,
} from 'lucide-react';
import { format } from 'date-fns';

export function StudentProfilePage() {
  const [passwordDialogOpen, setPasswordDialogOpen] = useState(false);
  const { data: student, isLoading } = useMyProfileQuery();

  const formattedCreated = student?.createdAt
    ? format(new Date(student.createdAt), 'PPP')
    : '—';

  return (
    <div className="space-y-6">
      <PageHeader
        title="My Profile"
        description="View your verified student profile, enrollment status, and account credentials."
      >
        <Button variant="outline" onClick={() => setPasswordDialogOpen(true)}>
          <Key className="mr-2 h-4 w-4" />
          Change Password
        </Button>
      </PageHeader>

      <ChangePasswordDialog
        open={passwordDialogOpen}
        onOpenChange={setPasswordDialogOpen}
      />

      <div className="grid gap-6 md:grid-cols-3">
        {/* Profile Card */}
        <Card className="md:col-span-2 border border-border bg-card">
          <CardHeader className="border-b border-border pb-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary text-primary-foreground font-bold text-2xl shadow-xs">
                  {student?.name ? student.name.charAt(0).toUpperCase() : 'S'}
                </div>
                <div className="space-y-1">
                  {isLoading ? (
                    <>
                      <Skeleton className="h-6 w-40" />
                      <Skeleton className="h-4 w-28" />
                    </>
                  ) : (
                    <>
                      <CardTitle className="text-xl font-bold">{student?.name}</CardTitle>
                      <p className="text-xs font-mono text-muted-foreground">Student ID: {student?.id}</p>
                    </>
                  )}
                </div>
              </div>
              <div className="flex gap-2">
                <Badge variant={student?.isRep ? 'default' : 'secondary'}>
                  {student?.isRep ? 'Course Representative' : 'Enrolled Student'}
                </Badge>
                <Badge variant={student?.status === 'active' ? 'success' : 'warning'}>
                  {student?.status || 'Active'}
                </Badge>
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-6 space-y-4">
            {isLoading ? (
              <div className="space-y-3">
                <Skeleton className="h-5 w-full" />
                <Skeleton className="h-5 w-full" />
                <Skeleton className="h-5 w-2/3" />
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 text-sm">
                <div className="rounded-lg border border-border p-3 space-y-1">
                  <span className="text-xs text-muted-foreground flex items-center gap-1.5">
                    <Mail className="h-3.5 w-3.5" /> University Email
                  </span>
                  <p className="font-medium text-foreground truncate">{student?.email}</p>
                </div>

                <div className="rounded-lg border border-border p-3 space-y-1">
                  <span className="text-xs text-muted-foreground flex items-center gap-1.5">
                    <Phone className="h-3.5 w-3.5" /> Phone Number
                  </span>
                  <p className="font-medium text-foreground">{student?.phone || 'Not recorded'}</p>
                </div>

                <div className="rounded-lg border border-border p-3 space-y-1">
                  <span className="text-xs text-muted-foreground flex items-center gap-1.5">
                    <Calendar className="h-3.5 w-3.5" /> Enrolled Since
                  </span>
                  <p className="font-medium text-foreground">{formattedCreated}</p>
                </div>

                <div className="rounded-lg border border-border p-3 space-y-1">
                  <span className="text-xs text-muted-foreground flex items-center gap-1.5">
                    <ShieldCheck className="h-3.5 w-3.5" /> Access Tier
                  </span>
                  <p className="font-medium text-foreground">
                    {student?.isRep ? 'Representative Level' : 'Standard Student'}
                  </p>
                </div>
              </div>
            )}
          </CardContent>

          <CardFooter className="bg-muted/30 border-t border-border p-4 text-xs text-muted-foreground flex items-center gap-2">
            <Clock className="h-4 w-4 shrink-0 text-muted-foreground" />
            <span>Profile synchronized with verified institution database.</span>
          </CardFooter>
        </Card>

        {/* Informational Guidance Card */}
        <Card className="border border-border bg-card h-fit">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Info className="h-5 w-5 text-primary" />
              <CardTitle className="text-base">Profile Policy</CardTitle>
            </div>
            <CardDescription>Academic record management</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-xs text-muted-foreground leading-relaxed">
            <p>
              To maintain absolute roster integrity and prevent fraudulent enrollment modifications, personal student
              details (name, email, and ID) cannot be modified directly by students.
            </p>
            <div className="rounded-md bg-muted p-3 border border-border space-y-1 text-foreground">
              <p className="font-semibold text-xs">Need to update your details?</p>
              <p className="text-[11px] text-muted-foreground">
                Contact your assigned Course Representative with your official student ID card for identity verification.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

