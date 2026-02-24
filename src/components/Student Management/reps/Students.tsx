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
  Select,
  TextInput,
} from "flowbite-react";
import { SiGooglemessages } from "react-icons/si";
import { getStudents } from "../../../services/studentService";
import { isAxiosError } from "axios";
import ToastMessage from "../../common/ToastMessage";
import MessageToStudentModal from "../../common/MessageToStudentModal";
import { useNavigate } from "react-router-dom";
import {
  PaginationType,
  ToastInterface,
  Student,
} from "../../../utils/Interfaces";
import { useSearch } from "../../../hooks/useSearch";
import exportStudentCSV from "../../../helpers/exportStudentCSV";
import DetailsCard from "../../common/DetailsCard";
import { HiOutlineDownload, HiOutlineSearch } from "react-icons/hi";

const Students = () => {
  const [students, setStudents] = useState<Student[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const navigate = useNavigate();

  const [pagination, setPagination] = useState<PaginationType>({
    currentPage: 1,
    totalPages: 0,
    itemsPerPage: 10,
    totalItems: 0,
  });

  const [toast, setToast] = useState<ToastInterface>({
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
    student_id = "",
  ) => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await getStudents(page, itemsPerPage, student_id);

      setStudents(response.data?.students || []);
      setPagination(response.data?.pagination);
    } catch (error) {
      if (isAxiosError(error)) {
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
    } finally {
      setIsLoading(false);
    }
  };

  const handleApplyFilters = () => {
    fetchStudentsData(1, pagination.itemsPerPage, searchQuery);
  };

  const handleClear = () => {
    setSearchQuery("");
    fetchStudentsData(1, pagination.itemsPerPage, "");
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

  const filteredStudents = useSearch<Student>(students, searchQuery);

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
    <div className="flex flex-col gap-6 font-sans">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold tracking-normal">
          Students Management
        </h2>

        <Button
          size="md"
          onClick={() => exportStudentCSV(students)}
          disabled={students.length === 0}
          className="cursor-pointer"
        >
          <HiOutlineDownload className="mr-2 h-5 w-5" />
          Export Students
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <DetailsCard
          color="emerald"
          title="Active Students"
          value={activeStudentsCount}
        />
        <DetailsCard
          color="red"
          title="Inactive Students"
          value={inactiveStudentsCount}
        />
        <DetailsCard
          color="blue"
          title="Registered Students"
          value={pagination.totalItems}
        />
      </div>

      <Card>
        <div className="grid grid-cols-1 items-end gap-4 md:grid-cols-12">
          <div className="md:col-span-2">
            <Label htmlFor="entries" className="mb-2 block font-medium">
              Show
            </Label>
            <Select
              id="entries"
              value={pagination.itemsPerPage}
              onChange={(e) => {
                const newLimit = Number(e.target.value);
                setPagination((prev) => ({ ...prev, itemsPerPage: newLimit }));
                fetchStudentsData(1, newLimit, searchQuery);
              }}
            >
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={pagination?.totalItems}>All</option>
            </Select>
          </div>

          <div className="md:col-span-6">
            <Label htmlFor="search" className="mb-2 block font-medium">
              Search Student ID
            </Label>
            <TextInput
              id="search"
              placeholder="Enter Student ID..."
              icon={HiOutlineSearch}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyUp={(e) => e.key === "Enter" && handleApplyFilters()}
            />
          </div>

          <div className="flex gap-2 md:col-span-4 md:justify-end">
            <Button
              color="gray"
              outline
              onClick={handleClear}
              className="flex-1 md:flex-none"
            >
              Clear
            </Button>
            <Button
              onClick={handleApplyFilters}
              className="flex-1 md:flex-none"
            >
              Apply Filters
            </Button>
          </div>
        </div>
      </Card>

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
            {isLoading && (
              <TableRow>
                <TableCell colSpan={studentTableHeaders.length}>
                  <Spinner size="lg" className="me-4" />{" "}
                </TableCell>
              </TableRow>
            )}

            {filteredStudents?.length > 0 ? (
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
