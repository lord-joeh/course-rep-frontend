import { formatInTimeZone } from "date-fns-tz";

interface FormatTimeOptions {
  showAMPM?: boolean;
}

export const formatTimeWithOffset = (
  date: string,
  time: string,
  options: FormatTimeOptions = { showAMPM: true },
): string => {
  if (!date || !time) return "—";

  try {
    const fullIsoString = `${date.split("T")[0]}T${time}`;

    const formatString = options.showAMPM ? "h:mm a" : "HH:mm";

    return formatInTimeZone(fullIsoString, "UTC", formatString);
  } catch (error) {
    console.error("Failed to format time:", error);
    return "Invalid Time";
  }
};
