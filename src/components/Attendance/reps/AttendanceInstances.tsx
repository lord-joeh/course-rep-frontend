import {
  Button,
  Card,
  Label,
  Pagination,
  Select,
  Spinner,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeadCell,
  TableRow,
  TextInput,
  Tooltip,
} from "flowbite-react";
import { useEffect, useMemo, useState } from "react";
import { MdBookmarkAdd, MdDeleteForever, MdRefresh } from "react-icons/md";
import {
  AttendanceFilterInterface,
  AttendanceInstanceInterface,
  Course,
  ModalState,
  PaginationType,
} from "../../../utils/Interfaces";
import { courses as getCourses } from "../../../services/courseService";
import { useCrud } from "../../../hooks/useCrud";
import {
  deleteAttendanceInstance,
  getAttendanceInstances,
  closeAttendanceInstance,
} from "../../../services/attendanceService";
import { isAxiosError } from "axios";
import { useSearch } from "../../../hooks/useSearch";
import CommonModal from "../../common/CommonModal";
import AddNewAttendanceInstance from "./AddNewAttendanceInstance";
import { BsQrCodeScan } from "react-icons/bs";
import { DeleteConfirmationDialogue } from "../../common/DeleteConfirmationDialogue";
import ViewQRCodeModal from "./ViewQRCode";
const AttendanceInstances = () => {
  const [attendanceInstances, setAttendanceInstances] = useState<
    AttendanceInstanceInterface[]
  >([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [classType, setClassType] = useState("");
  const [courseId, setCourseId] = useState("");
  const [date, setDate] = useState("");
  const [loading, setLoading] = useState(false);
  const [closingInstanceId, setClosingInstanceId] = useState<string | null>(
    null,
  );
  const [pagination, setPagination] = useState<PaginationType>({
    currentPage: 1,
    itemsPerPage: 5,
    totalItems: 0,
    totalPages: 0,
  });

  const filteredInstances = useSearch<AttendanceInstanceInterface>(
    attendanceInstances,
    searchQuery,
  );

  const [viewQRCode, setViewQRCode] = useState<{
    open: boolean;
    imageUrl: string;
    course_Id?: string;
    date?: string;
  }>({
    open: false,
    imageUrl: "",
  });

  const [modalState, setModalState] = useState<ModalState>({
    isDeleteDialogueOpen: false,
    isModalOpen: false,
    isDeleting: false,
    isEditing: false,
    itemToDelete: "",
    idToDelete: "",
    isAdding: false,
  });

  const filterParams: AttendanceFilterInterface = {
    page: Number(pagination.currentPage),
    limit: Number(pagination.itemsPerPage),
    courseId,
    date,
    class_type: classType as "in-person" | "online" | "",
  };

  const crudServices = {
    list: getCourses,
    remove: deleteAttendanceInstance,
  };

  const {
    items: courses,
    showToast,
    loading: isLoading,
    remove,
  } = useCrud<Course>(crudServices);

  const getCourseName = (courseId: string) => {
    const course = courses.find((c) => c.id === courseId);
    return course ? course.name : "Unknown Course";
  };

  const clearFilters = () => {
    setClassType("");
    setCourseId("");
    setDate("");
    setPagination((prev) => ({ ...prev, currentPage: 1 }));
  };

  const onPageChange = (pageNumber: number) => {
    setPagination((prev) => ({ ...prev, currentPage: pageNumber }));
  };

  const fetchInstances = async () => {
    try {
      setLoading(true);
      const filters = await getAttendanceInstances(filterParams);
      if (filters) {
        setAttendanceInstances(filters?.data?.instance);
        setPagination(filters?.data?.pagination);
      }
    } catch (error) {
      if (isAxiosError(error)) {
        showToast(
          error?.response?.data?.message ||
            "Failed to fetch attendance instances.",
          "error",
        );
      } else {
        showToast(
          "An unexpected error occurred while fetching attendance instances.",
          "error",
        );
      }
    } finally {
      setLoading(false);
    }
  };

  const handleInstanceDelete = async (id: string) => {
    try {
      setModalState((prev) => ({ ...prev, isDeleting: true }));
      const response = await remove(id);
      console.log("Del", response.data);
      if (response) {
        showToast(
          response?.data?.message ||
            response?.message ||
            "Deleted successfully.",
          "success",
        );
        await fetchInstances();
      }
    } catch (error) {
      if (isAxiosError(error)) {
        showToast(
          error?.response?.data?.message || "Failed to delete instance.",
          "error",
        );
      } else {
        showToast("An unexpected error occurred.", "error");
      }
    } finally {
      setModalState((prev) => ({
        ...prev,
        isDeleting: false,
        isDeleteDialogueOpen: false,
      }));
    }
  };

  const handleCloseAttendance = async (id: string) => {
    try {
      setClosingInstanceId(id);
      const response = await closeAttendanceInstance(id);
      if (response) {
        showToast(
          response?.message || "Attendance instance closed successfully.",
          "success",
        );
        await fetchInstances();
      }
    } catch (error) {
      if (isAxiosError(error)) {
        showToast(
          error?.response?.data?.error ||
            error?.response?.data?.message ||
            "Failed to update attendance status.",
          "error",
        );
      } else {
        showToast("Failed to update attendance status.", "error");
      }
    } finally {
      setClosingInstanceId(null);
    }
  };

  const calculateTimeRemaining = (expiresAt: string) => {
    const expiryTime = new Date(expiresAt).getTime();
    const currentTime = new Date().getTime();

    if (expiryTime > currentTime) {
      const minutesRemaining = Math.ceil(
        (expiryTime - currentTime) / (1000 * 60),
      );
      return `${minutesRemaining} mins`;
    }
    return "Expired";
  };

  useEffect(() => {
    fetchInstances();
  }, [filterParams?.limit, filterParams?.page]);

  const instanceTableHeaders = [
    "#",
    "Course",
    "Date",
    "Class Type",
    "Status",
    "Created At",
    "Expires In",
    "Actions",
  ];

  return (
    <div className="container flex flex-col gap-6">
      <h1 className="text-2xl font-semibold tracking-normal">
        Attendance Instance Management
      </h1>

      <div className="flex w-full items-center gap-2">
        <div className="relative flex flex-1 items-center">
          <TextInput
            id="search"
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search Instances..."
            aria-label="Search Instances"
            className="glow-on-focus w-[98%] pr-10"
          />
        </div>

        <Button
          className="flex w-60 items-center gap-2 px-4 py-3"
          aria-label="Refresh Instances"
          onClick={fetchInstances}
        >
          <MdRefresh size={18} className="me-1" /> Refresh
        </Button>
      </div>

      <Button
        className="flex w-full justify-center md:w-sm"
        onClick={() =>
          setModalState((prev) => ({ ...prev, isModalOpen: true }))
        }
      >
        <MdBookmarkAdd className="me-2 h-4 w-4" />
        Add New Attendance Instance
      </Button>

      <Card>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
          <div>
            <Label htmlFor="entries" className="mb-2 block font-medium">
              Show
            </Label>
            <Select
              id="entries"
              value={pagination?.itemsPerPage}
              onChange={(e) =>
                setPagination((prev) => ({
                  ...prev,
                  itemsPerPage: Number(e.target.value),
                  currentPage: 1, // Reset to first page on items per page change
                }))
              }
              className="w-full"
            >
              <option value={5}>5</option>
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={pagination?.totalItems ?? 100}>All</option>
            </Select>
          </div>

          <div>
            <Label htmlFor="classType" className="mb-2 block font-medium">
              Class Type
            </Label>
            <Select
              id="classType"
              name="classType"
              value={classType}
              onChange={(e) => setClassType(e.target.value)}
              className="w-full"
            >
              <option value="">Select Class Type</option>
              <option value="in-person">In-Person</option>
              <option value="online">Online</option>
            </Select>
          </div>

          <div>
            <Label htmlFor="course" className="mb-2 block font-medium">
              Course
            </Label>
            <Select
              id="course"
              name="courseId"
              value={courseId}
              onChange={(e) => setCourseId(e.target.value)}
              className="w-full"
            >
              <option value="">Select Course</option>
              {courses?.map((course) => (
                <option key={course?.id} value={course?.id}>
                  {course?.name}
                </option>
              ))}
            </Select>
          </div>

          <div>
            <Label htmlFor="date" className="mb-2 block font-medium">
              Date
            </Label>
            <TextInput
              type="date"
              name="date"
              id="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full"
            />
          </div>
        </div>

        <div className="mt-4 flex justify-end gap-2">
          <Button color="gray" outline onClick={clearFilters}>
            Clear
          </Button>
          <Button
            onClick={() => {
              setPagination((prev) => ({ ...prev, currentPage: 1 }));
              fetchInstances();
            }}
          >
            Apply Filters
          </Button>
        </div>
      </Card>

      <h2 className="text-2xl font-semibold tracking-normal">Instances</h2>
      <div className="overflow-x-auto rounded-lg shadow-md">
        <Table striped hoverable>
          <TableHead>
            <TableRow>
              {instanceTableHeaders.map((head, idx) => (
                <TableHeadCell key={idx}>{head}</TableHeadCell>
              ))}
            </TableRow>
          </TableHead>

          <TableBody>
            {loading || isLoading ? (
              <TableRow>
                <TableCell
                  colSpan={instanceTableHeaders.length}
                  className="text-center"
                >
                  <Spinner size="lg" className="me-4 animate-spin" />
                </TableCell>
              </TableRow>
            ) : filteredInstances?.length < 1 ? (
              <TableRow>
                <TableCell
                  colSpan={instanceTableHeaders.length}
                  className="text-center"
                >
                  No attendance instances found.
                </TableCell>
              </TableRow>
            ) : (
              filteredInstances?.map((instance, idx) => (
                <TableRow
                  key={instance.id}
                  className="bg-white dark:border-gray-700 dark:bg-gray-800"
                >
                  <TableCell>
                    {(pagination.currentPage - 1) * pagination.itemsPerPage +
                      idx +
                      1}
                  </TableCell>
                  <TableCell>{getCourseName(instance?.courseId)}</TableCell>
                  <TableCell>
                    {new Date(instance.date).toDateString()}
                  </TableCell>
                  <TableCell className="capitalize">
                    {instance.class_type}
                  </TableCell>
                  <TableCell>
                    {instance.is_close ? (
                      <span className="rounded-full bg-red-100 px-2 py-1 text-sm font-semibold text-red-800">
                        Closed
                      </span>
                    ) : (
                      <Tooltip content="Close attendance">
                        <Button
                          size="sm"
                          className="cursor-pointer bg-emerald-500"
                          onClick={() => handleCloseAttendance(instance.id)}
                          disabled={closingInstanceId === instance.id}
                        >
                          {closingInstanceId === instance.id ? (
                            <Spinner size="sm" />
                          ) : (
                            "Opened"
                          )}
                        </Button>
                      </Tooltip>
                    )}
                  </TableCell>
                  <TableCell>
                    {new Date(instance.createdAt).toDateString()}
                  </TableCell>
                  <TableCell>
                    {instance.expires_at
                      ? calculateTimeRemaining(instance.expires_at)
                      : "N/A"}
                  </TableCell>
                  <TableCell>
                    <div className="flex justify-between gap-2">
                      <Tooltip content="View QR Code">
                        <span
                          className="cursor-pointer text-blue-600 hover:text-blue-800"
                          onClick={() =>
                            setViewQRCode({
                              open: true,
                              imageUrl: instance?.qr_image ?? "",
                              course_Id: instance?.courseId,
                              date: instance?.date,
                            })
                          }
                        >
                          <BsQrCodeScan size={24} />
                        </span>
                      </Tooltip>

                      <Tooltip content="Delete Instance">
                        <span
                          className="cursor-pointer text-red-600 hover:text-red-800"
                          onClick={() =>
                            setModalState((prev) => ({
                              ...prev,
                              idToDelete: instance?.id,
                              itemToDelete: `${getCourseName(instance?.courseId)} Attendance Instance for ${new Date(instance.date).toDateString()}`,
                              isDeleteDialogueOpen: true,
                            }))
                          }
                        >
                          <MdDeleteForever size={24} />
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

      <CommonModal
        open={modalState.isModalOpen || viewQRCode.open}
        onClose={() => {
          setViewQRCode({ open: false, imageUrl: "" });
          setModalState((prev) => ({ ...prev, isModalOpen: false }));
        }}
      >
        {viewQRCode.open ? (
          <ViewQRCodeModal
            imageUrl={viewQRCode?.imageUrl}
            course_Id={viewQRCode?.course_Id}
            date={viewQRCode?.date}
            getCourseName={getCourseName}
          />
        ) : (
          <AddNewAttendanceInstance
            courses={courses}
            onSuccess={() => {
              setModalState((prev) => ({ ...prev, isModalOpen: false }));
              fetchInstances();
            }}
          />
        )}
      </CommonModal>

      <DeleteConfirmationDialogue
        isOpen={modalState.isDeleteDialogueOpen}
        onClose={() =>
          setModalState((prev) => ({ ...prev, isDeleteDialogueOpen: false }))
        }
        handleDelete={() => handleInstanceDelete(modalState?.idToDelete)}
        itemToDelete={modalState?.itemToDelete}
        isDeleting={modalState.isDeleting}
      />
    </div>
  );
};

export default AttendanceInstances;
