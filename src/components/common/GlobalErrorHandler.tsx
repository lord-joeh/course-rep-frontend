import { useEffect, useState } from "react";
import ToastMessage from "./ToastMessage";
import { ToastInterface } from "../../utils/Interfaces";

const GlobalErrorHandler = () => {
  const [toast, setToast] = useState<ToastInterface | null>(null);

  useEffect(() => {
    const handleHttpError = (event: Event) => {
      const customEvent = event as CustomEvent;
      setToast({
        message: customEvent.detail.message,
        type: customEvent.detail.type || "error",
        isVisible: true,
      });
    };

    window.addEventListener("http-error", handleHttpError);

    return () => window.removeEventListener("http-error", handleHttpError);
  }, []);

  if (!toast?.isVisible) return null;

  return (
    <ToastMessage
      message={toast.message}
      type={toast.type}
      onClose={() => setToast(null)}
    />
  );
};

export default GlobalErrorHandler;
