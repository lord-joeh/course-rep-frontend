import React, { useState, useEffect  } from "react";
import { Avatar, Card, Spinner, Tooltip } from "flowbite-react";
import { SiGooglemessages } from "react-icons/si";
import { FaUserEdit } from "react-icons/fa";
import { MdDeleteForever } from "react-icons/md";
import { useParams, useNavigate } from "react-router-dom";
import ToastMessage from "../../common/ToastMessage";
import { deleteStudent } from "../../../services/studentService";
import { isAxiosError } from "axios";
import { DeleteConfirmationDialogue } from "../../common/DeleteConfirmationDialogue";
import MessageToStudentModal from "../../common/MessageToStudentModal";
import useAuth from "../../../hooks/useAuth";
import CommonModal from "../../common/CommonModal";
import { updateStudent } from "../../../services/studentService";
import { studentDataHook } from "../../../utils/Interfaces";
import EditStudent from "./EditStudent";

type ModalState = {
  isDeleteDialogueOpen: boolean;
  isMessageModalOpen: boolean;
  isEditModalOpen: boolean;
  isDeleting: boolean;
  isEditing: boolean;
  itemToDelete: string;
  idToDelete: string;
};

const StudentInfo = ({ studentData, isLoading, error }: studentDataHook) => {
  const { studentId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [toast, setToast] = useState<{
    message: string;
    type: "error" | "success";
    isVisible: boolean;
  }>({
    message: "",
    type: "error",
    isVisible: false,
  });

  const [modalState, setModalState] = useState<ModalState>({
    isDeleteDialogueOpen: false,
    isMessageModalOpen: false,
    isEditModalOpen: false,
    isDeleting: false,
    isEditing: false,
    itemToDelete: "",
    idToDelete: "",
  });
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    status: "",
    isRep: false,
  });

  const showToast = (message: string, type: "success" | "error") =>
    setToast({ message, type, isVisible: true });

  const closeToast = () => setToast((prev) => ({ ...prev, isVisible: false }));

  const closeDialogue = () =>
    setModalState((prev) => ({ ...prev, isDeleteDialogueOpen: false }));

  const closeMessageModal = () =>
    setModalState((prev) => ({ ...prev, isMessageModalOpen: false }));

  const closeEditModal = () =>
    setModalState((prev) => ({ ...prev, isEditModalOpen: false }));

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    const { name, value, type } = e.target;
    const newValue =
      type === "checkbox" ? (e.target as HTMLInputElement).checked : value;

    setFormData({
      ...formData,
      [name]: newValue,
    });
  };

  useEffect(() => {
    if (studentData) {
      setFormData({
        name: studentData.name || "",
        email: studentData.email || "",
        phone: studentData.phone || "",
        status: studentData.status || "",
        isRep: studentData.isRep || false,
      });
    }
  }, [studentData]);

  const handleUserEdit = async (e: React.ChangeEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!studentId) return;
    try {
      setModalState((prev) => ({ ...prev, isEditing: true }));
      const response = await updateStudent(studentId, formData);

      showToast(
        response?.data?.message || "Student updated successfully",
        "success",
      );
    } catch (err) {
      if (isAxiosError(err)) {
        showToast(
          err.response?.data?.error || "Failed to update student.",
          "error",
        );
      } else {
        showToast(
          "An unexpected error occurred while updating student.",
          "error",
        );
      }
    } finally {
      setModalState((prev) => ({
        ...prev,
        isEditing: false,
        isEditModalOpen: false,
      }));
    }
  };

  const handleUserDelete = async (id: string) => {
    try {
      setModalState((prev) => ({ ...prev, isDeleting: true }));
      const response = await deleteStudent(id);
      showToast(
        response?.data?.message || "Student deleted successfully",
        "success",
      );
      navigate(-1);
    } catch (err) {
      if (isAxiosError(err)) {
        showToast(
          err.response?.data?.error || "Failed to delete student.",
          "error",
        );
      } else {
        showToast(
          "An unexpected error occurred while deleting student.",
          "error",
        );
      }
    } finally {
      setModalState((prev) => ({
        ...prev,
        isDeleting: false,
        isDeleteDialogueOpen: false,
      }));
    }
  };


  return (
    <div className="flex flex-col justify-start gap-5">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
        Student Details
      </h1>

      {error ? (
        <Card className="p-4 text-center text-red-500">
          <p>{error}</p>
        </Card>
      ) : (
        <Card>
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Spinner size="lg" />
            </div>
          ) : (
            <>
              <div className="flex flex-col items-center justify-center">
                <Avatar rounded size="lg" />
                <span className="mt-4 text-xl font-semibold text-gray-900 dark:text-white">
                  {studentData?.name}
                </span>
                <span className="text-lg font-semibold text-gray-900 dark:text-white">
                  {studentData?.phone}
                </span>
                <span className="text-sm font-semibold text-gray-700 dark:text-white">
                  {studentData?.email}
                </span>
              </div>
              <div className="flex justify-around">
                <div
                  className={`my-2 flex w-1/4 flex-col items-center rounded-md ${
                    studentData?.status === "active"
                      ? "bg-emerald-500"
                      : "bg-red-500"
                  }`}
                >
                  <small className="mt-2 text-gray-200">Status</small>
                  <p className="mb-2 text-sm text-white capitalize">
                    {studentData?.status}
                  </p>
                </div>
                <div className="my-2 flex w-1/4 flex-col items-center rounded-md bg-blue-500">
                  <small className="mt-2 text-gray-200">Role</small>
                  <p className="mb-2 text-sm text-white capitalize">
                    {studentData?.isRep ? "Rep" : "Student"}
                  </p>
                </div>
              </div>
            </>
          )}
        </Card>
      )}

      {!isLoading && !error && (
        <Card>
          <div className="flex justify-evenly space-x-4">
            {user?.id !== studentData?.id && (
              <Tooltip content="Message">
                <SiGooglemessages
                  size="30px"
                  color="blue"
                  className="cursor-pointer"
                  onClick={() =>
                    setModalState((prev) => ({
                      ...prev,
                      isMessageModalOpen: true,
                    }))
                  }
                />
              </Tooltip>
            )}

            <Tooltip content="Edit">
              <FaUserEdit
                size="30px"
                color="green"
                className="cursor-pointer"
                onClick={() =>
                  setModalState((prev) => ({ ...prev, isEditModalOpen: true }))
                }
              />
            </Tooltip>

            <Tooltip content="Delete Account">
              <MdDeleteForever
                size="30px"
                color="red"
                className="cursor-pointer"
                onClick={() =>
                  setModalState((prev) => ({
                    ...prev,
                    isDeleteDialogueOpen: true,
                    itemToDelete: studentData?.name || "",
                    idToDelete: studentData?.id || "",
                  }))
                }
              />
            </Tooltip>
          </div>
        </Card>
      )}

      {toast.isVisible && (
        <ToastMessage
          message={toast.message}
          type={toast.type}
          onClose={closeToast}
        />
      )}

      <DeleteConfirmationDialogue
        isOpen={modalState.isDeleteDialogueOpen}
        isDeleting={modalState.isDeleting}
        handleDelete={() => handleUserDelete(modalState.idToDelete)}
        onClose={closeDialogue}
        itemToDelete={modalState.itemToDelete}
      />

      <MessageToStudentModal
        isOpen={modalState.isMessageModalOpen}
        studentId={studentData?.id || ""}
        onClose={closeMessageModal}
      />

      <CommonModal
        open={modalState.isEditModalOpen}
        onClose={closeEditModal}
        children={
          <EditStudent
            formData={formData}
            handleChange={handleChange}
            handleUserEdit={handleUserEdit}
            isEditing={modalState.isEditing}
            onClose={closeEditModal}
            studentData={studentData}
          />
        }
      />
    </div>
  );
};

export default StudentInfo;
