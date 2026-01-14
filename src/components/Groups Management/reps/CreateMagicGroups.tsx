import React, { useState } from "react";
import { Label, TextInput, Button, Checkbox, Select } from "flowbite-react";
import { FaMagic } from "react-icons/fa";
import {
  MagicInterface,
  ToastInterface,
  Course,
  MagicGroupsProp,
} from "../../../utils/Interfaces";
import { isAxiosError } from "axios";
import { createMagicGroups } from "../../../services/groupsService";
import ToastMessage from "../../common/ToastMessage";

const CreateMagicGroups = ({ coursesList, onSuccess }: MagicGroupsProp) => {
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [magicData, setMagicData] = useState<MagicInterface>({
    courseId: "",
    studentsPerGroup: 0,
    isGeneral: false,
  });
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

  const handleMagicSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    try {
      setIsLoading(true);
      const response = await createMagicGroups(magicData);
      const successMessage = response?.message || "Groups created successfully";
      if (typeof onSuccess === "function") onSuccess(successMessage);
    } catch (err) {
      if (isAxiosError(err)) {
        showToast(
          err.response?.data?.error || "Failed to create groups.",
          "error",
        );
      } else {
        showToast(
          "An unexpected error occurred while creating groups.",
          "error",
        );
      }
    } finally {
      setIsLoading(false);
      setMagicData({
        courseId: "",
        studentsPerGroup: 0,
        isGeneral: false,
      });
    }
  };

  return (
    <div className="container">
      <h2 className="mb-4 text-2xl font-bold">Create Magic Groups</h2>
      <form onSubmit={handleMagicSubmit}>
        <div className="flex flex-col gap-3">
          <div className="mt-2 block items-center gap-2">
            <Label htmlFor="courseId">Select course to create groups</Label>
            <Select
              id="courseId"
              className="rounded text-gray-900 dark:text-white"
              value={magicData.courseId}
              onChange={(e) =>
                setMagicData((prev) => ({
                  ...prev,
                  courseId: e.target.value,
                }))
              }
              name="courseId"
              disabled={magicData.isGeneral}
            >
              <option value="" disabled>
                Select Course
              </option>
              {coursesList?.map((c: Course) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </Select>
          </div>

          <div className="mt-2 block">
            <Label htmlFor="studentsPerGroup">
              Number of students Per Group
            </Label>
            <TextInput
              id="studentsPerGroup"
              name="studentsPerGroup"
              type="number"
              value={magicData.studentsPerGroup}
              placeholder="Enter number of students per group"
              required
              onChange={(e) =>
                setMagicData((prev) => ({
                  ...prev,
                  studentsPerGroup: Number.parseInt(e.target.value),
                }))
              }
            />
          </div>

          <div className="mt-4 flex items-center gap-2">
            <Checkbox
              id="isGeneral"
              name="isGeneral"
              checked={magicData.isGeneral}
              onChange={(e) => {
                setMagicData((prev) => ({
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
            disabled={isLoading}
          >
            <FaMagic className="me-2 h-4 w-4" />
            {isLoading ? "Doing Magic..." : "Do Magic"}
          </Button>
        </div>
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

export default CreateMagicGroups;
