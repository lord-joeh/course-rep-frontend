import { useState } from "react";
import ToastMessage from "../../common/ToastMessage";
import { Card, Spinner } from "flowbite-react";
import { groupType, StudentGroupsProps } from "../../../utils/Interfaces";

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

  const closeToast = () => setToast((prev) => ({ ...prev, isVisible: false }));

  return (
    <div className="flex flex-col gap-5">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
        Groups
      </h1>

      {error && !isLoading && (
        <Card className="p-4 text-center text-red-500">
          <p>{error}</p>
        </Card>
      )}

      {isLoading && !error && (
        <div className="flex py-8">
          <Spinner size="lg" />
        </div>
      )}

      {!error && !isLoading && studentData?.Groups && (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          {studentData?.Groups.map((group: groupType) => (
            <Card key={group?.id} className="overscroll-x-auto">
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {group?.name || ""}
              </p>
              <p className="text-lg font-semibold text-gray-900 dark:text-white">
                {group?.Course?.name || "General Group"}
              </p>
              <p className="text-gray-900 dark:text-white">
                {group?.GroupMember.isLeader ? "Leader" : "Member"}
              </p>
            </Card>
          ))}
        </div>
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
