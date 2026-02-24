import React, { useEffect, useState } from "react";
import { Label, TextInput, Button, Select } from "flowbite-react";
import {
  Course,
  GroupEditInterface,
  GroupInterface,
  ToastInterface,
} from "../../../utils/Interfaces";
import { updateGroup } from "../../../services/groupsService";
import { isAxiosError } from "axios";
import ToastMessage from "../../common/ToastMessage";

const EditGroup = ({
  coursesList,
  closeEditModal,
  selectedGroup,
  onSuccess,
}: GroupEditInterface) => {
  const [editForm, setEditForm] = useState<Partial<GroupInterface>>({});

  const [toast, setToast] = useState<ToastInterface>({
    message: "",
    type: "error",
    isVisible: false,
  });

  const showToast = (message: string, type: "success" | "error") =>
    setToast({ message, type, isVisible: true });

  const closeToast = () => {
    setToast((prev) => ({ ...prev, isVisible: false }));
  };

  const handleEditChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    const { name, value } = e.target as HTMLInputElement | HTMLSelectElement;
    setEditForm((prev) => ({ ...prev, [name]: value }));
  };

  const submitEdit = async () => {
    if (!editForm?.id) return showToast("Invalid group selected", "error");
    try {
      const response = await updateGroup(editForm.id, {
        name: editForm.name,
        courseId: editForm.courseId,
        description: editForm.description,
      });
      const successMessage =
        response?.data?.message || "Group updated successfully";
      showToast(successMessage, "success");
      if (typeof onSuccess === "function") onSuccess(successMessage);
    } catch (error) {
      if (isAxiosError(error)) {
        showToast(
          error.response?.data?.error || "Error updating group",
          "error",
        );
      } else showToast("An unexpected error occurred.", "error");
    }
  };

  useEffect(() => {
    if (selectedGroup) {
      setEditForm((prev) => ({
        ...prev,
        id: selectedGroup?.id,
        courseId: selectedGroup?.courseId,
        name: selectedGroup?.name,
        description: selectedGroup?.description,
        isGeneral: selectedGroup?.isGeneral,
      }));
    }
  }, []);
  return (
    <>
      <div className="p-4">
        <h2 className="mb-4 text-2xl font-bold">Edit Group</h2>
        <div className="flex flex-col gap-3">
          <Label htmlFor="edit-name">Name</Label>
          <TextInput
            id="edit-name"
            name="name"
            value={editForm?.name || ""}
            onChange={handleEditChange}
            className="rounded"
          />

          <Label htmlFor="edit-description">Description</Label>
          <TextInput
            id="edit-description"
            name="description"
            value={editForm?.description || ""}
            onChange={handleEditChange}
            className="rounded"
          />

          <Label htmlFor="edit-course">Course</Label>
          <Select
            id="edit-course"
            name="courseId"
            value={editForm?.courseId || ""}
            onChange={handleEditChange}
            className="rounded text-gray-900 dark:text-white"
          >
            <option value="">General</option>
            {coursesList?.map((c: Course) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </Select>

          <div className="mt-3 flex grow justify-center gap-2">
            <Button onClick={closeEditModal} className="w-40 focus:border-none">
              Cancel
            </Button>
            <Button color="green" outline onClick={submitEdit} className="w-50">
              Save
            </Button>
          </div>
        </div>
      </div>

      {toast.isVisible && (
        <ToastMessage
          message={toast.message}
          type={toast.type}
          onClose={closeToast}
        />
      )}
    </>
  );
};

export default EditGroup;
