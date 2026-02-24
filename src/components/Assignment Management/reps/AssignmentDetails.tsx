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

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 2xl:grid-cols-3">
        <Card className="bg-emerald-50 text-center">
          <h5 className="text-lg font-medium text-emerald-500">
            Number of Submitted Assignments
          </h5>
          <p className="text-4xl font-semibold text-emerald-500">
            {pagination?.totalItems || 0}
          </p>
        </Card>

        <Card className="bg-blue-50">
          <h5 className="text-xl font-bold">Assignment Details</h5>
          <p className="text-3xl font-extrabold text-blue-600">
            {assignmentInfo?.title || ""}
          </p>
          <small>{assignmentInfo?.Course?.name || ""}</small>
          <span className="flex gap-3">
            <TbCalendarDue size={24} color="red" />
            <p className="text-lg font-semibold text-red-500">
              {assignmentInfo?.deadline
                ? new Date(assignmentInfo?.deadline).toDateString()
                : ""}{" "}
            </p>
          </span>
        </Card>

        {user && user?.isRep && (
          <Card className="bg-red-50">
            <h5 className="text-xl font-semibold">Assignment Actions</h5>

            <div className="flex justify-between">
              <Tooltip content="Update Assignment Info">
                <span
                  className="cursor-pointer"
                  onClick={() =>
                    setModalState((prev) => ({
                      ...prev,
                      isModalOpen: true,
                      isEditing: true,
                    }))
                  }
                >
                  <BiEditAlt size={32} color="green" />{" "}
                </span>
              </Tooltip>

              <Tooltip content="Delete Assignment and all Data">
                <span
                  className="cursor-pointer"
                  onClick={() =>
                    setModalState((prev) => ({
                      ...prev,
                      itemToDelete: assignmentInfo?.title ?? "",
                      idToDelete: assignmentInfo?.id ?? "",
                      isDeleteDialogueOpen: true,
                    }))
                  }
                >
                  <MdDeleteForever size={32} color="red" />{" "}
                </span>
              </Tooltip>
            </div>
          </Card>
        )}
      </div>

      <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
        Submissions
      </h1>

      {loading && <Spinner size="lg" />}

      {filteredSubmissions?.length > 0 ? (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredSubmissions.map((submitted, idx) => (
            <Card key={idx}>
              <div className="flex flex-col flex-wrap gap-2">
                <h5 className="text-md font-light tracking-tight text-gray-900 dark:text-white">
                  {submitted?.fileName ?? "Untitled"}
                </h5>
                <span className="flex flex-row">
                  <p className="text-sm">Student ID: </p>
                  <p className="text-sm font-bold">
                    {` ${submitted?.Student?.id || ""}`}
                  </p>
                </span>
                <span className="flex items-center gap-2 text-center">
                  <FaRegCalendarCheck size={24} color="green" />
                  <p className="text-sm">Submitted On: </p>
                  <p className="text-sm font-bold">
                    {submitted?.submittedAt
                      ? new Date(submitted?.submittedAt).toDateString()
                      : ""}
                  </p>
                </span>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <div className="text-center text-gray-500 dark:text-gray-400">
          No Assignment Submitted.
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
