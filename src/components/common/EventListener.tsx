import { useEffect, useState } from "react";
import { useSocket } from "../../hooks/useSocket";
import ToastMessage from "./ToastMessage";
import { ToastInterface } from "../../utils/Interfaces";
import { useProgress } from "../../hooks/useProgress";

const EventListener = () => {
  const socket = useSocket();
  const { addProgress, updateProgress, completeProgress } = useProgress();
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
    if (!socket) return;

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
      showToast(payload?.message, "success");
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

    // Job lifecycle events
    socket.on("jobStarted", (data: any) => {
      const id = data.socketId;
      if (id && id === socket.id) {
        console.log("🚀 Job started:", data);
        const jobTitle = data.jobType
          ? `Starting ${data.jobType}...`
          : "Starting job...";
        addProgress(id, jobTitle);
      }
    });

    socket.on("jobProgress", (data: any) => {
      const id = data.socketId;
      if (id && id === socket.id) {
        console.log("⏳ Job progress:", data);
        updateProgress(id, data.progress || 0, data.message || "Processing...");
      }
    });

    socket.on("emailSent", (data: any) => {
      if (data.socketId && data.socketId === socket.id) {
        console.log("📧 Email sent:", data);
        showToast(`Email sent to ${data.to}`, "success");
        completeProgress(data.socketId, true, "Email sent successfully");
      }
    });

    socket.on("smsSent", (data: any) => {
      if (data.socketId && data.socketId === socket.id) {
        console.log("📱 SMS sent:", data);
        showToast(`SMS sent to ${data.to}`, "success");
        completeProgress(data.socketId, true, "SMS sent successfully");
      }
    });

    // Handled by global progress tracker now
    socket.on("uploadProgress", (data: any) => {
      // data: { status: "start"|"progress", current, total, socketId, socketId }
      // We use socketId (or a job Id if we had one) as the unique key
      // Ideally we need a unique operation ID, but using socketId + type is okay for simple single-user ops
      // Actually, uploadHandlers sends `socketId` in payload.
      // Let's assume one active upload per user/socket for now, or we can improve ID generation later.

      const id = data.socketId;
      if (!id || id !== socket.id) return; // Filter by current socketId

      if (data.status === "start") {
        addProgress(id, `Uploading ${data.total} file(s)`);
      } else if (data.status === "progress") {
        const percent = Math.round((data.current / data.total) * 100);
        updateProgress(
          id,
          percent,
          `Processing ${data.current} of ${data.total}...`,
        );
      }
    });

    socket.on("uploadComplete", (data: any) => {
      const id = data.socketId;
      if (id && id === socket.id) {
        // Filter by current socketId
        completeProgress(id, true, `Completed: ${data.successful} sent.`);
      }
    });

    socket.on("jobCompleted", (data: any) => {
      // Generic job completion
      if (
        data.socketId &&
        data.socketId === socket.id &&
        data.jobType !== "processSlides" // ← Fixed: check jobType instead of type
      ) {
        // Filter by current socketId
        // processSlides often happens after upload, we might want to track it too?
        // If we tracked it, we would need to know its ID.
        // For now, keep toast for generic jobs, but maybe update progress if it matches?
        completeProgress(data.socketId, true, "Background job finished.");
      }

      console.log("Job Completed", data);
      if (data.socketId === socket.id) {
        // Filter by current socketId for toast
        if (data.fileName) {
          showToast(`Processing complete for ${data.fileName}`, "success");
        } else {
          showToast("Background job completed successfully", "success");
        }
      }
    });

    socket.on("jobFailed", (data: any) => {
      if (data.socketId && data.socketId === socket.id) {
        // Filter by current socketId
        completeProgress(data.socketId, false, data.error || "Failed");
        console.error("Job Failed", data);
        showToast(`Job failed: ${data.error || "Unknown error"}`, "error");
      }
    });

    return () => {
      socket.off("connect", onConnect);
      socket.off("workerStarted", onWorkerStarted);
      socket.off("test", onTest);
      socket.off("notification", onNotification);
      socket.off("jobStarted");
      socket.off("jobProgress");
      socket.off("jobCompleted");
      socket.off("jobFailed");
      socket.off("uploadProgress");
      socket.off("uploadComplete");
      socket.off("emailSent");
      socket.off("smsSent");
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
