import { useState } from 'react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import type { SecurityAuditLog } from '@/types/audit.types';
import {
  getAuditSeverityMeta,
  formatAuditAction,
  getActionCategory,
} from '@/lib/audit-validation';
import {
  Shield,
  Clock,
  User,
  Globe,
  Hash,
  Copy,
  Check,
  FileCode,
  Layers,
} from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';

interface AuditDetailsSheetProps {
  log: SecurityAuditLog | null;
  isOpen: boolean;
  onClose: () => void;
}

export function AuditDetailsSheet({ log, isOpen, onClose }: AuditDetailsSheetProps) {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  if (!log) return null;

  const severityMeta = getAuditSeverityMeta(log.severity);
  const actionCategory = getActionCategory(log.action);

  const copyToClipboard = (text: string, key: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    toast.success(`${label} Copied`, {
      description: 'Copied to clipboard.',
    });
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const isGenesis = log.previousHash === '0'.repeat(64);

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <SheetContent className="sm:max-w-xl w-full overflow-y-auto p-4 sm:p-6 space-y-6">
        <SheetHeader className="space-y-2">
          <div className="flex items-center justify-between">
            <Badge variant="outline" className={`font-mono text-xs ${severityMeta.badgeClass}`}>
              {severityMeta.label.toUpperCase()}
            </Badge>
            <span className="text-xs font-mono font-semibold text-muted-foreground">
              Seq #{log.sequenceNumber}
            </span>
          </div>

          <SheetTitle className="text-lg sm:text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <Shield className="w-5 h-5 text-primary shrink-0" />
            {formatAuditAction(log.action)}
          </SheetTitle>

          <SheetDescription className="text-xs text-muted-foreground flex items-center gap-2">
            <span>{actionCategory}</span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" />
              {log.timestamp ? format(new Date(log.timestamp), 'PPpp') : 'Unknown Date'}
            </span>
          </SheetDescription>
        </SheetHeader>

        {/* Actor Identity & Context */}
        <div className="space-y-3">
          <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
            <User className="w-4 h-4 text-primary" /> Actor & Origin Context
          </h4>
          <div className="grid grid-cols-2 gap-2 text-xs p-3 rounded-lg border border-border bg-muted/20">
            <div>
              <span className="text-muted-foreground block text-[11px]">Actor Role</span>
              <span className="font-semibold text-foreground font-mono">{log.actorRole}</span>
            </div>
            <div>
              <span className="text-muted-foreground block text-[11px]">Actor Email</span>
              <span className="font-medium text-foreground truncate block">
                {log.actorEmail || 'System / Unauthenticated'}
              </span>
            </div>
            <div>
              <span className="text-muted-foreground block text-[11px]">IP Address</span>
              <span className="font-mono font-medium text-foreground flex items-center gap-1">
                <Globe className="w-3 h-3 text-muted-foreground" />
                {log.ipAddress}
              </span>
            </div>
            <div>
              <span className="text-muted-foreground block text-[11px]">Actor ID</span>
              <span className="font-mono text-muted-foreground text-[11px] truncate block">
                {log.actorId || 'N/A'}
              </span>
            </div>
            {log.userAgent && (
              <div className="col-span-2 pt-1 border-t border-border">
                <span className="text-muted-foreground block text-[11px]">User Agent</span>
                <span className="font-mono text-muted-foreground text-[11px] break-all block">
                  {log.userAgent}
                </span>
              </div>
            )}
          </div>
        </div>

        <Separator />

        {/* Target Resource */}
        <div className="space-y-3">
          <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
            <Layers className="w-4 h-4 text-primary" /> Target Resource
          </h4>
          <div className="flex items-center justify-between p-3 rounded-lg border border-border bg-muted/20 text-xs">
            <div>
              <span className="text-muted-foreground block text-[11px]">Resource Domain</span>
              <span className="font-mono font-semibold text-foreground">{log.resource}</span>
            </div>
            {log.resourceId && (
              <div className="text-right">
                <span className="text-muted-foreground block text-[11px]">Resource ID</span>
                <span className="font-mono font-medium text-foreground">{log.resourceId}</span>
              </div>
            )}
          </div>
        </div>

        <Separator />

        {/* Cryptographic Proof: SHA-256 Hashes */}
        <div className="space-y-3">
          <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
            <Hash className="w-4 h-4 text-primary" /> Cryptographic Chain Proof
          </h4>
          <div className="space-y-2 p-3 rounded-lg border border-border bg-muted/10 font-mono text-xs">
            {/* Previous Hash */}
            <div>
              <div className="flex items-center justify-between pb-1">
                <span className="text-muted-foreground text-[11px]">
                  Previous Hash {isGenesis && '(Genesis Block)'}
                </span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-5 w-5"
                  onClick={() => copyToClipboard(log.previousHash, 'prevHash', 'Previous Hash')}
                  title="Copy Previous Hash"
                >
                  {copiedKey === 'prevHash' ? (
                    <Check className="w-3 h-3 text-emerald-600" />
                  ) : (
                    <Copy className="w-3 h-3 text-muted-foreground" />
                  )}
                </Button>
              </div>
              <div className="p-2 rounded bg-background border border-border text-[11px] break-all select-all">
                {log.previousHash}
              </div>
            </div>

            {/* Current Hash */}
            <div className="pt-2 border-t border-border">
              <div className="flex items-center justify-between pb-1">
                <span className="text-muted-foreground text-[11px]">Current Hash</span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-5 w-5"
                  onClick={() => copyToClipboard(log.currentHash, 'currHash', 'Current Hash')}
                  title="Copy Current Hash"
                >
                  {copiedKey === 'currHash' ? (
                    <Check className="w-3 h-3 text-emerald-600" />
                  ) : (
                    <Copy className="w-3 h-3 text-muted-foreground" />
                  )}
                </Button>
              </div>
              <div className="p-2 rounded bg-background border border-border text-[11px] break-all select-all font-semibold text-primary">
                {log.currentHash}
              </div>
            </div>
          </div>
        </div>

        <Separator />

        {/* Detailed JSON Payload */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
              <FileCode className="w-4 h-4 text-primary" /> Event Details Payload
            </h4>
            <Button
              variant="outline"
              size="sm"
              className="h-6 text-[11px] gap-1"
              onClick={() =>
                copyToClipboard(JSON.stringify(log.details, null, 2), 'payload', 'Details Payload')
              }
            >
              {copiedKey === 'payload' ? (
                <Check className="w-3 h-3 text-emerald-600" />
              ) : (
                <Copy className="w-3 h-3" />
              )}
              Copy JSON
            </Button>
          </div>

          <div className="p-3 rounded-lg border border-border bg-slate-950 text-slate-100 font-mono text-xs overflow-x-auto max-h-60">
            <pre className="text-[11px]">
              {log.details && Object.keys(log.details).length > 0
                ? JSON.stringify(log.details, null, 2)
                : '// No additional payload metadata'}
            </pre>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

