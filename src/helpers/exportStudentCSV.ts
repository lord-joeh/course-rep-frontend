import { Student } from "../utils/Interfaces";
import downloadFileWithBlob from "./downloadFile";
import escapeCSV from "./escapeSCV";

export default function exportStudentCSV(students: Student[]) {
  const headers = ["Student ID", "Name", "Phone Number", "Email"]
    .map((header) => `"${header}"`)
    .join(",");

  const rows = students.map((record) => [
    escapeCSV(record?.id),
    escapeCSV(record?.name),
    escapeCSV(record?.phone),
    escapeCSV(record?.email),
  ]);

  const csvContent =
    "\uFEFF" + [headers, ...rows.map((row) => row.join(","))].join("\r\n");

  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });

  downloadFileWithBlob(blob, "students.csv");
}
