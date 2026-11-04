import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';
import type { SecurityAuditLog } from '@/types/audit.types';
import { toast } from 'sonner';

interface AuditExportButtonProps {
  logs: SecurityAuditLog[];
  disabled?: boolean;
}

export function AuditExportButton({ logs, disabled = false }: AuditExportButtonProps) {
  const handleExportCsv = () => {
    if (!logs || logs.length === 0) {
      toast.error('No Logs to Export', {
        description: 'There are no audit logs matching your current filters.',
      });
      return;
    }

    try {
      const headers = [
        'Sequence Number',
        'Timestamp (UTC)',
        'Severity',
        'Action',
        'Resource',
        'Resource ID',
        'Actor Role',
        'Actor Email',
        'IP Address',
        'Previous Hash',
        'Current Hash',
      ];

      const rows = logs.map((log) => [
        log.sequenceNumber,
        `"${log.timestamp}"`,
        `"${log.severity}"`,
        `"${log.action}"`,
        `"${log.resource}"`,
        `"${log.resourceId || ''}"`,
        `"${log.actorRole}"`,
        `"${log.actorEmail || ''}"`,
        `"${log.ipAddress}"`,
        `"${log.previousHash}"`,
        `"${log.currentHash}"`,
      ]);

      const csvContent = [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);

      const link = document.createElement('a');
      link.setAttribute('href', url);
      const dateStr = new Date().toISOString().split('T')[0];
      link.setAttribute('download', `security-audit-trail-${dateStr}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast.success('Audit Log Exported', {
        description: `Exported ${logs.length} events to CSV for offline audit review.`,
      });
    } catch {
      toast.error('Export Failed', {
        description: 'Unable to generate CSV export.',
      });
    }
  };

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleExportCsv}
      disabled={disabled || logs.length === 0}
      className="h-9 gap-1.5 text-xs"
      aria-label="Export audit logs as CSV"
    >
      <Download className="w-4 h-4" />
      <span className="hidden sm:inline">Export CSV</span>
    </Button>
  );
}

