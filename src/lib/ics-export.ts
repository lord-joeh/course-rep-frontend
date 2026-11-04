import type { Event } from '@/types';

/**
 * Format a Date or ISO string into iCalendar UTC timestamp: YYYYMMDDTHHMMSSZ
 */
function formatIcsDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
}

/**
 * Escapes characters for iCalendar text format
 */
function escapeIcsText(text: string): string {
  return text
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\n/g, '\\n');
}

/**
 * Generate standard RFC 5545 iCalendar string for a single Event or Series occurrence.
 */
export function generateEventIcs(event: Event): string {
  const dtStart = formatIcsDate(event.startDate);
  const dtEnd = formatIcsDate(event.endDate);
  const now = formatIcsDate(new Date().toISOString());

  const summary = escapeIcsText(
    event.course ? `[${event.course.id}] ${event.title}` : event.title,
  );
  const description = escapeIcsText(
    (event.description || '') +
      (event.meetingLink ? `\nMeeting Link: ${event.meetingLink}` : ''),
  );
  const location = escapeIcsText(event.venue);

  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Course Rep Management System//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:${event.id}@courserep.edu`,
    `DTSTAMP:${now}`,
    `DTSTART:${dtStart}`,
    `DTEND:${dtEnd}`,
    `SUMMARY:${summary}`,
    `DESCRIPTION:${description}`,
    `LOCATION:${location}`,
    `STATUS:${event.isCancelled ? 'CANCELLED' : 'CONFIRMED'}`,
  ];

  if (event.meetingLink) {
    lines.push(`URL:${event.meetingLink}`);
  }

  lines.push('END:VEVENT', 'END:VCALENDAR');

  return lines.join('\r\n');
}

/**
 * Trigger immediate browser download of an .ics calendar file.
 */
export function downloadEventIcs(event: Event): void {
  const ics = generateEventIcs(event);
  const blob = new Blob([ics], { type: 'text/calendar;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  const safeTitle = event.title.replace(/[^a-zA-Z0-9_-]/g, '_');
  link.setAttribute('download', `${safeTitle}.ics`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

