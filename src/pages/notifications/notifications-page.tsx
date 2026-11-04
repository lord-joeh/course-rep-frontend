import { useState, useMemo } from 'react';
import { useAuthStore } from '@/lib/auth-store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  useNotificationsQuery,
  useUnreadNotificationCountQuery,
  useMarkAllNotificationsReadMutation,
  useDeleteNotificationMutation,
} from '@/hooks/use-notifications';
import { useCoursesQuery } from '@/hooks/use-courses';
import { useNotificationStream } from '@/hooks/use-notification-stream';
import { NotificationCard } from '@/components/notifications/notification-card';
import { CreateAnnouncementDialog } from '@/components/notifications/create-announcement-dialog';
import { EditAnnouncementDialog } from '@/components/notifications/edit-announcement-dialog';
import { DirectMessageDialog } from '@/components/notifications/direct-message-dialog';
import type { Notification, NotificationPriority, NotificationType } from '@/types';
import {
  Bell,
  Plus,
  Send,
  RefreshCw,
  Search,
  CheckCheck,
  Megaphone,
  Radio,
  Trash2,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';

export function NotificationsPage() {
  const { user } = useAuthStore();
  const isRep = Boolean(user?.isRep);

  // Filter States
  const [search, setSearch] = useState('');
  const [selectedPriority, setSelectedPriority] = useState<string>('all');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [selectedCourse, setSelectedCourse] = useState<string>('all');
  const [readFilter, setReadFilter] = useState<'all' | 'unread' | 'read'>('all');

  // Dialog States
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isDirectOpen, setIsDirectOpen] = useState(false);
  const [notifToEdit, setNotifToEdit] = useState<Notification | null>(null);
  const [notifToDelete, setNotifToDelete] = useState<Notification | null>(null);

  // Queries
  const {
    data: notificationsData,
    isLoading,
    refetch,
    isRefetching,
  } = useNotificationsQuery({
    limit: 100,
    search: search.trim() || undefined,
    priority: selectedPriority !== 'all' ? (selectedPriority as NotificationPriority) : undefined,
    type: selectedType !== 'all' ? (selectedType as NotificationType) : undefined,
    courseId:
      selectedCourse !== 'all' && selectedCourse !== 'general' ? selectedCourse : undefined,
    isRead: readFilter === 'all' ? undefined : readFilter === 'read',
  });

  const { data: countData } = useUnreadNotificationCountQuery();
  const unreadCount = countData?.unreadCount ?? 0;

  const { data: coursesData } = useCoursesQuery({ limit: 100 });
  const courses = coursesData?.items || [];
  const courseIds = useMemo(() => courses.map((c) => c.id), [courses]);

  // Real-time WebSocket connection to /notifications namespace
  const { isConnected } = useNotificationStream({
    studentId: user?.id,
    courseIds,
    enabled: true,
  });

  // Mutations
  const markAllReadMutation = useMarkAllNotificationsReadMutation();
  const deleteMutation = useDeleteNotificationMutation();

  const rawNotifications = notificationsData?.items || [];

  // Client filtering
  const filteredNotifications = useMemo(() => {
    let result = [...rawNotifications];

    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (n) =>
          n.title.toLowerCase().includes(q) ||
          n.message.toLowerCase().includes(q) ||
          (n.course && n.course.name.toLowerCase().includes(q)) ||
          (n.course && n.course.id.toLowerCase().includes(q)) ||
          (n.sender && n.sender.name.toLowerCase().includes(q)),
      );
    }

    if (selectedPriority !== 'all') {
      result = result.filter((n) => n.priority === selectedPriority);
    }

    if (selectedType !== 'all') {
      result = result.filter((n) => n.type === selectedType);
    }

    if (selectedCourse === 'general') {
      result = result.filter((n) => !n.courseId);
    } else if (selectedCourse !== 'all') {
      result = result.filter((n) => n.courseId === selectedCourse);
    }

    if (readFilter === 'unread') {
      result = result.filter((n) => !n.isRead);
    } else if (readFilter === 'read') {
      result = result.filter((n) => n.isRead);
    }

    return result.sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
  }, [rawNotifications, search, selectedPriority, selectedType, selectedCourse, readFilter]);

  const handleDeleteConfirm = async () => {
    if (!notifToDelete) return;
    try {
      await deleteMutation.mutateAsync(notifToDelete.id);
      setNotifToDelete(null);
    } catch {
      // Handled by toast
    }
  };

  return (
    <div className="space-y-6 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground flex items-center gap-2">
              <Bell className="w-7 h-7 text-primary shrink-0" />
              Announcements & Notifications
            </h1>
            {unreadCount > 0 && (
              <Badge variant="secondary" className="font-bold text-xs">
                {unreadCount} unread
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
            <span>Real-time cohort announcements, course notifications, and alerts.</span>
            <span className="hidden sm:inline-flex items-center gap-1 text-[11px] font-medium text-emerald-600 dark:text-emerald-400">
              <Radio className={`w-3 h-3 ${isConnected ? 'animate-pulse' : ''}`} />
              {isConnected ? 'Live WebSocket Active' : 'Connecting to Stream...'}
            </span>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            disabled={isRefetching}
            className="h-9 gap-1.5"
            aria-label="Refresh announcements"
          >
            <RefreshCw className={`w-4 h-4 ${isRefetching ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Refresh</span>
          </Button>

          {unreadCount > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => markAllReadMutation.mutate()}
              disabled={markAllReadMutation.isPending}
              className="h-9 gap-1.5 text-xs"
            >
              <CheckCheck className="w-4 h-4 text-primary" />
              <span>Mark all as read</span>
            </Button>
          )}

          {isRep && (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsDirectOpen(true)}
                className="h-9 gap-1.5 text-xs"
              >
                <Send className="w-3.5 h-3.5" />
                Direct Alert
              </Button>

              <Button
                size="sm"
                onClick={() => setIsCreateOpen(true)}
                className="h-9 gap-1.5 shadow-sm text-xs"
              >
                <Plus className="w-4 h-4" />
                Broadcast Announcement
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2 flex-1">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-2.5" />
            <Input
              placeholder="Search by title, keyword, course, or sender..."
              className="pl-9 h-9"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <select
            className="h-9 rounded-md border border-input bg-background px-3 py-1 text-xs shadow-xs focus:outline-none focus:ring-1 focus:ring-ring min-w-[140px]"
            value={selectedCourse}
            onChange={(e) => setSelectedCourse(e.target.value)}
          >
            <option value="all">All Audiences</option>
            <option value="general">Cohort-Wide Only</option>
            {courses.map((c) => (
              <option key={c.id} value={c.id}>
                [{c.id}] {c.name}
              </option>
            ))}
          </select>

          <select
            className="h-9 rounded-md border border-input bg-background px-3 py-1 text-xs shadow-xs focus:outline-none focus:ring-1 focus:ring-ring min-w-[130px]"
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
          >
            <option value="all">All Categories</option>
            <option value="general">General</option>
            <option value="academic">Academic</option>
            <option value="administrative">Administrative</option>
            <option value="deadline">Deadline</option>
            <option value="reminder">Reminder</option>
            <option value="alert">Alert</option>
          </select>
        </div>

        {/* Read Status Switcher */}
        <div className="flex items-center gap-1 shrink-0 bg-muted/60 p-0.5 rounded-lg border border-border">
          <button
            type="button"
            onClick={() => setReadFilter('all')}
            className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
              readFilter === 'all'
                ? 'bg-card text-foreground shadow-xs font-semibold'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            All
          </button>
          <button
            type="button"
            onClick={() => setReadFilter('unread')}
            className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
              readFilter === 'unread'
                ? 'bg-card text-foreground shadow-xs font-semibold'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Unread
          </button>
          <button
            type="button"
            onClick={() => setReadFilter('read')}
            className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
              readFilter === 'read'
                ? 'bg-card text-foreground shadow-xs font-semibold'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Read
          </button>
        </div>
      </div>

      {/* Priority Filter Pills */}
      <div className="flex flex-wrap items-center gap-1.5 pb-1 border-b border-border">
        <button
          type="button"
          onClick={() => setSelectedPriority('all')}
          className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
            selectedPriority === 'all'
              ? 'bg-primary text-primary-foreground font-semibold shadow-xs'
              : 'bg-muted/40 text-muted-foreground hover:bg-muted hover:text-foreground'
          }`}
        >
          All Priorities ({rawNotifications.length})
        </button>

        <button
          type="button"
          onClick={() => setSelectedPriority('urgent')}
          className={`px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${
            selectedPriority === 'urgent'
              ? 'bg-primary text-primary-foreground font-semibold shadow-xs'
              : 'bg-muted/40 text-muted-foreground hover:bg-muted hover:text-foreground'
          }`}
        >
          Urgent ({rawNotifications.filter((n) => n.priority === 'urgent').length})
        </button>

        <button
          type="button"
          onClick={() => setSelectedPriority('high')}
          className={`px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${
            selectedPriority === 'high'
              ? 'bg-primary text-primary-foreground font-semibold shadow-xs'
              : 'bg-muted/40 text-muted-foreground hover:bg-muted hover:text-foreground'
          }`}
        >
          High Priority ({rawNotifications.filter((n) => n.priority === 'high').length})
        </button>

        <button
          type="button"
          onClick={() => setSelectedPriority('normal')}
          className={`px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${
            selectedPriority === 'normal'
              ? 'bg-primary text-primary-foreground font-semibold shadow-xs'
              : 'bg-muted/40 text-muted-foreground hover:bg-muted hover:text-foreground'
          }`}
        >
          Normal ({rawNotifications.filter((n) => n.priority === 'normal').length})
        </button>

        <button
          type="button"
          onClick={() => setSelectedPriority('low')}
          className={`px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${
            selectedPriority === 'low'
              ? 'bg-primary text-primary-foreground font-semibold shadow-xs'
              : 'bg-muted/40 text-muted-foreground hover:bg-muted hover:text-foreground'
          }`}
        >
          Low ({rawNotifications.filter((n) => n.priority === 'low').length})
        </button>
      </div>

      {/* Content Area */}
      {isLoading ? (
        <div className="py-20 text-center text-sm text-muted-foreground space-y-2">
          <RefreshCw className="w-6 h-6 animate-spin mx-auto text-primary" />
          <p>Loading notifications...</p>
        </div>
      ) : filteredNotifications.length === 0 ? (
        <div className="py-16 text-center rounded-xl border border-dashed border-border bg-muted/10 space-y-3">
          <Megaphone className="w-10 h-10 text-muted-foreground/50 mx-auto" />
          <h3 className="text-base font-semibold text-foreground">No announcements found</h3>
          <p className="text-xs text-muted-foreground max-w-sm mx-auto">
            {search || selectedPriority !== 'all' || selectedCourse !== 'all' || readFilter !== 'all'
              ? 'No notifications match your current filter parameters.'
              : 'There are no announcements or notifications broadcasted yet.'}
          </p>
          {isRep && (
            <Button size="sm" onClick={() => setIsCreateOpen(true)} className="gap-1 text-xs">
              <Plus className="w-3.5 h-3.5" />
              Broadcast First Announcement
            </Button>
          )}
        </div>
      ) : (
        <div className="space-y-3" data-testid="notifications-list">
          {filteredNotifications.map((notification) => (
            <NotificationCard
              key={notification.id}
              notification={notification}
              isRep={isRep}
              onEdit={(n) => setNotifToEdit(n)}
              onDelete={(n) => setNotifToDelete(n)}
            />
          ))}
        </div>
      )}

      {/* Modals */}
      <CreateAnnouncementDialog
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
      />

      <EditAnnouncementDialog
        notification={notifToEdit}
        isOpen={Boolean(notifToEdit)}
        onClose={() => setNotifToEdit(null)}
      />

      <DirectMessageDialog
        isOpen={isDirectOpen}
        onClose={() => setIsDirectOpen(false)}
      />

      {/* Delete Confirmation Modal */}
      <Dialog open={Boolean(notifToDelete)} onOpenChange={(open) => !open && setNotifToDelete(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10 border border-destructive/20 mb-2">
              <Trash2 className="h-6 w-6 text-destructive" />
            </div>
            <DialogTitle className="text-center text-lg font-bold">
              Delete Announcement
            </DialogTitle>
            <DialogDescription className="text-center text-sm">
              Are you sure you want to delete{' '}
              <strong className="text-foreground">"{notifToDelete?.title}"</strong>? This will remove
              it from all student dashboards.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => setNotifToDelete(null)}
              disabled={deleteMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={handleDeleteConfirm}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? 'Deleting...' : 'Delete Announcement'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
