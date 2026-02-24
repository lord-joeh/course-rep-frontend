export default function escapeCSV(val: any) {
  const stringified = String(val ?? "N/A");
  // If value contains quotes, commas, or newlines, wrap in quotes and escape internal quotes
  if (/[",\n\r]/.test(stringified)) {
    return `"${stringified.replace(/"/g, '""')}"`;
  }
  return stringified;
}
