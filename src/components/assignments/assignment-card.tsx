import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useDownloadAssignmentSpec } from '@/hooks/use-assignments';
import { isPastDeadline, formatDeadlineRemaining, getDeadlineStatusMeta } from '@/lib/assignment-validation';
import type { Assignment } from '@/types';
import {
  Calendar,
  Clock,
  FileDown,
  UploadCloud,
  CheckCircle2,
  Users,
  Edit2,
  Trash2,
  Loader2,
  XCircle,
} from 'lucide-react';

interface AssignmentCardProps {
  assignment: Assignment;
  isRep?: boolean;
  onEdit?: (assignment: Assignment) => void;
  onDelete?: (assignment: Assignment) => void;
  onViewSubmissions?: (assignment: Assignment) => void;
  onSubmit?: (assignment: Assignment) => void;
  onWithdraw?: (submissionId: string, fileName?: string | null, assignmentTitle?: string) => void;
}

export function AssignmentCard({
  assignment,
  isRep = false,
  onEdit,
  onDelete,
  onViewSubmissions,
  onSubmit,
  onWithdraw,
}: AssignmentCardProps) {
  const { downloadSpec, isDownloading: isDownloadingSpec } = useDownloadAssignmentSpec();

  const isExpired = isPastDeadline(assignment.deadline);
  const hasSubmitted = assignment.hasSubmitted || Boolean(assignment.studentSubmission);
  const statusMeta = getDeadlineStatusMeta(assignment.deadline, hasSubmitted);

  return (
    <Card className="flex flex-col justify-between border-border bg-card transition-shadow hover:shadow-md">
      <CardContent className="p-5 space-y-4">
        {/* Top Header Row */}
        <div className="space-y-2">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <div className="flex items-center gap-1.5 flex-wrap">
              <Badge className="font-mono text-[10px] bg-primary text-primary-foreground font-bold">
                {assignment.courseId}
              </Badge>
              <Badge
                variant={statusMeta.badgeVariant}
                className={`text-[10px] font-semibold border ${statusMeta.colorClass}`}
              >
                {statusMeta.label}
              </Badge>
            </div>

            {/* Rep Actions (Edit / Delete) */}
            {isRep && (
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-muted-foreground hover:text-foreground"
                  onClick={() => onEdit?.(assignment)}
                  title="Edit Assignment"
                >
                  <Edit2 className="h-3.5 w-3.5" />
                  <span className="sr-only">Edit</span>
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-destructive hover:bg-destructive/10 hover:text-destructive"
                  onClick={() => onDelete?.(assignment)}
                  title="Delete Assignment"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  <span className="sr-only">Delete</span>
                </Button>
              </div>
            )}
          </div>

          <h3 className="font-bold text-base text-foreground leading-snug line-clamp-2" title={assignment.title}>
            {assignment.title}
          </h3>

          <p className="text-xs text-muted-foreground line-clamp-3 leading-relaxed">
            {assignment.description}
          </p>
        </div>

        {/* Specification attachment notice */}
        {assignment.fileName && (
          <div className="flex items-center justify-between p-2 rounded-lg border border-border bg-muted/40 text-xs">
            <span className="text-muted-foreground truncate max-w-[200px]" title={assignment.fileName}>
              Brief: {assignment.fileName}
            </span>
            <Button
              variant="outline"
              size="sm"
              className="h-6 text-[11px] gap-1 px-2"
              onClick={() => downloadSpec(assignment.id, assignment.fileName || 'brief')}
              disabled={isDownloadingSpec}
              title="Download specification brief"
            >
              {isDownloadingSpec ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                <FileDown className="h-3 w-3" />
              )}
              Download Brief
            </Button>
          </div>
        )}

        {/* Deadline & Submissions Metadata Bar */}
        <div className="pt-2 border-t border-border/60 flex items-center justify-between text-xs text-muted-foreground">
          <div className="flex items-center gap-1.5" title={new Date(assignment.deadline).toLocaleString()}>
            <Calendar className="h-3.5 w-3.5" />
            <span>{new Date(assignment.deadline).toLocaleDateString()}</span>
          </div>

          <div className="flex items-center gap-1 font-medium">
            <Clock className="h-3 w-3" />
            <span className={isExpired ? 'text-destructive font-semibold' : ''}>
              {formatDeadlineRemaining(assignment.deadline)}
            </span>
          </div>
        </div>

        {/* Student Submission Status details */}
        {!isRep && (
          <div className="pt-2 border-t border-border/60">
            {hasSubmitted ? (
              <div className="flex items-center justify-between text-xs bg-emerald-500/10 p-2.5 rounded-lg border border-emerald-500/20 text-emerald-700 dark:text-emerald-400">
                <div className="flex items-center gap-1.5 min-w-0 pr-2">
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
                  <span className="truncate">
                    Submitted: {assignment.studentSubmission?.fileName || 'Solution file'}
                  </span>
                </div>
                {!isExpired && assignment.studentSubmission?.id && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 text-[10px] text-destructive hover:bg-destructive/10 px-1.5"
                    onClick={() =>
                      onWithdraw?.(
                        assignment.studentSubmission!.id,
                        assignment.studentSubmission?.fileName,
                        assignment.title,
                      )
                    }
                    title="Withdraw solution before deadline"
                  >
                    <XCircle className="mr-1 h-3 w-3" />
                    Withdraw
                  </Button>
                )}
              </div>
            ) : isExpired ? (
              <div className="p-2 text-center text-xs text-muted-foreground bg-muted/40 rounded-lg">
                Submissions closed
              </div>
            ) : null}
          </div>
        )}

        {/* Footer Actions */}
        <div className="pt-2 border-t border-border/60">
          {isRep ? (
            <Button
              className="w-full text-xs font-semibold h-8 gap-1.5"
              onClick={() => onViewSubmissions?.(assignment)}
            >
              <Users className="h-3.5 w-3.5" />
              <span>
                View Submissions ({assignment.submissionCount ?? 0})
              </span>
            </Button>
          ) : (
            <Button
              className="w-full text-xs font-semibold h-8 gap-1.5"
              onClick={() => onSubmit?.(assignment)}
              disabled={isExpired}
              variant={hasSubmitted ? 'outline' : 'default'}
            >
              <UploadCloud className="h-3.5 w-3.5" />
              <span>
                {isExpired
                  ? 'Submissions Closed'
                  : hasSubmitted
                  ? 'Re-Submit Solution'
                  : 'Submit Solution'}
              </span>
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
