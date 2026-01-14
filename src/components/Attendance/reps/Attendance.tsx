import {
  Button,
  Card,
  Label,
  Select,
  Spinner,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeadCell,
  TableRow,
  TextInput,
  Pagination,
  Tooltip,
} from "flowbite-react";
import { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  AttendanceRecordInterface,
  ModalState,
  PaginationType,
} from "../../../utils/Interfaces";
import {
  deleteAttendance,
  getAttendanceInstanceById,
  markAttendance,
} from "../../../services/attendanceService";
import { useCrud } from "../../../hooks/useCrud";
import { isAxiosError } from "axios";
import { HiOutlineDownload, HiOutlineSearch } from "react-icons/hi";
import ToastMessage from "../../common/ToastMessage";
import { FaUserCheck } from "react-icons/fa";
import { MdDeleteForever } from "react-icons/md";
import { DeleteConfirmationDialogue } from "../../common/DeleteConfirmationDialogue";
import exportToCSV from "../../../helpers/exportAttendanceCSV";
import { BsQrCodeScan } from "react-icons/bs";

const Attendance = () => {
  const { instanceId } = useParams();
  const [searchQuery, setSearchQuery] = useState("");
  const [presentCount, setPresentCount] = useState(0);
  const [attendanceData, setAttendanceData] = useState<
    AttendanceRecordInterface[]
  >([]);
  const [pagination, setPagination] = useState<PaginationType>({
    itemsPerPage: 10,
    totalItems: 0,
    currentPage: 1,
    totalPages: 0,
  });
  const [modalState, setModalState] = useState<ModalState>({
    isAdding: false,
    isEditing: false,
    isDeleting: false,
    isDeleteDialogueOpen: false,
    isModalOpen: false,
    idToDelete: "",
    itemToDelete: "",
  });
  const [attendanceTrackId, setAttendanceTrackId] = useState("");
  const navigate = useNavigate();

  const { showToast, setLoading, loading, toast, closeToast, remove } =
    useCrud<AttendanceRecordInterface>({
      list: async () => ({ data: [] }),
      remove: deleteAttendance,
    });

  const fetchAttendanceRecords = useCallback(
    async (
      page = pagination.currentPage,
      limit = pagination.itemsPerPage,
      studentId = "",
    ) => {
      try {
        setLoading(true);
        if (instanceId) {
          const response = await getAttendanceInstanceById(instanceId, {
            page,
            limit,
            studentId,
          });

          setAttendanceData(response?.data?.attendance || []);
          setPagination(response?.data?.pagination);
          setPresentCount(response?.data?.presentCount || 0);
        }
      } catch (error) {
        const errorMsg = isAxiosError(error)
          ? error?.response?.data?.message || "Error fetching attendance"
          : "Error fetching attendance";
        showToast(errorMsg, "error");
      } finally {
        setLoading(false);
      }
    },
    [instanceId, pagination.itemsPerPage],
  );

  const handleManualMark = async (
    attendanceId: string,
    studentId: string,
    currentStatus: string,
  ) => {
    if (currentStatus === "present")
      return showToast("Attendance already marked", "error");
    else {
      try {
        setAttendanceTrackId(attendanceId);
        const response = await markAttendance(studentId, attendanceId);
        if (response) {
          showToast(response?.message || "Marked", "success");
          await fetchAttendanceRecords(
            pagination.currentPage,
            pagination.itemsPerPage,
            searchQuery,
          );
        }
      } catch (error) {
        if (isAxiosError(error)) {
          showToast(
            error?.response?.data?.error || "Unable to mark attendance",
            "error",
          );
        } else {
          showToast("Failed to update status manually", "error");
        }
      } finally {
        setAttendanceTrackId("");
      }
    }
  };

  const handleAttendanceDelete = async (id: string) => {
    setModalState((prev) => ({ ...prev, isDeleting: true }));
    try {
      await remove(id);
    } catch (error) {
      console.log(error);
    } finally {
      setModalState((prev) => ({
        ...prev,
        isDeleting: false,
        isDeleteDialogueOpen: false,
      }));
    }
  };

  // Initial load
  useEffect(() => {
    fetchAttendanceRecords(1, pagination.itemsPerPage, "");
  }, [instanceId]);

  const handleApplyFilters = () => {
    fetchAttendanceRecords(1, pagination.itemsPerPage, searchQuery);
  };

  const handleClear = () => {
    setSearchQuery("");
    fetchAttendanceRecords(1, pagination.itemsPerPage, "");
  };

  const onPageChange = (page: number) => {
    setPagination((prev) => ({ ...prev, currentPage: page }));
    fetchAttendanceRecords(page, pagination.itemsPerPage, searchQuery);
  };

  const attendanceTableHeaders = [
    "#",
    "Student ID",
    "Name",
    "Status",
    "Marked At",
    "Actions",
  ];

  return (
    <div className="flex flex-col gap-5 dark:text-white">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold tracking-normal">Attendance</h2>

        <Button
          size="md"
          onClick={() => exportToCSV(attendanceData)}
          disabled={attendanceData.length === 0}
          className="cursor-pointer"
        >
          <HiOutlineDownload className="mr-2 h-5 w-5" />
          Export Attendance
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <Card className="bg-blue-50 dark:bg-blue-900/20">
          <div className="flex flex-col items-center">
            <span className="text-sm font-medium text-blue-600">
              Total Records
            </span>
            <span className="text-2xl font-bold">{pagination.totalItems}</span>
          </div>
        </Card>
        <Card className="bg-emerald-50 dark:bg-emerald-900/20">
          <div className="flex flex-col items-center">
            <span className="text-sm font-medium text-emerald-600">
              Present
            </span>
            <span className="text-2xl font-bold text-emerald-500">
              {presentCount}
            </span>
          </div>
        </Card>
        <Card className="bg-red-50 dark:bg-red-900/20">
          <div className="flex flex-col items-center">
            <span className="text-sm font-medium text-red-600">Absent</span>
            <span className="text-2xl font-bold text-red-500">
              {Math.max(0, pagination.totalItems - presentCount)}
            </span>
          </div>
        </Card>
      </div>

      <Button
        className="w-full cursor-pointer md:max-w-md"
        onClick={() => navigate("/mark")}
      >
        <BsQrCodeScan className="me-2 h-4 w-4" />
        Scan QR Code
      </Button>
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
                fetchAttendanceRecords(1, newLimit, searchQuery);
              }}
            >
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
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
        <Table striped hoverable>
          <TableHead>
            <TableRow>
              {attendanceTableHeaders.map((head) => (
                <TableHeadCell key={head}>{head}</TableHeadCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {loading && (
              <TableRow>
                <TableCell colSpan={5} className="py-10 text-center">
                  <Spinner size="xl" />
                </TableCell>
              </TableRow>
            )}

            {attendanceData?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="py-10 text-center">
                  No records found.
                </TableCell>
              </TableRow>
            ) : (
              attendanceData.map((record, idx) => (
                <TableRow key={record.id} className="dark:border-gray-700">
                  <TableCell className="font-medium text-gray-900 dark:text-white">
                    {(pagination.currentPage - 1) * pagination.itemsPerPage +
                      idx +
                      1}
                  </TableCell>
                  <TableCell>{record?.studentId || "N/A"}</TableCell>
                  <TableCell>{record.Student?.name || "Unknown"}</TableCell>
                  <TableCell>
                    <span
                      className={`rounded-full px-2 py-1 text-xs font-bold uppercase ${
                        record.status === "present"
                          ? "bg-green-100 text-green-700"
                          : "bg-red-100 text-red-700"
                      }`}
                    >
                      {record.status}
                    </span>
                  </TableCell>
                  <TableCell>
                    {record.status.toLowerCase() === "absent" ? (
                      <span className="text-gray-400 italic">Not Marked</span>
                    ) : (
                      <Tooltip
                        content={new Date(record.updatedAt).toDateString()}
                      >
                        <span className="cursor-help">
                          {new Date(record.updatedAt).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </Tooltip>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center justify-between gap-3">
                      <Tooltip
                        content={
                          record.status === "present"
                            ? "Marked"
                            : "Mark as Present"
                        }
                      >
                        <span
                          role="button"
                          onClick={() =>
                            handleManualMark(
                              record?.id,
                              record?.studentId,
                              record.status,
                            )
                          }
                          onKeyDown={(e) =>
                            e.key === "Enter" &&
                            handleManualMark(
                              record?.id,
                              record?.studentId,
                              record.status,
                            )
                          }
                          className={`cursor-pointer ${
                            record.status === "present"
                              ? "cursor-not-allowed text-red-600 hover:text-red-800"
                              : "text-emerald-600 hover:text-emerald-800"
                          }`}
                        >
                          {record.status === "present" ? (
                            <FaUserCheck
                              color="red"
                              size={24}
                              className="cursor-not-allowed"
                            />
                          ) : attendanceTrackId === record.id ? (
                            <Spinner size="lg" />
                          ) : (
                            <FaUserCheck size={24} />
                          )}
                        </span>
                      </Tooltip>

                      <Tooltip content="Delete">
                        <span
                          className="cursor-pointer"
                          onClick={() => {
                            setModalState((prev) => ({
                              ...prev,
                              isDeleteDialogueOpen: true,
                              idToDelete: record?.id,
                              itemToDelete: `Attendance for ${record?.Student.name} on ${new Date(record.createdAt).toDateString()}`,
                            }));
                          }}
                        >
                          <MdDeleteForever size={24} color="red" />
                        </span>
                      </Tooltip>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <div className="m-2 flex place-self-center sm:justify-center">
        <Pagination
          layout="table"
          currentPage={pagination.currentPage}
          itemsPerPage={pagination?.itemsPerPage}
          totalItems={pagination.totalPages}
          onPageChange={onPageChange}
          showIcons
        />
      </div>

      <DeleteConfirmationDialogue
        isOpen={modalState.isDeleteDialogueOpen}
        onClose={() =>
          setModalState((prev) => ({ ...prev, isDeleteDialogueOpen: false }))
        }
        itemToDelete={modalState.itemToDelete}
        handleDelete={() => handleAttendanceDelete(modalState.idToDelete)}
        isDeleting={modalState.isDeleting}
      />

      {toast && (
        <ToastMessage
          message={toast.message}
          type={toast.type}
          onClose={closeToast}
        />
      )}
    </div>
  );
};

export default Attendance;
