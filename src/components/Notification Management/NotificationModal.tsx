import React, { useEffect, useState } from "react";
import {
  Button,
  Label,
  Modal,
  ModalBody,
  ModalHeader,
  TextInput,
  Textarea,
} from "flowbite-react";
import { NotificationPayload } from "../../services/notificationServices";

interface NotificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: NotificationPayload) => Promise<void>;
  initialData?: NotificationPayload;
  isSubmitting: boolean;
}

const NotificationModal = ({
  isOpen,
  onClose,
  onSubmit,
  initialData,
  isSubmitting,
}: NotificationModalProps) => {
  const [formData, setFormData] = useState<NotificationPayload>({
    title: "",
    message: "",
  });

  useEffect(() => {
    if (initialData) {
      setFormData(initialData);
    } else {
      setFormData({ title: "", message: "" });
    }
  }, [initialData, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit(formData);
    onClose();
  };

  return (
    <Modal show={isOpen} onClose={onClose}>
      <ModalHeader>
        {initialData ? "Edit Notification" : "Post New Notification"}
      </ModalHeader>
      <ModalBody>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <div className="mb-2 block">
              <Label htmlFor="title"> Title </Label>
            </div>
            <TextInput
              id="title"
              placeholder="e.g., Exam Schedule Update"
              required
              value={formData.title}
              onChange={(e) =>
                setFormData({ ...formData, title: e.target.value })
              }
            />
          </div>
          <div>
            <div className="mb-2 block">
              <Label htmlFor="message"> Message </Label>
            </div>
            <Textarea
              id="message"
              placeholder="Type your announcement here..."
              required
              rows={4}
              value={formData.message}
              onChange={(e) =>
                setFormData({ ...formData, message: e.target.value })
              }
            />
          </div>
          <div className="mt-4 flex justify-end gap-2">
            <Button color="gray" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {initialData ? "Update" : "Post"}
            </Button>
          </div>
        </form>
      </ModalBody>
    </Modal>
  );
};

export default NotificationModal;
