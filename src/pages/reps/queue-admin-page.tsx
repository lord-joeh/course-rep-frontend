import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { useQueueStatsQuery } from '@/hooks/use-queue-admin';
import { QueueSummaryGrid } from '@/components/queues/queue-summary-grid';
import { QueueWorkerCard } from '@/components/queues/queue-worker-card';
import { BullBoardLinkButton } from '@/components/queues/bull-board-link-button';
import { TestEmailDialog } from '@/components/queues/test-email-dialog';
import { TestSmsDialog } from '@/components/queues/test-sms-dialog';
import { QUEUE_REGISTRY } from '@/lib/queue-validation';
import {
  Activity,
  RefreshCw,
  Mail,
  MessageSquare,
  Server,
  Zap,
} from 'lucide-react';

export function QueueAdminPage() {
  const [refreshInterval, setRefreshInterval] = useState<number | false>(10000);
  const [testModalQueue, setTestModalQueue] = useState<'email' | 'sms' | null>(null);

  const {
    data: stats,
    isLoading,
    refetch,
    isRefetching,
  } = useQueueStatsQuery(refreshInterval);

  const handleOpenTest = (queueKey: string) => {
    if (queueKey === 'email') setTestModalQueue('email');
    if (queueKey === 'sms') setTestModalQueue('sms');
  };

  return (
    <div className="space-y-6 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground flex items-center gap-2">
              <Activity className="w-7 h-7 text-primary shrink-0" />
              BullMQ Queue Administration
            </h1>
            <Badge variant="secondary" className="font-mono text-xs font-semibold">
              4 Queues Active
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Real-time Redis/BullMQ worker orchestration dashboard monitoring background job
            processing across Email, SMS, Google Drive sync, and Attendance batch pipelines.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Polling Interval Selector */}
          <div className="flex items-center gap-1.5 border border-border rounded-lg px-2 py-1 bg-background text-xs">
            <span className="text-muted-foreground text-[11px] hidden sm:inline">Auto-refresh:</span>
            <select
              className="bg-transparent border-0 text-xs font-medium focus:outline-none cursor-pointer"
              value={refreshInterval === false ? 'off' : refreshInterval}
              onChange={(e) => {
                const val = e.target.value;
                setRefreshInterval(val === 'off' ? false : Number(val));
              }}
              aria-label="Select auto-refresh interval"
            >
              <option value="5000">Every 5s</option>
              <option value="10000">Every 10s</option>
              <option value="30000">Every 30s</option>
              <option value="off">Off (Manual)</option>
            </select>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            disabled={isRefetching}
            className="h-9 gap-1.5 text-xs"
            aria-label="Refresh queue metrics"
          >
            <RefreshCw className={`w-4 h-4 ${isRefetching ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Refresh</span>
          </Button>

          {/* Test Probes Dropdown / Fast Buttons */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setTestModalQueue('email')}
            className="h-9 gap-1.5 text-xs"
          >
            <Mail className="w-4 h-4 text-primary" />
            <span className="hidden sm:inline">Probe Email</span>
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setTestModalQueue('sms')}
            className="h-9 gap-1.5 text-xs"
          >
            <MessageSquare className="w-4 h-4 text-primary" />
            <span className="hidden sm:inline">Probe SMS</span>
          </Button>

          {/* Direct Bull-Board Management Console Link */}
          <BullBoardLinkButton />
        </div>
      </div>

      {/* Aggregate Overview Grid */}
      <QueueSummaryGrid stats={stats} isLoading={isLoading} />

      {/* Individual Worker Queue Cards */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-base sm:text-lg font-bold tracking-tight text-foreground flex items-center gap-2">
            <Server className="w-5 h-5 text-primary" />
            Active Background Workers
          </h2>
          <span className="text-xs text-muted-foreground">
            Redis-backed persistent queues with exponential backoff & auto-retry
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <QueueWorkerCard
            queueMeta={QUEUE_REGISTRY.email}
            counts={stats?.email}
            onOpenTest={handleOpenTest}
          />
          <QueueWorkerCard
            queueMeta={QUEUE_REGISTRY.sms}
            counts={stats?.sms}
            onOpenTest={handleOpenTest}
          />
          <QueueWorkerCard
            queueMeta={QUEUE_REGISTRY['drive-sync']}
            counts={stats?.['drive-sync']}
            onOpenTest={handleOpenTest}
          />
          <QueueWorkerCard
            queueMeta={QUEUE_REGISTRY.attendance}
            counts={stats?.attendance}
            onOpenTest={handleOpenTest}
          />
        </div>
      </div>

      {/* Architecture & Worker Diagnostics Notes */}
      <Card className="border border-border bg-muted/10">
        <CardHeader className="p-4 sm:p-5 pb-2">
          <CardTitle className="text-sm font-semibold flex items-center gap-2 text-foreground">
            <Zap className="w-4 h-4 text-primary" /> BullMQ Infrastructure & Reliability Policy
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 sm:p-5 pt-0 text-xs text-muted-foreground space-y-2">
          <p>
            • <strong>Automatic Retries:</strong> SMS and Attendance jobs utilize fixed and
            exponential backoff (up to 3 attempts) with error tracking in the Security Audit Log.
          </p>
          <p>
            • <strong>Pruning & Retention:</strong> Completed jobs are automatically removed after 24
            hours; failed jobs are retained for 7 days in Redis for diagnostic inspection and
            manual retry.
          </p>
          <p>
            • <strong>Direct Console Access:</strong> For granular Redis-level inspection, click the{' '}
            <strong className="text-foreground">Bull-Board Console</strong> button above to access
            job payloads, pause queues, and inspect raw error stack traces.
          </p>
        </CardContent>
      </Card>

      {/* Test Probe Modals */}
      <TestEmailDialog
        isOpen={testModalQueue === 'email'}
        onClose={() => setTestModalQueue(null)}
      />

      <TestSmsDialog
        isOpen={testModalQueue === 'sms'}
        onClose={() => setTestModalQueue(null)}
      />
    </div>
  );
}

