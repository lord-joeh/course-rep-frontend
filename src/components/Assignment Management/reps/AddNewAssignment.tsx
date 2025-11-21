import { ChangeEvent, useState } from "react";
import {
  AssignmentCreationInterface,
  CourseInterface,
  ToastInterface,
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
} from "flowbite-react";
import { IoCloudUploadOutline } from "react-icons/io5";
import { uploadNewAssignment } from "../../../services/assignmentService";
import { isAxiosError } from "axios";
import ToastMessage from "../../common/ToastMessage";

const AddNewAssignment = () => {
  const [assignmentData, setAssignmentData] =
    useState<AssignmentCreationInterface>({
      title: "",
      description: "",
      courseId: "IT 323",
      deadline: "",
    });
  const [courses, setCourses] = useState<CourseInterface[]>([]);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<ToastInterface>({
    message: "",
    type: "error",
    isVisible: false,
  });

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

  const showToast = (message: string, type: "success" | "error") => {
    setToast((prev) => ({ ...prev, message, type, isVisible: true }));
  };

  const handleSubmit = async (e: ChangeEvent<HTMLFormElement>) => {
    e.preventDefault();
    try {
        setLoading(true)
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
      if (assignmentData?.file)
        transformedFormData.append("file", assignmentData?.file);
      transformedFormData.append("title", assignmentData?.title);
      transformedFormData.append("description", assignmentData?.description);
      transformedFormData.append("deadline", assignmentData?.deadline);
      transformedFormData.append("courseId", assignmentData?.courseId);

      const response = await uploadNewAssignment(transformedFormData);
      if (response) return showToast(response?.message, "success");
    } catch (error) {
      if (isAxiosError(error)) {
        showToast(
          error?.response?.data?.message || "Error uploading assignment",
          "error",
        );
      } else {
        showToast("Failed to upload assignment", "error");
      }
    } finally {
      setLoading(false);
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
      <h1 className="text-3xl">Upload Assignment</h1>
      <form onSubmit={handleSubmit} encType="multipart/form-data">
        <div className="mb-3 max-w-md">
          <div className="mb-2 block">
            <Label htmlFor="courses">Select Course</Label>
          </div>
          <Select
            id="courses"
            name="courseId"
            value={assignmentData?.courseId}
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

        <div className="mb-2 block max-w-md">
          <Label className="mb-2 block" htmlFor="assignment-upload">
            Select Files to Upload
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

        <div className="mt-2 mb-2 block max-w-md">
          <Label htmlFor="assignment-deadline">Due Date</Label>
          <TextInput
            id="assignment-deadline"
            name="deadline"
            type="date"
            value={assignmentData?.deadline}
            onChange={handleChange}
            required
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
              Upload Assignment
            </>
          )}
        </Button>
      </form>

       {toast.isVisible && (
        <ToastMessage
          message={toast.message}
          type={toast.type}
          onClose={() => setToast((prev) => ({ ...prev, isVisible: false }))}
        />
      )}
    </div>
  );
};

export default AddNewAssignment;
