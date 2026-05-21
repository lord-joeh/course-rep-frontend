import { formatInTimeZone } from "date-fns-tz";

interface FormatTimeOptions {
  showAMPM?: boolean;
  timezone?: string;
}

export const formatTimeWithOffset = (
  _date: string, // no longer needed, keep for backwards compat
  time: string,
  options: FormatTimeOptions = { showAMPM: true, timezone: "Africa/Lagos" },
): string => {
  if (!time) return "—";

  try {
    const tz = options.timezone ?? "Africa/Lagos";
    const formatString = options.showAMPM ? "h:mm a" : "HH:mm";

    const today = new Date().toISOString().split("T")[0];
    const fullIso = `${today}T${time}`;

    return formatInTimeZone(fullIso, tz, formatString);
  } catch (error) {
    console.error("Failed to format time:", error, { time });
    return "Invalid Time";
  }
};
