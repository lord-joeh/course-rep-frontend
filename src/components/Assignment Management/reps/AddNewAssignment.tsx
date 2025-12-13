import { ChangeEvent, useEffect, useState } from "react";
import {
  AssignmentCreationInterface,
  AssignmentsInterface,
  CourseInterface,
} from "../../../utils/Interfaces";
import {
  Button,
  FileInput,
  HelperText,
  Label,
  Select,
  Spinner,
  Textarea,
  TextInput,
  Progress,
} from "flowbite-react";
import { IoCloudUploadOutline } from "react-icons/io5";
import { uploadNewAssignment, updateAssignmentDetails } from "../../../services/assignmentService";
import ToastMessage from "../../common/ToastMessage";
import { useCrud } from "../../../hooks/useCrud";
import { courses as getCourses } from "../../../services/courseService";
import { useSocket } from "../../../hooks/useSocket";

interface AddNewAssignmentProps {
  assignment?: AssignmentsInterface;
  onClose?: () => void;
  isEditing?: boolean;
}

const AddNewAssignment = ({ assignment, onClose, isEditing }: AddNewAssignmentProps) => {
  const [assignmentData, setAssignmentData] =
    useState<AssignmentCreationInterface>({
      title: "",
      description: "",
      courseId: "",
      deadline: "",
    });

  const crudServices = {
    list: getCourses,
    add: uploadNewAssignment,
    update: updateAssignmentDetails
  }
  const {
    items: courses,
    loading,
    toast,
    showToast,
    closeToast,
    add,
    update
  } = useCrud<CourseInterface>(crudServices)

  const socket = useSocket();
  const [processing, setProcessing] = useState(false); // Local loading for socket ops
  const [progress, setProgress] = useState(0);
  const [statusText, setStatusText] = useState("");

  useEffect(() => {
    if (!socket) return;

    const onProgress = (data: any) => {
      if (data.status === "start") {
        setProcessing(true);
        setProgress(0);
        setStatusText("Starting upload...");
      } else if (data.status === "progress") {
        const percent = data.total ? Math.round((data.current / data.total) * 100) : 0;
        setProgress(percent);
        setStatusText("Uploading file...");
      }
    };

    const onComplete = (data: any) => {
      setProcessing(false);
      setProgress(100);
      setStatusText("Upload complete!");
      if (data.successful) {
        showToast("Assignment added successfully", "success");
        onClose?.();
      }
      // If failed, jobFailed usually fires.
    };

    const onJobFailed = (data: any) => {
      if (processing) { // Only if we are waiting
        setProcessing(false);
        showToast(data.error || "Upload failed", "error");
      }
    }

    socket.on("uploadProgress", onProgress);
    socket.on("uploadComplete", onComplete);
    socket.on("jobFailed", onJobFailed);

    return () => {
      socket.off("uploadProgress", onProgress);
      socket.off("uploadComplete", onComplete);
      socket.off("jobFailed", onJobFailed);
    };
  }, [socket, processing]);

  useEffect(() => {
    if (assignment) {
      setAssignmentData({
        title: assignment.title,
        description: assignment.description,
        courseId: assignment.courseId,
        deadline: assignment.deadline,
      });
    }
  }, [assignment]);

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    if (name && value) {
      setAssignmentData((prev) => ({ ...prev, [name]: value }));
    }

    if (e.target.files) {
      const file = e.target.files[0];
      setAssignmentData((prev) => ({ ...prev, file }));
    }
  };

  const handleSubmit = async (e: ChangeEvent<HTMLFormElement>) => {
    e.preventDefault();
    try {
      if (
        !assignmentData?.courseId ||
        !assignmentData?.title ||
        !assignmentData?.description ||
        !assignmentData?.deadline
      ) {
        return showToast(
          "All fields are required. Except the file field",
          "error",
        );
      }

      const transformedFormData = new FormData();
      if (!isEditing && assignmentData?.file)
        transformedFormData.append("file", assignmentData?.file);
      transformedFormData.append("title", assignmentData?.title);
      transformedFormData.append("description", assignmentData?.description);
      transformedFormData.append("deadline", assignmentData?.deadline);
      transformedFormData.append("courseId", assignmentData?.courseId);
      if (socket && socket.id) transformedFormData.append("socketId", socket.id);

      if (isEditing) {
        if (!assignment?.id) return showToast("Invalid Assignment ID", "error");
        await update(assignment.id, transformedFormData);
        onClose?.();
      } else {
        await add(transformedFormData);
        // If file is present, we wait for socket. If no file, it might be instant or also queued (logic in backend says Case 2 isNewAssignment always queued? yes).
        setProcessing(true);
        setStatusText("Request queued...");
      }

    } catch (error) { } finally {
      setAssignmentData({
        title: "",
        deadline: "",
        description: "",
        courseId: "",
      });
    }
  };

  return (
    <div className="container flex flex-col justify-center gap-5 dark:text-white">
      <h1 className="text-3xl">{isEditing ? "Edit Assignment" : "Upload Assignment"}</h1>
      <form onSubmit={handleSubmit} encType="multipart/form-data" className="container">
        <div className="mb-3 max-w-md">
          <div className="mb-2 block">
            <Label htmlFor="courses">Select Course</Label>
          </div>
          <Select
            id="courses"
            name="courseId"
            value={assignmentData?.courseId}
            required
            onChange={(e: ChangeEvent<HTMLSelectElement>) => {
              setAssignmentData((prev) => ({
                ...prev,
                courseId: e.target.value,
              }));
            }}
          >
            <option value="" disabled>
              Select Course
            </option>
            {courses.map((course: CourseInterface) => (
              <option key={course?.id} value={course?.id}>
                {course?.name}
              </option>
            ))}
          </Select>
        </div>

        <div className="mb-2 block max-w-md">
          <Label htmlFor="title">Assignment Title</Label>
          <TextInput
            id="title"
            name="title"
            type="text"
            required
            placeholder="Title"
            value={assignmentData?.title}
            onChange={handleChange}
          />
        </div>

        <div className="mb-2 block max-w-md">
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            name="description"
            required
            rows={3}
            placeholder="Information about the assignment"
            onChange={(e: ChangeEvent<HTMLTextAreaElement>) => {
              setAssignmentData((prev) => ({
                ...prev,
                description: e.target.value,
              }));
            }}
          />
        </div>

        {!isEditing && (
          <div className="mb-2 block max-w-md">
            <Label className="mb-2 block" htmlFor="assignment-upload">
              Select Assignment File to Upload
            </Label>
            <FileInput
              id="assignment-upload"
              name="files"
              onChange={handleChange}
              accept=".pdf,.ppt,.pptx,.docx,.doc, .jpg, .png"
              className="max-w-md"
            />
            <HelperText>
              Supported Files: pdf, ppt, pptx, docx, doc, jpg, png. Max File Size:
              10MB
            </HelperText>
          </div>
        )}

        {isEditing && assignment?.fileName && (
          <div className="mb-2 max-w-md">
            <Label className="mb-2 block">Current File</Label>
            <div className="text-sm">{assignment.fileName}</div>
          </div>
        )}

        <div className="mt-2 mb-2 block max-w-md">
          <Label htmlFor="assignment-deadline">Due Date</Label>
          <TextInput
            id="assignment-deadline"
            name="deadline"
            type="date"
            value={assignmentData?.deadline}
            onChange={handleChange}
            required
            className="max-w-md"
          />
        </div>

        {/* Show selected file name and size */}
        {assignmentData.file && assignmentData?.file?.name && (
          <div className="mt-2 max-w-md">
            <div className="text-sm font-medium">Selected file</div>
            <ul className="list-disc pl-5">
              {
                <li key={assignmentData?.file.name} className="text-sm">
                  {assignmentData?.file.name} (
                  {Math.round(assignmentData?.file.size / 1024)} KB)
                </li>
              }
            </ul>
          </div>
        )}

        <Button
          className="mt-4 w-full max-w-md cursor-pointer place-self-center"
          type="submit"
          disabled={loading}
        >
          {loading ? (
            <Spinner />
          ) : (
            <>
              <IoCloudUploadOutline className="me-2 h-5 w-5" />
              {isEditing ? "Update Assignment" : "Upload Assignment"}
            </>
          )}
        </Button>

        {processing && (
          <div className="mt-4 flex flex-col gap-2 max-w-md place-self-center w-full">
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
          message={toast.message}
          type={toast.type}
          onClose={closeToast}
        />
      )}
    </div>
  );
};

export default AddNewAssignment;
