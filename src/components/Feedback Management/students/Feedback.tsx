import React, { useState, useEffect } from "react";
import { submitFeedback } from "../../../services/feedbackService";
import useAuth from "../../../hooks/useAuth";
import { isAxiosError } from "axios";
import { Button, Checkbox, Textarea, Label } from "flowbite-react";
import { VscFeedback } from "react-icons/vsc";
import ToastMessage from "../../common/ToastMessage";

interface Feedback {
  studentId: string;
  content: string;
  is_anonymous: boolean;
}

interface ToastInterface {
  message: string;
  type: "error" | "success";
  isVisible: boolean;
}

const Feedback = () => {
  const [feedback, setFeedback] = useState<Feedback>({
    studentId: "",
    content: "",
    is_anonymous: false,
  });
  const { user } = useAuth();
  const [loading, setLoading] = useState<boolean>(false);
  const [toast, setToast] = useState<ToastInterface>({
    message: "",
    type: "error",
    isVisible: false,
  });
  const showToast = (message: string, type: "success" | "error") =>
    setToast({ message, type, isVisible: true });

  const closeToast = () => {
    setToast((prev) => ({ ...prev, isVisible: false }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (feedback.content.length < 1 || !feedback?.studentId)
      return showToast("Make sure your feedback field is not blank", "error");

    try {
      setLoading(true);
      const response = await submitFeedback(feedback);
      showToast(
        response?.data?.message || "Feedback submitted successfully",
        "success",
      );
    } catch (err) {
      if (isAxiosError(err)) {
        showToast(
          err.response?.data?.error || "Failed to submit Feedback.",
          "error",
        );
      } else {
        showToast(
          "An unexpected error occurred while submitting feedback.",
          "error",
        );
      }
    } finally {
      setFeedback((prev) => ({
        ...prev,
        content: "",
        is_anonymous: false,
      }));
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) setFeedback((prev) => ({ ...prev, studentId: user?.data?.id }));
  }, []);

  return (
    <div className="container flex flex-col justify-center gap-6 p-6 font-sans md:p-1">
      <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
        {" "}
        Submit a Feedback
      </h1>
      <form onSubmit={handleSubmit}>
        <div className="mt-2 block">
          <Textarea
            id="feedback"
            name="content"
            value={feedback.content}
            placeholder="Feedback..."
            required
            rows={10}
            onChange={(e) => {
              setFeedback((prev) => ({ ...prev, content: e.target.value }));
            }}
          />
        </div>

        <div className="mt-4 flex items-center gap-2">
          <Checkbox
            id="anonymous"
            name="is_anonymous"
            checked={feedback?.is_anonymous}
            disabled={loading}
            onChange={(e) => {
              setFeedback((prev) => ({
                ...prev,
                is_anonymous: e.target.checked,
              }));
            }}
          />
          <Label htmlFor="isAnonymous">Anonymous</Label>
        </div>

        <Button
          type="submit"
          className="mt-4 flex w-70 justify-center place-self-center"
          disabled={loading}
        >
          <VscFeedback className="me-2 h-4 w-4" />
          {loading ? "submitting..." : " Submit"}
        </Button>
      </form>

      {toast.isVisible && (
        <ToastMessage
          message={toast.message}
          type={toast.type}
          onClose={closeToast}
        />
      )}
    </div>
  );
};

export default Feedback;
