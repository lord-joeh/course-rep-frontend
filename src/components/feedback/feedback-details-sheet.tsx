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
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import type { Feedback, FeedbackStatus } from '@/types';
import {
  getFeedbackStatusMeta,
  getFeedbackCategoryMeta,
  getFeedbackPriorityMeta,
} from '@/lib/feedback-validation';
import { useUpdateFeedbackStatusMutation } from '@/hooks/use-feedback';
import {
  Shield,
  User,
  Clock,
  BookOpen,
  MessageSquareReply,
  Trash2,
  Loader2,
  CheckCircle2,
} from 'lucide-react';
import { formatDistanceToNow, format } from 'date-fns';

interface FeedbackDetailsSheetProps {
  feedback: Feedback | null;
  isOpen: boolean;
  onClose: () => void;
  isRep?: boolean;
  onDelete?: (feedback: Feedback) => void;
}

export function FeedbackDetailsSheet({
  feedback,
  isOpen,
  onClose,
  isRep = false,
  onDelete,
}: FeedbackDetailsSheetProps) {
  const updateStatusMutation = useUpdateFeedbackStatusMutation();

  const [triageStatus, setTriageStatus] = useState<FeedbackStatus>('submitted');
  const [repResponse, setRepResponse] = useState('');

  useEffect(() => {
    if (feedback) {
      setTriageStatus(feedback.status);
      setRepResponse(feedback.repResponse || '');
    }
  }, [feedback]);

  if (!feedback) return null;

  const statusMeta = getFeedbackStatusMeta(feedback.status);
  const categoryMeta = getFeedbackCategoryMeta(feedback.category);
  const priorityMeta = getFeedbackPriorityMeta(feedback.priority);
  const CategoryIcon = categoryMeta.icon;
  const StatusIcon = statusMeta.icon;

  const createdTimeAgo = formatDistanceToNow(new Date(feedback.createdAt), {
    addSuffix: true,
  });

  const formattedDate = format(new Date(feedback.createdAt), 'PPP p');

  const handleTriageSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await updateStatusMutation.mutateAsync({
        id: feedback.id,
        dto: {
          status: triageStatus,
          repResponse: repResponse.trim() || undefined,
        },
      });
      onClose();
    } catch {
      // Toast handled by mutation
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-xl w-full max-h-[90vh] overflow-y-auto p-4 sm:p-6 space-y-4">
        {/* Header */}
        <DialogHeader className="space-y-2 text-left">
          <div className="flex items-center gap-1.5 flex-wrap">
            <Badge
              variant="outline"
              className={`text-[10px] px-2 py-0.5 gap-1 border font-medium ${categoryMeta.badgeClass}`}
            >
              <CategoryIcon className="w-3 h-3" />
              <span>{categoryMeta.label}</span>
            </Badge>

            <Badge
              variant="outline"
              className={`text-[10px] px-1.5 py-0.5 border ${priorityMeta.badgeClass}`}
            >
              {priorityMeta.label}
            </Badge>

            <Badge
              variant="outline"
              className={`text-[10px] px-2 py-0.5 gap-1 border font-semibold ${statusMeta.badgeClass}`}
            >
              <StatusIcon className="w-3 h-3" />
              <span>{statusMeta.label}</span>
            </Badge>
          </div>

          <DialogTitle className="text-base sm:text-xl font-bold text-foreground leading-snug">
            {feedback.title}
          </DialogTitle>

          <DialogDescription className="flex items-center gap-2 text-xs text-muted-foreground flex-wrap">
            <span className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" />
              <span>{createdTimeAgo}</span>
            </span>
            <span>•</span>
            <span>{formattedDate}</span>
          </DialogDescription>
        </DialogHeader>

        <Separator />

        {/* Author & Course Affiliation Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          {/* Author Card */}
          <div className="p-3 rounded-lg border border-border bg-muted/20 flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0">
              {feedback.isAnonymous ? <Shield className="w-4 h-4" /> : <User className="w-4 h-4" />}
            </div>
            <div className="min-w-0">
              <div className="font-semibold text-foreground truncate">
                {feedback.isAnonymous ? 'Anonymous Student' : feedback.student?.name || 'Registered Student'}
              </div>
              <div className="text-[11px] text-muted-foreground truncate">
                {feedback.isAnonymous
                  ? 'Identity redacted'
                  : feedback.student?.email || 'Confidential submission'}
              </div>
            </div>
          </div>

          {/* Course Association Card */}
          <div className="p-3 rounded-lg border border-border bg-muted/20 flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-secondary text-secondary-foreground flex items-center justify-center shrink-0">
              <BookOpen className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <div className="font-semibold text-foreground truncate">
                {feedback.course ? feedback.course.name : 'Cohort-Wide'}
              </div>
              <div className="text-[11px] text-muted-foreground font-mono truncate">
                {feedback.course ? feedback.course.id : 'General Suggestion'}
              </div>
            </div>
          </div>
        </div>

        {/* Detailed Content */}
        <div className="space-y-1.5">
          <Label className="text-xs font-semibold text-foreground">Feedback Description</Label>
          <div className="p-3.5 rounded-lg border border-border bg-card text-foreground text-xs sm:text-sm whitespace-pre-wrap leading-relaxed">
            {feedback.content}
          </div>
        </div>

        {/* Existing Rep Response (if present and not currently editing as rep) */}
        {feedback.repResponse && (
          <div className="rounded-lg border border-primary/30 bg-primary/5 p-3.5 space-y-1.5">
            <div className="flex items-center justify-between text-xs font-semibold text-primary">
              <span className="flex items-center gap-1.5">
                <MessageSquareReply className="w-4 h-4" />
                <span>Official Course Rep Response</span>
              </span>
              {feedback.respondedAt && (
                <span className="text-[11px] text-muted-foreground font-normal">
                  {formatDistanceToNow(new Date(feedback.respondedAt), { addSuffix: true })}
                </span>
              )}
            </div>
            <p className="text-xs text-foreground whitespace-pre-wrap leading-relaxed">
              {feedback.repResponse}
            </p>
          </div>
        )}

        {/* Rep Triage Control Panel (Reps Only) */}
        {isRep && (
          <form onSubmit={handleTriageSubmit} className="space-y-3 pt-2 border-t border-border">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-foreground uppercase tracking-wider">
                Course Rep Triage & Actions
              </h4>
              {onDelete && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => onDelete(feedback)}
                  className="h-7 text-xs text-destructive hover:bg-destructive/10 hover:text-destructive gap-1 px-2"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Delete</span>
                </Button>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="triage-status" className="text-xs font-semibold">
                  Triage Status
                </Label>
                <select
                  id="triage-status"
                  className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-xs shadow-xs focus:outline-none focus:ring-1 focus:ring-ring"
                  value={triageStatus}
                  onChange={(e) => setTriageStatus(e.target.value as FeedbackStatus)}
                >
                  <option value="submitted">Submitted (Pending Action)</option>
                  <option value="under_review">Under Review (Investigating)</option>
                  <option value="resolved">Resolved (Action Taken)</option>
                  <option value="dismissed">Dismissed (No Action Required)</option>
                </select>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="triage-response" className="text-xs font-semibold">
                Official Rep Response (Visible to Student)
              </Label>
              <Textarea
                id="triage-response"
                placeholder="Explain the outcome, action taken with faculty, or reason for dismissal..."
                className="min-h-[90px] text-xs resize-none"
                value={repResponse}
                onChange={(e) => setRepResponse(e.target.value)}
              />
            </div>

            <div className="flex justify-end gap-2 pt-1">
              <Button
                type="submit"
                size="sm"
                disabled={updateStatusMutation.isPending}
                className="gap-1.5 text-xs h-9"
              >
                {updateStatusMutation.isPending ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Save Triage & Response</span>
                  </>
                )}
              </Button>
            </div>
          </form>
        )}

        <DialogFooter className="pt-2">
          <Button type="button" variant="outline" size="sm" onClick={onClose} className="text-xs h-9">
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

