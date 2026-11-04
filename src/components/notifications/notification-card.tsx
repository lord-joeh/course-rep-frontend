import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type { Notification } from '@/types';
import {
  getNotificationPriorityMeta,
  getNotificationTypeMeta,
} from '@/lib/notification-validation';
import { useMarkNotificationReadMutation } from '@/hooks/use-notifications';
import { formatDistanceToNow, format } from 'date-fns';
import { MoreVertical, Pencil, Trash2, Check, User } from 'lucide-react';

interface NotificationCardProps {
  notification: Notification;
  isRep?: boolean;
  onEdit?: (notification: Notification) => void;
  onDelete?: (notification: Notification) => void;
  onSelect?: (notification: Notification) => void;
}

export function NotificationCard({
  notification,
  isRep = false,
  onEdit,
  onDelete,
  onSelect,
}: NotificationCardProps) {
  const markReadMutation = useMarkNotificationReadMutation();

  const priorityMeta = getNotificationPriorityMeta(notification.priority);
  const typeMeta = getNotificationTypeMeta(notification.type);
  const PriorityIcon = priorityMeta.icon;
  const TypeIcon = typeMeta.icon;

  const createdAt = new Date(notification.createdAt);
  const timeAgo = formatDistanceToNow(createdAt, { addSuffix: true });
  const exactTime = format(createdAt, 'MMM d, yyyy · h:mm a');

  const handleMarkAsRead = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!notification.isRead) {
      markReadMutation.mutate(notification.id);
    }
  };

  return (
    <Card
      className={`border transition-all hover:shadow-xs cursor-pointer ${
        notification.isRead
          ? 'bg-card border-border opacity-85'
          : 'bg-card border-primary/30 shadow-xs'
      }`}
      onClick={() => onSelect?.(notification)}
      data-testid={`notification-card-${notification.id}`}
    >
      <CardHeader className="p-4 pb-2">
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1.5 flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-1.5">
              {/* Priority Badge */}
              <Badge
                variant="outline"
                className={`text-[10px] px-2 py-0.5 gap-1 border ${priorityMeta.badgeClass}`}
              >
                <PriorityIcon className="w-3 h-3" />
                {priorityMeta.label}
              </Badge>

              {/* Category / Type Badge */}
              <Badge
                variant="outline"
                className={`text-[10px] px-2 py-0.5 gap-1 border ${typeMeta.badgeClass}`}
              >
                <TypeIcon className="w-3 h-3" />
                {typeMeta.label}
              </Badge>

              {/* Course Scope Badge */}
              {notification.course ? (
                <Badge variant="secondary" className="text-[10px] px-2 py-0.5 font-mono">
                  {notification.course.name || notification.course.id}
                </Badge>
              ) : (
                <Badge variant="outline" className="text-[10px] px-1.5 py-0.5 text-muted-foreground border-border">
                  Cohort-Wide
                </Badge>
              )}

              {/* Unread Indicator */}
              {!notification.isRead && (
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-primary">
                  <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                  New
                </span>
              )}
            </div>

            <CardTitle className="text-base font-semibold leading-tight text-foreground">
              {notification.title}
            </CardTitle>
          </div>

          <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
            {!notification.isRead && (
              <Button
                variant="ghost"
                size="sm"
                className="h-8 text-xs gap-1 text-muted-foreground hover:text-foreground"
                onClick={handleMarkAsRead}
                disabled={markReadMutation.isPending}
                title="Mark as read"
              >
                <Check className="w-3.5 h-3.5 text-primary" />
                <span className="hidden sm:inline">Mark Read</span>
              </Button>
            )}

            {isRep && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0" aria-label="Announcement options">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-44">
                  {onEdit && (
                    <DropdownMenuItem onClick={() => onEdit(notification)}>
                      <Pencil className="mr-2 h-4 w-4" />
                      Edit Announcement
                    </DropdownMenuItem>
                  )}
                  {onDelete && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => onDelete(notification)} className="text-destructive">
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete Announcement
                      </DropdownMenuItem>
                    </>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-4 pt-1 space-y-3">
        <p className="text-xs text-muted-foreground leading-relaxed whitespace-pre-wrap">
          {notification.message}
        </p>

        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-border/60 text-[11px] text-muted-foreground">
          <div className="flex items-center gap-1 min-w-0">
            <User className="w-3 h-3 shrink-0 text-muted-foreground" />
            <span className="truncate">
              {notification.sender?.name || 'Course Representative'}
            </span>
          </div>

          <span title={exactTime} className="shrink-0 font-medium">
            {timeAgo}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}

