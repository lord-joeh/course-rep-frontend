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
import { useUpdateCourseMutation } from '@/hooks/use-courses';
import { useLecturersQuery } from '@/hooks/use-lecturers';
import { updateCourseSchema } from '@/lib/course-validation';
import type { Course } from '@/types';
import { Edit2, Loader2, BookOpen, Clock, Calendar, GraduationCap, Folder } from 'lucide-react';

interface EditCourseDialogProps {
  course: Course | null;
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

export function EditCourseDialog({
  course,
  open,
  onOpenChange,
}: EditCourseDialogProps) {
  const [name, setName] = useState('');
  const [semester, setSemester] = useState('First Semester');
  const [lecturerId, setLecturerId] = useState('');
  const [day, setDay] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [slidesFolderId, setSlidesFolderId] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const { data: lecturersData, isLoading: isLoadingLecturers } = useLecturersQuery({
    limit: 100,
  });
  const lecturers = lecturersData?.items || [];

  useEffect(() => {
    if (course) {
      setName(course.name || '');
      setSemester(course.semester || 'First Semester');
      setLecturerId(course.lecturerId || '');
      setDay(course.day || '');
      setStartTime(course.startTime || '');
      setEndTime(course.endTime || '');
      setSlidesFolderId(course.slidesFolderId || '');
      setErrors({});
    }
  }, [course]);

  const updateMutation = useUpdateCourseMutation(() => {
    onOpenChange(false);
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!course) return;
    setErrors({});

    const validationResult = updateCourseSchema.safeParse({
      name: name.trim() || undefined,
      semester: semester.trim() || undefined,
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

    updateMutation.mutate({
      id: course.id,
      dto: validationResult.data,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[560px]">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Edit2 className="h-5 w-5" />
            </div>
            <div>
              <DialogTitle>Edit Course Details</DialogTitle>
              <DialogDescription>
                Modify schedule, faculty assignment, and configuration for {course?.id}.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          {/* Course ID (Read-only) & Title */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <BookOpen className="h-3.5 w-3.5" />
                Code
              </label>
              <Input
                value={course?.id || ''}
                disabled
                className="bg-muted font-mono font-bold"
              />
            </div>

            <div className="sm:col-span-2 space-y-1.5">
              <label htmlFor="edit-course-name" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                Course Title
              </label>
              <Input
                id="edit-course-name"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  if (errors.name) setErrors((prev) => ({ ...prev, name: '' }));
                }}
                className={errors.name ? 'border-destructive focus-visible:ring-destructive' : ''}
                disabled={updateMutation.isPending}
              />
              {errors.name && (
                <p className="text-xs text-destructive font-medium">{errors.name}</p>
              )}
            </div>
          </div>

          {/* Semester & Lecturer Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label htmlFor="edit-course-semester" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5" />
                Semester
              </label>
              <select
                id="edit-course-semester"
                value={semester}
                onChange={(e) => setSemester(e.target.value)}
                className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-sm text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                disabled={updateMutation.isPending}
              >
                {SEMESTERS.map((sem) => (
                  <option key={sem} value={sem}>{sem}</option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label htmlFor="edit-course-lecturer" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <GraduationCap className="h-3.5 w-3.5" />
                Assigned Faculty
              </label>
              <select
                id="edit-course-lecturer"
                value={lecturerId}
                onChange={(e) => setLecturerId(e.target.value)}
                className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-sm text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                disabled={updateMutation.isPending || isLoadingLecturers}
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
              <label htmlFor="edit-course-day" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5" />
                Day of Week
              </label>
              <select
                id="edit-course-day"
                value={day}
                onChange={(e) => setDay(e.target.value)}
                className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-sm text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                disabled={updateMutation.isPending}
              >
                <option value="">None specified</option>
                {DAYS_OF_WEEK.map((d) => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label htmlFor="edit-course-start-time" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5" />
                Start Time
              </label>
              <Input
                id="edit-course-start-time"
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                disabled={updateMutation.isPending}
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="edit-course-end-time" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5" />
                End Time
              </label>
              <Input
                id="edit-course-end-time"
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                disabled={updateMutation.isPending}
              />
            </div>
          </div>

          {/* Slides Folder ID */}
          <div className="space-y-1.5">
            <label htmlFor="edit-course-folder" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <Folder className="h-3.5 w-3.5" />
              Google Drive Slides Folder ID
            </label>
            <Input
              id="edit-course-folder"
              placeholder="e.g. 1A2b3C4d5E6f..."
              value={slidesFolderId}
              onChange={(e) => setSlidesFolderId(e.target.value)}
              disabled={updateMutation.isPending}
            />
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
