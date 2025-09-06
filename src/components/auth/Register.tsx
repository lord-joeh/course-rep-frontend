import { useNavigate } from "react-router-dom";
import React, { useState } from "react";
import axios from "axios";
import { registerStudent } from "../../services/studentService";
import { Button, Label, TextInput, Spinner, Checkbox } from "flowbite-react";
import { HiUser, HiMiniIdentification } from "react-icons/hi2";
import { FaPhone } from "react-icons/fa6";
import { MdEmail } from "react-icons/md";
import { TbLockPassword } from "react-icons/tb";
import { LuSendHorizontal } from "react-icons/lu";

const Register = () => {
  const [registerData, setRegisterData] = useState({
    id: "",
    name: "",
    phone: "",
    email: "",
    password: "",
    confirmPassword: "",
    isRep: false,
  });
  const [isLoading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setError("");
    setRegisterData((prev) => ({ ...prev, [name]: value }));
  };

  const mainPass = document.querySelector("#password");
  const confirmPass = document.querySelector("#confirm-password");
  const handleShowPassword = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      mainPass?.setAttribute("type", "text");
      confirmPass?.setAttribute("type", "text");
    } else {
      mainPass?.setAttribute("type", "password");
      confirmPass?.setAttribute("type", "password");
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    let validationError = "";
    if (!registerData.id || registerData.id.length < 1) {
      validationError = "Your student ID is required for registration";
    } else if (!registerData.name || registerData.name.length < 1) {
      validationError = "Your full name is required for registration";
    } else if (!registerData.phone || registerData.phone.length < 1) {
      validationError = "Your phone number is required for registration";
    } else if (!registerData.email || registerData.email.length < 1) {
      validationError = "Your email address is required for registration";
    } else if (!registerData.password || registerData.password.length < 8) {
      validationError = "Your password should be at least 8 characters";
    } else if (registerData.password !== registerData.confirmPassword) {
      validationError = "Passwords do not match. Please try again.";
    }

    if (validationError) {
      setError(validationError);
      return;
    }
    setLoading(true);
    setError("");
    try {
      const response = await registerStudent(registerData);

      if (response) {
        navigate("/");
      }
    } catch (error: unknown) {
      if (axios.isAxiosError(error)) {
        setError(
          error.response?.data?.error ||
            "Registration failed. Please try again.",
        );
      } else {
        setError("An unknown error occurred");
        setRegisterData((prev) => ({ ...prev, password: "" }));
      }
    } finally {
      setLoading(false);
      setRegisterData({
        id: "",
        name: "",
        phone: "",
        email: "",
        password: "",
        confirmPassword: "",
        isRep: false,
      });
    }
  };
  return (
    <div className="border[#4b648d] flex min-h-100 w-95 flex-col justify-evenly rounded-xl bg-[#415a77] px-4 shadow-2xl">
      <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
        <div>
          <div className="md-4 mt-2 block">
            <Label htmlFor="studentId">Student ID</Label>
          </div>
          <TextInput
            type="text"
            id="studentId"
            placeholder="Student ID"
            name="id"
            required
            value={registerData.id}
            onChange={handleChange}
            disabled={isLoading}
            icon={HiUser}
            className="sm:text-sm md:text-base"
          />
        </div>
        <div>
          <div className="md-4 block">
            <Label htmlFor="name">Name</Label>
          </div>
          <TextInput
            type="text"
            id="name"
            placeholder="Full Name"
            name="name"
            required
            value={registerData.name}
            onChange={handleChange}
            disabled={isLoading}
            icon={HiMiniIdentification}
            className="sm:text-sm md:text-base"
          />
        </div>
        <div>
          <div className="md-4 block">
            <Label htmlFor="phone">Phone Number</Label>
          </div>
          <TextInput
            type="text"
            id="phone"
            placeholder="0245678390"
            name="phone"
            required
            value={registerData.phone}
            onChange={handleChange}
            disabled={isLoading}
            icon={FaPhone}
            className="sm:text-sm md:text-base"
          />
        </div>
        <div>
          <div className="md-4 block">
            <Label htmlFor="email">Email</Label>
          </div>
          <TextInput
            type="email"
            id="email"
            placeholder="account@example.com"
            name="email"
            required
            value={registerData.email}
            onChange={handleChange}
            disabled={isLoading}
            icon={MdEmail}
            className="sm:text-sm md:text-base"
          />
        </div>
        <div>
          <div className="md-4 block">
            <Label htmlFor="password">Password</Label>
          </div>
          <TextInput
            type="password"
            id="password"
            className="pass-check sm:text-sm md:text-base"
            placeholder="Password"
            name="password"
            required
            value={registerData.password}
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
            type="password"
            id="confirm-password"
            className="pass-check sm:text-sm md:text-base"
            placeholder="Confirm Password"
            name="confirmPassword"
            required
            value={registerData.confirmPassword}
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
          className="hover:t mb-4 cursor-pointer border-none text-lg"
        >
          {isLoading && <Spinner size="md" className="me-4" color="warning" />}
          <LuSendHorizontal className="me-2 h-4 w-4" />
          Register
        </Button>
      </form>
      {error && <p className="text-center text-red-700">{error}</p>}
      <div className="mb-4 flex justify-center text-white sm:text-sm md:text-base">
        <small>
          Already have an Account?
          <span>
            {" "}
            <a href="/" className="text-[#03045e] hover:text-blue-300">
              Login Here
            </a>
          </span>{" "}
        </small>
      </div>
    </div>
  );
};

export default Register;
