import axios from "axios";
import {
  Modal,
  ModalHeader,
  ModalBody,
  Button,
  Spinner,
  Textarea,
  Radio,
  Label,
} from "flowbite-react";
import React, { useEffect, useState } from "react";
import ToastMessage from "./ToastMessage";
import { sendMessageToStudent } from "../../services/notificationServices";

interface MessageProp {
  isOpen: boolean;
  studentId: string;
  onClose: () => void;
}

interface MessageInterface {
  message: string;
  messageType: "SMS" | "email";
}

const MessageToStudentModal = ({ isOpen, studentId, onClose }: MessageProp) => {
  const [isSending, setSending] = useState<boolean>(false);
  const [messageData, setMessageData] = useState<MessageInterface>({
    message: "",
    messageType: "SMS",
  });
  const [toast, setToast] = useState<{
    message: string;
    type: "error" | "success";
    isVisible: boolean;
  }>({
    message: "",
    type: "error",
    isVisible: false,
  });

  useEffect(() => {
    if (isOpen) {
      setMessageData({
        message: "",
        messageType: "SMS",
      });
    }
  }, [isOpen]);

  const handleSend = async () => {
    if (!messageData.message || messageData.message.trim().length === 0) {
      setToast({
        message: "Message content cannot be empty.",
        type: "error",
        isVisible: true,
      });
      return;
    }
    if (!messageData.messageType) {
      setToast({
        message: "You must select a message type (SMS or Email).",
        type: "error",
        isVisible: true,
      });
      return;
    }
    if (!studentId) {
      setToast({
        message: "Student ID is required to send the message.",
        type: "error",
        isVisible: true,
      });
      return;
    }

    try {
      setSending(true);
      const response = await sendMessageToStudent({
        ...messageData,
        studentId,
      });

      setToast({
        message: response?.message || "Message sent successfully!",
        type: "success",
        isVisible: true,
      });

      onClose();
    } catch (error) {
      if (axios.isAxiosError(error)) {
        setToast({
          message: error.response?.data?.error || "Failed to send message.",
          type: "error",
          isVisible: true,
        });
      } else {
        setToast({
          message: "An unexpected error occurred while sending the message.",
          type: "error",
          isVisible: true,
        });
      }
    } finally {
      setSending(false);
    }
  };

  const handleMessageChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setMessageData((prev) => ({
      ...prev,
      message: e.target.value,
    }));
  };

  const handleTypeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setMessageData((prev) => ({
      ...prev,
      messageType: e.target.value as "SMS" | "email",
    }));
  };

  const closeToast = () => {
    setToast((prev) => ({ ...prev, isVisible: false }));
  };

  return (
    <>
      <Modal show={isOpen} size="md" onClose={onClose} popup>
        <ModalHeader />
        <ModalBody>
          <div className="space-y-6">
            <h3 className="text-xl font-medium text-gray-900 dark:text-white">
              Send Message
            </h3>
            <div>
              <div className="mb-2 block">
                <Label htmlFor="message">Message</Label>
              </div>
              <Textarea
                id="message"
                name="message"
                value={messageData.message}
                placeholder="Message..."
                required
                onChange={handleMessageChange}
              />
            </div>
            <div className="flex max-w-md gap-4">
              <div className="flex items-center gap-2">
                <Radio
                  id="sms"
                  name="messageType"
                  value="SMS"
                  checked={messageData.messageType === "SMS"}
                  onChange={handleTypeChange}
                />
                <Label htmlFor="sms">SMS</Label>
              </div>
              <div className="flex items-center gap-2">
                <Radio
                  id="email"
                  name="messageType"
                  value="email"
                  checked={messageData.messageType === "email"}
                  onChange={handleTypeChange}
                />
                <Label htmlFor="email">Email</Label>
              </div>
            </div>
            <div className="flex justify-center gap-4">
              <Button onClick={handleSend} disabled={isSending}>
                {isSending && <Spinner size="sm" className="me-2" />}
                Send Message
              </Button>
              <Button color="alternative" onClick={onClose}>
                Cancel
              </Button>
            </div>
          </div>
        </ModalBody>
      </Modal>

      {toast.isVisible && (
        <ToastMessage
          message={toast.message}
          type={toast.type}
          onClose={closeToast}
        />
      )}
    </>
  );
};

export default MessageToStudentModal;
