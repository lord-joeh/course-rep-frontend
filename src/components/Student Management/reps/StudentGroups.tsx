import { useState } from "react";
import ToastMessage from "../../common/ToastMessage";
import { Spinner } from "flowbite-react";
import { groupType, StudentGroupsProps } from "../../../utils/Interfaces";
import { IoEyeOutline } from "react-icons/io5";
import { useNavigate } from "react-router-dom";
import useAuth from "../../../hooks/useAuth";

const StudentGroups = ({
  studentData,
  isLoading,
  error,
}: StudentGroupsProps) => {
  const [toast, setToast] = useState<{
    message: string;
    type: "error" | "success";
    isVisible: boolean;
  }>({
    message: "",
    type: "error",
    isVisible: false,
  });
  const navigate = useNavigate();
  const { user } = useAuth();

  const closeToast = () => setToast((prev) => ({ ...prev, isVisible: false }));

  return (
    <div className="flex flex-col gap-5">
      <h1 className="text-xl font-medium text-gray-900 dark:text-white">
        Groups
      </h1>

      {error && !isLoading && (
        <p className="text-center text-sm text-red-500">{error}</p>
      )}

      {isLoading && !error && (
        <div className="flex justify-center py-8">
          <Spinner size="lg" />
        </div>
      )}

      {!error && !isLoading && studentData?.Groups && (
        <>
          {studentData.Groups.length === 0 ? (
            <p className="text-center text-sm text-gray-400 dark:text-gray-500">
              You are not part of any group.
            </p>
          ) : (
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2 2xl:grid-cols-3">
              {studentData.Groups.map((group: groupType) => {
                const isLeader = group?.GroupMember?.isLeader;
                const destination = user?.isRep
                  ? `/reps/groups/${group.id}`
                  : `/students/groups/${group.id}`;

                return (
                  <div
                    key={group.id}
                    className="flex flex-col gap-3 rounded-xl border border-gray-200 bg-white p-5 transition-colors hover:border-gray-300 dark:border-gray-700 dark:bg-gray-900 dark:hover:border-gray-600"
                  >
                    {/* header */}
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {group?.name || "Unnamed Group"}
                      </p>
                      <span
                        className={`inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                          isLeader
                            ? "bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-400"
                            : "bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400"
                        }`}
                      >
                        {isLeader && "★ "}
                        {isLeader ? "Leader" : "Member"}
                      </span>
                    </div>

                    {/* course */}
                    <div className="flex items-center gap-1.5 text-xs text-gray-400 dark:text-gray-500">
                      <IoEyeOutline size={13} className="shrink-0" />
                      {group?.Course?.name || "General Group"}
                    </div>

                    {/* footer */}
                    <div className="flex justify-end border-t border-gray-100 pt-3 dark:border-gray-800">
                      <button
                        onClick={() => navigate(destination)}
                        className="flex cursor-pointer items-center gap-1.5 rounded-lg border border-gray-200 bg-gray-50 px-3 py-1.5 text-xs font-medium text-gray-700 transition-colors hover:bg-gray-100 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
                      >
                        <IoEyeOutline size={13} />
                        View members
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

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

export default StudentGroups;
