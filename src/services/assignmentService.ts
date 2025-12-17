import api from "../utils/api";
import type { SubmittedAssignment } from "../utils/Interfaces";

export const uploadNewAssignment = async (formData: FormData) => {
  const response = await api.postForm(`/api/assignments/`, formData);
  return response?.data;
};

export const getAssignmentsByCourse = async (
  courseId: string,
  limit: number,
  page: number,
) => {
  const response = await api.get(
    `/api/assignments/?courseId=${courseId}&limit=${limit}&page=${page}`,
  );
  return response.data;
};

export const submitAssignment = async (submissionData: FormData) => {
  const response = await api.postForm(
    `/api/assignments/upload`,
    submissionData,
  );
  return response?.data;
};

export const getStudentSubmittedAssignment = async (
  id: string,
  page: number,
  limit: number,
) => {
  const response = await api.get(
    `/api/assignments/student/${id}?page=${page}&limit=${limit}`,
  );
  return response?.data;
};

export const getAssignmentDetailsById = async (
  id: string,
  page: number,
  limit: number,
) => {
  const response = await api.get(
    `/api/assignments/${id}?page=${page}&limit=${limit}`,
  );
  return response?.data;
};

export const deleteAssignmentById = async (id: string) => {
  const response = await api.delete(`/api/assignments/${id}`);
  return response?.data;
};

export const deleteSubmittedAssignment = async (data: SubmittedAssignment) => {
  const response = await api.delete(
    `/api/assignments/delete/${data?.id}?studentId=${data?.studentId}&assignmentId=${data?.assignmentId}&submittedAt=${data?.submittedAt}`,
  );
  return response?.data;
};

export const updateAssignmentDetails = async (
  id: string,
  updatedData: FormData,
) => {
  const response = await api.put(`/api/assignments/${id}`, updatedData);
  return response?.data;
};
