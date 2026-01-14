import { AttendanceRecordInterface } from "../utils/Interfaces";

const exportToCSV = (data: AttendanceRecordInterface[]) => {
  const headers = ["Student ID", "Student Name", "Status", "Marked At"];

  const escapeCSV = (val: any) => {
    const stringified = String(val ?? "N/A");
    // If value contains quotes, commas, or newlines, wrap in quotes and escape internal quotes
    if (/[",\n\r]/.test(stringified)) {
      return `"${stringified.replace(/"/g, '""')}"`;
    }
    return stringified;
  };

  const rows = data.map((record) => [
    escapeCSV(record?.studentId),
    escapeCSV(record.Student?.name),
    escapeCSV(record.status),
    escapeCSV(new Date(record.createdAt).toLocaleString()),
  ]);

  // Include the UTF-8 BOM (\uFEFF) for Excel compatibility
  const csvContent =
    "\uFEFF" +
    [headers.join(","), ...rows.map((row) => row.join(","))].join("\r\n");

  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = `Attendance_${new Date().toISOString().split("T")[0]}.csv`;

  document.body.appendChild(link);
  link.click();

  // Cleanup
  setTimeout(() => {
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, 100);
};

export default exportToCSV;
