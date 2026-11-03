import { useState } from 'react';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useCourseRosterQuery } from '@/hooks/use-courses';
import type { Course } from '@/types';
import { Users, Search, X, Mail, ShieldCheck } from 'lucide-react';

interface CourseRosterSheetProps {
  course: Course | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CourseRosterSheet({
  course,
  open,
  onOpenChange,
}: CourseRosterSheetProps) {
  const [search, setSearch] = useState('');

  const { data: students = [], isLoading } = useCourseRosterQuery(course?.id);

  const filteredStudents = students.filter((s) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      s.name?.toLowerCase().includes(q) ||
      s.email?.toLowerCase().includes(q) ||
      s.id?.toLowerCase().includes(q)
    );
  });

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-md flex flex-col p-6">
        <SheetHeader className="space-y-1">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Users className="h-5 w-5" />
              </div>
              <SheetTitle>Enrolled Roster</SheetTitle>
            </div>
            <Badge variant="outline" className="font-semibold text-xs">
              {students.length} Enrolled
            </Badge>
          </div>
          <SheetDescription>
            Active students registered in <strong className="text-foreground">{course?.id} - {course?.name}</strong>.
          </SheetDescription>
        </SheetHeader>

        {/* Search within roster */}
        <div className="relative my-4">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Filter by name, ID, or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 pr-9"
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Student list */}
        <div className="flex-1 overflow-y-auto space-y-2 pr-1">
          {isLoading ? (
            Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3 p-3 rounded-lg border border-border">
                <Skeleton className="h-10 w-10 rounded-full" />
                <div className="space-y-1.5 flex-1">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
              </div>
            ))
          ) : filteredStudents.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-8 text-center text-muted-foreground">
              <Users className="h-8 w-8 text-muted-foreground/60 mb-2" />
              <p className="text-sm font-medium">
                {search ? 'No matching students found' : 'No students enrolled yet'}
              </p>
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch('')}
                  className="mt-2 text-xs text-primary underline"
                >
                  Clear filter
                </button>
              )}
            </div>
          ) : (
            filteredStudents.map((student) => (
              <div
                key={student.id}
                className="flex items-center justify-between p-3 rounded-lg border border-border bg-card hover:bg-muted/30 transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground font-semibold text-xs">
                    {student.name ? student.name.slice(0, 2).toUpperCase() : 'ST'}
                  </div>
                  <div className="min-w-0">
                    <p className="font-medium text-sm text-foreground truncate">{student.name}</p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span className="font-mono">{student.id}</span>
                      <span>•</span>
                      <a
                        href={`mailto:${student.email}`}
                        className="truncate hover:text-primary hover:underline flex items-center gap-1"
                        title={student.email}
                      >
                        <Mail className="h-3 w-3" />
                        <span className="truncate max-w-[140px]">{student.email}</span>
                      </a>
                    </div>
                  </div>
                </div>

                {student.isRep && (
                  <Badge variant="default" className="text-[10px] shrink-0 ml-2">
                    <ShieldCheck className="mr-1 h-3 w-3" />
                    Rep
                  </Badge>
                )}
              </div>
            ))
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
