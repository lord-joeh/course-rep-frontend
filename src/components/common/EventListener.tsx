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

    const onJobStart = (payload: any) => {
      const id = payload.socketId;
      if (id && id === socket.id) {
        console.log("🚀 Job started:", payload);
        const jobTitle = payload.message
          ? `${payload?.message}...`
          : "Starting job...";
        addProgress(id, jobTitle);
      }
    };

    const onJobProgress = (payload: any) => {
      const id = payload.socketId;
      if (id && id === socket.id) {
        console.log("⏳ Job progress:", payload);
        updateProgress(
          id,
          payload.progress || 0,
          payload.message || "Processing...",
        );
      }
    };

    const onEmailSent = (payload: any) => {
      if (payload.socketId && payload.socketId === socket.id) {
        console.log("📧 Email sent:", payload);
        showToast(`Email sent to ${payload?.to ?? payload?.email}`, "success");
        completeProgress(payload.socketId, true, "Email sent successfully");
      }
    };

    const onSMSSent = (payload: any) => {
      if (payload.socketId && payload.socketId === socket.id) {
        console.log("📱 SMS sent:", payload);
        showToast(`SMS sent to ${payload?.to ?? payload?.phone}`, "success");
        completeProgress(payload.socketId, true, "SMS sent successfully");
      }
    };

    const onUploadProgress = (payload: any) => {
      const id = payload.socketId;
      if (!id || id !== socket.id) return;

      if (payload.status === "start") {
        addProgress(id, `Uploading ${payload.total} file(s)`);
      } else if (payload.status === "progress") {
        const percent = Math.round((payload.current / payload.total) * 100);
        updateProgress(
          id,
          percent,
          `Processing ${payload.current} of ${payload.total}...`,
        );
      }
    };

    const onJobComplete = (payload: any) => {
      console.log("Job Completed", payload);
      if (payload.socketId && payload.socketId === socket.id) {
        showToast(payload?.message || "Job completed", "success");
        completeProgress(
          payload.socketId,
          true,
          payload?.message || "Background job finished.",
        );
      }

      if (
        payload.socketId === socket.id &&
        payload.jobType == "processSlides"
      ) {
        if (payload.fileName) {
          showToast(
            `Processing complete for ${payload?.fileName ?? payload?.jobType}`,
            "success",
          );
        } else {
          showToast("Background job completed successfully", "success");
        }
      }
    };

    const onUploadComplete = (payload: any) => {
      const id = payload.socketId;
      if (id && id === socket.id) {
        showToast(`Upload complete: ${payload.successful} of ${payload.total}`, "success");
        completeProgress(id, true, `Completed: ${payload.successful} sent.`);
      }
    };

    const onJobFailed = (payload: any) => {
      if (payload.socketId && payload.socketId === socket.id) {
        completeProgress(payload.socketId, false, payload.error || "Failed");
        console.error("Job Failed", payload);
        showToast(`${payload.error || "Unknown error"}`, "error");
      }
    };

    // Listen for all events to debug
    socket.onAny((eventName, ...args) => {
      console.log(`📡 Received event: ${eventName}`, args);
    });

    socket.on("connect", onConnect);
    socket.on("workerStarted", onWorkerStarted);
    socket.on("test", onTest);
    socket.on("notification", onNotification);
    socket.on("jobStarted", onJobStart);
    socket.on("jobProgress", onJobProgress);
    socket.on("emailSent", onEmailSent);
    socket.on("smsSent", onSMSSent);
    socket.on("uploadProgress", onUploadProgress);
    socket.on("uploadComplete", onUploadComplete);
    socket.on("jobComplete", onJobComplete);
    socket.on("jobFailed", onJobFailed);

    return () => {
      socket.off("connect", onConnect);
      socket.off("workerStarted", onWorkerStarted);
      socket.off("test", onTest);
      socket.off("notification", onNotification);
      socket.off("jobStarted", onJobStart);
      socket.off("jobProgress", onJobProgress);
      socket.off("jobComplete", onJobComplete);
      socket.off("jobFailed", onJobFailed);
      socket.off("uploadProgress", onUploadProgress);
      socket.off("uploadComplete", onUploadComplete);
      socket.off("emailSent", onEmailSent);
      socket.off("smsSent", onSMSSent);
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
