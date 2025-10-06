import React, { useState } from "react";
import { GroupInterface, ToastInterface, Course } from "./Groups";
import { TextInput, Label, Checkbox, Button } from "flowbite-react";
import { FaMagic } from "react-icons/fa";
import { addGroup } from "../../../services/groupsService";
import { isAxiosError } from "axios";
import ToastMessage from "../../common/ToastMessage";

interface AddNewGroupProps {
  courses?: Course[];
  onSuccess?: (message?: string) => void;
}

const AddNewGroup: React.FC<AddNewGroupProps> = ({ courses = [], onSuccess }) => {
  const [formData, setFormData] = useState<GroupInterface>({
    id: "",
    name: "",
    courseId: "",
    isGeneral: false,
    description: "",
    Course: {name: ""}
  });
  const [loading, setLoading] = useState<boolean>(false);
  const [toast, setToast] = useState<ToastInterface>({
    message: "",
    type: "error",
    isVisible: false,
  });

  const showToast = (message: string, type: "success" | "error") =>
    setToast({ message, type, isVisible: true });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    const { name, value } = e.target as HTMLInputElement | HTMLSelectElement;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (formData.name.length < 1 || !formData.description)
      return showToast(
        "Make sure your Group name and description field is not blank",
        "error",
      );

    try {
      setLoading(true);
      const response = await addGroup(formData);
      const successMessage =
        response?.data?.message || "Group created successfully";
      showToast(successMessage, "success");
      if (typeof onSuccess === "function") onSuccess(successMessage);
    } catch (err) {
      if (isAxiosError(err)) {
        showToast(
          err.response?.data?.error || "Failed to create group.",
          "error",
        );
      } else {
        showToast(
          "An unexpected error occurred while creating group.",
          "error",
        );
      }
    } finally {
      setFormData((prev) => ({
        ...prev,
        name: "",
        description: "",
        courseId: "",
        isGeneral: false,
      }));
      setLoading(false);
    }
  };

  return (
    <div className="container flex flex-col justify-center gap-6 p-6 font-sans md:p-1">
      <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
        {" "}
        Add New Group
      </h1>

      <form onSubmit={handleSubmit}>
        <div className="mt-2 block">
          <Label htmlFor="name">Name</Label>
          <TextInput
            id="name"
            name="name"
            value={formData.name}
            placeholder="Group Name..."
            required
            onChange={handleChange}
          />
        </div>

        <div className="mt-2 block">
          <Label htmlFor="name">Description</Label>
          <TextInput
            id="description"
            name="description"
            value={formData.description}
            placeholder="Group Description..."
            required
            onChange={handleChange}
          />
        </div>

        <div className="mt-2 flex items-center gap-2">
          <Label htmlFor="entries">Select course to create group</Label>
          <select
            id="entries"
            className="rounded text-gray-900 dark:text-white"
            value={formData.courseId}
            onChange={handleChange}
            name="courseId"
            disabled={formData.isGeneral}
          >
            <option value="" disabled>
              Select Course
            </option>
            {courses?.map((c: Course) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        <div className="mt-4 flex items-center gap-2">
          <Checkbox
            id="isGeneral"
            name="isGeneral"
            checked={formData.isGeneral}
            onChange={(e) => {
              setFormData((prev) => ({
                ...prev,
                isGeneral: e.target.checked,
              }));
            }}
          />
          <Label htmlFor="isGeneral">General Group</Label>
        </div>

        <Button
          type="submit"
          className="mt-4 flex w-70 justify-center place-self-center"
          disabled={loading}
        >
          <FaMagic className="me-2 h-4 w-4" />
          {loading ? "Creating..." : " Create"}
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

export default AddNewGroup;
