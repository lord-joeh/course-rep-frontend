import api from "../utils/api";

export const getFeedbacks = async (page: number, limit: number) => {
  const response = await api.get(`/feedbacks/?page=${page}&limit=${limit}`);
  if (!response?.data) throw new Error("Failed fetching feedbacks");
  return response.data;
};

