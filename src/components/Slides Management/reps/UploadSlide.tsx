import {
  FileInput,
  HelperText,
  Label,
  Button,
  Spinner,
  Select,
  Progress,
} from "flowbite-react";
import React, { useState } from "react";
import { IoCloudUploadOutline } from "react-icons/io5";
import { uploadSlides } from "../../../services/slidesServices.ts";
import { isAxiosError } from "axios";
import {
  CourseInterface,
  SlideUploadInterface,
  ToastInterface,
} from "../../../utils/Interfaces.ts";
import ToastMessage from "../../common/ToastMessage.tsx";
import { useSocket } from "../../../hooks/useSocket.ts";
import { useJobProgress } from "../../../hooks/useJobProgress.ts";

const UploadSlide = ({ courses, onSuccess }: any) => {
  const [formData, setFormData] = useState<SlideUploadInterface>({
    folderId: "",
    courseId: "",
    files: [],
  });
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<ToastInterface>({
    message: "",
    type: "error",
    isVisible: false,
  });

  const socket = useSocket();
  const { isProcessing, progress, statusText, resetJob } = useJobProgress({
    jobType: "uploadSlides",
    title: "Uploading slides",
    onComplete: (success) => {
      setLoading(false);
      if (success && typeof onSuccess === "function") {
        onSuccess();
      }
      // Reset form on success
      if (success) {
        setFormData({
          folderId: "",
          courseId: "",
          files: [],
        });
      }
    },
    onError: (error) => {
      setLoading(false);
      showToast(error, "error");
    },
  });

  // Note: Job tracking is now handled by EventListener + useJobProgress
  // No need for duplicate socket listeners here

  const showToast = (message: string, type: "error" | "success") => {
    setToast((prev) => ({ ...prev, isVisible: true, message, type }));
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    if (name && value) {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }

    if (e.target.files) {
      const files = Array.from(e.target.files);
      setFormData((prev) => ({ ...prev, files }));
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!formData.courseId) {
      return showToast("Please select a course", "error");
    }

    if (!formData.files || formData.files.length < 1) {
      return showToast("Please select at least one file to upload", "error");
    }

    try {
      setLoading(true);

      const fd = new FormData();

      formData.files.forEach((file) => fd.append("files", file));

      fd.append("courseId", formData.courseId);
      if (formData.folderId) fd.append("folderId", formData.folderId);
      if (socket && socket.id) fd.append("socketId", socket.id);

      const response = await uploadSlides(fd);

      // Job is now tracked via EventListener + GlobalProgressTracker
      // The inline progress will be updated by useJobProgress hook
      if (!response) {
        setLoading(false);
        showToast("Upload failed to start", "error");
      }
      if (typeof onSuccess === "function") {
        onSuccess();
      }
    } catch (err) {
      setLoading(false);
      resetJob();
      if (isAxiosError(err)) {
        showToast(
          err.response?.data?.message || "Error uploading slides",
          "error",
        );
      } else {
        showToast("Error uploading slides", "error");
      }
    }
  };

  const findSlideFolderId = (courseId: string): string => {
    const course = courses.find(
      (course: CourseInterface) => course?.id === courseId,
    );
    const folderId = course?.slidesFolderID ?? "";
    setFormData((prev) => ({ ...prev, folderId }));
    return folderId;
  };

  return (
    <div className="container mx-auto flex flex-col justify-center gap-5 p-4 dark:text-white">
      <h1 className="text-3xl">Upload Slides</h1>
      <form onSubmit={handleSubmit} encType="multipart/form-data">
        <div className="mb-3 max-w-md">
          <div className="mb-2 block">
            <Label htmlFor="courses">Select Course</Label>
          </div>
          <Select
            id="courses"
            name="courseId"
            value={formData.courseId}
            onChange={(e: React.ChangeEvent<HTMLSelectElement>) => {
              const courseId = e.target.value;
              const folder = findSlideFolderId(courseId);
              setFormData((prev) => ({ ...prev, courseId, folderId: folder }));
            }}
            required
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

        <Label className="mb-2 block" htmlFor="slide-upload">
          Select Files to Upload
        </Label>
        <FileInput
          id="slide-upload"
          name="files"
          multiple
          onChange={handleChange}
          accept=".pdf,.ppt,.pptx,.docx,.doc, .jpg, .png, .csv, .txt, .mp4, .xlsx, .xls"
          size={10}
          className="max-w-md"
        />
        <HelperText>10 files Max</HelperText>

        {/* Show selected file name */}
        {formData.files && formData.files.length > 0 && (
          <div className="mt-2 max-w-md">
            <div className="text-sm font-medium">Selected files:</div>
            <ul className="list-disc pl-5">
              {formData.files.map((f, i) => (
                <li key={i} className="text-sm">
                  {f.name} ({Math.round(f.size / 1024)} KB)
                </li>
              ))}
            </ul>
          </div>
        )}

        <Button
          className="mt-4 w-full max-w-md cursor-pointer place-self-center"
          type="submit"
          disabled={loading || isProcessing}
        >
          {loading || isProcessing ? (
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-center gap-2">
                <Spinner aria-label="Uploading" />
                <span className="text-sm">{statusText || "Uploading..."}</span>
              </div>
              {progress > 0 && (
                <Progress progress={progress} size="sm" color="blue" />
              )}
            </div>
          ) : (
            <>
              <IoCloudUploadOutline className="me-2 h-5 w-5" />
              Upload Slides
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

export default UploadSlide;
