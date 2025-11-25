import api from "../utils/api";

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
