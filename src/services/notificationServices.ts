import api from "../utils/api";

export interface MessageInterface {
  message: string;
  studentId: string;
  messageType: "SMS" | "email";
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  createdAt: string;
  isRead: boolean;
}

export interface NotificationPayload {
  title: string;
  message: string;
}

export const sendMessageToStudent = async (messageData: MessageInterface) => {
  const response = await api.post("/api/notifications/send", messageData);
  if (!response.data) throw new Error("Failed sending message");
  return response.data;
};

export const getNotifications = async (page = 1, limit = 5) => {
  const response = await api.get(
    `/api/notifications/?page=${page}&limit=${limit}`,
  );
  return response.data; 
};

export const markAsRead = async (id: string) => {
  const response = await api.patch(`/api/notifications/${id}/read`);
  return response.data;
};

export const markAllAsRead = async () => {
  const response = await api.patch(`/api/notifications/read-all`);
  return response.data;
};
export const addNotification = async (data: NotificationPayload) => {
  const response = await api.post("/api/notifications", data);
  return response.data;
};

export const updateNotification = async (
  id: string,
  data: NotificationPayload,
) => {
  const response = await api.put(`/api/notifications/${id}`, data);
  return response.data;
};

export const deleteNotification = async (id: string) => {
  const response = await api.delete(`/api/notifications/${id}`);
  return response.data;
};
