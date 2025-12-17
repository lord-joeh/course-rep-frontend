import api from "../utils/api";
import { AddNewAttendanceInstanceInterface } from "../utils/Interfaces";

export const addAttendanceInstance = async (
  data: AddNewAttendanceInstanceInterface,
) => {
  const response = await api.post(`/api/attendance/initialize`, data);
  return response?.data;
};
