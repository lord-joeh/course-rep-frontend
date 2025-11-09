import api from "../utils/api";
interface MessageInterface {
  message: string;
  studentId: string;
  messageType: "SMS" | "email";
}
export const sendMessageToStudent = async (messageData: MessageInterface) => {
  const response = await api.post("/api/notifications/send", messageData);
  if (!response.data) throw new Error("Failed sending message");
  return response.data;
};
