import {
  Button,
  Card,
  Label,
  Pagination,
  Select,
  Spinner,
  TextInput,
} from "flowbite-react";
import { useEffect, useState } from "react";
import { FaArrowLeft, FaRegCalendarCheck } from "react-icons/fa";
import { MdDeleteForever } from "react-icons/md";
import { useNavigate, useParams } from "react-router-dom";
import {
  AssignmentDetailsInterface,
  SubmittedAssignment,
  type ModalState,
  type PaginationType,
} from "../../../utils/Interfaces";
import { useSearch } from "../../../hooks/useSearch";
import { TbCalendarDue } from "react-icons/tb";
import { useCrud } from "../../../hooks/useCrud";
import {
  deleteAssignmentById,
  getAssignmentDetailsById,
} from "../../../services/assignmentService";
import { isAxiosError } from "axios";
import useAuth from "../../../hooks/useAuth";
import ToastMessage from "../../common/ToastMessage";
import { DeleteConfirmationDialogue } from "../../common/DeleteConfirmationDialogue";
import CommonModal from "../../common/CommonModal";
import AddNewAssignment from "./AddNewAssignment";
import { HiOutlineSearch } from "react-icons/hi";
import { BiEditAlt } from "react-icons/bi";

function AssignmentDetails() {
  const [searchQuery, setSearchQuery] = useState<string>("");
  const navigate = useNavigate();
  const [assignmentInfo, setAssignmentInfo] = useState<SubmittedAssignment>();
  const [submissions, setSubmissions] = useState<AssignmentDetailsInterface[]>(
    [],
  );
  const filteredSubmissions = useSearch<AssignmentDetailsInterface>(
    submissions,
    searchQuery,
  );
  const [loading, setLoading] = useState(false);
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
  const params = useParams();
  const assignmentId = params?.assignmentId;
  const { user } = useAuth();

  const crudServices = {
    list: async () => ({ data: [] as AssignmentDetailsInterface[] }),
    remove: deleteAssignmentById,
  };

  const { showToast, closeToast, toast, remove } =
    useCrud<AssignmentDetailsInterface>(crudServices);

  async function fetchAssignmentSubmissions() {
    if (!assignmentId) return showToast("Assignment ID not provided", "error");
    setLoading(true);
    try {
      const response = await getAssignmentDetailsById(
        assignmentId,
        pagination?.currentPage,
        pagination?.itemsPerPage,
      );
      setAssignmentInfo(response?.data?.assignment);
      setSubmissions(response?.data?.submissions.submissions);
      setPagination(response?.data?.submissions?.pagination);
    } catch (error) {
      if (isAxiosError(error)) {
        showToast(error?.response?.data?.message, "error");
      } else {
        showToast("Error fetching data", "error");
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete() {
    if (!assignmentId) return showToast("Assignment ID not provided", "error");
    setModalState((prev) => ({ ...prev, isDeleting: true }));
    try {
      await remove(assignmentId);
    } catch (error) {
    } finally {
      setModalState((prev) => ({
        ...prev,
        isDeleting: false,
        isDeleteDialogueOpen: false,
      }));
    }
  }

  useEffect(() => {
    fetchAssignmentSubmissions();
  }, [pagination?.currentPage, pagination?.itemsPerPage]);

  const onPageChange = (pageNumber: number) => {
    setPagination((prev) => ({ ...prev, currentPage: pageNumber }));
  };

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
        Assignment Details
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
                  itemsPerPage: parseInt(e.target.value),
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

      {/* stat strip */}
      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
        {/* count */}
        <div className="flex flex-col gap-2 rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-700 dark:bg-gray-900">
          <p className="text-[11px] font-medium tracking-wider text-gray-400 uppercase">
            Total submissions
          </p>
          <p className="text-3xl font-medium text-emerald-600">
            {pagination.totalItems || 0}
          </p>
        </div>

        {/* assignment info */}
        <div className="flex flex-col gap-2 rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-700 dark:bg-gray-900">
          <p className="text-[11px] font-medium tracking-wider text-gray-400 uppercase">
            Assignment
          </p>
          <p className="text-sm font-medium text-gray-900 dark:text-white">
            {assignmentInfo?.title || "—"}
          </p>
          <p className="text-xs text-gray-400">
            {assignmentInfo?.Course?.name || ""}
          </p>
          <div className="flex items-center gap-1.5 text-xs font-medium text-red-500">
            <TbCalendarDue size={13} />
            {assignmentInfo?.deadline
              ? new Date(assignmentInfo.deadline).toDateString()
              : "—"}
          </div>
        </div>

        {/* actions — rep only */}
        {user?.isRep && (
          <div className="flex flex-col gap-2 rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-700 dark:bg-gray-900">
            <p className="text-[11px] font-medium tracking-wider text-gray-400 uppercase">
              Actions
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() =>
                  setModalState((prev) => ({
                    ...prev,
                    isModalOpen: true,
                    isEditing: true,
                  }))
                }
                className="flex cursor-pointer items-center gap-1.5 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-xs font-medium text-gray-700 transition-colors hover:bg-gray-100 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
              >
                <BiEditAlt size={13} /> Edit
              </button>
              <button
                onClick={() =>
                  setModalState((prev) => ({
                    ...prev,
                    itemToDelete: assignmentInfo?.title ?? "",
                    idToDelete: assignmentInfo?.id ?? "",
                    isDeleteDialogueOpen: true,
                  }))
                }
                className="flex cursor-pointer items-center gap-1.5 rounded-lg border border-red-200 px-3 py-2 text-xs font-medium text-red-500 transition-colors hover:bg-red-50 dark:border-red-900 dark:hover:bg-red-950"
              >
                <MdDeleteForever size={13} /> Delete
              </button>
            </div>
          </div>
        )}
      </div>

      <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
        Submissions
      </h1>

      {loading && <Spinner size="lg" />}

      {filteredSubmissions.length > 0 ? (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
          {filteredSubmissions.map((submitted) => {
            const initials = submitted?.Student?.name
              .split(" ")
              .map((n) => n.charAt(0).toUpperCase())
              .join("");
            return (
              <div
                key={submitted.id}
                className="flex flex-col gap-3 rounded-xl border border-gray-200 bg-white p-5 transition-colors hover:border-gray-300 dark:border-gray-700 dark:bg-gray-900 dark:hover:border-gray-600"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-50 text-xs font-medium text-blue-600 dark:bg-blue-950 dark:text-blue-300">
                    {initials}
                  </div>
                  <p className="truncate text-sm font-medium text-gray-900 dark:text-white">
                    {submitted?.fileName ?? "Untitled"}
                  </p>
                </div>
                <div className="flex flex-col gap-1.5 border-t border-gray-100 pt-3 dark:border-gray-800">
                  <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                    <span className="font-medium text-gray-700 dark:text-gray-300">
                      Student ID:
                    </span>
                    {submitted?.Student?.id || "—"}
                  </div>
                  <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                    <FaRegCalendarCheck
                      size={12}
                      className="text-emerald-500"
                    />
                    {submitted?.submittedAt
                      ? new Date(submitted.submittedAt).toDateString()
                      : "—"}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        !loading && (
          <p className="text-center text-sm text-gray-400 dark:text-gray-500">
            No submissions yet.
          </p>
        )
      )}

      {filteredSubmissions.length > 0 && (
        <div className="flex justify-center">
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
          type={toast.type}
          onClose={closeToast}
        />
      )}

      {
        <CommonModal
          open={modalState?.isModalOpen}
          onClose={() =>
            setModalState((prev) => ({ ...prev, isModalOpen: false }))
          }
        >
          <AddNewAssignment
            assignment={assignmentInfo as any}
            isEditing={modalState?.isEditing || true}
            onClose={() =>
              setModalState((prev) => ({ ...prev, isModalOpen: false }))
            }
          />
        </CommonModal>
      }

      {
        <DeleteConfirmationDialogue
          isOpen={modalState?.isDeleteDialogueOpen}
          itemToDelete={modalState?.itemToDelete}
          isDeleting={modalState?.isDeleting}
          handleDelete={handleDelete}
          onClose={() =>
            setModalState((prev) => ({ ...prev, isDeleteDialogueOpen: false }))
          }
        />
      }
    </div>
  );
}

export default AssignmentDetails;
