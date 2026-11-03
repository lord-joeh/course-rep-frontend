import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  useGoogleStatusQuery,
  useGoogleAuthUrlQuery,
  useRevokeGoogleAccessMutation,
} from '@/hooks/use-google-vault';
import {
  HardDrive,
  CheckCircle2,
  XCircle,
  ExternalLink,
  ShieldCheck,
  AlertTriangle,
  Loader2,
  RefreshCw,
} from 'lucide-react';

export function GoogleStatusCard() {
  const [revokeDialogOpen, setRevokeDialogOpen] = useState(false);

  const { data: status, isLoading, isFetching, refetch } = useGoogleStatusQuery();
  const { data: authData, isLoading: isLoadingAuthUrl, refetch: refetchAuthUrl } =
    useGoogleAuthUrlQuery(false);

  const revokeMutation = useRevokeGoogleAccessMutation(() => {
    setRevokeDialogOpen(false);
  });

  const handleConnect = async () => {
    const res = await refetchAuthUrl();
    const url = res.data?.authUrl || authData?.authUrl;
    if (url) {
      window.open(url, '_blank', 'noopener,noreferrer');
    }
  };

  const isConnected = status?.connected === true;
  const expiryFormatted = status?.expiryDate
    ? new Date(status.expiryDate).toLocaleString()
    : 'Auto-refresh active (Offline)';

  return (
    <>
      <Card className="border-border bg-card">
        <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <HardDrive className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <CardTitle className="text-base font-bold text-foreground">
                  Google Drive Cloud Vault
                </CardTitle>
                <Badge
                  variant={isConnected ? 'default' : 'secondary'}
                  className={
                    isConnected
                      ? 'bg-emerald-600 text-white font-semibold text-xs'
                      : 'text-xs text-muted-foreground'
                  }
                >
                  {isConnected ? (
                    <>
                      <CheckCircle2 className="mr-1 h-3.5 w-3.5" />
                      Connected
                    </>
                  ) : (
                    <>
                      <XCircle className="mr-1 h-3.5 w-3.5" />
                      Disconnected
                    </>
                  )}
                </Badge>
              </div>
              <CardDescription className="text-xs text-muted-foreground mt-0.5">
                Centralized Google Drive API integration for course slides and material storage.
              </CardDescription>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={() => refetch()}
              disabled={isFetching}
              title="Refresh status"
            >
              <RefreshCw className={`h-4 w-4 ${isFetching ? 'animate-spin' : ''}`} />
            </Button>
            {isConnected ? (
              <Button
                variant="destructive"
                size="sm"
                className="text-xs"
                onClick={() => setRevokeDialogOpen(true)}
              >
                Disconnect Vault
              </Button>
            ) : (
              <Button
                size="sm"
                className="text-xs"
                onClick={handleConnect}
                disabled={isLoadingAuthUrl}
              >
                {isLoadingAuthUrl ? (
                  <>
                    <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                    Connecting...
                  </>
                ) : (
                  <>
                    <ExternalLink className="mr-1.5 h-3.5 w-3.5" />
                    Connect Google Drive
                  </>
                )}
              </Button>
            )}
          </div>
        </CardHeader>

        <CardContent className="pt-4 space-y-4 text-xs">
          {/* Key metadata grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-muted-foreground">
            <div className="p-3 rounded-lg border border-border bg-background">
              <span className="font-semibold text-foreground block mb-0.5">Vault Status:</span>
              <span>
                {isLoading
                  ? 'Checking connection...'
                  : isConnected
                  ? 'Active & Ready for Course Slides Distribution'
                  : 'Account not linked. Course slide distribution requires authorization.'}
              </span>
            </div>

            <div className="p-3 rounded-lg border border-border bg-background">
              <span className="font-semibold text-foreground block mb-0.5">Access Token Refresh:</span>
              <span className="font-mono">{expiryFormatted}</span>
            </div>
          </div>

          {/* Institutional Security Notice */}
          <div className="flex items-start gap-2.5 rounded-lg border border-primary/20 bg-primary/5 p-3 text-foreground">
            <ShieldCheck className="h-4 w-4 text-primary shrink-0 mt-0.5" />
            <div className="text-[11px] leading-relaxed text-muted-foreground">
              <strong className="text-foreground font-semibold">Institutional Security Protocol: </strong>
              Google OAuth refresh tokens and secrets are stored in PostgreSQL encrypted with AES-256-GCM.
              Authorization flows enforce Redis single-use CSRF tokens with automatic non-blocking silent token rotation.
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Revocation Confirmation Dialog */}
      <Dialog open={revokeDialogOpen} onOpenChange={setRevokeDialogOpen}>
        <DialogContent className="sm:max-w-[420px]">
          <DialogHeader>
            <div className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-destructive/10 text-destructive">
                <AlertTriangle className="h-5 w-5" />
              </div>
              <div>
                <DialogTitle>Disconnect Google Drive?</DialogTitle>
                <DialogDescription>
                  Revoke institutional cloud storage credentials.
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <p className="py-2 text-sm text-foreground">
            Disconnecting Google Drive will remove the encrypted access tokens. Course slides and material
            sync will be suspended until re-authorized.
          </p>

          <DialogFooter className="pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setRevokeDialogOpen(false)}
              disabled={revokeMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={() => revokeMutation.mutate()}
              disabled={revokeMutation.isPending}
            >
              {revokeMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Revoking...
                </>
              ) : (
                'Disconnect Now'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

