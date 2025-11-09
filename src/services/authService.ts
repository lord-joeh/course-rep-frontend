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

export const loginStudent = async ({
  studentId,
  password,
}: loginStudentArgs) => {
  const response = await api.post("/api/auth/login", { studentId, password });
  if (!response.data?.token) {
    throw new Error("Login failed");
  }
  const results = response.data;
  return {
    ...response.data,
    isRep: results.data.isRep,
    token: results.token,
    name: results.data.name,
  };
};

export const forgotPassword = async (forgotDetails: object) => {
  const response = await api.post("/api/auth/forgot", forgotDetails);
  if (!response.data) throw new Error("Failed requesting password reset");
  return response.data;
};

export const resetPassword = async (resetData: ResetInterface) => {
  const response = await api.post(
    `/api/auth/reset?token=${resetData?.token}`,
    resetData,
  );
  if (!response.data) throw new Error("Failed resetting password");
  return response.data;
};
