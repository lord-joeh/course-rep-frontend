import React from "react";
import { Button, Label } from "flowbite-react";

interface EditStudentProps {
  formData: {
    name: string;
    email: string;
    phone: string;
    status: string;
    isRep: boolean;
  };
  handleChange: (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => void;
  handleUserEdit: (e: React.ChangeEvent<HTMLFormElement>) => void;
  isEditing: boolean;
  onClose: () => void;
  studentData: any;
}

const EditStudent: React.FC<EditStudentProps> = ({
  formData,
  handleChange,
  handleUserEdit,
  isEditing,
  onClose,
  studentData,
}) => {
  return (
    <div className="flex flex-col justify-center gap-5">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
        Edit Student
      </h1>

      <form onSubmit={handleUserEdit} className="flex flex-col gap-4">
          <div>
            <Label htmlFor="status">Status</Label>
            <select
              id="status"
              name="status"
              value={formData.status}
              onChange={handleChange}
              className="w-full rounded-md border p-2 dark:text-white"
              required
            >
              <option value="">Select Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="suspended">Suspended</option>
              <option value="withdrawn">Withdrawn</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <input
              id="isRep"
              name="isRep"
              type="checkbox"
              checked={formData.isRep}
              onChange={handleChange}
              className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <Label htmlFor="isRep">
              {studentData?.isRep ? "Change to student" : "Change to Rep"}
            </Label>
          </div>
        <div className="flex justify-center gap-4">
          <Button type="submit" disabled={isEditing} color="green">
            {isEditing ? "Saving..." : "Save Changes"}
          </Button>

          <Button color="alternative" onClick={onClose}>
            Cancel
          </Button>
        </div>
      </form>
    </div>
  );
};

export default EditStudent;
