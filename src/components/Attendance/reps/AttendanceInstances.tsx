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
import { useEffect, useState } from "react";
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
} from "../../../services/attendanceService";
import { isAxiosError } from "axios";
import { useSearch } from "../../../hooks/useSearch";
import CommonModal from "../../common/CommonModal";
import AddNewAttendanceInstance from "./AddNewAttendanceInstance";
import { BsDownload, BsQrCodeScan } from "react-icons/bs";
import { DeleteConfirmationDialogue } from "../../common/DeleteConfirmationDialogue";

const AttendanceInstances = () => {
  const [attendanceInstances, setAttendanceInstances] = useState<
    AttendanceInstanceInterface[]
  >([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [classType, setClassType] = useState("");
  const [courseId, setCourseId] = useState("");
  const [date, setDate] = useState("");
  const [loading, setLoading] = useState(false);
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

  const getCourseName = (courseId: string) => {
    const course = courses.find((c) => c.id === courseId);
    return course ? course.name : "Unknown Course";
  };

  const clearFilters = () => {
    setClassType("");
    setCourseId("");
    setDate("");
  };

  const crudServices = {
    list: getCourses,
    remove: deleteAttendanceInstance,
  };

  const onPageChange = (pageNumber: number) => {
    setPagination((prev) => ({ ...prev, currentPage: pageNumber }));
  };

  const {
    items: courses,
    showToast,
    loading: isLoading,
    remove,
  } = useCrud<Course>(crudServices);

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
      await remove(id);
    } catch (error) {
    } finally {
      setModalState((prev) => ({
        ...prev,
        isDeleting: false,
        isDeleteDialogueOpen: false,
      }));
    }
  };

  useEffect(() => {
    fetchInstances();
  }, []);

  const instanceTableHeaders = [
    "#",
    "Course",
    "Date",
    "Class Type",
    "status",
    "Created At",
    "Expires In",
    "Actions",
  ];

  const ViewQRCodeModal = () => {
    return (
      <div className="flex flex-col justify-center">
        <Card imgSrc={viewQRCode.imageUrl} imgAlt="QR Code">
          <h5 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">
            {`${getCourseName(viewQRCode.course_Id || "")} ATTENDANCE `}
          </h5>
          <p className="font-normal text-gray-700 dark:text-gray-400">
            Scan this QR code to mark your attendance for the Class.
          </p>

          <p className="font-normal">{new Date().toDateString()}</p>
        </Card>

        <div className="mt-4 flex justify-center">
          <Button
            className="w-full cursor-pointer text-xl"
            onClick={() => {
              const link = document.createElement("a");
              link.href = viewQRCode.imageUrl;
              link.download = `${getCourseName(viewQRCode?.course_Id ?? "")} ${new Date().toDateString()} Attendance qr-code.png`;
              document.body.appendChild(link);
              link.click();
              document.body.removeChild(link);
            }}
          >
            <BsDownload size={24} className="me-2" />
            Download
          </Button>
        </div>
      </div>
    );
  };

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
              defaultValue=""
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
                  <Spinner size="lg" className="me-4 animate-spin" />{" "}
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
                  <TableCell>{instance.class_type}</TableCell>
                  <TableCell>
                    {!instance.is_closed &&
                    new Date(instance.expires_at).getTime()! >
                      new Date().getTime()
                      ? "Active"
                      : "Closed"}
                  </TableCell>
                  <TableCell>
                    {new Date(instance.createdAt).toDateString()}
                  </TableCell>
                  <TableCell>
                    {instance.expires_at &&
                    new Date(instance.expires_at).getTime()! >
                      new Date().getTime()
                      ? `${Math.ceil((new Date(instance.expires_at).getTime() - new Date().getTime()) / (1000 * 60))} mins`
                      : "Expired"}
                  </TableCell>
                  <TableCell>
                    <div className="flex justify-between">
                      <Tooltip content="View QR Code">
                        <span
                          className="cursor-pointer text-blue-600"
                          onClick={() =>
                            setViewQRCode({
                              open: true,
                              imageUrl: instance?.qr_image ?? "",
                              course_Id: instance?.courseId,
                            })
                          }
                        >
                          <BsQrCodeScan size={24} />
                        </span>
                      </Tooltip>

                      <Tooltip content="Delete Instance">
                        <span
                          className="cursor-pointer text-red-600"
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
          itemsPerPage={pagination.itemsPerPage}
          totalItems={pagination.totalItems}
          onPageChange={onPageChange}
          showIcons
        />
      </div>

      <CommonModal
        open={modalState.isModalOpen || viewQRCode.open}
        onClose={() => {
          setModalState((prev) => ({ ...prev, isModalOpen: false }));
          setViewQRCode({ open: false, imageUrl: "" });
        }}
      >
        {viewQRCode.open ? (
          <ViewQRCodeModal />
        ) : (
          <AddNewAttendanceInstance
            courses={courses}
            onSuccess={() =>
              setModalState((prev) => ({ ...prev, isModalOpen: false }))
            }
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
