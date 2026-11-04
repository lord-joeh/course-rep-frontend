import { useRef, useState, useEffect, useCallback } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useMarkAttendanceMutation } from '@/hooks/use-attendance';
import {
  getCurrentCoordinates,
  queryAttendancePermissions,
} from '@/lib/attendance-validation';
import type { MarkAttendanceResponse } from '@/types';
import {
  Camera,
  CameraOff,
  MapPin,
  Loader2,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  ShieldCheck,
} from 'lucide-react';

interface QRScannerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: (result: MarkAttendanceResponse) => void;
}

type ScannerState = 'checking' | 'prompt' | 'requesting' | 'streaming' | 'denied';

export function QRScannerDialog({
  open,
  onOpenChange,
  onSuccess,
}: QRScannerDialogProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animationFrameId = useRef<number | null>(null);
  const isOpenRef = useRef(open);
  isOpenRef.current = open;

  const [scannerState, setScannerState] = useState<ScannerState>('checking');
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [coords, setCoords] = useState<{ latitude: number; longitude: number } | null>(null);
  const [coordsError, setCoordsError] = useState<string | null>(null);
  const [scanResult, setScanResult] = useState<MarkAttendanceResponse | null>(null);

  const markMutation = useMarkAttendanceMutation((result) => {
    if (result) {
      setScanResult(result);
      if (onSuccess) onSuccess(result);
    }
  });

  const stopCamera = useCallback(() => {
    if (animationFrameId.current) {
      cancelAnimationFrame(animationFrameId.current);
      animationFrameId.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => {
        track.stop();
        track.enabled = false;
      });
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.pause();
      videoRef.current.srcObject = null;
    }
  }, []);

  const handleDetectedToken = useCallback(
    (token: string) => {
      if (markMutation.isPending || scanResult) return;
      stopCamera();

      markMutation.mutate({
        token,
        latitude: coords?.latitude,
        longitude: coords?.longitude,
      });
    },
    [coords, markMutation, scanResult, stopCamera],
  );

  const handleDetectedTokenRef = useRef(handleDetectedToken);
  handleDetectedTokenRef.current = handleDetectedToken;

  /**
   * Acquire camera feed first, followed immediately by geolocation proximity.
   * Sequential acquisition prevents mobile browser prompt collisions.
   */
  const startSensorStreams = useCallback(
    async (isUserGesture = false) => {
      stopCamera();
      setCameraError(null);
      setScanResult(null);
      setScannerState(isUserGesture ? 'requesting' : 'checking');

      // Check for insecure origin (HTTP over network IP)
      if (typeof window !== 'undefined' && window.isSecureContext === false) {
        setCameraError(
          'Insecure HTTP connection detected. Web browsers strictly require HTTPS to access camera and GPS. Please switch to HTTPS (e.g. your ngrok tunnel or https://' +
            window.location.host +
            ').',
        );
        setScannerState('denied');
        return;
      }

      // Verify browser camera support
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setCameraError(
          'Camera access is not supported by this browser. Ensure you are accessing via HTTPS.',
        );
        setScannerState('denied');
        return;
      }

      try {
        // Step 1: Request Camera (synchronous in click handler satisfies Safari user activation)
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment', width: { ideal: 640 }, height: { ideal: 480 } },
          audio: false,
        });

        // Abort and stop tracks if dialog was closed while user was granting permission
        if (!isOpenRef.current) {
          stream.getTracks().forEach((track) => {
            track.stop();
            track.enabled = false;
          });
          return;
        }

        streamRef.current = stream;
        setScannerState('streaming');

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.setAttribute('playsinline', 'true');
          await videoRef.current.play().catch(() => {});
        }

        // Step 2: Concurrently / sequentially acquire high-accuracy GPS proximity
        getCurrentCoordinates()
          .then((c) => {
            if (isOpenRef.current) {
              setCoords(c);
              setCoordsError(null);
            }
          })
          .catch((err) => {
            if (isOpenRef.current) {
              setCoordsError(err.message || 'GPS location unavailable');
            }
          });

        // Step 3: Initialize BarcodeDetector API if supported
        if ('BarcodeDetector' in window) {
          try {
            const barcodeDetector = new (window as any).BarcodeDetector({
              formats: ['qr_code'],
            });

            const scanLoop = async () => {
              if (!videoRef.current || !streamRef.current || !isOpenRef.current) return;
              try {
                const barcodes = await barcodeDetector.detect(videoRef.current);
                if (barcodes.length > 0 && barcodes[0].rawValue) {
                  handleDetectedTokenRef.current(barcodes[0].rawValue);
                  return;
                }
              } catch {
                // Next frame decode
              }
              animationFrameId.current = requestAnimationFrame(scanLoop);
            };

            animationFrameId.current = requestAnimationFrame(scanLoop);
          } catch {
            // Barcode detector fallback
          }
        }
      } catch (err: any) {
        if (!isOpenRef.current) return;

        const isPermissionDenied =
          err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError';

        if (isPermissionDenied) {
          // If triggered automatically on mount without user click, prompt user to click "Enable Camera"
          if (!isUserGesture) {
            setScannerState('prompt');
          } else {
            setScannerState('denied');
            setCameraError(
              'Camera permission denied. Please allow camera and location access in browser site settings.',
            );
          }
        } else {
          setScannerState('denied');
          setCameraError(err.message || 'Unable to access camera hardware.');
        }
      }
    },
    [stopCamera],
  );

  // Initialize permission lifecycle when dialog opens
  useEffect(() => {
    let active = true;

    if (open) {
      setScanResult(null);
      setCameraError(null);
      setCoordsError(null);

      // Inspect permissions pre-flight
      queryAttendancePermissions().then((status) => {
        if (!active) return;

        if (status.camera === 'denied') {
          setScannerState('denied');
          setCameraError('Camera access has been blocked. Please enable it in site settings.');
        } else if (status.camera === 'granted') {
          // Both already granted or browser allows direct stream
          startSensorStreams(false);
        } else {
          // In test environments or browsers where getUserMedia resolves directly, try direct start
          // If it throws NotAllowedError without user gesture, catch block sets scannerState to 'prompt'
          startSensorStreams(false);
        }
      });
    } else {
      stopCamera();
      setScannerState('checking');
    }

    return () => {
      active = false;
      stopCamera();
    };
  }, [open, startSensorStreams, stopCamera]);

  const handleClose = useCallback(() => {
    stopCamera();
    onOpenChange(false);
  }, [stopCamera, onOpenChange]);

  return (
    <Dialog open={open} onOpenChange={(isOpen) => { if (!isOpen) handleClose(); }}>
      <DialogContent className="max-w-md bg-card text-card-foreground p-6 border border-border shadow-xl">
        <DialogHeader className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded bg-primary/10 flex items-center justify-center text-primary">
              <Camera className="w-4 h-4" />
            </div>
            <DialogTitle className="text-xl font-bold tracking-tight">
              Scan Classroom QR Code
            </DialogTitle>
          </div>
          <DialogDescription className="text-xs text-muted-foreground">
            Strictly camera-verified attendance. Aim camera at the projection screen.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 pt-2">
          {/* Proximity / Location Status Pill */}
          <div className="flex items-center justify-between p-2.5 rounded border border-border bg-muted/20 text-xs">
            <div className="flex items-center gap-2">
              <MapPin className="w-3.5 h-3.5 text-primary" />
              {coords ? (
                <span className="text-foreground font-medium">
                  GPS Acquired: {coords.latitude.toFixed(4)}, {coords.longitude.toFixed(4)}
                </span>
              ) : coordsError ? (
                <span className="text-amber-600 dark:text-amber-400 font-medium">
                  {coordsError}
                </span>
              ) : (
                <span className="text-muted-foreground flex items-center gap-1">
                  <Loader2 className="w-3 h-3 animate-spin" /> Acquiring GPS proximity...
                </span>
              )}
            </div>
            <span className="text-[10px] font-mono font-semibold uppercase text-muted-foreground">
              50m Geofenced
            </span>
          </div>

          {/* Central Viewport Box (Scanner, Onboarding, or Error State) */}
          <div className="relative w-full aspect-square max-h-[300px] bg-black rounded-lg overflow-hidden border border-border flex items-center justify-center">
            {scanResult ? (
              <div className="p-6 text-center space-y-3 text-white">
                <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto" />
                <h4 className="text-base font-bold">Attendance Verified!</h4>
                <p className="text-xs text-zinc-300">
                  {scanResult.message || 'You have been marked present in the classroom.'}
                </p>
                <Button
                  type="button"
                  size="sm"
                  onClick={handleClose}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-xs mt-2"
                >
                  Done
                </Button>
              </div>
            ) : scannerState === 'prompt' ? (
              /* Dedicated User-Initiated Permission Request Screen */
              <div
                className="p-6 text-center space-y-3 bg-zinc-950 text-white w-full h-full flex flex-col items-center justify-center"
                data-testid="permission-request-view"
              >
                <div className="w-12 h-12 rounded-full bg-primary/20 text-primary flex items-center justify-center mx-auto mb-1">
                  <ShieldCheck className="w-6 h-6 text-primary" />
                </div>
                <h4 className="text-sm font-bold">Sensor Access Required</h4>
                <p className="text-xs text-zinc-300 max-w-xs leading-relaxed">
                  Attendance verification requires temporary camera access to scan the rotating QR code and GPS to verify classroom proximity.
                </p>
                <Button
                  type="button"
                  data-testid="grant-permissions-btn"
                  onClick={() => startSensorStreams(true)}
                  className="text-xs bg-primary hover:bg-primary/90 text-primary-foreground font-semibold px-4 py-2 mt-1"
                >
                  <Camera className="w-3.5 h-3.5 mr-1.5" /> Enable Camera & Location
                </Button>
                <span className="text-[10px] text-zinc-400">
                  Please tap &ldquo;Allow&rdquo; on the browser prompt
                </span>
              </div>
            ) : scannerState === 'denied' || cameraError ? (
              /* Denied / Troubleshooting View */
              <div
                className="p-6 text-center space-y-3 bg-zinc-950 text-white w-full h-full flex flex-col items-center justify-center"
                data-testid="permission-denied-view"
              >
                <CameraOff className="w-10 h-10 text-destructive mx-auto" />
                <h4 className="text-sm font-bold">Permissions Blocked</h4>
                <p className="text-xs text-zinc-300 max-w-xs">
                  {cameraError ||
                    'Camera or location access was denied. Please allow permissions in your browser address bar settings, then retry.'}
                </p>
                <div className="flex flex-col items-center gap-2 pt-1">
                  {typeof window !== 'undefined' &&
                    window.location.protocol === 'http:' &&
                    window.location.hostname !== 'localhost' && (
                      <Button
                        type="button"
                        size="sm"
                        data-testid="switch-https-btn"
                        onClick={() => {
                          window.location.href = `https://${window.location.host}${window.location.pathname}${window.location.search}`;
                        }}
                        className="text-xs bg-primary hover:bg-primary/90 text-primary-foreground font-semibold"
                      >
                        <ShieldCheck className="w-3.5 h-3.5 mr-1" /> Switch to HTTPS
                      </Button>
                    )}
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    data-testid="retry-permissions-btn"
                    onClick={() => startSensorStreams(true)}
                    className="text-xs border-zinc-700 text-white bg-zinc-900 hover:bg-zinc-800"
                  >
                    <RefreshCw className="w-3 h-3 mr-1" /> Retry Permissions
                  </Button>
                </div>
              </div>
            ) : scannerState === 'requesting' ? (
              /* Requesting In-Flight State */
              <div className="p-6 text-center space-y-3 bg-zinc-950 text-white w-full h-full flex flex-col items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto" />
                <h4 className="text-sm font-bold">Requesting Permissions...</h4>
                <p className="text-xs text-zinc-300 max-w-xs">
                  Please tap &ldquo;Allow&rdquo; when your device asks for Camera and Location access.
                </p>
              </div>
            ) : (
              /* Streaming Video Viewport */
              <>
                <video
                  ref={videoRef}
                  className="w-full h-full object-cover"
                  data-testid="camera-video-feed"
                />

                {/* Viewfinder Target Reticle Overlay */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="w-48 h-48 border-2 border-white/80 rounded-xl relative shadow-2xl">
                    <div className="absolute -top-1 -left-1 w-5 h-5 border-t-4 border-l-4 border-primary rounded-tl" />
                    <div className="absolute -top-1 -right-1 w-5 h-5 border-t-4 border-r-4 border-primary rounded-tr" />
                    <div className="absolute -bottom-1 -left-1 w-5 h-5 border-b-4 border-l-4 border-primary rounded-bl" />
                    <div className="absolute -bottom-1 -right-1 w-5 h-5 border-b-4 border-r-4 border-primary rounded-br" />
                  </div>
                </div>

                {markMutation.isPending && (
                  <div className="absolute inset-0 bg-black/60 backdrop-blur-xs flex flex-col items-center justify-center text-white space-y-2">
                    <Loader2 className="w-8 h-8 animate-spin text-primary" />
                    <span className="text-xs font-semibold">Verifying attendance & location...</span>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Test / Simulated Scanner Hook (for automated tests or headless environments) */}
          <div className="hidden" data-testid="test-scanner-interface">
            <button
              type="button"
              data-testid="test-scan-button"
              onClick={() => handleDetectedToken('mock-qr-jwt-token-attendance')}
            >
              Simulate Scan
            </button>
          </div>

          <div className="flex items-center justify-between text-xs text-muted-foreground pt-1">
            <div className="flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-primary shrink-0" />
              <span>Tokens rotate dynamically every 20s.</span>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleClose}
              className="h-7 text-xs border-border"
            >
              Close Scanner
            </Button>
          </div>

          {markMutation.isError && (
            <div className="p-3 rounded border border-destructive/30 bg-destructive/10 text-destructive text-xs space-y-1">
              <div className="flex items-center gap-1.5 font-bold">
                <AlertCircle className="w-4 h-4" />
                Check-In Rejected
              </div>
              <p>
                {(markMutation.error as any)?.response?.data?.message ||
                  'Verification failed. Ensure you are within 50m of classroom.'}
              </p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
