import api from "../utils/api";

type fetchType = {
  page: number;
  limit: number;
  studentId: string;
};

type locationType = { latitude: number; longitude: number };

import {
  AddNewAttendanceInstanceInterface,
  AttendanceFilterInterface,
} from "../utils/Interfaces";

export const addAttendanceInstance = async (
  data: AddNewAttendanceInstanceInterface,
) => {
  const response = await api.post(`/api/attendance/initialize`, data);
  return response?.data;
};

export const getAttendanceInstances = async (
  data: AttendanceFilterInterface,
) => {
  const response = await api.get(
    `/api/attendance/?page=${data.page}&limit=${data.limit}&courseId=${data.courseId}&date=${data.date}&classType=${data.class_type}`,
  );
  return response?.data;
};

export const deleteAttendanceInstance = async (id: string) => {
  const response = await api.delete(`/api/attendance/instance/${id}`);
  return response?.data;
};

export const getAttendanceInstanceById = async (
  id: string,
  data: fetchType,
) => {
  const response = await api.get(
    `/api/attendance/${id}?page=${data?.page}&limit=${data?.limit}&studentId=${data?.studentId}`,
  );
  return response?.data;
};

export const closeAttendanceInstance = async (id: string) => {
  const response = await api.post(`/api/attendance/close?instanceId=${id}`);
  return response?.data;
};

export const markAttendance = async (
  studentId: string,
  attendanceId: string,
) => {
  const response = await api.put(
    `/api/attendance/mark?attendanceId=${attendanceId}&studentId=${studentId}`,
  );
  return response?.data;
};

export const deleteAttendance = async (id: string) => {
  const response = await api.delete(`/api/attendance/${id}`);
  return response?.data;
};

export const autoMarkAttendance = async (
  studentId: string,
  token: string,
  location: locationType,
) => {
  const response = await api.post(
    `/api/attendance/auto/mark?studentId=${studentId}&token=${token}`,
    location,
  );
  return response?.data;
};
