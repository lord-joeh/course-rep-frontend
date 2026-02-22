import React, { useState } from "react";
import { Button, Label, TextInput, Spinner, Checkbox } from "flowbite-react";
import { HiUser } from "react-icons/hi2";
import { TbLockPassword } from "react-icons/tb";
import { loginStudent } from "../../services/authService.ts";
import { FaTelegramPlane } from "react-icons/fa";
import axios from "axios";
import useAuth from "../../hooks/useAuth.ts";

const Login = () => {
  const [loginData, setLoginData] = useState({
    studentId: "",
    password: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { login } = useAuth();

  const handleShowPassword = (e: React.ChangeEvent<HTMLInputElement>) => {
    setShowPassword(e.target.checked);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setError("");
    const { name, value } = e.target;
    setLoginData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!loginData.studentId) return setError("Please provide your student ID");

    if (!loginData.password) return setError("Your password is needed");

    try {
      setIsLoading(true);
      setError("");
      const response = await loginStudent(loginData);
      login(response);
    } catch (error: unknown) {
      if (axios.isAxiosError(error)) {
        setError(error.response?.data.error);
      } else {
        setError("An unknown error occurred");
      }
    } finally {
      setLoginData((prev) => ({ ...prev, password: "" }));
      setIsLoading(false);
    }
  };

  return (
    <div className="border[#4b648d] flex h-100 w-95 flex-col justify-evenly rounded-xl bg-[#415a77] px-4 shadow-2xl">
      <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
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
            value={loginData.studentId}
            className="sm:text-sm md:text-base"
          />
        </div>
        <div>
          <div className="mb-4 block">
            <Label htmlFor="studentPassword">Password</Label>
          </div>
          <TextInput
            type={showPassword ? "text" : "password"}
            id="studentPassword"
            name="password"
            placeholder="Password"
            required
            icon={TbLockPassword}
            onChange={handleChange}
            disabled={isLoading}
            value={loginData.password}
            className="sm:text-sm md:text-base"
          />
        </div>
        <div className="flex items-center gap-2">
          <Checkbox
            id="show_password"
            onChange={handleShowPassword}
            checked={showPassword}
          />
          <Label htmlFor="show_Password">Show password</Label>
        </div>
        <Button
          type="submit"
          id="login-Button"
          disabled={isLoading}
          className="hover:t cursor-pointer border-none text-lg"
        >
          {isLoading && <Spinner size="md" className="me-4" color="gray" />}
          <FaTelegramPlane className="me-2 h-4 w-4" />
          Login
        </Button>
      </form>
      {error && <p className="text-center text-red-500">{error}</p>}
      <hr />
      <div className="flex justify-between text-white">
        <a
          href="/forgot-password"
          className="dark:text-primary-500 text-sm hover:underline"
        >
          Lost Password?
        </a>
        <a
          href="/register"
          className="dark:text-primary-500 text-sm hover:underline"
        >
          Not registered?
        </a>
      </div>
    </div>
  );
};

export default Login;
