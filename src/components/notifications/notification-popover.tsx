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
import { Bell, CheckCheck, ChevronRight, Inbox, RefreshCw } from 'lucide-react';
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
          className="relative h-9 w-9 rounded-full hover:bg-muted"
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

      <DropdownMenuContent
        align="end"
        sideOffset={8}
        collisionPadding={12}
        className="w-[calc(100vw-24px)] sm:w-96 max-w-sm p-0 shadow-xl border border-border bg-card rounded-xl overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-3.5 py-3 border-b border-border bg-muted/30">
          <div className="flex items-center gap-2">
            <h3 className="text-xs sm:text-sm font-bold text-foreground tracking-tight">Notifications</h3>
            {unreadCount > 0 && (
              <Badge variant="secondary" className="text-[10px] font-bold px-1.5 py-0 h-4 bg-primary/10 text-primary border-primary/20">
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
              className="h-7 text-[11px] gap-1 px-2 text-muted-foreground hover:text-foreground"
            >
              <CheckCheck className="w-3.5 h-3.5 text-primary" />
              <span>Mark all read</span>
            </Button>
          )}
        </div>

        {/* Recent Items List */}
        <div className="max-h-[min(380px,65vh)] overflow-y-auto divide-y divide-border/60 overscroll-contain">
          {isLoading ? (
            <div className="p-8 text-center text-xs text-muted-foreground space-y-2">
              <RefreshCw className="w-4 h-4 animate-spin mx-auto text-primary" />
              <p>Loading alerts...</p>
            </div>
          ) : recentNotifications.length === 0 ? (
            <div className="p-8 text-center space-y-2">
              <Inbox className="w-8 h-8 text-muted-foreground/40 mx-auto" />
              <p className="text-xs font-medium text-foreground">All caught up!</p>
              <p className="text-[11px] text-muted-foreground max-w-xs mx-auto">
                No recent announcements or notifications for your courses.
              </p>
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
                  className={`p-3 sm:p-3.5 transition-colors hover:bg-muted/50 active:bg-muted/70 cursor-pointer flex items-start gap-2.5 ${
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
                    <div className="flex items-center justify-between gap-1.5 flex-wrap">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <Badge
                          variant="outline"
                          className={`text-[9px] px-1.5 py-0 border font-medium ${priorityMeta.badgeClass}`}
                        >
                          {priorityMeta.label}
                        </Badge>
                        {notif.course && (
                          <span className="text-[9px] text-muted-foreground font-mono bg-muted px-1 rounded">
                            {notif.course.id}
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] text-muted-foreground shrink-0">{timeAgo}</span>
                    </div>

                    <h4
                      className={`text-xs sm:text-sm leading-tight truncate ${
                        !notif.isRead ? 'font-semibold text-foreground' : 'font-medium text-muted-foreground'
                      }`}
                    >
                      {notif.title}
                    </h4>

                    <p className="text-[11px] sm:text-xs text-muted-foreground line-clamp-2 leading-relaxed break-words">
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
        <div className="p-1.5 bg-card">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate(isRep ? '/reps/notifications' : '/students/notifications')}
            className="w-full justify-between text-xs h-8 text-primary font-medium hover:bg-primary/10 hover:text-primary px-2.5 rounded-lg"
          >
            <span>View all announcements</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </Button>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
