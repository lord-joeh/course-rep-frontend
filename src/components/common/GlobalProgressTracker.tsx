import { Progress, Card, Badge } from "flowbite-react";
import { useProgress } from "../../hooks/useProgress";
import {
  IoCloudUploadOutline,
  IoDocumentTextOutline,
  IoMailOutline,
  IoChatbubbleEllipsesOutline,
  IoCheckmarkCircle,
  IoCloseCircle,
  IoHourglassOutline,
} from "react-icons/io5";

const GlobalProgressTracker = () => {
  const { items, removeProgress } = useProgress();

  if (items.length === 0) return null;

  const getJobTypeIcon = (jobType?: string) => {
    switch (jobType) {
      case "uploadSlides":
      case "uploadAssignment":
      case "submitAssignment":
        return <IoCloudUploadOutline className="h-4 w-4" />;
      case "processSlides":
        return <IoDocumentTextOutline className="h-4 w-4" />;
      case "sendEmail":
        return <IoMailOutline className="h-4 w-4" />;
      case "sendSMS":
        return <IoChatbubbleEllipsesOutline className="h-4 w-4" />;
      default:
        return <IoHourglassOutline className="h-4 w-4" />;
    }
  };

  const getJobTypeBadge = (jobType?: string) => {
    const badges: Record<string, { color: string; text: string }> = {
      uploadSlides: { color: "info", text: "Upload" },
      uploadAssignment: { color: "info", text: "Upload" },
      submitAssignment: { color: "purple", text: "Submit" },
      processSlides: { color: "warning", text: "Processing" },
      sendEmail: { color: "success", text: "Email" },
      sendSMS: { color: "success", text: "SMS" },
    };

    const badge = (jobType && badges[jobType]) || {
      color: "gray",
      text: "Job",
    };
    return (
      <Badge color={badge.color as any} size="xs">
        {badge.text}
      </Badge>
    );
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <IoCheckmarkCircle className="h-5 w-5 text-green-500" />;
      case "error":
        return <IoCloseCircle className="h-5 w-5 text-red-500" />;
      default:
        return null;
    }
  };

  return (
    <div className="fixed right-4 bottom-4 z-50 flex max-h-[80vh] w-80 flex-col gap-2 overflow-y-auto">
      {items.map((item) => (
        <Card
          key={item.id}
          className="relative border-t-4 shadow-lg"
          style={{
            borderTopColor:
              item.status === "error"
                ? "red"
                : item.status === "completed"
                  ? "green"
                  : "blue",
          }}
        >
          <div className="mb-2 flex items-start justify-between">
            <div className="flex min-w-0 flex-1 items-center gap-2">
              {getJobTypeIcon(item.metadata?.jobType)}
              <h5 className="truncate text-sm font-bold tracking-tight text-gray-900 dark:text-white">
                {item.title}
              </h5>
              {getStatusIcon(item.status)}
            </div>
            <button
              onClick={() => removeProgress(item.id)}
              className="ml-2 text-gray-400 hover:text-gray-900"
            >
              <span className="text-xs">✕</span>
            </button>
          </div>

          <div className="mb-2 flex items-center gap-2">
            {getJobTypeBadge(item.metadata?.jobType)}
            <span className="text-xs text-gray-500">
              {new Date(item.createdAt).toLocaleTimeString()}
            </span>
          </div>

          <div className="flex flex-col gap-1">
            <div className="mb-1 flex justify-between text-xs text-gray-600">
              <span>{item.message}</span>
              <span>{Math.round(item.progress)}%</span>
            </div>

            <Progress
              progress={item.progress}
              color={item.status === "error" ? "red" : "blue"}
              size="sm"
            />
          </div>
        </Card>
      ))}
    </div>
  );
};

export default GlobalProgressTracker;
