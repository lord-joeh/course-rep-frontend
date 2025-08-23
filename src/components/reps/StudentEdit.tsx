import { useState, FormEvent, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, Spinner, Label, TextInput, Button } from "flowbite-react";
import axios from "axios";
import useStudentData from "../../hooks/useStudentData";
import { updateStudent } from "../../services/studentService";
import ToastMessage from "../common/ToastMessage";
import useAuth from "../../hooks/useAuth";

const StudentEdit = () => {
  const { studentId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { studentData, isLoading, error } = useStudentData(studentId);
  const userIsRep = user?.isRep;

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    status: "",
    isRep: false,
  });

  const [toast, setToast] = useState<{
    message: string;
    type: "error" | "success";
    isVisible: boolean;
  }>({
    message: "",
    type: "error",
    isVisible: false,
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (studentData) {
      setFormData({
        name: studentData.name || "",
        email: studentData.email || "",
        phone: studentData.phone || "",
        status: studentData.status || "",
        isRep: studentData.isRep || false,
      });
    }
  }, [studentData]);

  const showToast = (message: string, type: "success" | "error") => {
    setToast({ message, type, isVisible: true });
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    const { name, value, type } = e.target;
    const newValue =
      type === "checkbox" ? (e.target as HTMLInputElement).checked : value;

    setFormData({
      ...formData,
      [name]: newValue,
    });
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!studentId) return;
    try {
      setIsSubmitting(true);
      const response = await updateStudent(studentId, formData);

      showToast(
        response?.data?.message || "Student updated successfully",
        "success",
      );

      setTimeout(() => navigate(-1), 1000);
    } catch (err) {
      if (axios.isAxiosError(err)) {
        showToast(
          err.response?.data?.error || "Failed to update student.",
          "error",
        );
      } else {
        showToast(
          "An unexpected error occurred while updating student.",
          "error",
        );
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <Spinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <Card className="p-4 text-center text-red-500">
        <p>{error}</p>
      </Card>
    );
  }

  return (
    <div className="flex flex-col justify-center gap-5">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
        Edit Student
      </h1>

      <Card>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <Label htmlFor="name">Name</Label>
            <TextInput
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
            />
          </div>

          <div>
            <Label htmlFor="email">Email</Label>
            <TextInput
              id="email"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              required
            />
          </div>

          <div>
            <Label htmlFor="phone">Phone</Label>
            <TextInput
              id="phone"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              required
            />
          </div>
          {userIsRep && (
            <>
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
                <Label htmlFor="isRep">Mark as Rep</Label>
              </div>
            </>
          )}

          <Button type="submit" disabled={isSubmitting} color="blue">
            {isSubmitting ? "Saving..." : "Save Changes"}
          </Button>
        </form>
      </Card>

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

export default StudentEdit;
