import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useVerifyAuditIntegrityMutation } from '@/hooks/use-audit-logs';
import type { AuditIntegrityReport } from '@/types/audit.types';
import {
  ShieldCheck,
  ShieldAlert,
  Hash,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  RefreshCw,
} from 'lucide-react';
import { format } from 'date-fns';

interface AuditIntegrityModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AuditIntegrityModal({ isOpen, onClose }: AuditIntegrityModalProps) {
  const [fromSeq, setFromSeq] = useState<string>('');
  const [toSeq, setToSeq] = useState<string>('');
  const [report, setReport] = useState<AuditIntegrityReport | null>(null);

  const verifyMutation = useVerifyAuditIntegrityMutation();

  const handleRunVerification = async () => {
    try {
      const payload: { fromSeq?: number; toSeq?: number } = {};
      if (fromSeq.trim()) payload.fromSeq = parseInt(fromSeq.trim(), 10);
      if (toSeq.trim()) payload.toSeq = parseInt(toSeq.trim(), 10);

      const res = await verifyMutation.mutateAsync(payload);
      setReport(res || null);
    } catch {
      // Handled by mutation toast
    }
  };

  const handleClose = () => {
    setReport(null);
    setFromSeq('');
    setToSeq('');
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="max-w-lg w-full p-4 sm:p-6">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg sm:text-xl font-bold">
            <Hash className="w-5 h-5 text-primary" />
            Cryptographic Audit Chain Verifier
          </DialogTitle>
          <DialogDescription className="text-xs sm:text-sm">
            Verify the mathematical integrity and sequence ordering of the SHA-256 hash chain to
            detect tampering or deletion of security events.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Sequence Range Scope */}
          <div className="grid grid-cols-2 gap-3 p-3 rounded-lg border border-border bg-muted/20">
            <div className="space-y-1">
              <Label htmlFor="from-seq" className="text-xs font-semibold">
                Start Sequence (Optional)
              </Label>
              <Input
                id="from-seq"
                type="number"
                placeholder="e.g. 1 (Genesis)"
                className="h-8 text-xs font-mono"
                value={fromSeq}
                onChange={(e) => setFromSeq(e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="to-seq" className="text-xs font-semibold">
                End Sequence (Optional)
              </Label>
              <Input
                id="to-seq"
                type="number"
                placeholder="e.g. Latest"
                className="h-8 text-xs font-mono"
                value={toSeq}
                onChange={(e) => setToSeq(e.target.value)}
              />
            </div>
          </div>

          {/* Action Trigger */}
          <Button
            type="button"
            onClick={handleRunVerification}
            disabled={verifyMutation.isPending}
            className="w-full gap-2 text-xs font-semibold"
          >
            {verifyMutation.isPending ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Verifying Hash Sequences...
              </>
            ) : (
              <>
                <RefreshCw className="w-4 h-4" />
                Run Cryptographic Verification
              </>
            )}
          </Button>

          {/* Verification Results Panel */}
          {report && (
            <div
              className={`p-4 rounded-xl border space-y-3 ${
                report.isIntact
                  ? 'border-emerald-500/30 bg-emerald-50/50 dark:bg-emerald-950/20'
                  : 'border-rose-500/30 bg-rose-50/50 dark:bg-rose-950/20'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {report.isIntact ? (
                    <ShieldCheck className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
                  ) : (
                    <ShieldAlert className="w-6 h-6 text-rose-600 dark:text-rose-400" />
                  )}
                  <div>
                    <h4 className="text-sm font-bold text-foreground">
                      {report.isIntact ? 'Audit Chain Intact' : 'Integrity Compromise Detected'}
                    </h4>
                    <p className="text-[11px] text-muted-foreground">
                      Verified at{' '}
                      {report.verifiedAt ? format(new Date(report.verifiedAt), 'PPpp') : 'Now'}
                    </p>
                  </div>
                </div>

                <Badge
                  variant={report.isIntact ? 'default' : 'destructive'}
                  className="font-mono text-xs uppercase"
                >
                  {report.isIntact ? 'Valid' : 'Tampered'}
                </Badge>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs pt-2 border-t border-border">
                <div className="flex justify-between py-0.5">
                  <span className="text-muted-foreground">Verified Records:</span>
                  <span className="font-mono font-semibold">{report.totalVerified}</span>
                </div>
                <div className="flex justify-between py-0.5">
                  <span className="text-muted-foreground">Unbroken Chain:</span>
                  <span className="font-mono font-semibold">{report.unbrokenChainLength}</span>
                </div>
                <div className="flex justify-between py-0.5">
                  <span className="text-muted-foreground">Genesis Hash:</span>
                  <span className="font-mono font-semibold flex items-center gap-1">
                    {report.genesisHashValid ? (
                      <>
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        Valid
                      </>
                    ) : (
                      <>
                        <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                        Invalid
                      </>
                    )}
                  </span>
                </div>
                <div className="flex justify-between py-0.5">
                  <span className="text-muted-foreground">Hash Algorithm:</span>
                  <span className="font-mono font-semibold">HMAC-SHA256</span>
                </div>
              </div>

              {report.errors && report.errors.length > 0 && (
                <div className="mt-2 p-2 rounded-md bg-rose-500/10 border border-rose-500/20 text-xs text-rose-700 dark:text-rose-400 space-y-1">
                  <p className="font-semibold flex items-center gap-1">
                    <AlertTriangle className="w-3.5 h-3.5" /> Integrity Violations:
                  </p>
                  <ul className="list-disc pl-4 space-y-0.5 text-[11px]">
                    {report.errors.map((err, i) => (
                      <li key={i}>{err}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>

        <DialogFooter className="sm:justify-end">
          <Button variant="outline" size="sm" onClick={handleClose}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

