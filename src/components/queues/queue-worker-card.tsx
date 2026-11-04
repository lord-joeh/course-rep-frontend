import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import type { BullJobCounts, QueueMeta } from '@/types/queue.types';
import { calculateQueueHealth, getQueueHealthMeta } from '@/lib/queue-validation';
import {
  Mail,
  MessageSquare,
  HardDrive,
  QrCode,
  Layers,
  Send,
} from 'lucide-react';

interface QueueWorkerCardProps {
  queueMeta: QueueMeta;
  counts?: BullJobCounts;
  onOpenTest?: (queueKey: string) => void;
}

export function QueueWorkerCard({ queueMeta, counts, onOpenTest }: QueueWorkerCardProps) {
  const healthState = calculateQueueHealth(counts);
  const healthMeta = getQueueHealthMeta(healthState);

  const active = counts?.active || 0;
  const waiting = (counts?.waiting || 0) + (counts?.delayed || 0);
  const completed = counts?.completed || 0;
  const failed = counts?.failed || 0;
  const total = active + waiting + completed + failed;

  const completionRate = total > 0 ? Math.round((completed / total) * 100) : 100;

  const renderIcon = () => {
    switch (queueMeta.iconName) {
      case 'Mail':
        return <Mail className="w-5 h-5 text-primary" />;
      case 'MessageSquare':
        return <MessageSquare className="w-5 h-5 text-primary" />;
      case 'HardDrive':
        return <HardDrive className="w-5 h-5 text-primary" />;
      case 'QrCode':
        return <QrCode className="w-5 h-5 text-primary" />;
      default:
        return <Layers className="w-5 h-5 text-primary" />;
    }
  };

  const hasTestProbe = queueMeta.key === 'email' || queueMeta.key === 'sms';

  return (
    <Card className="border border-border bg-card shadow-xs flex flex-col justify-between">
      <CardHeader className="p-4 sm:p-5 pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-primary/10 border border-primary/20 shrink-0">
              {renderIcon()}
            </div>
            <div>
              <CardTitle className="text-sm sm:text-base font-bold text-foreground">
                {queueMeta.name}
              </CardTitle>
              <span className="font-mono text-[11px] text-muted-foreground uppercase">
                queue: {queueMeta.key}
              </span>
            </div>
          </div>

          <Badge variant="outline" className={`text-xs gap-1.5 shrink-0 ${healthMeta.badgeClass}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${healthMeta.dotClass}`} />
            {healthMeta.label}
          </Badge>
        </div>

        <CardDescription className="text-xs text-muted-foreground mt-2 line-clamp-2">
          {queueMeta.description}
        </CardDescription>
      </CardHeader>

      <CardContent className="p-4 sm:p-5 pt-0 space-y-4">
        {/* Job Breakdown Matrix */}
        <div className="grid grid-cols-4 gap-2 text-center p-2.5 rounded-lg border border-border bg-muted/20 text-xs">
          <div>
            <span className="text-[10px] text-muted-foreground block font-medium">Active</span>
            <span className="font-mono font-bold text-amber-600 dark:text-amber-400 text-sm">
              {active}
            </span>
          </div>
          <div>
            <span className="text-[10px] text-muted-foreground block font-medium">Waiting</span>
            <span className="font-mono font-bold text-foreground text-sm">{waiting}</span>
          </div>
          <div>
            <span className="text-[10px] text-muted-foreground block font-medium">Completed</span>
            <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400 text-sm">
              {completed}
            </span>
          </div>
          <div>
            <span className="text-[10px] text-muted-foreground block font-medium">Failed</span>
            <span
              className={`font-mono font-bold text-sm ${
                failed > 0 ? 'text-destructive font-black' : 'text-muted-foreground'
              }`}
            >
              {failed}
            </span>
          </div>
        </div>

        {/* Progress Rate */}
        <div className="space-y-1">
          <div className="flex justify-between text-[11px] text-muted-foreground">
            <span>Processed Ratio</span>
            <span className="font-mono font-semibold">{completionRate}%</span>
          </div>
          <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
            <div
              className={`h-full transition-all duration-300 ${
                failed > 0 ? 'bg-amber-500' : 'bg-primary'
              }`}
              style={{ width: `${completionRate}%` }}
            />
          </div>
        </div>

        {/* Action Controls */}
        {hasTestProbe && onOpenTest && (
          <div className="pt-1 border-t border-border flex justify-end">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onOpenTest(queueMeta.key)}
              className="h-8 gap-1.5 text-xs w-full sm:w-auto"
              aria-label={`Dispatch test probe for ${queueMeta.name}`}
            >
              <Send className="w-3.5 h-3.5 text-primary" />
              <span>Dispatch Test Probe</span>
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

