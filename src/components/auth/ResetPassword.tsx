import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { resetPassword } from "../../services/authService";
import axios from "axios";
import ToastMessage from "../common/ToastMessage";
import { TbLockPassword } from "react-icons/tb";
import { LuSendHorizontal } from "react-icons/lu";
import { Button, Label, TextInput, Spinner, Checkbox } from "flowbite-react";

interface ResetInterface {
  token: string | null;
  newPassword: string;
  confirmPassword: string;
}

interface ResetResponse {
  message?: string;
  status: number;
}

const ResetPassword = () => {
  const [resetData, setResetData] = useState<ResetInterface>({
    token: null,
    newPassword: "",
    confirmPassword: "",
  });
  const [isLoading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();
  const [toast, setToast] = useState({
    message: "",
    type: "",
    isVisible: false,
  });

  const closeToast = () => {
    setToast((prev) => ({ ...prev, isVisible: false }));
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setError("");
    setResetData((prev) => ({ ...prev, [name]: value }));
  };

  const handleShowPassword = (e: React.ChangeEvent<HTMLInputElement>) => {
    setShowPassword(e.target.checked);
  };

  useEffect(() => {
    const getTokenFromUrl = () => {
      const queryString = window.location.search;

      const urlParams = new URLSearchParams(queryString);

      const foundToken = urlParams.get("token");

      setResetData((prev) => ({ ...prev, token: foundToken }));
    };

    getTokenFromUrl();
  }, []);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    let validationError = "";
    if (
      !resetData.token ||
      typeof resetData.token !== "string" ||
      resetData.token.trim().length < 1
    ) {
      validationError = "Token not provided";
    } else if (
      !resetData.newPassword ||
      typeof resetData.newPassword !== "string" ||
      resetData.newPassword.length < 8
    ) {
      validationError = "Your password should be at least 8 characters";
    } else if (
      !resetData.confirmPassword ||
      resetData.newPassword !== resetData.confirmPassword
    ) {
      validationError = "Passwords do not match";
    }

    if (validationError) {
      setToast((prev) => ({
        ...prev,
        message: validationError,
        type: "error",
        isVisible: true,
      }));
      return;
    }

    try {
      setLoading(true);
      setError("");
      const response: ResetResponse = await resetPassword(resetData);
      if (response && response.message) {
        const successMessage = `${response.message}. Redirecting to Login`;
        setToast((prev) => ({
          ...prev,
          message: successMessage,
          type: "success",
          isVisible: true,
        }));
        setResetData((prev) => ({
          ...prev,
          newPassword: "",
          confirmPassword: "",
        }));
        setTimeout(() => {
          navigate("/");
        }, 3000);
        return;
      } else {
        throw new Error("Invalid response from server");
      }
    } catch (error: unknown) {
      if (axios.isAxiosError(error)) {
        const errorMessage =
          error.response?.data?.error ||
          "An error occurred during password reset";
        setToast((prev) => ({
          ...prev,
          message: errorMessage,
          type: "error",
          isVisible: true,
        }));
      } else {
        setToast((prev) => ({
          ...prev,
          message: "Password Reset failed. Please try again.",
          type: "error",
          isVisible: true,
        }));
      }
    } finally {
      setLoading(false);
    }
  };
  return (
    <div className="border[#4b648d] flex min-h-fit w-95 flex-col justify-evenly rounded-xl bg-[#415a77] px-4 shadow-2xl">
      <form className="mt-4 flex flex-col gap-4" onSubmit={handleSubmit}>
        <div>
          <div className="md-4 block">
            <Label htmlFor="password">New Password</Label>
          </div>
          <TextInput
            type={showPassword ? "text" : "password"}
            id="password"
            className="pass-check sm:text-sm md:text-base"
            placeholder="New Password"
            name="newPassword"
            required
            value={resetData.newPassword}
            onChange={handleChange}
            disabled={isLoading}
            icon={TbLockPassword}
          />
        </div>
        <div>
          <div className="md-4 block">
            <Label htmlFor="confirm-password">Confirm Password</Label>
          </div>
          <TextInput
            type={showPassword ? "text" : "password"}
            id="confirm-password"
            className="pass-check sm:text-sm md:text-base"
            placeholder="Confirm New Password"
            name="confirmPassword"
            required
            value={resetData.confirmPassword}
            onChange={handleChange}
            disabled={isLoading}
            icon={TbLockPassword}
          />
        </div>
        <div className="flex items-center gap-2">
          <Checkbox id="show_password" onChange={handleShowPassword} />
          <Label htmlFor="show_Password">Show password</Label>
        </div>
        <Button
          type="submit"
          id="register-Button"
          disabled={isLoading}
          className="mb-4 cursor-pointer border-none text-lg"
        >
          {isLoading && <Spinner size="md" className="me-4" color="warning" />}
          <LuSendHorizontal className="me-2 h-4 w-4" />
          Submit
        </Button>
      </form>
      {toast.isVisible && !error && (
        <ToastMessage
          message={toast.message}
          type={toast.type}
          onClose={closeToast}
        />
      )}
    </div>
  );
};

export default ResetPassword;
