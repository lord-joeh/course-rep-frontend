import {
  FileInput,
  Label,
  HelperText,
  Button,
  Spinner,
  Progress,
} from "flowbite-react";
import { IoCloudUploadOutline } from "react-icons/io5";
import { submitAssignment } from "../../../services/assignmentService";
import { useCrud } from "../../../hooks/useCrud";
import { useSocket } from "../../../hooks/useSocket";
import { useJobProgress } from "../../../hooks/useJobProgress";
import { AssignmentSubmissionInterface } from "../../../utils/Interfaces";
import { ChangeEvent, useState } from "react";
import ToastMessage from "../../common/ToastMessage";

const SubmitAssignment = ({
  folderId,
  assignmentId,
  studentId,
}: AssignmentSubmissionInterface) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const crudServices = {
    list: async () => ({ data: [] as AssignmentSubmissionInterface[] }),
    add: submitAssignment,
  };

  const { loading, add, toast, closeToast } =
    useCrud<AssignmentSubmissionInterface>(crudServices);

  const socket = useSocket();
  const { isProcessing, progress, statusText, resetJob } = useJobProgress({
    jobType: "submitAssignment",
    title: "Submitting assignment",
    onComplete: (success) => {
      if (success) {
        setSelectedFile(null);
      }
    },
    onError: (error) => {
      console.error("Submission failed:", error);
    },
  });

  // Job tracking now handled by EventListener + useJobProgress

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleSubmit = async (e: ChangeEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!selectedFile) {
      return;
    }

    // Create FormData here, fresh for each submission (fixes singleton bug)
    const formData = new FormData();
    formData.append("file", selectedFile);
    formData.append("folderId", folderId);
    formData.append("assignmentId", assignmentId);
    formData.append("studentId", studentId);
    if (socket && socket.id) formData.append("socketId", socket.id);

    try {
      await add(formData);
      // Job tracking is now handled automatically via EventListener
    } catch (error) {
      resetJob();
    }
  };

  return (
    <div className="container flex flex-col justify-center gap-5 dark:text-white">
      <h1 className="text-3xl">Submit Assignment</h1>
      <form
        encType="multipart/form-data"
        className="container"
        onSubmit={handleSubmit}
      >
        <div className="mb-2 block max-w-md">
          <Label className="mb-2 block" htmlFor="assignment-submit">
            Select File to Submit
          </Label>
          <FileInput
            id="assignment-submit"
            name="file"
            onChange={handleChange}
            accept=".pdf,.ppt,.pptx,.docx,.doc, .jpg, .png, .txt"
            className="max-w-md"
          />
          <HelperText>
            Supported Files: pdf, ppt, pptx, docx, doc, jpg, png, txt. Max File
            Size: 10MB
          </HelperText>
        </div>

        {selectedFile && (
          <div className="mt-2 max-w-md">
            <div className="text-sm font-medium">Selected file:</div>
            <div className="text-sm">
              {selectedFile.name} ({Math.round(selectedFile.size / 1024)} KB)
            </div>
          </div>
        )}

        <Button
          className="mt-4 w-full max-w-md cursor-pointer place-self-center"
          type="submit"
          disabled={loading || isProcessing || !selectedFile}
        >
          {loading || isProcessing ? (
            <Spinner />
          ) : (
            <>
              <IoCloudUploadOutline className="me-2 h-5 w-5" />
              Submit Assignment
            </>
          )}
        </Button>

        {isProcessing && (
          <div className="mt-4 flex w-full max-w-md flex-col gap-2 place-self-center">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">{statusText}</span>
              <span className="text-sm">{progress}%</span>
            </div>
            <Progress progress={progress} size="sm" color="blue" />
          </div>
        )}
      </form>

      {toast.visible && (
        <ToastMessage
          message={toast?.message}
          type={toast?.type}
          onClose={closeToast}
        />
      )}
    </div>
  );
};

export default SubmitAssignment;
