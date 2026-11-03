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
import { useCreateCourseMutation } from '@/hooks/use-courses';
import { useLecturersQuery } from '@/hooks/use-lecturers';
import { createCourseSchema } from '@/lib/course-validation';
import { BookPlus, Loader2, BookOpen, Clock, Calendar, GraduationCap, Folder } from 'lucide-react';

interface CreateCourseDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const DAYS_OF_WEEK = [
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
];

const SEMESTERS = ['First Semester', 'Second Semester'];

export function CreateCourseDialog({
  open,
  onOpenChange,
}: CreateCourseDialogProps) {
  const [id, setId] = useState('');
  const [name, setName] = useState('');
  const [semester, setSemester] = useState('First Semester');
  const [lecturerId, setLecturerId] = useState('');
  const [day, setDay] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [slidesFolderId, setSlidesFolderId] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Fetch faculty list for lecturer assignment
  const { data: lecturersData, isLoading: isLoadingLecturers } = useLecturersQuery({
    limit: 100,
  });
  const lecturers = lecturersData?.items || [];

  const createMutation = useCreateCourseMutation(() => {
    resetForm();
    onOpenChange(false);
  });

  const resetForm = () => {
    setId('');
    setName('');
    setSemester('First Semester');
    setLecturerId('');
    setDay('');
    setStartTime('');
    setEndTime('');
    setSlidesFolderId('');
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

    const validationResult = createCourseSchema.safeParse({
      id: id.trim().toUpperCase(),
      name: name.trim(),
      semester: semester.trim(),
      lecturerId: lecturerId.trim() || undefined,
      day: day.trim() || undefined,
      startTime: startTime.trim() || undefined,
      endTime: endTime.trim() || undefined,
      slidesFolderId: slidesFolderId.trim() || undefined,
    });

    if (!validationResult.success) {
      const fieldErrors: Record<string, string> = {};
      for (const issue of validationResult.error.issues) {
        const path = String(issue.path[0]);
        if (!fieldErrors[path]) {
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
      <DialogContent className="sm:max-w-[560px]">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <BookPlus className="h-5 w-5" />
            </div>
            <div>
              <DialogTitle>Register New Course</DialogTitle>
              <DialogDescription>
                Add an academic course to the institutional catalog.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          {/* Code & Name Row */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <label htmlFor="create-course-id" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <BookOpen className="h-3.5 w-3.5" />
                Code <span className="text-destructive">*</span>
              </label>
              <Input
                id="create-course-id"
                placeholder="e.g. CPEN401"
                value={id}
                onChange={(e) => {
                  setId(e.target.value.toUpperCase());
                  if (errors.id) setErrors((prev) => ({ ...prev, id: '' }));
                }}
                className={errors.id ? 'border-destructive focus-visible:ring-destructive uppercase' : 'uppercase'}
                disabled={createMutation.isPending}
                autoFocus
              />
              {errors.id && (
                <p className="text-xs text-destructive font-medium">{errors.id}</p>
              )}
            </div>

            <div className="sm:col-span-2 space-y-1.5">
              <label htmlFor="create-course-name" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                Course Title <span className="text-destructive">*</span>
              </label>
              <Input
                id="create-course-name"
                placeholder="e.g. Advanced Software Engineering"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  if (errors.name) setErrors((prev) => ({ ...prev, name: '' }));
                }}
                className={errors.name ? 'border-destructive focus-visible:ring-destructive' : ''}
                disabled={createMutation.isPending}
              />
              {errors.name && (
                <p className="text-xs text-destructive font-medium">{errors.name}</p>
              )}
            </div>
          </div>

          {/* Semester & Lecturer Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label htmlFor="create-course-semester" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5" />
                Semester <span className="text-destructive">*</span>
              </label>
              <select
                id="create-course-semester"
                value={semester}
                onChange={(e) => setSemester(e.target.value)}
                className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-sm text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                disabled={createMutation.isPending}
              >
                {SEMESTERS.map((sem) => (
                  <option key={sem} value={sem}>{sem}</option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label htmlFor="create-course-lecturer" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <GraduationCap className="h-3.5 w-3.5" />
                Assigned Faculty
              </label>
              <select
                id="create-course-lecturer"
                value={lecturerId}
                onChange={(e) => setLecturerId(e.target.value)}
                className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-sm text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                disabled={createMutation.isPending || isLoadingLecturers}
              >
                <option value="">Unassigned</option>
                {lecturers.map((lec) => (
                  <option key={lec.id} value={lec.id}>
                    {lec.name} ({lec.email})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Day & Time Schedule Row */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <label htmlFor="create-course-day" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5" />
                Day of Week
              </label>
              <select
                id="create-course-day"
                value={day}
                onChange={(e) => setDay(e.target.value)}
                className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-sm text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                disabled={createMutation.isPending}
              >
                <option value="">None specified</option>
                {DAYS_OF_WEEK.map((d) => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label htmlFor="create-course-start-time" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5" />
                Start Time
              </label>
              <Input
                id="create-course-start-time"
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                disabled={createMutation.isPending}
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="create-course-end-time" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5" />
                End Time
              </label>
              <Input
                id="create-course-end-time"
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                disabled={createMutation.isPending}
              />
            </div>
          </div>

          {/* Slides Folder ID */}
          <div className="space-y-1.5">
            <label htmlFor="create-course-folder" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <Folder className="h-3.5 w-3.5" />
              Google Drive Slides Folder ID <span className="text-muted-foreground font-normal">(Optional)</span>
            </label>
            <Input
              id="create-course-folder"
              placeholder="e.g. 1A2b3C4d5E6f..."
              value={slidesFolderId}
              onChange={(e) => setSlidesFolderId(e.target.value)}
              disabled={createMutation.isPending}
            />
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
                  Registering...
                </>
              ) : (
                'Create Course'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
