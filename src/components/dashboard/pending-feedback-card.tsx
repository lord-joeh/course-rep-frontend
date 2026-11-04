import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Link } from 'react-router-dom';
import type { Feedback } from '@/types/feedback.types';
import { getFeedbackPriorityMeta } from '@/lib/feedback-validation';
import { MessageSquare, ChevronRight, Shield, CheckCircle2 } from 'lucide-react';
import { formatDistanceToNow, parseISO } from 'date-fns';

interface PendingFeedbackCardProps {
  feedbacks: Feedback[];
  isLoading?: boolean;
}

export function PendingFeedbackCard({ feedbacks, isLoading }: PendingFeedbackCardProps) {
  const pendingItems = feedbacks.filter((f) => f.status === 'submitted');

  return (
    <Card className="border border-border bg-card shadow-xs flex flex-col justify-between">
      <CardHeader className="p-4 sm:p-5 pb-3 flex flex-row items-center justify-between space-y-0">
        <CardTitle className="text-sm sm:text-base font-bold text-foreground flex items-center gap-2">
          <MessageSquare className="w-4 h-4 text-primary" />
          Feedback Awaiting Triage
        </CardTitle>
        <Link
          to="/reps/feedback"
          className="text-xs text-primary hover:underline flex items-center gap-0.5 font-medium"
        >
          <span>Triage Board</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </Link>
      </CardHeader>

      <CardContent className="p-4 sm:p-5 pt-0">
        {isLoading ? (
          <div className="space-y-3 py-2 animate-pulse">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 rounded-lg border border-border bg-muted/40" />
            ))}
          </div>
        ) : pendingItems.length === 0 ? (
          <div className="py-8 text-center rounded-lg border border-dashed border-border bg-muted/10 space-y-2">
            <CheckCircle2 className="w-7 h-7 text-emerald-600 dark:text-emerald-400 mx-auto" />
            <p className="text-xs font-medium text-foreground">Feedback inbox is all clear</p>
            <p className="text-[11px] text-muted-foreground">
              No new student complaints or suggestions are currently pending review.
            </p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {pendingItems.slice(0, 3).map((fb) => {
              const priorityMeta = getFeedbackPriorityMeta(fb.priority);
              const createdAt = fb.createdAt ? parseISO(fb.createdAt) : null;

              return (
                <Link
                  key={fb.id}
                  to="/reps/feedback"
                  className="block p-3 rounded-lg border border-border bg-muted/20 hover:bg-muted/40 transition-colors"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="space-y-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold text-foreground truncate block">
                          {fb.title}
                        </span>
                        {fb.isAnonymous && (
                          <Badge variant="outline" className="text-[9px] px-1 py-0 gap-0.5 text-muted-foreground">
                            <Shield className="w-2.5 h-2.5" />
                            Anon
                          </Badge>
                        )}
                      </div>

                      <p className="text-[11px] text-muted-foreground line-clamp-1">
                        {fb.content}
                      </p>

                      <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                        <span className="capitalize">{fb.category}</span>
                        <span>•</span>
                        {createdAt && (
                          <span className="font-mono">
                            {formatDistanceToNow(createdAt, { addSuffix: true })}
                          </span>
                        )}
                      </div>
                    </div>

                    <Badge
                      variant="outline"
                      className={`text-[9px] uppercase font-bold shrink-0 ${priorityMeta.badgeClass}`}
                    >
                      {priorityMeta.label}
                    </Badge>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

