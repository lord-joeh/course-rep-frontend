import { Card, CardHeader, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type { AttendanceInstance } from '@/types';
import {
  Calendar,
  Clock,
  MapPin,
  Globe,
  Tv,
  Users,
  PowerOff,
  Trash2,
} from 'lucide-react';

interface SessionCardProps {
  session: AttendanceInstance;
  onLaunchProjector: (session: AttendanceInstance) => void;
  onViewRoster: (session: AttendanceInstance) => void;
  onCloseSession: (session: AttendanceInstance) => void;
  onDeleteSession: (session: AttendanceInstance) => void;
}

export function SessionCard({
  session,
  onLaunchProjector,
  onViewRoster,
  onCloseSession,
  onDeleteSession,
}: SessionCardProps) {
  const isClosed = session.isClose;
  const sessionDate = new Date(session.date);

  return (
    <Card className="flex flex-col justify-between border border-border bg-card hover:border-primary/40 transition-colors">
      <CardHeader className="p-4 pb-2 space-y-2">
        <div className="flex items-center justify-between gap-2">
          <Badge
            variant="outline"
            className="font-mono text-xs font-bold border-primary/20 bg-primary/5 text-primary"
          >
            {session.courseId}
          </Badge>
          <div className="flex items-center gap-1.5">
            <Badge
              variant="outline"
              className={
                isClosed
                  ? 'bg-muted text-muted-foreground border-border text-[11px]'
                  : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 text-[11px]'
              }
            >
              {isClosed ? 'Closed' : 'Active Session'}
            </Badge>
            <Badge
              variant="outline"
              className="text-[11px] border-border text-muted-foreground"
            >
              {session.classType === 'in-person' ? (
                <span className="flex items-center gap-1">
                  <MapPin className="w-3 h-3 text-primary" /> In-Person
                </span>
              ) : (
                <span className="flex items-center gap-1">
                  <Globe className="w-3 h-3 text-primary" /> Online
                </span>
              )}
            </Badge>
          </div>
        </div>

        <div>
          <h4 className="text-sm font-bold text-foreground">
            {session.course?.name || `${session.courseId} Attendance Session`}
          </h4>
          <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
            <span className="flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              {sessionDate.toLocaleDateString()}
            </span>
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {sessionDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-4 pt-1 pb-3 text-xs text-muted-foreground">
        {session.classType === 'in-person' && session.latitude && session.longitude ? (
          <div className="p-2 rounded bg-muted/20 border border-border flex items-center justify-between text-[11px] font-mono">
            <span>Geofence Center</span>
            <span>
              {session.latitude.toFixed(4)}, {session.longitude.toFixed(4)} (50m)
            </span>
          </div>
        ) : (
          <div className="p-2 rounded bg-muted/20 border border-border text-[11px]">
            Remote session: Student check-in allowed from any verified device.
          </div>
        )}
      </CardContent>

      <CardFooter className="p-4 pt-0 border-t border-border mt-auto flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            onClick={() => onLaunchProjector(session)}
            className="h-8 text-xs bg-primary text-primary-foreground hover:bg-primary/90 font-medium"
          >
            <Tv className="w-3.5 h-3.5 mr-1" /> Projector
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => onViewRoster(session)}
            className="h-8 text-xs border-border"
          >
            <Users className="w-3.5 h-3.5 mr-1" /> Roster
          </Button>
        </div>

        <div className="flex items-center gap-1">
          {!isClosed && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onCloseSession(session)}
              className="h-8 text-xs border-border text-amber-600 hover:text-amber-700"
              title="Close Attendance Session"
            >
              <PowerOff className="w-3.5 h-3.5" />
            </Button>
          )}

          <Button
            variant="outline"
            size="sm"
            onClick={() => onDeleteSession(session)}
            className="h-8 text-xs border-border text-destructive hover:text-destructive"
            title="Delete Session"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
}
