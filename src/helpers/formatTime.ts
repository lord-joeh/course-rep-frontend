import { format } from 'date-fns';
import { toZonedTime } from 'date-fns-tz';

interface FormatTimeOptions {
  showAMPM?: boolean;
}

export const formatTimeWithOffset = (
  date: string,
  time: string,
  options: FormatTimeOptions = { showAMPM: true }
): string => {
  if (!date || !time) {
    return '—';
  }

  try {
    const combinedISOString = `${date.split('T')[0]}T${time}`;

    const offset = time.slice(-3);
    const timeWithZone = toZonedTime(combinedISOString, offset);

    const formatString = options.showAMPM ? 'h:mm a' : 'HH:mm';
    return format(timeWithZone, formatString);
  } catch (error) {
    console.error('Failed to format time:', error);
    return 'Invalid Time';
  }
};
