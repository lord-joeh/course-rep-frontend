import api from "../utils/api.ts";

type loginStudentArgs = {
  studentId: string;
  password: string;
};

interface ResetInterface {
  token: string | null;
  newPassword: string;
  confirmPassword: string;
}

const loginStudent = async ({ studentId, password }: loginStudentArgs) => {
  const response = await api.post("/auth/login", { studentId, password });
  if (!response.data?.token) {
    throw new Error("Login failed");
  }
  const results = response.data;
  return {
    ...response.data,
    isRep: results.data.isRep,
    token: results.token,
    refreshToken: results.refreshToken,
    name: results.data.name,
  };
};

const registerStudent = async (registrationData: object) => {
  const response = await api.post("/student/", registrationData);
  if (!response.data) throw new Error("Registration failed");
  return response.data;
};

const forgotPassword = async (forgotDetails: object) => {
  const response = await api.post("/auth/forgot", forgotDetails);
  if (!response.data) throw new Error("Failed requesting password reset");
  return response.data;
};

const resetPassword = async (resetData: ResetInterface) => {
  const response = await api.post(
    `/auth/reset?token=${resetData?.token}`,
    resetData,
  );
  if (!response.data) throw new Error("Failed resetting password");
  return response.data;
};

export { loginStudent, registerStudent, forgotPassword, resetPassword };
