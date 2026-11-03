import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type { Student } from '@/types';
import { Mail, Phone, Calendar, ShieldCheck, Edit3, Trash2 } from 'lucide-react';
import { format } from 'date-fns';

interface StudentDetailsSheetProps {
  student: Student | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEdit: (student: Student) => void;
  onDelete: (student: Student) => void;
}

export function StudentDetailsSheet({
  student,
  open,
  onOpenChange,
  onEdit,
  onDelete,
}: StudentDetailsSheetProps) {
  if (!student) return null;

  const formattedCreated = student.createdAt
    ? format(new Date(student.createdAt), 'PPP')
    : 'Unknown';

  const getStatusBadge = (status: Student['status']) => {
    switch (status) {
      case 'active':
        return <Badge variant="success">Active</Badge>;
      case 'suspended':
        return <Badge variant="destructive">Suspended</Badge>;
      case 'pending':
        return <Badge variant="warning">Pending</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-md p-6 flex flex-col justify-between">
        <div className="space-y-6">
          <SheetHeader className="text-left space-y-1">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-primary-foreground font-bold text-lg">
                {student.name.charAt(0).toUpperCase()}
              </div>
              <div>
                <SheetTitle className="text-xl font-bold">{student.name}</SheetTitle>
                <p className="text-xs font-mono text-muted-foreground">ID: {student.id}</p>
              </div>
            </div>
            <div className="flex gap-2 pt-2">
              <Badge variant={student.isRep ? 'default' : 'secondary'}>
                {student.isRep ? 'Course Representative' : 'Student'}
              </Badge>
              {getStatusBadge(student.status)}
            </div>
          </SheetHeader>

          {/* Details Section */}
          <div className="space-y-3 pt-2">
            <div className="rounded-lg border border-border bg-card p-4 space-y-3 text-sm">
              <div className="flex items-center gap-3 text-foreground">
                <Mail className="h-4 w-4 text-muted-foreground shrink-0" />
                <span className="truncate">{student.email}</span>
              </div>
              <div className="flex items-center gap-3 text-foreground">
                <Phone className="h-4 w-4 text-muted-foreground shrink-0" />
                <span>{student.phone || 'No phone number provided'}</span>
              </div>
              <div className="flex items-center gap-3 text-foreground">
                <Calendar className="h-4 w-4 text-muted-foreground shrink-0" />
                <span>Registered: {formattedCreated}</span>
              </div>
              <div className="flex items-center gap-3 text-foreground">
                <ShieldCheck className="h-4 w-4 text-muted-foreground shrink-0" />
                <span>Role: {student.isRep ? 'Representative Privileges' : 'Standard Enrollee'}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="border-t border-border pt-4 flex gap-2">
          <Button
            variant="outline"
            className="flex-1"
            onClick={() => {
              onOpenChange(false);
              onEdit(student);
            }}
          >
            <Edit3 className="mr-2 h-4 w-4" />
            Edit Profile
          </Button>
          <Button
            variant="destructive"
            size="icon"
            onClick={() => {
              onOpenChange(false);
              onDelete(student);
            }}
            title="Delete Student Record"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}

