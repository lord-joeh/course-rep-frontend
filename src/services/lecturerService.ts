import api from "../utils/api";

type formaDataType = {
  name: string;
  email: string;
  phone: string;
};

export const getLecturers = async () => {
  const response = await api.get(`/lecturers/`);
  if (!response?.data) throw new Error("Failed fetching lecturers");
  return response.data;
};

export const deleteLecturers = async (id: string) => {
  const response = await api.delete(`/lecturers/${id}`);
  if (!response?.data) throw new Error("Failed deleting lecturer");
  return response.data;
};

export const addLecturer = async (formData: formaDataType) => {
  const response = await api.post(`/lecturers/`, formData);
  if (!response?.data) throw new Error("Failed adding lecturer");
  return response.data;
};

export const updateLecturer = async (id: string, formData: formaDataType) => {
  const response = await api.put(`/lecturers/${id}`, formData);
  if (!response?.data) throw new Error("Failed updating lecturer");
  return response.data;
};
