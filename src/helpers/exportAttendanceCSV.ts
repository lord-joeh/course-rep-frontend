import { AttendanceRecordInterface } from "../utils/Interfaces";

const exportToCSV = (data: AttendanceRecordInterface[]) => {
  const headers = ["Student ID", "Student Name", "Status", "Marked At"];

  const rows = data.map((record) => [
    record.studentId || "N/A",
    record.Student?.name || "N/A",
    record.status,
    new Date(record.createdAt).toLocaleString(),
  ]);

  const csvContent = [
    headers.join(","),
    ...rows.map((row) => row.join(",")),
  ].join("\n");

  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute(
    "download",
    `$Attendance_${new Date().toLocaleDateString()}.csv`,
  );
  link.style.visibility = "hidden";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

export default exportToCSV;
