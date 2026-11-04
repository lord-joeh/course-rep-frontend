import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Link } from 'react-router-dom';
import type { Assignment } from '@/types/assignment.types';
import { ClipboardList, Clock, ChevronRight, Inbox, AlertCircle } from 'lucide-react';
import { formatDistanceToNow, isPast, parseISO } from 'date-fns';

interface DeadlineTickerCardProps {
  assignments: Assignment[];
  isLoading?: boolean;
  viewAllHref: string;
}

export function DeadlineTickerCard({
  assignments,
  isLoading,
  viewAllHref,
}: DeadlineTickerCardProps) {
  return (
    <Card className="border border-border bg-card shadow-xs flex flex-col justify-between">
      <CardHeader className="p-4 sm:p-5 pb-3 flex flex-row items-center justify-between space-y-0">
        <CardTitle className="text-sm sm:text-base font-bold text-foreground flex items-center gap-2">
          <ClipboardList className="w-4 h-4 text-primary" />
          Assignment Deadlines
        </CardTitle>
        <Link
          to={viewAllHref}
          className="text-xs text-primary hover:underline flex items-center gap-0.5 font-medium"
        >
          <span>View All</span>
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
        ) : assignments.length === 0 ? (
          <div className="py-8 text-center rounded-lg border border-dashed border-border bg-muted/10 space-y-2">
            <Inbox className="w-7 h-7 text-muted-foreground/50 mx-auto" />
            <p className="text-xs font-medium text-foreground">No pending deadlines</p>
            <p className="text-[11px] text-muted-foreground">
              All coursework is up to date or no active submissions are due.
            </p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {assignments.slice(0, 4).map((asgn) => {
              const deadlineDate = asgn.deadline ? parseISO(asgn.deadline) : null;
              const isOverdue = deadlineDate ? isPast(deadlineDate) : false;

              return (
                <div
                  key={asgn.id}
                  className="flex items-start justify-between gap-3 p-3 rounded-lg border border-border bg-muted/20 hover:bg-muted/40 transition-colors"
                >
                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-bold text-foreground truncate block">
                        {asgn.title}
                      </span>
                      {asgn.course?.id && (
                        <Badge variant="outline" className="text-[10px] font-mono px-1.5 py-0">
                          {asgn.course.id}
                        </Badge>
                      )}
                    </div>

                    <div className="flex items-center gap-1.5 text-[11px]">
                      {deadlineDate && (
                        <span
                          className={`flex items-center gap-1 font-mono ${
                            isOverdue
                              ? 'text-destructive font-semibold'
                              : 'text-amber-600 dark:text-amber-400 font-medium'
                          }`}
                        >
                          {isOverdue ? (
                            <AlertCircle className="w-3 h-3 text-destructive" />
                          ) : (
                            <Clock className="w-3 h-3 text-amber-500" />
                          )}
                          {isOverdue
                            ? 'Overdue'
                            : `Due ${formatDistanceToNow(deadlineDate, { addSuffix: true })}`}
                        </span>
                      )}
                    </div>
                  </div>

                  <Badge
                    variant={isOverdue ? 'destructive' : 'secondary'}
                    className="text-[10px] shrink-0 font-medium"
                  >
                    {asgn.submissionCount !== undefined
                      ? `${asgn.submissionCount} subs`
                      : 'Active'}
                  </Badge>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

