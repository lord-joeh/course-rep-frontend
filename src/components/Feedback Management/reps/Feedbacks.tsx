import { useState, useEffect, useCallback } from "react";
import * as FeedbackService from "../../../services/feedbackService";
import { isAxiosError } from "axios";
import {
  Avatar,
  Button,
  Card,
  Label,
  Pagination,
  Select,
  Spinner,
  TextInput,
} from "flowbite-react";
import { VscFeedback } from "react-icons/vsc";
import MessageToStudentModal from "../../common/MessageToStudentModal";
import ToastMessage from "../../common/ToastMessage";
import CommonModal from "../../common/CommonModal";
import { DeleteConfirmationDialogue } from "../../common/DeleteConfirmationDialogue";
import AddFeedback from "../students/Feedback";
import {
  PaginationType,
  ModalState,
  ToastInterface,
  Feedback,
} from "../../../utils/Interfaces";
import { ViewFeedback } from "./ViewFeedback.tsx";
import { useSearch } from "../../../hooks/useSearch";
import { HiOutlineSearch } from "react-icons/hi";

const Feedbacks = () => {
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [formData, setFormData] = useState<Feedback>({
    id: "",
    studentId: "",
    content: "",
    is_anonymous: false,
    Student: { name: "" },
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

  const [currentStudentId, setCurrentStudentId] = useState<string>("");
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<ToastInterface>({
    message: "",
    type: "error",
    isVisible: false,
  });

  const showToast = (message: string, type: "success" | "error") =>
    setToast({ message, type, isVisible: true });

  const closeToast = () => {
    setToast((prev) => ({ ...prev, isVisible: false }));
  };

  const [pagination, setPagination] = useState<PaginationType>({
    currentPage: 1,
    totalPages: 0,
    itemsPerPage: 9,
    totalItems: 0,
  });

  const fetchFeedbacksData = async (
    page = 1,
    itemsPerPage = pagination.itemsPerPage,
  ) => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await FeedbackService.getFeedbacks(page, itemsPerPage);

      setFeedbacks(response.data?.feedbacks || []);
      const pageInfo = response.data?.pagination;
      setPagination({
        currentPage: pageInfo.currentPage || page,
        itemsPerPage: pageInfo.itemsPerPage || itemsPerPage,
        totalItems: pageInfo.totalItems || 0,
        totalPages: pageInfo.totalPages || 1,
      });
    } catch (error) {
      if (isAxiosError(error)) {
        showToast(
          error.response?.data?.error || "Error fetching feedbacks",
          "error",
        );
      } else {
        showToast("An unexpected error occurred.", "error");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const debouncedFetch = useCallback((page: number, perPage: number) => {
    const timeoutId = setTimeout(() => {
      fetchFeedbacksData(page, perPage);
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

  const filteredFeedbacks = useSearch<Feedback>(feedbacks, searchQuery);

  const handleFeedbackDelete = async (id: string) => {
    try {
      setModalState((prev) => ({ ...prev, isDeleting: true }));
      const response = await FeedbackService.deleteFeedback(id);
      showToast(
        response?.data?.message || "Feedback deleted successfully",
        "success",
      );
      setFeedbacks((prev) => prev.filter((feed) => feed.id !== id));
    } catch (err) {
      if (isAxiosError(err)) {
        showToast(
          err.response?.data?.error || "Failed to delete Feedback.",
          "error",
        );
      } else {
        showToast(
          "An unexpected error occurred while deleting Feedback.",
          "error",
        );
      }
    } finally {
      setModalState((prev) => ({
        ...prev,
        isDeleting: false,
        isDeleteDialogueOpen: false,
        isEditing: false,
      }));
    }
  };

  return (
    <div className="flex flex-col gap-3 font-sans">
      <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
        Feedbacks Management
      </h1>

      <Button
        onClick={() => {
          setModalState((prev) => ({
            ...prev,
            isAdding: true,
          }));
        }}
        className="mt-3 flex w-full justify-center md:w-md"
      >
        <VscFeedback className="me-2 h-4 w-4" /> Submit a Feedback
      </Button>

      <Card>
        <div className="grid grid-cols-1 items-center gap-4 md:grid-cols-12">
          <div className="md:col-span-2">
            <Label htmlFor="entries" className="mb-2 block font-medium">
              Show
            </Label>
            <Select
              id="entries"
              className="rounded border-none text-gray-900 dark:text-white"
              // value={pagination.itemsPerPage}
              // onChange={(e) =>
              //   setPagination((prev) => ({
              //     ...prev,
              //     itemsPerPage: Number.parseInt(e.target.value),
              //     currentPage: 1,
              //   }))
              // }
            >
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
              {/* <option value={pagination?.totalItems}>All</option> */}
            </Select>
          </div>

          <div className="md:col-span-5">
            <Label htmlFor="search" className="mb-2 block font-medium">
              Search Feedbacks
            </Label>
            <TextInput
              id="search"
              placeholder="Search Feedbacks..."
              icon={HiOutlineSearch}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
      </Card>

      <h1 className="mt-3 text-3xl font-bold text-gray-900 dark:text-white">
        Recent Feedbacks
      </h1>

      <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
        {isLoading && <Spinner size="lg" />}
        {filteredFeedbacks?.length > 0 ? (
          filteredFeedbacks.map((feedback: Feedback) => (
            <div
              key={feedback?.id}
              className="my-4 flex max-w-sm flex-col justify-between gap-5 rounded-xl bg-white shadow-lg dark:bg-gray-800"
            >
              <div className="flex items-center justify-between rounded-xl bg-blue-800 p-2 text-white">
                <span className="dark:text- text-6xl font-bold">
                  <Avatar rounded />
                </span>
                <span className="mt-2 p-4 text-xl font-semibold">
                  {feedback.Student?.name}
                </span>
              </div>
              <div className="flex flex-col justify-center space-y-2 p-2">
                {feedback.content.length > 100
                  ? `${feedback?.content.slice(0, 100)}...`
                  : feedback.content}
              </div>
              <div className="flex justify-center gap-4 p-2">
                <Button
                  disabled={feedback?.is_anonymous}
                  onClick={() => {
                    setCurrentStudentId(feedback?.studentId);
                    setModalState((prev) => ({ ...prev, isModalOpen: true }));
                  }}
                >
                  Respond
                </Button>
                <Button
                  color="alternative"
                  onClick={() => {
                    setFormData((prev) => ({
                      ...prev,
                      content: feedback?.content,
                      studentId: feedback?.studentId,
                      is_anonymous: feedback?.is_anonymous,
                      Student: { name: feedback.Student.name },
                      id: feedback.id,
                    }));
                    setModalState((prev) => ({ ...prev, isEditing: true }));
                  }}
                >
                  View
                </Button>
              </div>
            </div>
          ))
        ) : (
          <Card>No feedback</Card>
        )}
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

      <MessageToStudentModal
        isOpen={modalState.isModalOpen}
        studentId={currentStudentId}
        onClose={() =>
          setModalState((prev) => ({ ...prev, isModalOpen: false }))
        }
      />

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

      <CommonModal
        open={modalState.isAdding || modalState.isEditing}
        onClose={() => {
          setModalState((prev) => ({
            ...prev,
            isAdding: false,
            isEditing: false,
          }));
        }}
      >
        {modalState.isEditing && (
          <ViewFeedback
            formData={formData}
            setModalState={setModalState}
            setCurrentStudentId={setCurrentStudentId}
          />
        )}
        {modalState.isAdding && <AddFeedback />}
      </CommonModal>

      <DeleteConfirmationDialogue
        isOpen={modalState.isDeleteDialogueOpen}
        isDeleting={modalState.isDeleting}
        handleDelete={() => handleFeedbackDelete(modalState.idToDelete)}
        onClose={() => {
          setModalState((prev) => ({ ...prev, isDeleteDialogueOpen: false }));
        }}
        itemToDelete={modalState.itemToDelete}
      />
    </div>
  );
};

export default Feedbacks;
