import { useRef, useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAttendanceStream } from '@/hooks/use-attendance-stream';
import { useCloseAttendanceMutation } from '@/hooks/use-attendance';
import type { AttendanceInstance } from '@/types';
import {
  Maximize2,
  Minimize2,
  PowerOff,
  Wifi,
  WifiOff,
  Users,
  MapPin,
  Clock,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';

interface ProjectorModalProps {
  session: AttendanceInstance | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ProjectorModal({ session, open, onOpenChange }: ProjectorModalProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const stream = useAttendanceStream({
    instanceId: session?.id,
    initialQrImage: session?.qrImage,
    initialToken: session?.qrToken,
    initialPresentCount: 0,
  });

  const closeMutation = useCloseAttendanceMutation(() => {
    // Session closed
  });

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);

  const toggleFullscreen = async () => {
    if (!containerRef.current) return;
    try {
      if (!document.fullscreenElement) {
        await containerRef.current.requestFullscreen();
      } else {
        await document.exitFullscreen();
      }
    } catch {
      // Fullscreen not supported or rejected
    }
  };

  const handleCloseSession = () => {
    if (!session) return;
    closeMutation.mutate(session.id);
  };

  if (!session) return null;

  const isClosed = session.isClose || stream.isSessionClosed;
  const countdownPercent = Math.min(100, Math.max(0, (stream.countdown / 20) * 100));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl p-0 overflow-hidden bg-background border border-border shadow-2xl">
        <div
          ref={containerRef}
          className="relative flex flex-col min-h-[640px] bg-background text-foreground select-none"
        >
          {/* Top Control Bar */}
          <DialogHeader className="p-4 border-b border-border bg-card flex flex-row items-center justify-between space-y-0">
            <div className="flex items-center gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <DialogTitle className="text-xl font-bold tracking-tight">
                    {session.courseId} — Classroom Attendance Projector
                  </DialogTitle>
                  <Badge
                    variant="outline"
                    className={
                      isClosed
                        ? 'bg-muted text-muted-foreground border-border'
                        : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
                    }
                  >
                    {isClosed ? 'Session Closed' : 'Live Active Stream'}
                  </Badge>
                </div>
                <div className="flex items-center gap-4 text-xs text-muted-foreground mt-1">
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3 h-3" />
                    {session.classType === 'in-person'
                      ? 'In-Person (Geofenced 50m radius)'
                      : 'Online / Remote'}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {new Date(session.date).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <div
                className={`flex items-center gap-1.5 px-2.5 py-1 text-xs rounded border ${
                  stream.isConnected
                    ? 'border-emerald-500/20 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                    : 'border-amber-500/20 bg-amber-500/10 text-amber-600 dark:text-amber-400'
                }`}
                title={stream.isConnected ? 'WebSocket stream active' : 'Connecting to stream...'}
              >
                {stream.isConnected ? (
                  <>
                    <Wifi className="w-3.5 h-3.5" /> Live
                  </>
                ) : (
                  <>
                    <WifiOff className="w-3.5 h-3.5" /> Reconnecting
                  </>
                )}
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={toggleFullscreen}
                className="h-8 text-xs border-border"
                title="Toggle Fullscreen Projector Mode"
              >
                {isFullscreen ? (
                  <>
                    <Minimize2 className="w-3.5 h-3.5 mr-1" /> Exit Fullscreen
                  </>
                ) : (
                  <>
                    <Maximize2 className="w-3.5 h-3.5 mr-1" /> Fullscreen
                  </>
                )}
              </Button>

              {!isClosed && (
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={handleCloseSession}
                  disabled={closeMutation.isPending}
                  className="h-8 text-xs font-semibold"
                >
                  <PowerOff className="w-3.5 h-3.5 mr-1" />
                  Close Session
                </Button>
              )}
            </div>
          </DialogHeader>

          {/* Main Projection Body */}
          <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-6 p-6">
            {/* Left 2 Cols: High Contrast Dynamic QR Code */}
            <div className="md:col-span-2 flex flex-col items-center justify-center p-6 bg-card rounded border border-border text-center space-y-4">
              {isClosed ? (
                <div className="py-16 space-y-3">
                  <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto text-muted-foreground">
                    <PowerOff className="w-8 h-8" />
                  </div>
                  <h3 className="text-xl font-bold">Attendance Session Terminated</h3>
                  <p className="text-sm text-muted-foreground max-w-sm">
                    This attendance session has been finalized. All rotating QR tokens are expired.
                  </p>
                </div>
              ) : stream.qrImage ? (
                <>
                  {/* High Contrast Solid QR Container */}
                  <div className="relative p-4 bg-white rounded border-2 border-primary/20 shadow-lg">
                    <img
                      src={stream.qrImage}
                      alt="Rotating Attendance QR Code"
                      className="w-64 h-64 sm:w-72 sm:h-72 object-contain"
                    />
                    <div className="absolute inset-x-0 bottom-1 flex justify-center">
                      <span className="text-[10px] font-mono tracking-wider font-semibold text-slate-800 bg-white/90 px-2 py-0.5 rounded">
                        ROTATING DYNAMIC TOKEN
                      </span>
                    </div>
                  </div>

                  {/* 20-second dynamic countdown progress bar */}
                  <div className="w-full max-w-sm space-y-1.5">
                    <div className="flex items-center justify-between text-xs font-mono">
                      <span className="text-muted-foreground">Next token refresh in:</span>
                      <span className="font-bold text-primary">{stream.countdown}s</span>
                    </div>
                    <div className="w-full h-2 bg-muted rounded overflow-hidden">
                      <div
                        className="h-full bg-primary transition-all duration-1000 ease-linear"
                        style={{ width: `${countdownPercent}%` }}
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-2 text-xs text-muted-foreground pt-1">
                    <ShieldCheck className="w-4 h-4 text-primary" />
                    <span>Scan with mobile device camera. Tokens refresh automatically.</span>
                  </div>
                </>
              ) : (
                <div className="py-16 space-y-3">
                  <AlertTriangle className="w-8 h-8 text-amber-500 mx-auto" />
                  <p className="text-sm font-medium text-muted-foreground">
                    Initializing real-time dynamic QR code...
                  </p>
                </div>
              )}
            </div>

            {/* Right Col: Live Attendees Stream & Stats */}
            <div className="flex flex-col space-y-4">
              {/* Stats Card */}
              <div className="p-4 bg-card rounded border border-border space-y-2">
                <div className="flex items-center justify-between text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  <span>Current Check-Ins</span>
                  <Users className="w-4 h-4" />
                </div>
                <div className="text-3xl font-extrabold text-foreground tracking-tight">
                  {stream.livePresentCount}
                </div>
                <p className="text-xs text-muted-foreground">
                  Students checked in and verified in classroom
                </p>
              </div>

              {/* Live Ticker */}
              <div className="flex-1 p-4 bg-card rounded border border-border flex flex-col min-h-[220px]">
                <div className="flex items-center justify-between text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                  <span>Live Stream Feed</span>
                  <span className="text-[10px] text-primary font-mono">SOCKET.IO</span>
                </div>

                <div className="flex-1 space-y-2 overflow-y-auto max-h-[260px] pr-1">
                  {stream.recentAttendees.length === 0 ? (
                    <div className="h-full flex items-center justify-center text-xs text-muted-foreground text-center p-4">
                      Awaiting student scans...
                    </div>
                  ) : (
                    stream.recentAttendees.map((att, idx) => (
                      <div
                        key={`${att.studentId}-${idx}`}
                        className="flex items-center justify-between p-2 rounded bg-muted/40 border border-border text-xs animate-in fade-in slide-in-from-top-1"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                          <div className="truncate">
                            <span className="font-semibold text-foreground">
                              {att.studentName || att.studentId}
                            </span>
                          </div>
                        </div>
                        <span className="text-[10px] font-mono text-muted-foreground shrink-0 ml-2">
                          {new Date(att.markedAt).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                            second: '2-digit',
                          })}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
