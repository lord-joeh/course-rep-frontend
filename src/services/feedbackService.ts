import api from "../utils/api";
interface Feedback {
  studentId: string;
  content: string;
  is_anonymous: boolean;
}
export const getFeedbacks = async (page: number, limit: number) => {
  const response = await api.get(`/api/feedbacks/?page=${page}&limit=${limit}`);
  if (!response?.data) throw new Error("Failed fetching feedbacks");
  return response.data;
};

export const submitFeedback = async (formData: Feedback) => {
  const response = await api.post(`/api/feedbacks/`, formData);
  if (!response?.data) throw new Error("Failed submitting feedback");
  return response.data;
};

export const deleteFeedback = async (id: string) => {
  const response = await api.delete(`/api/feedbacks/${id}`);
  if (!response?.data) throw new Error("Failed deleting feedback");
  return response.data;
};
