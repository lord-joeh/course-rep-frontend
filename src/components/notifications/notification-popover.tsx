import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  useNotificationsQuery,
  useUnreadNotificationCountQuery,
  useMarkNotificationReadMutation,
  useMarkAllNotificationsReadMutation,
} from '@/hooks/use-notifications';
import { getNotificationPriorityMeta } from '@/lib/notification-validation';
import { useNavigate } from 'react-router-dom';
import { Bell, CheckCheck, ChevronRight, Inbox } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface NotificationPopoverProps {
  isRep?: boolean;
}

export function NotificationPopover({ isRep = false }: NotificationPopoverProps) {
  const navigate = useNavigate();
  const { data: countData } = useUnreadNotificationCountQuery();
  const unreadCount = countData?.unreadCount ?? 0;

  const { data: notificationsData, isLoading } = useNotificationsQuery({ limit: 5 });
  const recentNotifications = notificationsData?.items || [];

  const markReadMutation = useMarkNotificationReadMutation();
  const markAllReadMutation = useMarkAllNotificationsReadMutation();

  const handleNotificationClick = (id: string, isRead?: boolean) => {
    if (!isRead) {
      markReadMutation.mutate(id);
    }
    navigate(isRep ? '/reps/notifications' : '/students/notifications');
  };

  const handleMarkAllRead = (e: React.MouseEvent) => {
    e.stopPropagation();
    markAllReadMutation.mutate();
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative h-9 w-9"
          aria-label="View notifications"
          data-testid="notification-bell-trigger"
        >
          <Bell className="h-4 w-4 text-foreground" />
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-bold text-destructive-foreground shadow-xs">
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-80 sm:w-96 p-0 shadow-lg">
        {/* Header */}
        <div className="flex items-center justify-between p-3.5 border-b border-border bg-muted/40">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-bold text-foreground">Notifications</h3>
            {unreadCount > 0 && (
              <Badge variant="secondary" className="text-[10px] font-bold px-1.5 py-0 h-4">
                {unreadCount} unread
              </Badge>
            )}
          </div>

          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleMarkAllRead}
              disabled={markAllReadMutation.isPending}
              className="h-6 text-[11px] gap-1 px-2 text-muted-foreground hover:text-foreground"
            >
              <CheckCheck className="w-3 h-3" />
              Mark all read
            </Button>
          )}
        </div>

        {/* Recent Items List */}
        <div className="max-h-[340px] overflow-y-auto divide-y divide-border/60">
          {isLoading ? (
            <div className="p-6 text-center text-xs text-muted-foreground">
              Loading notifications...
            </div>
          ) : recentNotifications.length === 0 ? (
            <div className="p-8 text-center space-y-2">
              <Inbox className="w-8 h-8 text-muted-foreground/40 mx-auto" />
              <p className="text-xs font-medium text-foreground">All caught up!</p>
              <p className="text-[11px] text-muted-foreground">No recent announcements or notifications.</p>
            </div>
          ) : (
            recentNotifications.map((notif) => {
              const priorityMeta = getNotificationPriorityMeta(notif.priority);
              const timeAgo = formatDistanceToNow(new Date(notif.createdAt), {
                addSuffix: true,
              });

              return (
                <div
                  key={notif.id}
                  onClick={() => handleNotificationClick(notif.id, notif.isRead)}
                  className={`p-3 transition-colors hover:bg-muted/50 cursor-pointer flex items-start gap-2.5 ${
                    !notif.isRead ? 'bg-primary/5' : ''
                  }`}
                  data-testid={`popover-notif-${notif.id}`}
                >
                  <span
                    className={`mt-1.5 w-2 h-2 rounded-full shrink-0 ${
                      !notif.isRead ? 'bg-primary' : 'bg-transparent'
                    }`}
                  />

                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex items-center justify-between gap-1">
                      <Badge
                        variant="outline"
                        className={`text-[9px] px-1 py-0 border ${priorityMeta.badgeClass}`}
                      >
                        {priorityMeta.label}
                      </Badge>
                      <span className="text-[10px] text-muted-foreground shrink-0">{timeAgo}</span>
                    </div>

                    <h4
                      className={`text-xs leading-tight truncate ${
                        !notif.isRead ? 'font-semibold text-foreground' : 'text-muted-foreground'
                      }`}
                    >
                      {notif.title}
                    </h4>

                    <p className="text-[11px] text-muted-foreground line-clamp-2 leading-relaxed">
                      {notif.message}
                    </p>
                  </div>
                </div>
              );
            })
          )}
        </div>

        <DropdownMenuSeparator className="m-0" />

        {/* Footer Navigation Link */}
        <div className="p-2 bg-card">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate(isRep ? '/reps/notifications' : '/students/notifications')}
            className="w-full justify-between text-xs h-8 text-primary font-medium"
          >
            <span>View all announcements</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </Button>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
