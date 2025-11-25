import api from "../utils/api";

export const uploadSlides = async (formData: FormData) => {
  const response = await api.postForm(`/api/slides/upload`, formData);
  return await response?.data;
};

export const getSlidesByCourse = async (
  courseId: string,
  limit: number,
  page: number,
) => {
  const response = await api.get(
    `/api/slides/?courseId=${courseId}&limit=${limit}&page=${page}`,
  );
  return response.data;
};

export const deleteSlide = async (slideId: string) => {
  const response = await api.delete(`/api/slides/${slideId}/delete`);
  return response.data;
};

export const downloadSlide = async (id: string) => {
  return await api.get(`/api/google/download?fileId=${id}`, {
    responseType: "blob",
  });
};
