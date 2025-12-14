import { useState, useCallback, useEffect } from "react";
import { useProgress } from "./useProgress";
import { useSocket } from "./useSocket";

export type JobType =
  | "uploadSlides"
  | "uploadAssignment"
  | "submitAssignment"
  | "processSlides"
  | "sendEmail"
  | "sendSMS";

interface UseJobProgressOptions {
  jobType: JobType;
  title: string;
  onComplete?: (success: boolean) => void;
  onError?: (error: string) => void;
}

interface JobProgressState {
  isProcessing: boolean;
  progress: number;
  statusText: string;
  jobId: string | null;
}

export function useJobProgress(options: UseJobProgressOptions) {
  const { jobType, title, onComplete, onError } = options;
  const { addProgress, updateProgress, completeProgress } = useProgress();
  const socket = useSocket();

  const [localState, setLocalState] = useState<JobProgressState>({
    isProcessing: false,
    progress: 0,
    statusText: "",
    jobId: null,
  });

  // Generate unique job ID
  const generateJobId = useCallback(() => {
    if (!socket?.id) return null;
    return `${socket.id}-${jobType}-${Date.now()}`;
  }, [socket?.id, jobType]);

  // Start a new job
  const startJob = useCallback(
    (customTitle?: string) => {
      const jobId = generateJobId();
      if (!jobId) {
        console.error("Cannot start job: socket not connected");
        return null;
      }

      const jobTitle = customTitle || title;

      // Add to global progress tracker
      addProgress(jobId, jobTitle, {
        jobType,
        socketId: socket?.id,
      });

      // Update local state
      setLocalState({
        isProcessing: true,
        progress: 0,
        statusText: "Starting...",
        jobId,
      });

      return jobId;
    },
    [generateJobId, title, jobType, socket?.id, addProgress],
  );

  // Update job progress
  const updateJobProgress = useCallback(
    (progress: number, message?: string) => {
      if (!localState.jobId) return;

      updateProgress(localState.jobId, progress, message);

      setLocalState((prev) => ({
        ...prev,
        progress,
        statusText: message || prev.statusText,
      }));
    },
    [localState.jobId, updateProgress],
  );

  // Complete job
  const completeJob = useCallback(
    (success: boolean, message?: string) => {
      if (!localState.jobId) return;

      completeProgress(localState.jobId, success, message);

      setLocalState((prev) => ({
        ...prev,
        isProcessing: false,
        progress: success ? 100 : prev.progress,
        statusText: message || (success ? "Completed!" : "Failed"),
      }));

      if (onComplete) {
        onComplete(success);
      }
    },
    [localState.jobId, completeProgress, onComplete],
  );

  // Fail job
  const failJob = useCallback(
    (errorMessage: string) => {
      completeJob(false, errorMessage);
      if (onError) {
        onError(errorMessage);
      }
    },
    [completeJob, onError],
  );

  // Reset local state
  const resetJob = useCallback(() => {
    setLocalState({
      isProcessing: false,
      progress: 0,
      statusText: "",
      jobId: null,
    });
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      // Note: We don't remove from global tracker on unmount
      // This allows tracking to continue even if component unmounts
    };
  }, []);

  return {
    startJob,
    updateJobProgress,
    completeJob,
    failJob,
    resetJob,
    isProcessing: localState.isProcessing,
    progress: localState.progress,
    statusText: localState.statusText,
    jobId: localState.jobId,
  };
}
