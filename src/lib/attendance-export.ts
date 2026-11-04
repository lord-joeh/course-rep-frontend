import { apiClient } from '@/lib/api-client';
import type { ApiResponse, AttendanceDetailResponse, AttendanceInstance, AttendanceRecord } from '@/types';
import { toast } from 'sonner';

/**
 * Generates an RFC-4180 compliant CSV string with UTF-8 BOM from session and attendee records.
 */
export function generateAttendanceCsv(
  session: AttendanceInstance,
  attendees: AttendanceRecord[],
): string {
  const headers = [
    'Student ID',
    'Student Name',
    'Status',
    'Check-In Time',
    'Course Code',
    'Course Name',
    'Session Date',
    'Session Time',
    'Class Type',
    'Location / Geofence',
  ];

  const escapeCsv = (val: string | number | null | undefined): string => {
    if (val === null || val === undefined) return '""';
    const str = String(val).replace(/"/g, '""');
    return `"${str}"`;
  };

  const sessionDate = new Date(session.date);
  const formattedDate = sessionDate.toLocaleDateString();
  const formattedTime = sessionDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const classTypeStr = session.classType === 'in-person' ? 'In-Person' : 'Online / Remote';
  const locationStr =
    session.classType === 'in-person' && session.latitude && session.longitude
      ? `${session.latitude.toFixed(5)}, ${session.longitude.toFixed(5)} (50m)`
      : 'N/A';

  const rows = attendees.map((record) => {
    const studentId = record.studentId || '';
    const studentName = record.student?.name || 'Enrolled Student';
    const status = (record.status || 'absent').toUpperCase();
    const checkInTime =
      record.status === 'present' && record.date
        ? new Date(record.date).toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
          })
        : 'N/A';

    return [
      escapeCsv(studentId),
      escapeCsv(studentName),
      escapeCsv(status),
      escapeCsv(checkInTime),
      escapeCsv(session.courseId),
      escapeCsv(session.course?.name || ''),
      escapeCsv(formattedDate),
      escapeCsv(formattedTime),
      escapeCsv(classTypeStr),
      escapeCsv(locationStr),
    ].join(',');
  });

  // Prepend UTF-8 BOM (\uFEFF) for compatibility with Excel, Numbers, and Google Sheets
  return '\uFEFF' + [headers.map(escapeCsv).join(','), ...rows].join('\r\n');
}

/**
 * Triggers a direct browser file download of the generated attendance CSV.
 */
export function downloadAttendanceCsv(
  session: AttendanceInstance,
  attendees: AttendanceRecord[],
): void {
  const csvContent = generateAttendanceCsv(session, attendees);
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;

  const safeCourseId = session.courseId.replace(/[^a-zA-Z0-9_-]/g, '_');
  const dateStr = new Date(session.date).toISOString().slice(0, 10);
  link.download = `attendance_${safeCourseId}_${dateStr}.csv`;

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Fetches attendance instance details (if needed) and downloads the CSV.
 */
export async function exportAttendanceSessionCsv(
  session: AttendanceInstance,
  existingAttendees?: AttendanceRecord[],
): Promise<void> {
  try {
    let attendees: AttendanceRecord[] = existingAttendees ? [...existingAttendees] : [];

    if (attendees.length === 0) {
      toast.loading('Preparing attendance export...', { id: 'export-csv' });
      const res = await apiClient.get<ApiResponse<AttendanceDetailResponse>>(
        `/attendance/instances/${session.id}`,
      );
      attendees = res.data?.data?.attendees?.items || [];
    }

    downloadAttendanceCsv(session, attendees);
    toast.success(`Exported attendance roster (${attendees.length} records)`, {
      id: 'export-csv',
    });
  } catch (error: any) {
    toast.error(error.message || 'Failed to export attendance CSV', { id: 'export-csv' });
  }
}
