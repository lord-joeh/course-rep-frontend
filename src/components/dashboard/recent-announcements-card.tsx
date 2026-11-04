import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Link } from 'react-router-dom';
import type { Notification } from '@/types/notification.types';
import { Bell, ChevronRight, Inbox, AlertTriangle } from 'lucide-react';
import { formatDistanceToNow, parseISO } from 'date-fns';

interface RecentAnnouncementsCardProps {
  notifications: Notification[];
  isLoading?: boolean;
  viewAllHref: string;
}

export function RecentAnnouncementsCard({
  notifications,
  isLoading,
  viewAllHref,
}: RecentAnnouncementsCardProps) {
  return (
    <Card className="border border-border bg-card shadow-xs flex flex-col justify-between">
      <CardHeader className="p-4 sm:p-5 pb-3 flex flex-row items-center justify-between space-y-0">
        <CardTitle className="text-sm sm:text-base font-bold text-foreground flex items-center gap-2">
          <Bell className="w-4 h-4 text-primary" />
          Recent Announcements & Alerts
        </CardTitle>
        <Link
          to={viewAllHref}
          className="text-xs text-primary hover:underline flex items-center gap-0.5 font-medium"
        >
          <span>View All</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </Link>
      </CardHeader>

      <CardContent className="p-4 sm:p-5 pt-0">
        {isLoading ? (
          <div className="space-y-3 py-2 animate-pulse">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 rounded-lg border border-border bg-muted/40" />
            ))}
          </div>
        ) : notifications.length === 0 ? (
          <div className="py-8 text-center rounded-lg border border-dashed border-border bg-muted/10 space-y-2">
            <Inbox className="w-7 h-7 text-muted-foreground/50 mx-auto" />
            <p className="text-xs font-medium text-foreground">No recent announcements</p>
            <p className="text-[11px] text-muted-foreground">
              You're all caught up with cohort notifications.
            </p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {notifications.slice(0, 4).map((notif) => {
              const createdAt = notif.createdAt ? parseISO(notif.createdAt) : null;
              const isUrgent = notif.priority === 'urgent';

              return (
                <div
                  key={notif.id}
                  className={`flex items-start justify-between gap-3 p-3 rounded-lg border transition-colors ${
                    isUrgent
                      ? 'border-rose-500/30 bg-rose-500/5 hover:bg-rose-500/10'
                      : !notif.isRead
                      ? 'border-primary/20 bg-primary/5 hover:bg-primary/10'
                      : 'border-border bg-muted/20 hover:bg-muted/40'
                  }`}
                >
                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-2">
                      {!notif.isRead && (
                        <span className="w-2 h-2 rounded-full bg-primary shrink-0" />
                      )}
                      <span className="text-xs font-bold text-foreground truncate block">
                        {notif.title}
                      </span>
                    </div>

                    <p className="text-[11px] text-muted-foreground line-clamp-1">
                      {notif.message}
                    </p>

                    {createdAt && (
                      <span className="text-[10px] text-muted-foreground font-mono block">
                        {formatDistanceToNow(createdAt, { addSuffix: true })}
                      </span>
                    )}
                  </div>

                  {isUrgent ? (
                    <Badge variant="destructive" className="text-[10px] uppercase font-bold shrink-0 gap-1">
                      <AlertTriangle className="w-3 h-3" />
                      Urgent
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="text-[10px] capitalize shrink-0 font-medium">
                      {notif.type || 'Notice'}
                    </Badge>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

