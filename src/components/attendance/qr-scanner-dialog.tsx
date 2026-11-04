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
import { getCurrentCoordinates } from '@/lib/attendance-validation';
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

  const startCamera = useCallback(async () => {
    stopCamera();
    setCameraError(null);
    setScanResult(null);

    // 1. Concurrently fetch geolocation
    getCurrentCoordinates()
      .then((c) => {
        setCoords(c);
        setCoordsError(null);
      })
      .catch((err) => {
        setCoordsError(err.message || 'GPS location unavailable');
      });

    // 2. Request camera video stream
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setCameraError('Camera access is not supported by this browser.');
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 640 }, height: { ideal: 480 } },
        audio: false,
      });

      // Abort and stop tracks immediately if dialog was closed while awaiting permission/hardware
      if (!isOpenRef.current) {
        stream.getTracks().forEach((track) => {
          track.stop();
          track.enabled = false;
        });
        return;
      }

      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.setAttribute('playsinline', 'true');
        await videoRef.current.play().catch(() => {});
      }

      // Check for native BarcodeDetector API support
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
              // Frame decoding error or waiting for next frame
            }
            animationFrameId.current = requestAnimationFrame(scanLoop);
          };

          animationFrameId.current = requestAnimationFrame(scanLoop);
        } catch {
          // BarcodeDetector failed to initialize
        }
      }
    } catch (err: any) {
      if (!isOpenRef.current) return;
      setCameraError(
        err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError'
          ? 'Camera permission denied. Please allow camera access in browser site settings.'
          : err.message || 'Unable to access camera hardware.',
      );
    }
  }, [stopCamera]);

  useEffect(() => {
    if (open) {
      startCamera();
    } else {
      stopCamera();
    }
    return () => {
      stopCamera();
    };
  }, [open, startCamera, stopCamera]);

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

          {/* Camera Viewport or Error Screen */}
          <div className="relative w-full aspect-square max-h-[300px] bg-black rounded-lg overflow-hidden border border-border flex items-center justify-center">
            {cameraError ? (
              <div className="p-6 text-center space-y-3">
                <CameraOff className="w-10 h-10 text-destructive mx-auto" />
                <h4 className="text-sm font-bold text-white">Camera Permission Required</h4>
                <p className="text-xs text-zinc-300 max-w-xs">{cameraError}</p>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={startCamera}
                  className="text-xs border-zinc-700 text-white bg-zinc-900 hover:bg-zinc-800"
                >
                  <RefreshCw className="w-3 h-3 mr-1" /> Retry Camera
                </Button>
              </div>
            ) : scanResult ? (
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
            ) : (
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
