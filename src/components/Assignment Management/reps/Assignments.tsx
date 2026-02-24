import { useEffect, useState } from "react";
import {
  AssignmentsInterface,
  CourseInterface,
  ModalState,
  PaginationType,
} from "../../../utils/Interfaces";
import {
  Button,
  Card,
  Label,
  Pagination,
  Select,
  Spinner,
  TextInput,
  Tooltip,
} from "flowbite-react";
import { MdAssignmentAdd, MdOutlineAssignmentTurnedIn } from "react-icons/md";
import useAuth from "../../../hooks/useAuth";
import { FiDownload } from "react-icons/fi";
import { useSearch } from "../../../hooks/useSearch";
import { courses as getCourses } from "../../../services/courseService";
import { useCrud } from "../../../hooks/useCrud";
import { getAssignmentsByCourse } from "../../../services/assignmentService";
import { isAxiosError } from "axios";
import ToastMessage from "../../common/ToastMessage";
import { IoCloudUploadOutline } from "react-icons/io5";
import { TbCalendarDue } from "react-icons/tb";
import { downloadSlide as downloadAssignment } from "../../../services/slidesServices";
import CommonModal from "../../common/CommonModal";
import AddNewAssignment from "./AddNewAssignment";
import SubmitAssignment from "./SubmitAssignment";
import { useNavigate } from "react-router-dom";
import { HiOutlineSearch } from "react-icons/hi";
import { BsFolder } from "react-icons/bs";

const Assignments = () => {
  const [searchQuery, setSearchQuery] = useState<string>("");
  const { user } = useAuth();
  const [course_Id, setCourse_Id] = useState<string>("");
  const [assignments, setAssignments] = useState<AssignmentsInterface[]>([]);
  const [loading, setLoading] = useState(false);
  const filteredAssignments = useSearch<AssignmentsInterface>(
    assignments,
    searchQuery,
  );
  const navigate = useNavigate();
  const [pagination, setPagination] = useState<PaginationType>({
    currentPage: 1,
    itemsPerPage: 10,
    totalItems: 0,
    totalPages: 0,
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

  const [assignmentTrack, setAssignmentTrack] = useState({
    folderId: "",
    assignmentId: "",
    studentId: user?.data?.id ?? "",
  });

  const crudServices = {
    list: getCourses,
    download: downloadAssignment,
  };

  const {
    items: courses,
    toast,
    showToast,
    closeToast,
    download,
  } = useCrud<CourseInterface>(crudServices);

  const onPageChange = (pageNumber: number) => {
    setPagination((prev) => ({ ...prev, currentPage: pageNumber }));
  };

  const closeModal = () => {
    if (modalState?.isAdding) {
      setModalState((prev) => ({ ...prev, isAdding: false }));
    } else if (modalState?.isModalOpen) {
      setModalState((prev) => ({ ...prev, isModalOpen: false }));
    }
  };
  const fetchAssignments = async () => {
    try {
      setLoading(true);
      const response = await getAssignmentsByCourse(
        course_Id,
        pagination?.itemsPerPage,
        pagination?.currentPage,
      );
      setAssignments(response?.data?.assignments);
      setPagination(response?.data?.pagination);
    } catch (error) {
      if (isAxiosError(error)) {
        showToast(
          error?.response?.data?.message?.error || "Error fetching assignments",
          "error",
        );
      } else {
        showToast("Error fetching assignments", "error");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (course_Id?.length > 0) {
      fetchAssignments();
    }
  }, [pagination?.currentPage, pagination?.itemsPerPage, course_Id]);

  const handleFileDownload = async (fileId: string) => {
    if (!fileId) return showToast("Not a file", "error");
    try {
      await download(fileId);
    } catch (error) {}
  };

  return (
    <div className="flex flex-col gap-5">
      <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
        {user?.isRep ? "Assignment Management" : "Assignments"}
      </h1>

      <div className="flex flex-wrap justify-start gap-6">
        {user?.isRep && (
          <Button
            className="flex h-12 w-full justify-center md:w-auto"
            onClick={() =>
              setModalState((prev) => ({ ...prev, isAdding: true }))
            }
          >
            <MdAssignmentAdd className="me-2 h-4 w-4" />
            Upload New Assignment
          </Button>
        )}

        <Button
          className="flex h-12 w-full justify-center md:w-auto"
          onClick={() => navigate("submissions")}
        >
          <MdOutlineAssignmentTurnedIn className="me-2 h-4 w-4" />
          Your Submitted Assignments
        </Button>

        <Card>
          <div className="grid grid-cols-1 items-center md:gap-14 gap-3 md:grid-cols-12">
            <div className="md:col-span-2">
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
                    currentPage: 1,
                  }))
                }
                className="w-full"
              >
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={pagination?.totalItems ?? 100}>All</option>
              </Select>
            </div>

            <div className="md:col-span-4">
              <Label htmlFor="course" className="mb-2 block font-medium">
                Course
              </Label>
              <Select
                id="course"
                name="courseId"
                onChange={(e: React.ChangeEvent<HTMLSelectElement>) => {
                  setCourse_Id(e.target.value);
                  setPagination((prev) => ({ ...prev, currentPage: 1 }));
                }}
                className="w-full"
              >
                <option value="">Select Course for Assignments</option>
                {courses.map((course) => (
                  <option key={course.id} value={course.id}>
                    {course.name}
                  </option>
                ))}
              </Select>
            </div>

            <div className="md:col-span-6">
              <Label htmlFor="search" className="mb-2 block font-medium">
                Search Assignment
              </Label>
              <TextInput
                id="search"
                placeholder="Search Assignment..."
                icon={HiOutlineSearch}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
        </Card>
      </div>

      <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
        Recent Assignments
      </h1>

      {loading ? (
        <Spinner size="lg" className="mr-4 place-self-center" />
      ) : (filteredAssignments?.length ?? 0) > 0 ? (
        <div className="3xl:grid-cols-4 grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
          {filteredAssignments.map((assignment, idx) => (
            <Card key={idx}>
              <div className="flex flex-col gap-2">
                <h5 className="text-sm font-medium tracking-tight text-gray-900 dark:text-white">
                  {assignment?.title || "Untitled Assignment"}
                </h5>

                <p className="line-clamp-3 text-sm">
                  {assignment?.description || ""}
                </p>
                <span className="flex items-center gap-2">
                  <TbCalendarDue size={24} color="red" />
                  <p className="text-sm font-medium text-red-500">
                    {assignment?.deadline
                      ? new Date(assignment.deadline).toDateString()
                      : ""}{" "}
                  </p>
                </span>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  className="mt-4 h-12 flex-1 cursor-pointer"
                  rel="noopener noreferrer"
                  onClick={() => {
                    setAssignmentTrack((prev) => ({
                      ...prev,
                      folderId: assignment?.submissionFolderID,
                      assignmentId: assignment?.id,
                    }));
                    setModalState((prev) => ({ ...prev, isModalOpen: true }));
                  }}
                  disabled={new Date() > new Date(assignment?.deadline)}
                >
                  <IoCloudUploadOutline size={24} className="me-2" />
                  Submit Assignment
                </Button>

                <Tooltip content="Download Assignment">
                  <FiDownload
                    size={32}
                    className="me-2 mt-4 cursor-pointer"
                    onClick={() => handleFileDownload(assignment?.fileId)}
                  />
                </Tooltip>

                {user && user.isRep && (
                  <Tooltip content="View Submission">
                    <BsFolder
                      size={32}
                      className="me-2 mt-4 cursor-pointer"
                      onClick={() =>
                        navigate(`${assignment?.id}/submissions/details`)
                      }
                    />
                  </Tooltip>
                )}
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <div className="text-center text-gray-500 dark:text-gray-400">
          No Assignment found, Select a course.
        </div>
      )}

      {filteredAssignments.length > 0 && (
        <div className="m-2 flex place-self-center sm:justify-center">
          <Pagination
            layout="table"
            currentPage={pagination?.currentPage || 1}
            itemsPerPage={pagination?.itemsPerPage || 10}
            totalItems={pagination?.totalItems || 0}
            onPageChange={onPageChange}
            showIcons
          />
        </div>
      )}

      {toast.visible && (
        <ToastMessage
          message={toast.message}
          type={!toast.type ? "error" : toast.type}
          onClose={closeToast}
        />
      )}

      {
        <CommonModal
          open={modalState?.isAdding || modalState?.isModalOpen}
          onClose={closeModal}
        >
          {modalState?.isAdding ? (
            <AddNewAssignment />
          ) : (
            <SubmitAssignment
              folderId={assignmentTrack?.folderId}
              assignmentId={assignmentTrack?.assignmentId}
              studentId={assignmentTrack?.studentId}
            />
          )}
        </CommonModal>
      }
    </div>
  );
};

export default Assignments;
