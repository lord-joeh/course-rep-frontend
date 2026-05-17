import { FiDownload } from "react-icons/fi";
import { SubmittedAssignment } from "../../../utils/Interfaces";
import { FaRegCalendarCheck, FaRegCalendarXmark } from "react-icons/fa6";
import { Tooltip } from "flowbite-react";
import { MdDeleteForever } from "react-icons/md";

interface SubmissionCardProps {
  submission: SubmittedAssignment;
  onDownload: (fileId: string) => void;
  onDelete: (submission: SubmittedAssignment) => void;
}

export const SubmissionCard = ({
  submission,
  onDownload,
  onDelete,
}: SubmissionCardProps) => {
  const courseName = submission?.Assignment?.Course?.name ?? "";
  const assignmentTitle = submission?.Assignment?.title ?? "";
  const submittedDate = submission?.submittedAt
    ? new Date(submission.submittedAt).toDateString()
    : "—";
  const dueDate = submission?.Assignment?.deadline
    ? new Date(submission.Assignment.deadline).toDateString()
    : "—";

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-gray-200 bg-white p-5 transition-colors hover:border-gray-300 dark:border-gray-700 dark:bg-gray-900 dark:hover:border-gray-600">
      {/* header */}
      <div className="flex flex-col gap-2">
        <span className="inline-flex w-fit items-center gap-1 rounded-full bg-blue-50 px-2 py-0.5 text-[11px] font-medium text-blue-600 dark:bg-blue-950 dark:text-blue-300">
          {courseName}
        </span>
        <div>
          <p className="truncate text-sm font-medium text-gray-900 dark:text-white">
            {submission?.fileName ?? "Untitled"}
          </p>
          <p className="text-xs text-gray-400 dark:text-gray-500">
            {assignmentTitle}
          </p>
        </div>
      </div>

      {/* dates */}
      <div className="flex flex-col gap-1.5 border-t border-gray-100 pt-3 dark:border-gray-800">
        <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
          <FaRegCalendarCheck size={12} className="shrink-0 text-emerald-500" />
          Submitted
          <span className="font-medium text-gray-700 dark:text-gray-300">
            {submittedDate}
          </span>
        </div>
        <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
          <FaRegCalendarXmark size={12} className="shrink-0 text-red-500" />
          Due
          <span className="font-medium text-gray-700 dark:text-gray-300">
            {dueDate}
          </span>
        </div>
      </div>

      {/* actions */}
      <div className="flex items-center gap-2 border-t border-gray-100 pt-3 dark:border-gray-800">
        <button
          onClick={() => onDownload(submission.fileId)}
          className="flex flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-xs font-medium text-gray-700 transition-colors hover:bg-gray-100 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
        >
          <FiDownload size={13} /> Download
        </button>
        <Tooltip content="Delete submission">
          <button
            onClick={() => onDelete(submission)}
            className="flex h-[34px] w-[34px] shrink-0 cursor-pointer items-center justify-center rounded-lg border border-red-200 transition-colors hover:bg-red-50 dark:border-red-900 dark:hover:bg-red-950"
            aria-label="Delete submission"
          >
            <MdDeleteForever size={15} className="text-red-500" />
          </button>
        </Tooltip>
      </div>
    </div>
  );
};
