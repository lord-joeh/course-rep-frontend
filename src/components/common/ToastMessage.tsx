import  { useState, useEffect } from "react";
import { Toast, ToastToggle } from "flowbite-react";
import { HiCheck, HiX } from "react-icons/hi";

type ToastType = {
  message: string;
  type: string;
  onClose: () => void | null;
};

const ToastMessage = ({ message, type, onClose }: ToastType) => {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
      onClose();
    }, 7000);
    return () => clearTimeout(timer);
  }, [onClose]);

  if (!isVisible || !message) {
    return null;
  }

  const isSuccess = type === "success";
  const icon = isSuccess ? (
    <HiCheck className="h-5 w-5" />
  ) : (
    <HiX className="h-5 w-5" />
  );
  const bgColor = isSuccess ? "bg-green-100" : "bg-red-100";
  const textColor = isSuccess ? "text-green-500" : "text-red-500";
  const darkBgColor = isSuccess ? "dark:bg-green-800" : "dark:bg-red-800";
  const darkTextColor = isSuccess ? "dark:text-green-200" : "dark:text-red-200";

  return (
    <div className="fixed top-4 right-4 z-50">
      <Toast>
        <div
          className={`inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${bgColor} ${textColor} ${darkBgColor} ${darkTextColor}`}
        >
          {icon}
        </div>
        <div className="ml-3 text-sm font-normal">{message}</div>
        <ToastToggle onClick={() => setIsVisible(false)} />
      </Toast>
    </div>
  );
};

export default ToastMessage;
