import api from "../utils/api";

type formaDataType = {
  name: string;
  email: string;
  phone: string;
};

export const getLecturers = async () => {
  const response = await api.get(`/api/lecturers/`);
  if (!response?.data?.success)
    throw new Error(response?.data?.message || "Failed fetching lecturers");
  return response.data;
};

export const deleteLecturers = async (id: string) => {
  const response = await api.delete(`/api/lecturers/${id}`);
  if (!response?.data) throw new Error("Failed deleting lecturer");
  return response.data;
};

export const addLecturer = async (formData: formaDataType) => {
  const response = await api.post(`/api/lecturers/`, formData);
  if (!response?.data) throw new Error("Failed adding lecturer");
  return response.data;
};

export const updateLecturer = async (id: string, formData: formaDataType) => {
  const response = await api.put(`/api/lecturers/${id}`, formData);
  if (!response?.data) throw new Error("Failed updating lecturer");
  return response.data;
};
