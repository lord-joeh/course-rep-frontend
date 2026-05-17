import { Tooltip } from "flowbite-react";
import { GroupInterface } from "../../../utils/Interfaces";
import { FaEdit } from "react-icons/fa";
import { IoEyeOutline } from "react-icons/io5";
import { MdDeleteForever } from "react-icons/md";

interface GroupCardProps {
  group: GroupInterface;
  onEdit: (group: GroupInterface) => void;
  onDelete: (id: string, label: string) => void;
  onView: (id: string) => void;
}

export const GroupCard = ({
  group,
  onEdit,
  onDelete,
  onView,
}: GroupCardProps) => {
  const courseLabel = group.Course?.name || "General Group";
  const deleteLabel = `${group.name} from ${group.Course?.name || "General Groups"}`;

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-gray-200 bg-white p-5 transition-colors hover:border-gray-300 dark:border-gray-700 dark:bg-gray-900 dark:hover:border-gray-600">
      {/* header */}
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm font-medium text-gray-900 dark:text-white">
          {group.name}
        </p>
        <span
          className={`inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${
            group.isGeneral
              ? "bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-400"
              : "bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-400"
          }`}
        >
          {group.isGeneral ? "General" : "Course"}
        </span>
      </div>

      {/* body */}
      <div className="flex flex-1 flex-col gap-1">
        <p className="line-clamp-2 text-xs text-gray-500 dark:text-gray-400">
          {group.description}
        </p>
        <p className="text-xs text-gray-400 dark:text-gray-500">
          {courseLabel}
        </p>
      </div>

      {/* actions */}
      <div className="flex items-center gap-2 border-t border-gray-100 pt-3 dark:border-gray-800">
        <button
          onClick={() => onEdit(group)}
          className="flex flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-lg border border-gray-200 bg-gray-50 px-3 py-1.5 text-xs font-medium text-gray-700 transition-colors hover:bg-gray-100 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
        >
          <FaEdit size={13} />
          Edit
        </button>

        <Tooltip content="View members">
          <button
            onClick={() => onView(group.id)}
            className="flex h-[34px] w-[34px] shrink-0 cursor-pointer items-center justify-center rounded-lg border border-gray-200 transition-colors hover:bg-gray-100 dark:border-gray-700 dark:hover:bg-gray-800"
            aria-label="View group members"
          >
            <IoEyeOutline size={16} className="text-gray-500" />
          </button>
        </Tooltip>

        <Tooltip content="Delete group">
          <button
            onClick={() => onDelete(group.id, deleteLabel)}
            className="flex h-[34px] w-[34px] shrink-0 cursor-pointer items-center justify-center rounded-lg border border-red-200 transition-colors hover:bg-red-50 dark:border-red-900 dark:hover:bg-red-950"
            aria-label="Delete group"
          >
            <MdDeleteForever size={16} className="text-red-500" />
          </button>
        </Tooltip>
      </div>
    </div>
  );
};
