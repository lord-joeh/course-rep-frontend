import { useState, useEffect, useCallback, useMemo } from "react";
import * as FeedbackService from "../../../services/feedbackService";
import { isAxiosError } from "axios";
import { MdDeleteForever, MdRefresh } from "react-icons/md";
import { Avatar, Button, Card, Pagination, Spinner } from "flowbite-react";
import { VscFeedback } from "react-icons/vsc";
import MessageToStudentModal from "../../common/MessageToStudentModal";
import ToastMessage from "../../common/ToastMessage";
import CommonModal from "../../common/CommonModal";
import { DeleteConfirmationDialogue } from "../../common/DeleteConfirmationDialogue";
import AddFeedback from "../students/Feedback";

interface Feedback {
  id: string;
  studentId: string;
  content: string;
  is_anonymous: boolean;
  Student: { name: string };
}

interface PaginationType {
  currentPage: number;
  totalPages: number;
  itemsPerPage: number;
  totalItems: number;
}

interface ModalState {
  isAdding: boolean;
  isDeleteDialogueOpen: boolean;
  isModalOpen: boolean;
  isDeleting: boolean;
  isEditing: boolean;
  itemToDelete: string;
  idToDelete: string;
}

interface ToastInterface {
  message: string;
  type: "error" | "success";
  isVisible: boolean;
}

const Feedbacks = () => {
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [isLoading, setLoading] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [formData, setFormData] = useState<Feedback>({
    id: "",
    studentId: "",
    content: "",
    is_anonymous: false,
    Student: { name: "" },
  });

  const [toast, setToast] = useState<ToastInterface>({
    message: "",
    type: "error",
    isVisible: false,
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

  const [pagination, setPagination] = useState<PaginationType>({
    currentPage: 1,
    totalPages: 0,
    itemsPerPage: 9,
    totalItems: 0,
  });
  const [currentStudentId, setCurrentStudentId] = useState<string>("");

  const showToast = (message: string, type: "success" | "error") =>
    setToast({ message, type, isVisible: true });

  const closeToast = () => {
    setToast((prev) => ({ ...prev, isVisible: false }));
  };

  const fetchFeedbacksData = async (
    page = 1,
    itemsPerPage = pagination.itemsPerPage,
  ) => {
    try {
      setLoading(true);

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
      setLoading(false);
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

  const handleRefresh = () => {
    fetchFeedbacksData(pagination.currentPage, pagination.itemsPerPage);
  };

  const onPageChange = (pageNumber: number) => {
    setPagination((prev) => ({ ...prev, currentPage: pageNumber }));
  };

  const filteredFeedbacks = useMemo(() => {
    if (!searchQuery) return feedbacks;
    const lowerQuery = searchQuery.toLowerCase();
    return feedbacks.filter((feedback) =>
      Object.values(feedback).some((value) =>
        String(value).toLowerCase().includes(lowerQuery),
      ),
    );
  }, [feedbacks, searchQuery]);

  const handleFeedbackDelete = async (id: string) => {
    try {
      setModalState((prev) => ({ ...prev, isDeleting: true }));
      const response = await FeedbackService.deleteFeedback(id);
      showToast(
        response?.data?.message || "Feedback deleted successfully",
        "success",
      );
      handleRefresh();
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

  const viewModalContent = (
    <div className="flex flex-col justify-center gap-5">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
        {formData?.is_anonymous
          ? "Anonymous Feedback"
          : `${formData.Student.name}'s Feedback`}
      </h1>

      <div className="dark:text-white">{formData?.content}</div>
      <div className="flex justify-center gap-4 p-2">
        <Button
          disabled={formData.is_anonymous}
          onClick={() => {
            setCurrentStudentId(formData.studentId);
            setModalState((prev) => ({ ...prev, isModalOpen: true }));
          }}
        >
          Respond to Feedback
        </Button>
        <Button
          color="alternative"
          onClick={() => {
            setModalState((prev) => ({ ...prev, isEditing: false }));
          }}
        >
          Close
        </Button>

        <span
          onClick={() =>
            setModalState((prev) => ({
              ...prev,
              isDeleteDialogueOpen: true,
              itemToDelete: `${formData?.content.slice(0, 30)}...` || "",
              idToDelete: formData?.id || "",
            }))
          }
          className="mt-2 cursor-pointer px-8"
        >
          <MdDeleteForever size={24} color="red" />
        </span>
      </div>
    </div>
  );
  return (
    <div className="flex flex-col gap-6 p-6 font-sans md:p-1">
      <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
        Feedbacks Management
      </h1>
      <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
        <input
          id="search"
          type="search"
          placeholder="Search feedback..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full flex-grow rounded-lg border px-4 py-2 focus:outline-none md:w-auto"
        />
        <Button onClick={handleRefresh}>
          <MdRefresh className="me-2 h-4 w-4" /> Refresh
        </Button>
      </div>

      <Button
        onClick={() => {
          setModalState((prev) => ({
            ...prev,
            isAdding: true,
          }));
        }}
        className="flex w-50 justify-start"
      >
        <VscFeedback className="me-2 h-4 w-4" /> Submit a Feedback
      </Button>

      <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
        Recent Feedbacks
      </h1>

      <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
        {isLoading ? (
          <Spinner size="lg" />
        ) : filteredFeedbacks.length > 0 ? (
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
                  disabled={feedback.is_anonymous}
                  onClick={() => {
                    setCurrentStudentId(feedback.studentId);
                    setModalState((prev) => ({ ...prev, isModalOpen: true }));
                  }}
                >
                  Respond to Feedback
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
        {modalState.isEditing && viewModalContent}
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
