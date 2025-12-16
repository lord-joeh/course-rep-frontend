import {
  FileInput,
  Label,
  HelperText,
  Button,
  Spinner,
} from "flowbite-react";
import { IoCloudUploadOutline } from "react-icons/io5";
import { submitAssignment } from "../../../services/assignmentService";
import { useCrud } from "../../../hooks/useCrud";
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

    const formData = new FormData();
    formData.append("file", selectedFile);
    formData.append("folderId", folderId);
    formData.append("assignmentId", assignmentId);
    formData.append("studentId", studentId);

    try {
      await add(formData);
    } catch (error) {
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
          disabled={loading || !selectedFile}
        >
          {loading ? (
            <Spinner />
          ) : (
            <>
              <IoCloudUploadOutline className="me-2 h-5 w-5" />
              Submit Assignment
            </>
          )}
        </Button>

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
