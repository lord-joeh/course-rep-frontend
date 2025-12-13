import { useEffect, useState } from "react";
import { useSocket } from "../../hooks/useSocket";
import ToastMessage from "./ToastMessage";
import { ToastInterface } from "../../utils/Interfaces";

const EventListener = () => {
  const socket = useSocket();
  const [toast, setToast] = useState<ToastInterface>({
    message: "",
    type: "error",
    isVisible: false,
  });

  const closeToast = () => {
    setToast((prev) => ({ ...prev, isVisible: false }));
  };

  const showToast = (message: string, type: "success" | "error") =>
    setToast((prev) => ({ ...prev, message, type, isVisible: true }));

  useEffect(() => {
    if (!socket) {
      console.log("❌ Socket not available");
      return;
    }

    console.log("✅ Socket available, setting up listeners");

    const onConnect = () => {
      showToast("Socket connected", "success");
      console.log("🔌 Socket connected with ID:", socket.id);
    };

    const onWorkerStarted = (payload: any) => {
      console.log("🎉 Received workerStarted event:", payload);
      showToast(payload?.message || "Worker started", "success");
    };

    const onTest = (payload: any) => {
      console.log("🧪 Received test event:", payload);
      showToast("Test event received", "success");
    };

    const onNotification = (payload: any) => {
      showToast(payload?.message, 'success');
      console.log("🔔 Received notification event:", payload);
    };

    // Listen for all events to debug
    socket.onAny((eventName, ...args) => {
      console.log(`📡 Received event: ${eventName}`, args);
    });

    socket.on("connect", onConnect);
    socket.on("workerStarted", onWorkerStarted);
    socket.on("test", onTest);
    socket.on("notification", onNotification);

    socket.on("jobCompleted", (data: any) => {
      console.log("Job Completed", data);
      if (data.fileName) {
        showToast(`Processing complete for ${data.fileName}`, "success");
      } else {
        showToast("Background job completed successfully", "success");
      }
    });

    socket.on("jobFailed", (data: any) => {
      console.error("Job Failed", data);
      showToast(`Job failed: ${data.error || "Unknown error"}`, "error");
    });

    return () => {
      socket.off("connect", onConnect);
      socket.off("workerStarted", onWorkerStarted);
      socket.off("test", onTest);
      socket.off("test", onTest);
      socket.off("notification", onNotification);
      socket.off("jobCompleted");
      socket.off("jobFailed");
      socket.offAny();
    };
  }, [socket]);

  return (
    <div>
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

export default EventListener;
