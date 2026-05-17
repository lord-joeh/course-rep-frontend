import { FiDownload, FiFile } from "react-icons/fi";
import { SlideInterface } from "../../../utils/Interfaces";
import { Tooltip } from "flowbite-react";
import { MdDelete } from "react-icons/md";

interface SlideCardProps {
  slide: SlideInterface;
  isRep: boolean;
  onDownload: (driveFileID: string) => void;
  onDelete: (id: string, fileName: string) => void;
}

export const SlideCard = ({
  slide,
  isRep,
  onDownload,
  onDelete,
}: SlideCardProps) => {
  const formattedDate = new Date(slide.createdAt).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  return (
    <div className="group flex flex-col gap-3 rounded-xl border border-gray-200 bg-white p-5 transition-colors hover:border-gray-300 dark:border-gray-700 dark:bg-gray-900 dark:hover:border-gray-600">
      {/* header */}
      <div className="flex items-center gap-3">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-blue-50 dark:bg-blue-950">
          <FiFile size={20} className="text-blue-500 dark:text-blue-400" />
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-gray-900 dark:text-white">
            {slide.fileName || "Untitled Slide"}
          </p>
          <p className="text-xs text-gray-400 dark:text-gray-500">
            Added {formattedDate}
          </p>
        </div>
      </div>

      {/* actions */}
      <div className="flex items-center gap-2 border-t border-gray-100 pt-3 dark:border-gray-800">
        <button
          onClick={() => onDownload(slide.driveFileID)}
          className="flex flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-lg border border-gray-200 bg-gray-50 px-3 py-1.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-100 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
        >
          <FiDownload size={15} />
          Download
        </button>

        {isRep && (
          <Tooltip content="Delete slide">
            <button
              onClick={() => onDelete(slide.id, slide.fileName)}
              className="flex h-[34px] w-[34px] shrink-0 cursor-pointer items-center justify-center rounded-lg border border-red-200 text-red-500 transition-colors hover:bg-red-50 dark:border-red-900 dark:hover:bg-red-950"
              aria-label="Delete slide"
            >
              <MdDelete size={17} />
            </button>
          </Tooltip>
        )}
      </div>
    </div>
  );
};
