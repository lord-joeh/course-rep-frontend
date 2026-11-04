import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useCoursesQuery } from '@/hooks/use-courses';
import { useInitializeAttendanceMutation } from '@/hooks/use-attendance';
import {
  initializeAttendanceSchema,
  getCurrentCoordinates,
} from '@/lib/attendance-validation';
import type { AttendanceInstance, ClassType } from '@/types';
import {
  QrCode,
  MapPin,
  Calendar,
  Clock,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Globe,
  Radio,
} from 'lucide-react';

interface InitializeSessionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSessionCreated?: (session: AttendanceInstance) => void;
}

export function InitializeSessionDialog({
  open,
  onOpenChange,
  onSessionCreated,
}: InitializeSessionDialogProps) {
  const { data: coursesData } = useCoursesQuery();
  const courses = coursesData?.items || [];

  const nowIso = new Date();
  nowIso.setMinutes(nowIso.getMinutes() - nowIso.getTimezoneOffset());
  const defaultDateTime = nowIso.toISOString().slice(0, 16);

  const [courseId, setCourseId] = useState('');
  const [date, setDate] = useState(defaultDateTime);
  const [classType, setClassType] = useState<ClassType>('in-person');
  const [latitude, setLatitude] = useState<string>('');
  const [longitude, setLongitude] = useState<string>('');
  const [durationMinutes, setDurationMinutes] = useState<number>(60);
  const [isDetectingLocation, setIsDetectingLocation] = useState(false);
  const [locationSuccessMsg, setLocationSuccessMsg] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const initializeMutation = useInitializeAttendanceMutation((created) => {
    if (created && onSessionCreated) {
      onSessionCreated(created);
    }
    handleClose();
  });

  const handleClose = () => {
    setCourseId('');
    setDate(defaultDateTime);
    setClassType('in-person');
    setLatitude('');
    setLongitude('');
    setDurationMinutes(60);
    setLocationSuccessMsg(null);
    setErrors({});
    onOpenChange(false);
  };

  const handleDetectLocation = async () => {
    setIsDetectingLocation(true);
    setErrors((prev) => {
      const next = { ...prev };
      delete next.latitude;
      delete next.longitude;
      return next;
    });

    try {
      const coords = await getCurrentCoordinates();
      setLatitude(coords.latitude.toFixed(6));
      setLongitude(coords.longitude.toFixed(6));
      setLocationSuccessMsg(`Location acquired (Lat: ${coords.latitude.toFixed(4)}, Lng: ${coords.longitude.toFixed(4)})`);
    } catch (err: any) {
      setErrors((prev) => ({
        ...prev,
        latitude: err.message || 'Unable to retrieve location coordinates.',
      }));
    } finally {
      setIsDetectingLocation(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    const parsedLat = latitude ? parseFloat(latitude) : undefined;
    const parsedLng = longitude ? parseFloat(longitude) : undefined;

    const validationResult = initializeAttendanceSchema.safeParse({
      courseId,
      date: new Date(date).toISOString(),
      classType,
      latitude: parsedLat,
      longitude: parsedLng,
      durationMinutes,
    });

    if (!validationResult.success) {
      const fieldErrors: Record<string, string> = {};
      for (const issue of validationResult.error.issues) {
        const path = issue.path[0]?.toString() || 'form';
        fieldErrors[path] = issue.message;
      }
      setErrors(fieldErrors);
      return;
    }

    initializeMutation.mutate({
      courseId,
      date: new Date(date).toISOString(),
      classType,
      latitude: parsedLat,
      longitude: parsedLng,
      durationMinutes,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg bg-card text-card-foreground p-6 border border-border shadow-md">
        <DialogHeader className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded bg-primary/10 flex items-center justify-center text-primary">
              <QrCode className="w-4 h-4" />
            </div>
            <DialogTitle className="text-xl font-bold tracking-tight">
              Initialize Attendance Session
            </DialogTitle>
          </div>
          <DialogDescription className="text-sm text-muted-foreground">
            Launch a rotating dynamic QR attendance session with automated student enrollment sync.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          {/* Course Selector */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-foreground uppercase tracking-wider">
              Course *
            </label>
            <select
              value={courseId}
              onChange={(e) => setCourseId(e.target.value)}
              className="w-full h-10 px-3 py-2 text-sm rounded border border-input bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
            >
              <option value="">Select a course...</option>
              {courses.map((course) => (
                <option key={course.id} value={course.id}>
                  {course.id} - {course.name}
                </option>
              ))}
            </select>
            {errors.courseId && (
              <p className="text-xs font-medium text-destructive flex items-center gap-1">
                <AlertCircle className="w-3 h-3" /> {errors.courseId}
              </p>
            )}
          </div>

          {/* Class Type Toggle */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-foreground uppercase tracking-wider">
              Class Type *
            </label>
            <div className="grid grid-cols-2 gap-3 pt-1">
              <button
                type="button"
                onClick={() => {
                  setClassType('in-person');
                  setLocationSuccessMsg(null);
                }}
                className={`flex items-center justify-center gap-2 p-3 text-sm font-medium border rounded transition-colors ${
                  classType === 'in-person'
                    ? 'border-primary bg-primary/10 text-primary font-semibold'
                    : 'border-border bg-background text-muted-foreground hover:bg-muted/50'
                }`}
              >
                <MapPin className="w-4 h-4" />
                In-Person (Geofenced 50m)
              </button>
              <button
                type="button"
                onClick={() => {
                  setClassType('online');
                  setLocationSuccessMsg(null);
                  setErrors((prev) => {
                    const next = { ...prev };
                    delete next.latitude;
                    delete next.longitude;
                    return next;
                  });
                }}
                className={`flex items-center justify-center gap-2 p-3 text-sm font-medium border rounded transition-colors ${
                  classType === 'online'
                    ? 'border-primary bg-primary/10 text-primary font-semibold'
                    : 'border-border bg-background text-muted-foreground hover:bg-muted/50'
                }`}
              >
                <Globe className="w-4 h-4" />
                Online / Remote
              </button>
            </div>
          </div>

          {/* Geolocation Section for In-Person Classes */}
          {classType === 'in-person' && (
            <div className="p-3.5 border border-border bg-muted/20 rounded space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
                  <MapPin className="w-3.5 h-3.5 text-primary" />
                  Classroom Geofence Center Coordinates *
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleDetectLocation}
                  disabled={isDetectingLocation}
                  className="h-7 text-xs border-border"
                >
                  {isDetectingLocation ? (
                    <>
                      <Loader2 className="w-3 h-3 animate-spin mr-1" />
                      Acquiring...
                    </>
                  ) : (
                    <>
                      <Radio className="w-3 h-3 mr-1 text-primary" />
                      Detect Current Location
                    </>
                  )}
                </Button>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[11px] font-medium text-muted-foreground">Latitude</label>
                  <Input
                    placeholder="e.g. 5.6037"
                    value={latitude}
                    onChange={(e) => setLatitude(e.target.value)}
                    className="h-8 text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-medium text-muted-foreground">Longitude</label>
                  <Input
                    placeholder="e.g. -0.1870"
                    value={longitude}
                    onChange={(e) => setLongitude(e.target.value)}
                    className="h-8 text-xs font-mono"
                  />
                </div>
              </div>

              {locationSuccessMsg && (
                <div className="flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  {locationSuccessMsg}
                </div>
              )}

              {(errors.latitude || errors.longitude) && (
                <p className="text-xs font-medium text-destructive flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" /> {errors.latitude || errors.longitude}
                </p>
              )}
            </div>
          )}

          {/* Date & Time Picker */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-foreground uppercase tracking-wider flex items-center gap-1">
                <Calendar className="w-3 h-3 text-muted-foreground" />
                Date & Start Time *
              </label>
              <Input
                type="datetime-local"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="h-9 text-xs"
              />
              {errors.date && (
                <p className="text-xs font-medium text-destructive">{errors.date}</p>
              )}
            </div>

            {/* Duration Selector */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-foreground uppercase tracking-wider flex items-center gap-1">
                <Clock className="w-3 h-3 text-muted-foreground" />
                Session Duration *
              </label>
              <select
                value={durationMinutes}
                onChange={(e) => setDurationMinutes(Number(e.target.value))}
                className="w-full h-9 px-3 text-xs rounded border border-input bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
              >
                <option value={15}>15 Minutes</option>
                <option value={30}>30 Minutes</option>
                <option value={45}>45 Minutes</option>
                <option value={60}>1 Hour (Standard)</option>
                <option value={90}>1.5 Hours</option>
                <option value={120}>2 Hours</option>
                <option value={180}>3 Hours</option>
              </select>
            </div>
          </div>

          <DialogFooter className="pt-3 border-t border-border flex items-center justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={initializeMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={initializeMutation.isPending}
              className="bg-primary text-primary-foreground hover:bg-primary/90 font-medium"
            >
              {initializeMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  Starting Session...
                </>
              ) : (
                'Start Attendance Session'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

