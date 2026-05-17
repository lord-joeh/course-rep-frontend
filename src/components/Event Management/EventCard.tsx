import { IoLocationOutline, IoTimeOutline } from "react-icons/io5";
import { Event } from "../../utils/Interfaces";
import { FiEdit3 } from "react-icons/fi";
import { MdDeleteForever } from "react-icons/md";
import { formatTimeWithOffset } from "../../helpers/formatTime";

interface EventCardProps {
  event: Event;
  isRep: boolean;
  onEdit: (event: Event) => void;
  onDelete: (id: string, label: string) => void;
}

const MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

export const EventCard = ({
  event,
  isRep,
  onEdit,
  onDelete,
}: EventCardProps) => {
  const date = new Date(event.date);
  const day = String(date.getDate()).padStart(2, "0");
  const month = MONTHS[date.getMonth()];
  const year = date.getFullYear();
  const deleteLabel = `${event.description.slice(0, 30)}${event.description.length > 30 ? "..." : ""}`;

  return (
    <div className="flex overflow-hidden rounded-xl border border-gray-200 bg-white transition-colors hover:border-gray-300 dark:border-gray-700 dark:bg-gray-900 dark:hover:border-gray-600">
      {/* date panel */}
      <div className="flex min-w-[72px] flex-shrink-0 flex-col items-center justify-center gap-0.5 bg-[#1e3a6e] px-5">
        <span className="text-3xl leading-none font-bold text-white">
          {day}
        </span>
        <span className="mt-1 text-[11px] font-semibold tracking-wide text-blue-300 uppercase">
          {month}
        </span>
        <span className="text-[10px] text-blue-400">{year}</span>
      </div>

      {/* body */}
      <div className="flex min-w-0 flex-1 flex-col gap-2 p-4">
        <p className="text-sm leading-snug font-medium text-gray-900 dark:text-white">
          {event.description}
        </p>

        <div className="flex flex-col gap-1.5">
          <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
            <IoTimeOutline size={13} />
            <span>{formatTimeWithOffset(event.date, event.time)}</span>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
            <IoLocationOutline size={13} />
            <span>{event.venue}</span>
          </div>
        </div>

        {isRep && (
          <div className="flex items-center gap-2 border-t border-gray-100 pt-2 dark:border-gray-800">
            <button
              onClick={() => onEdit(event)}
              className="flex cursor-pointer items-center gap-1 rounded-lg border border-gray-200 bg-gray-50 px-2.5 py-1 text-xs font-medium text-gray-700 transition-colors hover:bg-gray-100 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
            >
              <FiEdit3 size={12} />
              Edit
            </button>
            <button
              onClick={() => onDelete(event.id, deleteLabel)}
              className="flex cursor-pointer items-center gap-1 rounded-lg border border-red-200 px-2.5 py-1 text-xs font-medium text-red-500 transition-colors hover:bg-red-50 dark:border-red-900 dark:hover:bg-red-950"
            >
              <MdDeleteForever size={12} />
              Delete
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
