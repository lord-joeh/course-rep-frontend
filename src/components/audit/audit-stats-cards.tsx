import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { AuditDashboardStats } from '@/types/audit.types';
import { ShieldAlert, ShieldX, KeyRound, MapPinOff, Layers } from 'lucide-react';

interface AuditStatsCardsProps {
  stats?: AuditDashboardStats;
  isLoading?: boolean;
}

export function AuditStatsCards({ stats, isLoading }: AuditStatsCardsProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 animate-pulse">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-24 rounded-xl border border-border bg-card/60" />
        ))}
      </div>
    );
  }

  const totalLogs = stats?.totalLogs ?? 0;
  const failedLogins = stats?.failedLoginsLast24h ?? 0;
  const geofenceBreaches = stats?.geofenceBreachesLast24h ?? 0;
  const highSeverityCount = stats?.recentHighSeverityCount ?? 0;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Total Ledger Events */}
        <Card className="border border-border bg-card">
          <CardHeader className="p-4 pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground">
              Total Audit Logs
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0 flex items-center justify-between">
            <span className="text-2xl font-bold text-foreground">{totalLogs}</span>
            <Layers className="w-5 h-5 text-muted-foreground/60" />
          </CardContent>
        </Card>

        {/* Failed Logins (24h) */}
        <Card className="border border-amber-500/20 bg-amber-500/5">
          <CardHeader className="p-4 pb-2">
            <CardTitle className="text-xs font-medium text-amber-700 dark:text-amber-400">
              Auth Failures (24h)
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0 flex items-center justify-between">
            <span className="text-2xl font-bold text-amber-600 dark:text-amber-400">
              {failedLogins}
            </span>
            <KeyRound className="w-5 h-5 text-amber-500/70" />
          </CardContent>
        </Card>

        {/* Geofence Breaches (24h) */}
        <Card className="border border-rose-500/20 bg-rose-500/5">
          <CardHeader className="p-4 pb-2">
            <CardTitle className="text-xs font-medium text-rose-700 dark:text-rose-400">
              Geofence Breaches (24h)
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0 flex items-center justify-between">
            <span className="text-2xl font-bold text-rose-600 dark:text-rose-400">
              {geofenceBreaches}
            </span>
            <MapPinOff className="w-5 h-5 text-rose-500/70" />
          </CardContent>
        </Card>

        {/* Critical & High Incidents */}
        <Card className="border border-border bg-card">
          <CardHeader className="p-4 pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground">
              Critical / High Incidents
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0 flex items-center justify-between">
            <span
              className={`text-2xl font-bold ${
                highSeverityCount > 0 ? 'text-destructive' : 'text-foreground'
              }`}
            >
              {highSeverityCount}
            </span>
            {highSeverityCount > 0 ? (
              <ShieldAlert className="w-5 h-5 text-destructive" />
            ) : (
              <ShieldX className="w-5 h-5 text-muted-foreground/60" />
            )}
          </CardContent>
        </Card>
      </div>

      {/* Severity Breakdown Bar */}
      {stats?.severityCounts && (
        <div className="flex flex-wrap items-center gap-2 p-2.5 rounded-lg border border-border bg-muted/20 text-xs">
          <span className="text-muted-foreground font-medium mr-1">Severity Distribution:</span>
          <Badge variant="outline" className="text-emerald-700 dark:text-emerald-400 border-emerald-500/30 gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            Info: {stats.severityCounts.INFO || 0}
          </Badge>
          <Badge variant="outline" className="text-slate-700 dark:text-slate-400 border-slate-500/30 gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-slate-500" />
            Low: {stats.severityCounts.LOW || 0}
          </Badge>
          <Badge variant="outline" className="text-sky-700 dark:text-sky-400 border-sky-500/30 gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-sky-500" />
            Medium: {stats.severityCounts.MEDIUM || 0}
          </Badge>
          <Badge variant="outline" className="text-amber-700 dark:text-amber-400 border-amber-500/30 gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
            High: {stats.severityCounts.HIGH || 0}
          </Badge>
          <Badge variant="outline" className="text-rose-700 dark:text-rose-400 border-rose-500/30 gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
            Critical: {stats.severityCounts.CRITICAL || 0}
          </Badge>
        </div>
      )}
    </div>
  );
}

