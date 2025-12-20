import { Progress, Card, Badge } from "flowbite-react";
import { useProgress } from "../../hooks/useProgress";
import { useEffect } from "react"; // Added for auto-dismiss logic
import {
  IoCloudUploadOutline,
  IoDocumentTextOutline,
  IoMailOutline,
  IoChatbubbleEllipsesOutline,
  IoCheckmarkCircle,
  IoCloseCircle,
  IoHourglassOutline,
  IoQrCodeOutline, // New icon for Attendance
  IoPeopleOutline, // New icon for Groups
  IoClose, // Better close icon
} from "react-icons/io5";

const GlobalProgressTracker = () => {
  const { items, removeProgress } = useProgress();

  // OPTIONAL: Auto-dismiss completed items after 5 seconds
  useEffect(() => {
    const timers: NodeJS.Timeout[] = [];

    items.forEach((item) => {
      if (item.status === "completed" || item.status === "error") {
        const timer = setTimeout(() => {
          removeProgress(item.id);
        }, 5000); // 5 seconds delay
        timers.push(timer);
      }
    });

    return () => timers.forEach((t) => clearTimeout(t));
  }, [items, removeProgress]);

  if (items.length === 0) return null;

  const getJobTypeIcon = (jobType?: string) => {
    switch (jobType) {
      // --- EXISTING ---
      case "uploadSlides":
      case "uploadAssignment":
      case "submitAssignment":
        return <IoCloudUploadOutline className="h-5 w-5" />;
      case "processSlides":
        return <IoDocumentTextOutline className="h-5 w-5" />;
      case "sendEmail":
        return <IoMailOutline className="h-5 w-5" />;
      case "sendSMS":
        return <IoChatbubbleEllipsesOutline className="h-5 w-5" />;

      // --- NEW BACKEND HANDLERS ---
      case "processAttendanceCreation":
      case "processAttendanceMarking":
        return <IoQrCodeOutline className="h-5 w-5" />;
      case "processCustomGroups":
        return <IoPeopleOutline className="h-5 w-5" />;

      default:
        return <IoHourglassOutline className="h-5 w-5" />;
    }
  };

  const getJobTypeBadge = (jobType?: string) => {
    // Define mappings for badge colors and labels
    const badges: Record<string, { color: string; text: string }> = {
      uploadSlides: { color: "info", text: "Upload" },
      uploadAssignment: { color: "info", text: "Upload" },
      submitAssignment: { color: "purple", text: "Submit" },
      processSlides: { color: "warning", text: "Processing" },
      sendEmail: { color: "success", text: "Email" },
      sendSMS: { color: "success", text: "SMS" },

      // New mappings
      processAttendanceCreation: { color: "indigo", text: "Attendance Init" },
      processAttendanceMarking: { color: "indigo", text: "Marking" },
      processCustomGroups: { color: "pink", text: "Grouping" },
    };

    const badge = (jobType && badges[jobType]) || {
      color: "gray",
      text: "Pending", // Better default text
    };

    return (
      <Badge color={badge.color as any} size="xs" className="w-fit">
        {badge.text}
      </Badge>
    );
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <IoCheckmarkCircle className="h-6 w-6 text-green-500" />;
      case "error":
        return <IoCloseCircle className="h-6 w-6 text-red-500" />;
      default:
        // Use a spinner or hourglass for active states if desired
        return null;
    }
  };

  return (
    <div className="fixed right-4 bottom-4 z-50 flex max-h-[80vh] w-full flex-col gap-3 overflow-y-auto p-2 md:w-96">
      {items.map((item) => (
        <Card
          key={item.id}
          className="animate-in slide-in-from-right-10 relative border-l-4 shadow-xl transition-all duration-300"
          theme={{
            root: {
              children: "gap-2 p-4", // Customizing Flowbite padding
            },
          }}
          style={{
            borderLeftColor:
              item.status === "error"
                ? "#EF4444" // Red-500
                : item.status === "completed"
                  ? "#22C55E" // Green-500
                  : "#3B82F6", // Blue-500
          }}
        >
          {/* Header Section */}
          <div className="flex items-start justify-between gap-3">
            <div className="flex min-w-0 flex-1 items-center gap-2 text-gray-700 dark:text-gray-200">
              {getJobTypeIcon(item.metadata?.jobType)}
              <h5 className="truncate text-sm font-bold tracking-tight">
                {item.title}
              </h5>
            </div>

            <div className="flex items-center gap-1">
              {getStatusIcon(item.status)}
              <button
                onClick={() => removeProgress(item.id)}
                className="ml-1 rounded-full p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-900 dark:hover:bg-gray-700"
              >
                <IoClose className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* Badge & Timestamp */}
          <div className="flex items-center justify-between">
            {getJobTypeBadge(item.metadata?.jobType)}
            <span className="text-xs text-gray-500">
              {new Date(item.createdAt).toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </span>
          </div>

          {/* Progress Bar Section */}
          <div className="mt-1 flex flex-col gap-1">
            <div className="flex justify-between text-xs font-medium text-gray-600 dark:text-gray-400">
              <span className="max-w-[70%] truncate">{item.message}</span>
              <span>{Math.round(item.progress)}%</span>
            </div>

            <Progress
              progress={item.progress}
              color={
                item.status === "error"
                  ? "red"
                  : item.status === "completed"
                    ? "green"
                    : "blue"
              }
              size="sm"
            />
          </div>
        </Card>
      ))}
    </div>
  );
};

export default GlobalProgressTracker;
