import { AttendanceRecordInterface } from "../utils/Interfaces";
import downloadFileWithBlob from "./downloadFile";
import escapeCSV from "./escapeSCV";

const exportToCSV = (data: AttendanceRecordInterface[]) => {
  const headers = ["Student ID", "Student Name", "Status", "Marked At"]
    .map((header) => `"${header}"`)
    .join(",");

  const rows = data.map((record) => [
    escapeCSV(record?.studentId),
    escapeCSV(record.Student?.name),
    escapeCSV(record.status),
    escapeCSV(new Date(record.createdAt).toLocaleString()),
  ]);

  // Include the UTF-8 BOM (\uFEFF) for Excel compatibility
  const csvContent =
    "\uFEFF" + [headers, ...rows.map((row) => row.join(","))].join("\r\n");

  const fileName = `ATTENDANCE ${new Date().toDateString()}.csv`;

  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  downloadFileWithBlob(blob, fileName);
};

export default exportToCSV;
