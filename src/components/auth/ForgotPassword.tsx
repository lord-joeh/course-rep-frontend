import React, { useState } from "react";
import { forgotPassword } from "../../services/authService";
import axios from "axios";
import { Button, TextInput, Spinner, Label } from "flowbite-react";
import { HiUser } from "react-icons/hi2";
import { FaTelegramPlane } from "react-icons/fa";
import ToastMessage from "../common/ToastMessage";
import { ToastInterface } from "../../utils/Interfaces.ts";

const ForgotPassword = () => {
  const [student, setStudent] = useState({ studentId: "" });
  const [isLoading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<ToastInterface>({
    message: "",
    type: "error",
    isVisible: false,
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setError("");
    setStudent((prev) => ({ ...prev, [name]: value }));
  };

  const closeToast = () => {
    setToast((prev) => ({ ...prev, isVisible: false }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!student.studentId || student.studentId.length < 1) {
      setError("Student ID is required for password reset");
      return;
    }

    try {
      setLoading(true)
      const response = await forgotPassword(student);
      if (!response)
        setError("Password reset request failed. Please try again");
      if (response && response.message) {
        setToast((prev) => ({
          ...prev,
          message: response.message,
          type: "success",
          isVisible: true,
        }));
        return;
      }
    } catch (error) {
      if (axios.isAxiosError(error)) {
        setToast((prev) => ({
          ...prev,
          message:  error.response?.data?.error ,
          type: "error",
          isVisible: true,
        }));
      } else {
        setError("An unexpected error occurred.");
      }
    } finally {
      setStudent((prev) => ({ ...prev, studentId: "" }));
      setLoading(false);
    }
  };

  return (
    <div className="border[#4b648d] flex h-fit w-95 flex-col justify-evenly rounded-xl bg-[#415a77] px-4 shadow-2xl">
      <form className="mt-2 flex flex-col gap-4" onSubmit={handleSubmit}>
        <div>
          <div className="mb-4 block">
            <Label htmlFor="studentId">Student ID</Label>
          </div>
          <TextInput
            type="text"
            id="studentId"
            name="studentId"
            placeholder="Student ID"
            required
            autoFocus
            icon={HiUser}
            onChange={handleChange}
            disabled={isLoading}
            value={student.studentId}
            className="sm:text-sm md:text-base"
          />
        </div>
        <Button
          type="submit"
          id="login-Button"
          disabled={isLoading}
          className="hover:t mb-4 cursor-pointer text-lg"
        >
          {isLoading && <Spinner size="md" className="me-4" color="warning" />}
          <FaTelegramPlane className="me-2 h-4 w-4" />
          Submit
        </Button>
      </form>
      {toast.isVisible && (
        <ToastMessage
          message={toast.message}
          type={toast.type}
          onClose={closeToast}
        />
      )}
      {error && (
        <ToastMessage message={error} type="error" onClose={closeToast} />
      )}
    </div>
  );
};

export default ForgotPassword;
