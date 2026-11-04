import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useCreateFeedbackMutation } from '@/hooks/use-feedback';
import { useCoursesQuery } from '@/hooks/use-courses';
import { createFeedbackSchema } from '@/lib/feedback-validation';
import type { FeedbackCategory, FeedbackPriority } from '@/types';
import { MessageSquarePlus, Shield, ShieldCheck, Loader2 } from 'lucide-react';

interface SubmitFeedbackDialogProps {
  isOpen: boolean;
  onClose: () => void;
  defaultCourseId?: string;
}

export function SubmitFeedbackDialog({
  isOpen,
  onClose,
  defaultCourseId = '',
}: SubmitFeedbackDialogProps) {
  const { data: coursesData } = useCoursesQuery({ limit: 100 });
  const courses = coursesData?.items || [];

  const createMutation = useCreateFeedbackMutation();

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState<FeedbackCategory>('general');
  const [courseId, setCourseId] = useState(defaultCourseId);
  const [priority, setPriority] = useState<FeedbackPriority>('medium');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (isOpen) {
      setTitle('');
      setContent('');
      setCategory('general');
      setCourseId(defaultCourseId);
      setPriority('medium');
      setIsAnonymous(false);
      setErrors({});
    }
  }, [isOpen, defaultCourseId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    const payload = {
      title: title.trim(),
      content: content.trim(),
      category,
      courseId: courseId.trim() || undefined,
      isAnonymous,
      priority,
    };

    const parsed = createFeedbackSchema.safeParse(payload);
    if (!parsed.success) {
      const errMap: Record<string, string> = {};
      parsed.error.issues.forEach((issue) => {
        const key = issue.path[0]?.toString() || 'general';
        errMap[key] = issue.message;
      });
      setErrors(errMap);
      return;
    }

    try {
      await createMutation.mutateAsync(parsed.data);
      onClose();
    } catch {
      // Toast handled by mutation
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md w-full p-4 sm:p-6">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg sm:text-xl font-bold">
            <MessageSquarePlus className="w-5 h-5 text-primary" />
            Submit Feedback or Suggestion
          </DialogTitle>
          <DialogDescription className="text-xs sm:text-sm">
            Voice questions, complaints, or constructive suggestions for your cohort.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-1">
          {/* Title */}
          <div className="space-y-1.5">
            <Label htmlFor="fb-title" className="text-xs font-semibold">
              Subject / Title <span className="text-destructive">*</span>
            </Label>
            <Input
              id="fb-title"
              placeholder="e.g. Broken Projector in Engineering Block"
              className="h-9 text-xs"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
            {errors.title && <p className="text-xs text-destructive">{errors.title}</p>}
          </div>

          {/* Category & Course Scope Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="fb-category" className="text-xs font-semibold">
                Category
              </Label>
              <select
                id="fb-category"
                className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-xs shadow-xs focus:outline-none focus:ring-1 focus:ring-ring"
                value={category}
                onChange={(e) => setCategory(e.target.value as FeedbackCategory)}
              >
                <option value="general">General Suggestion</option>
                <option value="academic">Academic & Curriculum</option>
                <option value="facilities">Classroom & Facilities</option>
                <option value="lecturer">Lecturer Feedback</option>
                <option value="welfare">Student Welfare</option>
                <option value="other">Other Concern</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="fb-course" className="text-xs font-semibold">
                Associated Course (Optional)
              </Label>
              <select
                id="fb-course"
                className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-xs shadow-xs focus:outline-none focus:ring-1 focus:ring-ring"
                value={courseId}
                onChange={(e) => setCourseId(e.target.value)}
              >
                <option value="">-- General / Cohort-Wide --</option>
                {courses.map((c) => (
                  <option key={c.id} value={c.id}>
                    [{c.id}] {c.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Priority */}
          <div className="space-y-1.5">
            <Label htmlFor="fb-priority" className="text-xs font-semibold">
              Urgency / Priority
            </Label>
            <select
              id="fb-priority"
              className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-xs shadow-xs focus:outline-none focus:ring-1 focus:ring-ring"
              value={priority}
              onChange={(e) => setPriority(e.target.value as FeedbackPriority)}
            >
              <option value="low">Low (Standard suggestion or idea)</option>
              <option value="medium">Medium (Requires attention this week)</option>
              <option value="high">High (Impacting upcoming deadline/class)</option>
              <option value="urgent">Urgent (Immediate blocker or crisis)</option>
            </select>
          </div>

          {/* Content */}
          <div className="space-y-1.5">
            <Label htmlFor="fb-content" className="text-xs font-semibold">
              Detailed Description <span className="text-destructive">*</span>
            </Label>
            <Textarea
              id="fb-content"
              placeholder="Describe the problem, proposed solution, or feedback clearly..."
              className="min-h-[110px] text-xs resize-none"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              required
            />
            {errors.content && <p className="text-xs text-destructive">{errors.content}</p>}
          </div>

          {/* Anonymous Privacy Toggle Banner */}
          <div className="rounded-lg border border-border bg-muted/40 p-3 space-y-2">
            <label className="flex items-start gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={isAnonymous}
                onChange={(e) => setIsAnonymous(e.target.checked)}
                className="mt-0.5 rounded border-input h-4 w-4 text-primary focus:ring-primary accent-primary"
              />
              <div className="text-xs space-y-0.5 select-none">
                <div className="font-semibold text-foreground flex items-center gap-1.5">
                  <Shield className="w-3.5 h-3.5 text-primary" />
                  <span>Submit Anonymously</span>
                </div>
                <p className="text-muted-foreground text-[11px] leading-relaxed">
                  Your name and student ID will be cryptographically redacted. Course Reps will see your feedback, but your identity remains completely confidential.
                </p>
              </div>
            </label>
          </div>

          <DialogFooter className="gap-2 sm:gap-0 pt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onClose}
              disabled={createMutation.isPending}
              className="text-xs h-9"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={createMutation.isPending}
              className="gap-1.5 text-xs h-9"
            >
              {createMutation.isPending ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Submitting...</span>
                </>
              ) : (
                <>
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Submit Feedback</span>
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

