import { useEffect, useState, useMemo, useCallback } from "react";
import {
  Button,
  Card,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeadCell,
  TableRow,
  Spinner,
  Pagination,
  Tooltip,
  Label,
} from "flowbite-react";
import { SiGooglemessages } from "react-icons/si";
import { FaFileExport } from "react-icons/fa6";
import { MdRefresh } from "react-icons/md";
import { getStudents } from "../../../services/studentService";
import axios from "axios";
import ToastMessage from "../../common/ToastMessage";
import MessageToStudentModal from "../../common/MessageToStudentModal";
import { useNavigate } from "react-router-dom";

interface Student {
  id: string;
  name: string;
  phone: string;
  email: string;
  status: "active";
}

type PaginationType = {
  currentPage: number;
  totalPages: number;
  itemsPerPage: number;
  totalItems: number;
};

const Students = () => {
  const [students, setStudents] = useState<Student[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setLoading] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const navigate = useNavigate();

  const [pagination, setPagination] = useState<PaginationType>({
    currentPage: 1,
    totalPages: 0,
    itemsPerPage: 10,
    totalItems: 0,
  });

  const [toast, setToast] = useState<{
    message: string;
    type: "error" | "success";
    isVisible: boolean;
  }>({
    message: "",
    type: "error",
    isVisible: false,
  });

  const [messageModal, setMessageModal] = useState({
    isOpen: false,
    studentId: "",
  });

  const closeToast = () => {
    setToast((prev) => ({ ...prev, isVisible: false }));
  };

  const fetchStudentsData = async (
    page = 1,
    itemsPerPage = pagination.itemsPerPage,
  ) => {
    try {
      setLoading(true);
      setError(null);

      const response = await getStudents(page, itemsPerPage);

      setStudents(response.data?.students || []);
      setPagination({
        currentPage: response.data?.pagination?.currentPage || page,
        itemsPerPage: response.data?.pagination?.itemsPerPage || itemsPerPage,
        totalItems: response.data?.pagination?.totalItems || 0,
        totalPages: response.data?.pagination?.totalPages || 1,
      });
    } catch (error) {
      if (axios.isAxiosError(error)) {
        setToast({
          message: error.response?.data?.error || "Error fetching students",
          type: "error",
          isVisible: true,
        });
      } else {
        setToast({
          message: "An unexpected error occurred.",
          type: "error",
          isVisible: true,
        });
      }
      setError("An unexpected error occurred while fetching data.");
    } finally {
      setLoading(false);
    }
  };

  const debouncedFetch = useCallback((page: number, perPage: number) => {
    const timeoutId = setTimeout(() => {
      fetchStudentsData(page, perPage);
    }, 300);
    return () => clearTimeout(timeoutId);
  }, []);

  useEffect(() => {
    const cleanup = debouncedFetch(
      pagination.currentPage,
      pagination.itemsPerPage,
    );
    return () => cleanup();
  }, [pagination.currentPage, pagination.itemsPerPage, debouncedFetch]);

  const onPageChange = (pageNumber: number) => {
    setPagination((prev) => ({ ...prev, currentPage: pageNumber }));
  };

  const handleRefresh = () => {
    fetchStudentsData(pagination.currentPage, pagination.itemsPerPage);
  };

  const handleExport = () => {
    const headers = ["Student ID", "Name", "Phone Number", "Email"]
      .map((h) => `"${h}"`)
      .join(",");
    const rows = students
      .map(
        (student) =>
          `"${student.id}","${student.name}","${student.phone}","${student.email}"`,
      )
      .join("\n");
    const csvContent = `${headers}\n${rows}`;
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "students.csv";
    link.click();
    setToast({
      message: "Students data exported successfully!",
      type: "success",
      isVisible: true,
    });
  };

  const filteredStudents = useMemo(() => {
    if (!searchQuery) return students;
    const lowerQuery = searchQuery.toLowerCase();
    return students.filter((student) =>
      Object.values(student).some((value) =>
        String(value).toLowerCase().includes(lowerQuery),
      ),
    );
  }, [students, searchQuery]);

  const activeStudentsCount = useMemo(
    () => students.filter((s) => s.status === "active").length,
    [students],
  );
  const inactiveStudentsCount = useMemo(
    () => students.filter((s) => s.status !== "active").length,
    [students],
  );

  const studentTableHeaders = [
    "#",
    "Student ID",
    "Name",
    "Phone Number",
    "Email",
    "Actions",
  ];

  return (
    <div className="flex flex-col gap-6 p-6 font-sans md:p-1">
      <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
        Students Management
      </h1>

      <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
        <input
          id="search"
          type="search"
          placeholder="Search students..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full flex-grow rounded-lg border px-4 py-2 focus:outline-none md:w-auto"
        />
        <Button onClick={handleExport}>
          <FaFileExport className="me-2 h-4 w-4" /> Export Students
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-6 sm:grid-cols-3">
        <Card className="border-l-4 border-l-emerald-500">
          <h5 className="text-xl font-bold">Active Students</h5>
          <p className="text-4xl font-extrabold text-emerald-500">
            {activeStudentsCount}
          </p>
        </Card>
        <Card className="border-l-4 border-l-red-600">
          <h5 className="text-xl font-bold">Inactive Students</h5>
          <p className="text-4xl font-extrabold text-red-600">
            {inactiveStudentsCount}
          </p>
        </Card>
        <Card className="border-l-4 border-l-blue-600">
          <h5 className="text-xl font-bold">Registered Students</h5>
          <p className="text-4xl font-extrabold text-blue-600">
            {pagination.totalItems}
          </p>
        </Card>
      </div>

      <div className="flex justify-between">
        <div className="flex items-center gap-2">
          <Label htmlFor="entries">Show</Label>
          <select
            id="entries"
            className="rounded text-gray-900 dark:text-white"
            value={pagination.itemsPerPage}
            onChange={(e) =>
              setPagination((prev) => ({
                ...prev,
                itemsPerPage: parseInt(e.target.value),
                currentPage: 1,
              }))
            }
          >
            <option value="10">10</option>
            <option value="25">25</option>
            <option value="50">50</option>
            <option value={pagination.totalItems}>All</option>
          </select>
          Entries
        </div>
        <Button onClick={handleRefresh}>
          <MdRefresh className="me-2 h-4 w-4" /> Refresh
        </Button>
      </div>

      <div className="overflow-x-auto rounded-lg shadow-md">
        <Table striped>
          <TableHead>
            <TableRow>
              {studentTableHeaders.map((head, idx) => (
                <TableHeadCell key={idx}>{head}</TableHeadCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={studentTableHeaders.length}>
                  <Spinner size="lg" className="me-4 animate-spin" />{" "}
                </TableCell>
              </TableRow>
            ) : filteredStudents.length > 0 ? (
              filteredStudents.map((student, index) => (
                <TableRow
                  key={student.id}
                  className="hover:bg-gray-200 hover:dark:bg-gray-600"
                >
                  <TableCell
                    className="hover:cursor-pointer"
                    onClick={() => navigate(`${student?.id}`)}
                  >
                    {index + 1}
                  </TableCell>
                  <TableCell
                    className="hover:cursor-pointer"
                    onClick={() => navigate(`${student?.id}`)}
                  >
                    {student.id}
                  </TableCell>
                  <TableCell
                    className="hover:cursor-pointer"
                    onClick={() => navigate(`${student?.id}`)}
                  >
                    {student.name}
                  </TableCell>
                  <TableCell>{student.phone}</TableCell>
                  <TableCell>{student.email}</TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Tooltip content="Message">
                        <SiGooglemessages
                          size="25px"
                          color="blue"
                          onClick={() =>
                            setMessageModal((prev) => ({
                              ...prev,
                              isOpen: true,
                              studentId: student?.id,
                            }))
                          }
                        />
                      </Tooltip>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={studentTableHeaders.length}
                  className="py-8 text-center text-gray-500"
                >
                  No students found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <div className="m-2 flex place-self-center sm:justify-center">
        <Pagination
          layout="table"
          currentPage={pagination.currentPage}
          itemsPerPage={pagination.itemsPerPage}
          totalItems={pagination.totalItems}
          onPageChange={onPageChange}
          showIcons
        />
      </div>

      {error && (
        <ToastMessage message={error} type="error" onClose={closeToast} />
      )}
      {toast.isVisible && (
        <ToastMessage
          message={toast.message}
          type={toast.type}
          onClose={closeToast}
        />
      )}
      <MessageToStudentModal
        isOpen={messageModal.isOpen}
        studentId={messageModal.studentId}
        onClose={() => setMessageModal((prev) => ({ ...prev, isOpen: false }))}
      />
    </div>
  );
};

export default Students;
