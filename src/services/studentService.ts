import api from "../utils/api";

export const getStudents = async (page: number, limit: number) => {
  const response = await api.get(`/api/students/?page=${page}&limit=${limit}`);
  if (!response?.data) throw new Error("Failed fetching students ");
  return response.data;
};

export const deleteStudent = async (studentId: string) => {
  const response = await api.delete(`/api/students/${studentId}`);
  if (!response?.data) throw new Error("Failed deleting student ");
  return response.data;
};

export const registerStudent = async (registrationData: object) => {
  const response = await api.post("/api/students/", registrationData);
  if (!response.data) throw new Error("Registration failed");
  return response.data;
};

export const studentById = async (studentId: string) => {
  const response = await api.get(`/api/students/${studentId}`);
  if (!response?.data) throw new Error("Failed fetching student ");
  return response.data;
};

export const updateStudent = async (studentId: string, payload: object) => {
  const response = await api.put(`/api/students/${studentId}`, payload);
  if (!response.data) throw new Error("Failed updating student details");
  return response.data;
};
