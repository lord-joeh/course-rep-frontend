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
import { useEffect, useState } from "react";
import { MdDeleteForever } from "react-icons/md";
import {
  PaginationType,
  SubmittedAssignment,
  ModalState,
} from "../../../utils/Interfaces";
import { useSearch } from "../../../hooks/useSearch";
import {
  deleteSubmittedAssignment,
  getStudentSubmittedAssignment,
} from "../../../services/assignmentService";
import { useCrud } from "../../../hooks/useCrud";
import ToastMessage from "../../common/ToastMessage";
import { isAxiosError } from "axios";
import useAuth from "../../../hooks/useAuth";
import { FaArrowLeft, FaRegCalendarCheck } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { FaRegCalendarXmark } from "react-icons/fa6";
import { FiDownload } from "react-icons/fi";
import { downloadSlide as downloadSubmittedAssignment } from "../../../services/slidesServices";
import { DeleteConfirmationDialogue } from "../../common/DeleteConfirmationDialogue";
import { HiOutlineSearch } from "react-icons/hi";

const StudentSubmittedAssignment = () => {
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [submissions, setSubmissions] = useState<SubmittedAssignment[]>([]);
  const [submissionToDelete, setSubmissionToDelete] =
    useState<SubmittedAssignment>();
  const [loading, setLoading] = useState(false);
  const filteredSubmissions = useSearch<SubmittedAssignment>(
    submissions,
    searchQuery,
  );
  const [pagination, setPagination] = useState<PaginationType>({
    itemsPerPage: 12,
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
  const { user } = useAuth();
  const navigate = useNavigate();

  const crudServices = {
    list: async () => ({ data: [] as SubmittedAssignment[] }),
    download: downloadSubmittedAssignment,
  };

  const { toast, showToast, closeToast, download } =
    useCrud<SubmittedAssignment>(crudServices);

  const fetchSubmissions = async () => {
    if (!user?.data?.id) return showToast("Student ID missing", "error");
    setLoading(true);
    try {
      const response = await getStudentSubmittedAssignment(
        user?.data?.id,
        pagination?.currentPage,
        pagination?.itemsPerPage,
      );
      setSubmissions(response?.data?.submissions);
      setPagination(response?.data?.pagination);
    } catch (error) {
      if (isAxiosError(error)) {
        showToast(
          error?.response?.data?.message || "Failed fetching submissions",
          "error",
        );
      } else {
        showToast("Failed fetching submissions", "error");
      }
    } finally {
      setLoading(false);
    }
  };

  const onPageChange = (page: number) =>
    setPagination((prev) => ({ ...prev, currentPage: page }));

  const handleFileDownload = async (fileId: string) => {
    if (!fileId) return showToast("Not a file", "error");
    try {
      await download(fileId);
    } catch (error) {}
  };

  const handleFileDelete = async (
    submission: SubmittedAssignment | undefined,
  ) => {
    setModalState((prev) => ({ ...prev, isDeleting: true }));
    if (!submission?.id) return showToast("Submission ID missing", "error");
    try {
      const response = await deleteSubmittedAssignment(submission);
      showToast(
        response?.message || "Submission deleted successfully",
        "success",
      );
    } catch (error) {
      if (isAxiosError(error)) {
        showToast(
          error?.response?.data?.message || "Failed deleting submission",
          "error",
        );
      } else {
        showToast("Failed deleting submission", "error");
      }
    } finally {
      setModalState((prev) => ({
        ...prev,
        isDeleting: false,
        isDeleteDialogueOpen: false,
      }));
      fetchSubmissions();
    }
  };

  useEffect(() => {
    fetchSubmissions();
  }, [pagination?.currentPage, pagination?.itemsPerPage]);

  return (
    <div className="flex flex-col gap-5 dark:text-white">
      <Button
        color="alternative"
        className="w-50 cursor-pointer"
        onClick={() => navigate(-1)}
      >
        <FaArrowLeft className="me-2" />
        Back
      </Button>

      <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
        Submitted Assignments
      </h1>

      <Card>
        <div className="grid grid-cols-1 items-center gap-4 md:grid-cols-12">
          <div className="md:col-span-2">
            <Label htmlFor="entries" className="mb-2 block font-medium">
              Show
            </Label>
            <Select
              id="entries"
              className="rounded border-none text-gray-900 dark:text-white"
              value={pagination.itemsPerPage}
              onChange={(e) =>
                setPagination((prev) => ({
                  ...prev,
                  itemsPerPage: Number.parseInt(e.target.value),
                  currentPage: 1,
                }))
              }
            >
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={pagination?.totalItems}>All</option>
            </Select>
          </div>

          <div className="md:col-span-5">
            <Label htmlFor="search" className="mb-2 block font-medium">
              Search Submission
            </Label>
            <TextInput
              id="search"
              placeholder="Search Submission..."
              icon={HiOutlineSearch}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
      </Card>

      {loading ? (
        <Spinner size="lg" className="mr-4" />
      ) : (filteredSubmissions?.length ?? 0) > 0 ? (
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 2xl:grid-cols-3">
          {filteredSubmissions.map((submission, idx) => (
            <Card key={idx}>
              <div className="flex flex-col flex-wrap gap-3">
                <h5 className="text-md font-medium tracking-tight text-gray-900 dark:text-white">
                  {submission?.fileName ?? "Untitled"}
                </h5>
                <span className="flex gap-2">
                  <FaRegCalendarCheck size={16} color="green" />
                  <p className="text-sm">Submitted On: </p>
                  <p className="text-sm font-bold">
                    {submission?.submittedAt
                      ? new Date(submission?.submittedAt).toDateString()
                      : ""}{" "}
                  </p>
                </span>

                <span className="flex gap-3">
                  <FaRegCalendarXmark size={16} color="red" />
                  <p className="text-sm">Due Date: </p>
                  <p className="text-sm font-bold">
                    {submission?.Assignment?.deadline
                      ? new Date(
                          submission?.Assignment?.deadline,
                        ).toDateString()
                      : ""}
                  </p>
                </span>

                <small className="text-sm">
                  {`${submission?.Assignment?.Course?.name} ${submission?.Assignment?.title}`}
                </small>
              </div>

              <div className="flex justify-between">
                <Tooltip content="Download">
                  <FiDownload
                    size={30}
                    className="me-2 cursor-pointer"
                    onClick={() => handleFileDownload(submission?.fileId)}
                  />
                </Tooltip>

                <Tooltip content="Delete">
                  <MdDeleteForever
                    size={30}
                    color="red"
                    className="me-2 cursor-pointer"
                    onClick={() => {
                      setSubmissionToDelete(submission);
                      setModalState((prev) => ({
                        ...prev,
                        itemToDelete: submission?.fileName,
                        idToDelete: submission?.id,
                        isDeleteDialogueOpen: true,
                      }));
                    }}
                  />
                </Tooltip>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <div className="text-center text-gray-500 dark:text-gray-400">
          No Assignment Submitted
        </div>
      )}

      {filteredSubmissions.length > 0 && (
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
          message={toast?.message}
          type={toast?.type}
          onClose={closeToast}
        />
      )}

      {
        <DeleteConfirmationDialogue
          isDeleting={modalState?.isDeleting}
          isOpen={modalState?.isDeleteDialogueOpen}
          itemToDelete={submissionToDelete?.fileName ?? ""}
          onClose={() =>
            setModalState((prev) => ({ ...prev, isDeleteDialogueOpen: false }))
          }
          handleDelete={() => handleFileDelete(submissionToDelete)}
        />
      }
    </div>
  );
};

export default StudentSubmittedAssignment;
