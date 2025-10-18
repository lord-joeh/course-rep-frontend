import React, { useState } from "react";
import {
  NewGroupMemberInterface,
  NewGroupMemberProp,
  ToastInterface,
} from "../../../utils/Interfaces";
import { isAxiosError } from "axios";
import { addGroupMember } from "../../../services/groupsService";
import { Button, Label, Spinner, TextInput } from "flowbite-react";
import ToastMessage from "../../common/ToastMessage";
import { HiUserAdd } from "react-icons/hi";

const AddGroupMember = ({ onSuccess, groupId }: NewGroupMemberProp) => {
  const [memberData, setMemberData] = useState<NewGroupMemberInterface>({
    studentId: "",
    groupId: groupId,
  });
  const [isAdding, setAdding] = useState(false);
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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setMemberData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!memberData?.studentId || !memberData?.groupId)
      return showToast("Make sure all the fields are not empty", "error");
    try {
      setAdding(true);
      const response = await addGroupMember(memberData);
      const successMessage =
        response?.data?.message || "Group member added successfully";
      if (typeof onSuccess === "function") onSuccess(successMessage);
    } catch (error) {
      if (isAxiosError(error)) {
        showToast(
          error.response?.data?.error || "Error adding group member",
          "error",
        );
      } else {
        showToast("An unexpected error occurred.", "error");
      }
    } finally {
      setAdding(false);
    }
  };

  return (
    <div className="container flex flex-col gap-5">
      <h1 className="text-xl font-semibold">Add New Group Member</h1>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div>
          <Label htmlFor="groupId">Group ID</Label>
          <TextInput
            type="text"
            id="groupId"
            name="groupId"
            placeholder="Group ID"
            value={groupId}
            disabled={groupId.length > 0}
          />
        </div>

        <div>
          <Label htmlFor="studentId">Student ID</Label>
          <TextInput
            type="text"
            id="studentId"
            name="studentId"
            placeholder="Enter the Student ID of the student you want to add"
            value={memberData?.studentId}
            disabled={isAdding}
            onChange={handleChange}
          />
        </div>

        <Button
          className="w-full cursor-pointer"
          disabled={isAdding}
          type="submit"
        >
          {isAdding && <Spinner size="md" />}
          <HiUserAdd size={24} className="me-2" />
          Add Member
        </Button>
      </form>

      {toast.isVisible && (
        <ToastMessage
          message={toast.message}
          type={toast.type}
          onClose={closeToast}
        />
      )}
    </div>
  );
};

export default AddGroupMember;
