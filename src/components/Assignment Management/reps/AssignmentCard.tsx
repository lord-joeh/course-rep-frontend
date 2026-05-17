import { TbCalendarDue } from "react-icons/tb";
import { AssignmentsInterface } from "../../../utils/Interfaces";
import { IoCloudUploadOutline } from "react-icons/io5";
import { Tooltip } from "flowbite-react";
import { FiDownload } from "react-icons/fi";
import { BsFolder } from "react-icons/bs";

interface AssignmentCardProps {
  assignment: AssignmentsInterface;
  isRep: boolean;
  onSubmit: (folderId: string, assignmentId: string) => void;
  onDownload: (fileId: string) => void;
  onViewSubmissions: (assignmentId: string) => void;
}

export const AssignmentCard = ({
  assignment,
  isRep,
  onSubmit,
  onDownload,
  onViewSubmissions,
}: AssignmentCardProps) => {
  const isOverdue = new Date() > new Date(assignment.deadline);
  const formattedDeadline = assignment.deadline
    ? new Date(assignment.deadline).toDateString()
    : "";

  return (
    <div
      className={`flex flex-col gap-3 rounded-xl border bg-white p-5 transition-colors dark:bg-gray-900 ${
        isOverdue
          ? "border-red-200 dark:border-red-900"
          : "border-gray-200 hover:border-gray-300 dark:border-gray-700 dark:hover:border-gray-600"
      }`}
    >
      {/* header */}
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm font-medium text-gray-900 dark:text-white">
          {assignment.title || "Untitled Assignment"}
        </p>
        <span
          className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold ${
            isOverdue
              ? "bg-red-50 text-red-600 dark:bg-red-950 dark:text-red-400"
              : "bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-400"
          }`}
        >
          {isOverdue ? "Overdue" : "Open"}
        </span>
      </div>

      {/* description */}
      <p className="line-clamp-3 text-xs leading-relaxed text-gray-500 dark:text-gray-400">
        {assignment.description}
      </p>

      {/* deadline */}
      <div
        className={`flex items-center gap-1.5 text-xs font-medium ${
          isOverdue ? "text-gray-400" : "text-red-500"
        }`}
      >
        <TbCalendarDue size={14} />
        <span>Due {formattedDeadline}</span>
      </div>

      {/* actions */}
      <div className="flex items-center gap-2 border-t border-gray-100 pt-3 dark:border-gray-800">
        <button
          disabled={isOverdue}
          onClick={() => onSubmit(assignment.submissionFolderID, assignment.id)}
          className="flex flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-xs font-medium text-gray-700 transition-colors hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-40 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
        >
          <IoCloudUploadOutline size={14} />
          Submit
        </button>

        <Tooltip content="Download assignment">
          <button
            onClick={() => onDownload(assignment.fileId)}
            className="flex h-[34px] w-[34px] shrink-0 cursor-pointer items-center justify-center rounded-lg border border-gray-200 transition-colors hover:bg-gray-100 dark:border-gray-700 dark:hover:bg-gray-800"
            aria-label="Download assignment"
          >
            <FiDownload size={15} className="text-gray-500" />
          </button>
        </Tooltip>

        {isRep && (
          <Tooltip content="View submissions">
            <button
              onClick={() => onViewSubmissions(assignment.id)}
              className="flex h-[34px] w-[34px] shrink-0 cursor-pointer items-center justify-center rounded-lg border border-gray-200 transition-colors hover:bg-gray-100 dark:border-gray-700 dark:hover:bg-gray-800"
              aria-label="View submissions"
            >
              <BsFolder size={15} className="text-gray-500" />
            </button>
          </Tooltip>
        )}
      </div>
    </div>
  );
};
