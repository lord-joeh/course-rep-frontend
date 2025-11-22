import React from "react";
import { MdDeleteForever } from "react-icons/md";
import { Button } from "flowbite-react";
import { ModalState, ViewFeedbackProps } from "../../../utils/Interfaces";

export const ViewFeedback: React.FC<ViewFeedbackProps> = ({
  formData,
  setCurrentStudentId,
  setModalState,
}: ViewFeedbackProps) => {
  return (
    <div className="flex flex-col justify-center gap-5">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
        {formData?.is_anonymous
          ? "Anonymous Feedback"
          : `${formData?.Student?.name ?? "Student"}'s Feedback`}
      </h1>

      <div className="dark:text-white">{formData?.content}</div>
      <div className="flex justify-end gap-2 p-2">
        <Button
          disabled={formData.is_anonymous}
          onClick={() => {
            setCurrentStudentId(formData.studentId);
            setModalState((prev: ModalState) => ({
              ...prev,
              isModalOpen: true,
            }));
          }}
        >
          Respond
        </Button>
        <Button
          color="alternative"
          onClick={() => {
            setModalState((prev: ModalState) => ({
              ...prev,
              isModalOpen: false,
              isEditing: false,
            }));
          }}
        >
          Close
        </Button>

        <Button
          color="red"
          onClick={() =>
            setModalState((prev: ModalState) => ({
              ...prev,
              isDeleteDialogueOpen: true,
              itemToDelete: `${formData?.content.slice(0, 30)}...` || "",
              idToDelete: formData?.id || "",
            }))
          }
          className=""
          aria-label="Delete feedback"
        >
          <MdDeleteForever size={24} />
        </Button>
      </div>
    </div>
  );
};
