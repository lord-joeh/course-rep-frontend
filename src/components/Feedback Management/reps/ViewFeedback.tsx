import React from "react";
import { MdDeleteForever } from "react-icons/md";
import { Button } from "flowbite-react";
import { ModalState, ViewFeedbackProps } from "../../../utils/Interfaces.ts";

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
          : `${formData.Student.name}'s Feedback`}
      </h1>

      <div className="dark:text-white">{formData?.content}</div>
      <div className="flex justify-center gap-4 p-2">
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
          Respond to Feedback
        </Button>
        <Button
          color="alternative"
          onClick={() => {
            setModalState((prev: ModalState) => ({
              ...prev,
              isEditing: false,
            }));
          }}
        >
          Close
        </Button>

        <span
          onClick={() =>
            setModalState((prev: ModalState) => ({
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
};
