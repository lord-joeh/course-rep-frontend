import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type { Feedback } from '@/types';
import {
  getFeedbackStatusMeta,
  getFeedbackCategoryMeta,
  getFeedbackPriorityMeta,
} from '@/lib/feedback-validation';
import {
  Shield,
  User,
  Clock,
  MoreVertical,
  Trash2,
  ExternalLink,
  MessageSquareReply,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface FeedbackCardProps {
  feedback: Feedback;
  onClick: () => void;
  isRep?: boolean;
  onDelete?: (feedback: Feedback) => void;
}

export const FeedbackCard: React.FC<FeedbackCardProps> = ({
  feedback,
  onClick,
  isRep = false,
  onDelete,
}) => {
  const statusMeta = getFeedbackStatusMeta(feedback.status);
  const categoryMeta = getFeedbackCategoryMeta(feedback.category);
  const priorityMeta = getFeedbackPriorityMeta(feedback.priority);
  const CategoryIcon = categoryMeta.icon;
  const StatusIcon = statusMeta.icon;

  const timeAgo = formatDistanceToNow(new Date(feedback.createdAt), {
    addSuffix: true,
  });

  return (
    <Card
      onClick={onClick}
      className="group transition-all duration-200 hover:border-primary/50 hover:shadow-md cursor-pointer border border-border bg-card text-card-foreground flex flex-col justify-between"
      data-testid={`feedback-card-${feedback.id}`}
    >
      <CardHeader className="p-4 sm:p-5 pb-3 space-y-2.5">
        {/* Top Badges Row */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 flex-wrap">
            {/* Category Badge */}
            <Badge
              variant="outline"
              className={`text-[10px] px-2 py-0.5 gap-1 border font-medium ${categoryMeta.badgeClass}`}
            >
              <CategoryIcon className="w-3 h-3" />
              <span>{categoryMeta.label}</span>
            </Badge>

            {/* Priority Badge */}
            <Badge
              variant="outline"
              className={`text-[10px] px-1.5 py-0.5 border ${priorityMeta.badgeClass}`}
            >
              {priorityMeta.label}
            </Badge>

            {/* Course Tag */}
            {feedback.course && (
              <Badge variant="secondary" className="text-[10px] px-1.5 py-0.5 font-mono">
                {feedback.course.id}
              </Badge>
            )}
          </div>

          <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
            {/* Status Pill */}
            <Badge
              variant="outline"
              className={`text-[10px] px-2 py-0.5 gap-1 border font-semibold ${statusMeta.badgeClass}`}
            >
              <StatusIcon className="w-3 h-3" />
              <span>{statusMeta.label}</span>
            </Badge>

            {/* Rep Context Actions */}
            {isRep && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-muted-foreground hover:text-foreground"
                    aria-label="Feedback options"
                  >
                    <MoreVertical className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="text-xs">
                  <DropdownMenuItem onClick={onClick} className="gap-2">
                    <ExternalLink className="w-3.5 h-3.5" />
                    Review & Triage
                  </DropdownMenuItem>
                  {onDelete && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={() => onDelete(feedback)}
                        className="gap-2 text-destructive focus:text-destructive"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        Delete Feedback
                      </DropdownMenuItem>
                    </>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </div>

        {/* Title */}
        <CardTitle className="text-sm sm:text-base font-bold text-foreground line-clamp-1 leading-snug group-hover:text-primary transition-colors">
          {feedback.title}
        </CardTitle>
      </CardHeader>

      <CardContent className="p-4 sm:p-5 pt-0 space-y-3">
        {/* Content Preview */}
        <p className="text-xs sm:text-sm text-muted-foreground line-clamp-2 leading-relaxed">
          {feedback.content}
        </p>

        {/* Rep Response Callout Banner (if answered) */}
        {feedback.repResponse && (
          <div className="rounded-lg border border-primary/20 bg-primary/5 p-2.5 space-y-1 text-xs">
            <div className="flex items-center gap-1.5 font-semibold text-primary text-[11px]">
              <MessageSquareReply className="w-3.5 h-3.5" />
              <span>Course Rep Response</span>
            </div>
            <p className="text-[11px] sm:text-xs text-foreground line-clamp-2 italic">
              &quot;{feedback.repResponse}&quot;
            </p>
          </div>
        )}

        {/* Card Footer Meta */}
        <div className="flex items-center justify-between text-[11px] text-muted-foreground pt-1 border-t border-border/60">
          {/* Author Badge */}
          <div className="flex items-center gap-1.5 min-w-0">
            {feedback.isAnonymous ? (
              <span className="inline-flex items-center gap-1 font-medium text-muted-foreground">
                <Shield className="w-3 h-3 text-primary" />
                <span>Anonymous Student</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 font-medium text-foreground truncate">
                <User className="w-3 h-3 text-muted-foreground" />
                <span className="truncate">{feedback.student?.name || 'Registered Student'}</span>
              </span>
            )}
          </div>

          {/* Time Ago */}
          <div className="flex items-center gap-1 shrink-0 text-muted-foreground">
            <Clock className="w-3 h-3" />
            <span>{timeAgo}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

