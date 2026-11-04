import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  useAuditLogsQuery,
  useAuditStatsQuery,
} from '@/hooks/use-audit-logs';
import { AuditStatsCards } from '@/components/audit/audit-stats-cards';
import { AuditIntegrityModal } from '@/components/audit/audit-integrity-modal';
import { AuditDetailsSheet } from '@/components/audit/audit-details-sheet';
import { AuditExportButton } from '@/components/audit/audit-export-button';
import type { SecurityAuditLog, AuditSeverity } from '@/types/audit.types';
import {
  getAuditSeverityMeta,
  formatAuditAction,
  getActionCategory,
  shortenHash,
} from '@/lib/audit-validation';
import {
  ShieldAlert,
  Hash,
  RefreshCw,
  Search,
  Clock,
  FilterX,
  ChevronLeft,
  ChevronRight,
  Eye,
  Globe,
  Inbox,
} from 'lucide-react';
import { format } from 'date-fns';

export function AuditLogsPage() {
  // Query Filter States
  const [searchInput, setSearchInput] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [selectedSeverity, setSelectedSeverity] = useState<string>('all');
  const [selectedResource, setSelectedResource] = useState<string>('all');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [page, setPage] = useState(1);

  // Modal / Sheet States
  const [isIntegrityModalOpen, setIsIntegrityModalOpen] = useState(false);
  const [activeLog, setActiveLog] = useState<SecurityAuditLog | null>(null);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchInput);
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  // Queries
  const { data: statsData, isLoading: isStatsLoading } = useAuditStatsQuery();

  const {
    data: logsData,
    isLoading: isLogsLoading,
    refetch,
    isRefetching,
  } = useAuditLogsQuery({
    page,
    limit: 20,
    search: debouncedSearch.trim() || undefined,
    severity: selectedSeverity !== 'all' ? (selectedSeverity as AuditSeverity) : undefined,
    resource: selectedResource !== 'all' ? selectedResource : undefined,
    startDate: startDate || undefined,
    endDate: endDate || undefined,
  });

  const logs = logsData?.items || [];
  const totalItems = logsData?.meta?.total ?? 0;
  const totalPages = logsData?.meta?.totalPages ?? 1;

  const hasActiveFilters =
    debouncedSearch !== '' ||
    selectedSeverity !== 'all' ||
    selectedResource !== 'all' ||
    startDate !== '' ||
    endDate !== '';

  const handleClearFilters = () => {
    setSearchInput('');
    setDebouncedSearch('');
    setSelectedSeverity('all');
    setSelectedResource('all');
    setStartDate('');
    setEndDate('');
    setPage(1);
  };

  const severityOptions: { key: string; label: string }[] = [
    { key: 'all', label: 'All Severities' },
    { key: 'CRITICAL', label: 'Critical' },
    { key: 'HIGH', label: 'High' },
    { key: 'MEDIUM', label: 'Medium' },
    { key: 'LOW', label: 'Low' },
    { key: 'INFO', label: 'Info' },
  ];

  return (
    <div className="space-y-6 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground flex items-center gap-2">
              <ShieldAlert className="w-7 h-7 text-primary shrink-0" />
              Security Audit Trail & Ledger
            </h1>
            <Badge variant="secondary" className="font-mono text-xs font-semibold">
              {totalItems} {totalItems === 1 ? 'event' : 'events'}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Immutable SHA-256 chained security log tracking authentication attempts, geofence
            violations, administrative overrides, and system changes.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            disabled={isRefetching}
            className="h-9 gap-1.5 text-xs"
            aria-label="Refresh audit logs"
          >
            <RefreshCw className={`w-4 h-4 ${isRefetching ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Refresh</span>
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsIntegrityModalOpen(true)}
            className="h-9 gap-1.5 text-xs"
            aria-label="Verify hash chain integrity"
          >
            <Hash className="w-4 h-4 text-primary" />
            <span>Verify Chain</span>
          </Button>

          <AuditExportButton logs={logs} disabled={isLogsLoading} />
        </div>
      </div>

      {/* Security Operational KPI Cards */}
      <AuditStatsCards stats={statsData} isLoading={isStatsLoading} />

      {/* Filter Toolbar */}
      <div className="space-y-3 p-4 rounded-xl border border-border bg-card shadow-xs">
        {/* Severity Quick Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
          <span className="text-muted-foreground font-semibold mr-1 shrink-0">Severity:</span>
          {severityOptions.map((opt) => (
            <button
              key={opt.key}
              type="button"
              onClick={() => {
                setSelectedSeverity(opt.key);
                setPage(1);
              }}
              className={`px-2.5 py-1 rounded-full text-xs font-medium transition-colors shrink-0 ${
                selectedSeverity === opt.key
                  ? 'bg-primary text-primary-foreground font-semibold'
                  : 'bg-muted/40 text-muted-foreground hover:bg-muted hover:text-foreground'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>

        {/* Inputs & Dropdowns Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 pt-1 border-t border-border">
          {/* Search Box */}
          <div className="relative">
            <Search className="w-4 h-4 absolute left-2.5 top-2.5 text-muted-foreground" />
            <Input
              placeholder="Search action, actor, IP..."
              className="pl-8 h-9 text-xs"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
            />
          </div>

          {/* Resource Filter Dropdown */}
          <select
            className="h-9 rounded-md border border-input bg-background px-3 py-1 text-xs shadow-xs focus:outline-none focus:ring-1 focus:ring-ring"
            value={selectedResource}
            onChange={(e) => {
              setSelectedResource(e.target.value);
              setPage(1);
            }}
            aria-label="Filter by resource"
          >
            <option value="all">All Resources</option>
            <option value="AUTH">Authentication (AUTH)</option>
            <option value="ATTENDANCE">Attendance (ATTENDANCE)</option>
            <option value="STUDENT">Students (STUDENT)</option>
            <option value="COURSE">Courses (COURSE)</option>
            <option value="DRIVE">Google Drive (DRIVE)</option>
            <option value="GROUP">Study Groups (GROUP)</option>
            <option value="FEEDBACK">Feedback (FEEDBACK)</option>
            <option value="NOTIFICATION">Notifications (NOTIFICATION)</option>
            <option value="SYSTEM">System (SYSTEM)</option>
          </select>

          {/* Start Date */}
          <Input
            type="date"
            className="h-9 text-xs"
            value={startDate}
            onChange={(e) => {
              setStartDate(e.target.value);
              setPage(1);
            }}
            aria-label="Filter start date"
          />

          {/* End Date */}
          <div className="flex items-center gap-1.5">
            <Input
              type="date"
              className="h-9 text-xs flex-1"
              value={endDate}
              onChange={(e) => {
                setEndDate(e.target.value);
                setPage(1);
              }}
              aria-label="Filter end date"
            />
            {hasActiveFilters && (
              <Button
                variant="ghost"
                size="icon"
                onClick={handleClearFilters}
                className="h-9 w-9 text-muted-foreground shrink-0"
                title="Clear all filters"
                aria-label="Clear all filters"
              >
                <FilterX className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Audit Log Table */}
      {isLogsLoading ? (
        <div className="py-20 text-center text-sm text-muted-foreground space-y-2">
          <RefreshCw className="w-6 h-6 animate-spin mx-auto text-primary" />
          <p>Loading security audit ledger...</p>
        </div>
      ) : logs.length === 0 ? (
        <div className="py-16 text-center rounded-xl border border-dashed border-border bg-muted/10 space-y-3">
          <Inbox className="w-10 h-10 text-muted-foreground/50 mx-auto" />
          <h3 className="text-base font-semibold text-foreground">No audit events found</h3>
          <p className="text-xs text-muted-foreground max-w-sm mx-auto">
            {hasActiveFilters
              ? 'No security events match your current filter parameters.'
              : 'The security audit ledger is currently empty.'}
          </p>
          {hasActiveFilters && (
            <Button size="sm" variant="outline" onClick={handleClearFilters} className="text-xs">
              Reset Filters
            </Button>
          )}
        </div>
      ) : (
        <div className="rounded-xl border border-border bg-card overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/30">
                  <TableHead className="text-xs w-16">Seq #</TableHead>
                  <TableHead className="text-xs">Timestamp (UTC)</TableHead>
                  <TableHead className="text-xs">Severity</TableHead>
                  <TableHead className="text-xs">Action & Domain</TableHead>
                  <TableHead className="text-xs">Actor</TableHead>
                  <TableHead className="text-xs">IP Address</TableHead>
                  <TableHead className="text-xs">Current SHA-256</TableHead>
                  <TableHead className="text-xs text-right">Details</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {logs.map((log) => {
                  const severityMeta = getAuditSeverityMeta(log.severity);
                  return (
                    <TableRow
                      key={log.id}
                      onClick={() => setActiveLog(log)}
                      className="cursor-pointer hover:bg-muted/40 transition-colors"
                    >
                      {/* Seq Number */}
                      <TableCell className="font-mono text-xs font-semibold text-muted-foreground">
                        #{log.sequenceNumber}
                      </TableCell>

                      {/* Timestamp */}
                      <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                        <span className="flex items-center gap-1 font-mono">
                          <Clock className="w-3 h-3" />
                          {log.timestamp ? format(new Date(log.timestamp), 'yyyy-MM-dd HH:mm:ss') : 'N/A'}
                        </span>
                      </TableCell>

                      {/* Severity Badge */}
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={`font-mono text-[10px] uppercase font-semibold ${severityMeta.badgeClass}`}
                        >
                          {severityMeta.label}
                        </Badge>
                      </TableCell>

                      {/* Action & Category */}
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="text-xs font-semibold text-foreground">
                            {formatAuditAction(log.action)}
                          </span>
                          <span className="text-[10px] text-muted-foreground">
                            {getActionCategory(log.action)} • {log.resource}
                          </span>
                        </div>
                      </TableCell>

                      {/* Actor Role & Email */}
                      <TableCell className="text-xs">
                        <div className="flex flex-col max-w-[150px]">
                          <span className="font-medium text-foreground truncate">
                            {log.actorEmail || 'System / Anonymous'}
                          </span>
                          <span className="font-mono text-[10px] text-muted-foreground uppercase">
                            {log.actorRole}
                          </span>
                        </div>
                      </TableCell>

                      {/* IP Address */}
                      <TableCell className="text-xs font-mono text-muted-foreground whitespace-nowrap">
                        <span className="flex items-center gap-1">
                          <Globe className="w-3 h-3 text-muted-foreground/60" />
                          {log.ipAddress}
                        </span>
                      </TableCell>

                      {/* Shortened SHA-256 */}
                      <TableCell className="text-xs font-mono text-muted-foreground whitespace-nowrap">
                        <span className="font-mono text-[11px] bg-muted/30 px-1.5 py-0.5 rounded">
                          {shortenHash(log.currentHash, 6, 6)}
                        </span>
                      </TableCell>

                      {/* Inspect Action */}
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 w-7 p-0"
                          onClick={(e) => {
                            e.stopPropagation();
                            setActiveLog(log);
                          }}
                          aria-label={`Inspect audit log #${log.sequenceNumber}`}
                        >
                          <Eye className="w-4 h-4 text-muted-foreground" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between p-3 border-t border-border bg-muted/10 text-xs">
              <span className="text-muted-foreground">
                Showing Page <span className="font-semibold text-foreground">{page}</span> of{' '}
                <span className="font-semibold text-foreground">{totalPages}</span> ({totalItems} total events)
              </span>

              <div className="flex items-center gap-1">
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 w-8 p-0"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  aria-label="Previous page"
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 w-8 p-0"
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  aria-label="Next page"
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Audit Integrity Modal */}
      <AuditIntegrityModal
        isOpen={isIntegrityModalOpen}
        onClose={() => setIsIntegrityModalOpen(false)}
      />

      {/* Single Log Details Slide-Over Sheet */}
      <AuditDetailsSheet
        log={activeLog}
        isOpen={Boolean(activeLog)}
        onClose={() => setActiveLog(null)}
      />
    </div>
  );
}

