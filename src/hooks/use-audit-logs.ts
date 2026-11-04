import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import type { ApiResponse } from '@/types/api.types';
import type {
  SecurityAuditLog,
  AuditDashboardStats,
  AuditIntegrityReport,
  AuditLogsQueryParams,
  PaginatedAuditLogs,
} from '@/types/audit.types';
import { toast } from 'sonner';

export const AUDIT_QUERY_KEYS = {
  all: ['audit-logs'] as const,
  lists: () => [...AUDIT_QUERY_KEYS.all, 'list'] as const,
  list: (params: AuditLogsQueryParams) => [...AUDIT_QUERY_KEYS.lists(), params] as const,
  stats: () => [...AUDIT_QUERY_KEYS.all, 'stats'] as const,
  alerts: (limit?: number) => [...AUDIT_QUERY_KEYS.all, 'alerts', limit] as const,
  details: () => [...AUDIT_QUERY_KEYS.all, 'detail'] as const,
  detail: (id: string) => [...AUDIT_QUERY_KEYS.details(), id] as const,
};

/**
 * Query for paginated security audit logs with filtering.
 */
export function useAuditLogsQuery(params: AuditLogsQueryParams = {}) {
  return useQuery({
    queryKey: AUDIT_QUERY_KEYS.list(params),
    queryFn: async () => {
      const res = await apiClient.get<ApiResponse<PaginatedAuditLogs>>('/audit-logs', {
        params,
      });
      return res.data?.data;
    },
    staleTime: 10000,
  });
}

/**
 * Query for aggregate security operational statistics.
 */
export function useAuditStatsQuery() {
  return useQuery({
    queryKey: AUDIT_QUERY_KEYS.stats(),
    queryFn: async () => {
      const res = await apiClient.get<ApiResponse<AuditDashboardStats>>('/audit-logs/stats');
      return res.data?.data;
    },
    staleTime: 30000,
  });
}

/**
 * Query for recent critical and high severity security alerts.
 */
export function useRecentAuditAlertsQuery(limit = 10) {
  return useQuery({
    queryKey: AUDIT_QUERY_KEYS.alerts(limit),
    queryFn: async () => {
      const res = await apiClient.get<ApiResponse<SecurityAuditLog[]>>(
        '/audit-logs/recent-alerts',
        { params: { limit } },
      );
      return res.data?.data || [];
    },
    staleTime: 15000,
  });
}

/**
 * Query for a single audit log event by ID.
 */
export function useAuditLogQuery(id: string) {
  return useQuery({
    queryKey: AUDIT_QUERY_KEYS.detail(id),
    queryFn: async () => {
      const res = await apiClient.get<ApiResponse<SecurityAuditLog>>(`/audit-logs/${id}`);
      return res.data?.data;
    },
    enabled: Boolean(id),
  });
}

/**
 * Mutation to verify cryptographic SHA-256 hash chain integrity.
 */
export function useVerifyAuditIntegrityMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload?: { fromSeq?: number; toSeq?: number }) => {
      const res = await apiClient.post<ApiResponse<AuditIntegrityReport>>(
        '/audit-logs/verify-integrity',
        payload || {},
      );
      return res.data?.data;
    },
    onSuccess: (report) => {
      if (report?.isIntact) {
        toast.success('Cryptographic Verification Succeeded', {
          description: `All ${report.totalVerified} entries in hash chain verified unbroken. Genesis hash intact.`,
        });
      } else {
        toast.error('Cryptographic Integrity Violation Detected', {
          description: `Audit chain compromise! ${report?.errors?.length || 1} hash mismatch(es) detected.`,
        });
      }
      queryClient.invalidateQueries({ queryKey: AUDIT_QUERY_KEYS.stats() });
    },
    onError: (err: any) => {
      toast.error('Verification Failed', {
        description: err.response?.data?.message || 'Unable to execute audit verification.',
      });
    },
  });
}

