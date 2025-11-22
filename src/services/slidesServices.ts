import api from "../utils/api";

export const uploadSlides = async (formData: FormData) => {
  const courseId = formData.get("courseId") as string;
  const folderId = formData.get("folderId") as string;
  
  const response = await api.postForm(
    `/api/slides/upload?courseId=${courseId}&folderId=${folderId}`,
  );
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
