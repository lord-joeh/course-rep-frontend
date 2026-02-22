import {
  Button,
  Card,
  Checkbox,
  Label,
  Spinner,
  TextInput,
} from "flowbite-react";
import { useEffect, useState } from "react";
import { IoIosSave } from "react-icons/io";
import { TbLockPassword } from "react-icons/tb";
import { ToastInterface } from "../../utils/Interfaces";
import { isAxiosError } from "axios";
import { changePassword } from "../../services/authService";
import ToastMessage from "../common/ToastMessage";
import useAuth from "../../hooks/useAuth";

interface passwordData {
  student_id: string | null;
  currentPassword: string;
  newPassword: string;
}

export default function ChangePassword() {
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [changeData, setChangeData] = useState<passwordData>({
    currentPassword: "",
    newPassword: "",
    student_id: "",
  });
  const [toast, setToast] = useState<ToastInterface>({
    message: "",
    type: "error",
    isVisible: false,
  });
  const { user } = useAuth();

  const closeToast = () => {
    setToast((prev) => ({ ...prev, isVisible: false }));
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setChangeData((prev) => ({ ...prev, [name]: value }));
  };

  const handleShowPassword = (e: React.ChangeEvent<HTMLInputElement>) => {
    setShowPassword(e.target.checked);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    let validationError = "";
    if (!changeData.student_id || changeData.student_id.trim().length < 1) {
      validationError = "Student ID missing, Please login";
    } else if (!changeData.newPassword || changeData.newPassword.length < 8) {
      validationError = "Your new password should be at least 8 characters";
    }

    if (validationError) {
      return setToast((prev) => ({
        ...prev,
        message: validationError,
        type: "error",
        isVisible: true,
      }));
    }

    try {
      setIsLoading(true);
      const response = await changePassword(changeData);
      if (response?.message) {
        setToast((prev) => ({
          ...prev,
          message: response?.message,
          type: "success",
          isVisible: true,
        }));
      } else {
        console.log("Invalid response from server");
      }
    } catch (error: unknown) {
      if (isAxiosError(error)) {
        const errorMessage =
          error.response?.data?.error || "An error occurred changing password";
        setToast((prev) => ({
          ...prev,
          message: errorMessage,
          type: "error",
          isVisible: true,
        }));
      }
    } finally {
      setIsLoading(false);
      setShowPassword(false);
      setChangeData((prev) => ({
        ...prev,
        newPassword: "",
        currentPassword: "",
      }));
    }
  };

  useEffect(() => {
    if (user) {
      setChangeData((prev) => ({ ...prev, student_id: user?.data.id }));
    }
  }, [user]);

  return (
    <div className="flex flex-col gap-2">
      <Card>
        <h2 className="text-lg font-medium">Change Password</h2>
        <form
          className="grid grid-cols-1 items-center gap-4 lg:grid-cols-2 xl:grid-cols-3"
          onSubmit={handleSubmit}
        >
          <div>
            <div className="mb-2 block">
              <Label htmlFor="current-password">Current Password</Label>
            </div>
            <TextInput
              type={showPassword ? "text" : "password"}
              id="current-password"
              className="pass-check sm:text-sm md:text-base"
              placeholder="Current Password"
              name="currentPassword"
              required
              value={changeData.currentPassword}
              onChange={handleChange}
              disabled={isLoading}
              icon={TbLockPassword}
            />
          </div>

          <div>
            <div className="mb-2 block">
              <Label htmlFor="new-password">New Password</Label>
            </div>
            <TextInput
              type={showPassword ? "text" : "password"}
              id="new-password"
              className="pass-check sm:text-sm md:text-base"
              placeholder="New Password"
              name="newPassword"
              required
              value={changeData.newPassword}
              onChange={handleChange}
              disabled={isLoading}
              icon={TbLockPassword}
            />
          </div>

          <Button
            type="submit"
            id="change-Button"
            disabled={isLoading || changeData.newPassword.length < 8}
            className="mt-7 cursor-pointer border-none text-lg"
          >
            {isLoading && <Spinner size="md" className="me-4" color="white" />}
            <IoIosSave className="me-2 h-4 w-4" />
            Save
          </Button>
        </form>
        <div className="flex items-center gap-2">
          <Checkbox
            id="show_password"
            onChange={handleShowPassword}
            checked={showPassword}
          />
          <Label htmlFor="show_Password">Show password</Label>
        </div>
      </Card>

      {toast.isVisible && (
        <ToastMessage
          message={toast.message}
          type={toast.type}
          onClose={closeToast}
        />
      )}
    </div>
  );
}
