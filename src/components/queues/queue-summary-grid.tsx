import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import type { QueueStatsMap } from '@/types/queue.types';
import { CheckCircle2, Clock, PlayCircle, AlertTriangle } from 'lucide-react';

interface QueueSummaryGridProps {
  stats?: QueueStatsMap;
  isLoading?: boolean;
}

export function QueueSummaryGrid({ stats, isLoading }: QueueSummaryGridProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 animate-pulse">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-24 rounded-xl border border-border bg-card/60" />
        ))}
      </div>
    );
  }

  let totalActive = 0;
  let totalCompleted = 0;
  let totalFailed = 0;
  let totalWaiting = 0;

  if (stats) {
    Object.values(stats).forEach((q) => {
      totalActive += q.active || 0;
      totalCompleted += q.completed || 0;
      totalFailed += q.failed || 0;
      totalWaiting += (q.waiting || 0) + (q.delayed || 0);
    });
  }

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
      {/* Total Completed */}
      <Card className="border border-border bg-card">
        <CardHeader className="p-4 pb-2">
          <CardTitle className="text-xs font-medium text-muted-foreground">
            Completed Tasks
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 pt-0 flex items-center justify-between">
          <span className="text-2xl font-bold text-foreground">{totalCompleted}</span>
          <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
        </CardContent>
      </Card>

      {/* Currently Active */}
      <Card className="border border-amber-500/20 bg-amber-500/5">
        <CardHeader className="p-4 pb-2">
          <CardTitle className="text-xs font-medium text-amber-700 dark:text-amber-400">
            Active Processing
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 pt-0 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-2xl font-bold text-amber-600 dark:text-amber-400">
              {totalActive}
            </span>
            {totalActive > 0 && (
              <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />
            )}
          </div>
          <PlayCircle className="w-5 h-5 text-amber-500/70" />
        </CardContent>
      </Card>

      {/* Waiting in Queue */}
      <Card className="border border-border bg-card">
        <CardHeader className="p-4 pb-2">
          <CardTitle className="text-xs font-medium text-muted-foreground">
            Waiting in Queue
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 pt-0 flex items-center justify-between">
          <span className="text-2xl font-bold text-foreground">{totalWaiting}</span>
          <Clock className="w-5 h-5 text-muted-foreground/60" />
        </CardContent>
      </Card>

      {/* Errored / Failed */}
      <Card
        className={`border ${
          totalFailed > 0
            ? 'border-rose-500/30 bg-rose-500/5'
            : 'border-border bg-card'
        }`}
      >
        <CardHeader className="p-4 pb-2">
          <CardTitle
            className={`text-xs font-medium ${
              totalFailed > 0 ? 'text-rose-700 dark:text-rose-400' : 'text-muted-foreground'
            }`}
          >
            Failed / Stalled
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 pt-0 flex items-center justify-between">
          <span
            className={`text-2xl font-bold ${
              totalFailed > 0 ? 'text-destructive' : 'text-foreground'
            }`}
          >
            {totalFailed}
          </span>
          <AlertTriangle
            className={`w-5 h-5 ${
              totalFailed > 0 ? 'text-destructive' : 'text-muted-foreground/60'
            }`}
          />
        </CardContent>
      </Card>
    </div>
  );
}

