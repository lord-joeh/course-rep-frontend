import React from "react";

type StudentGroupsProps = {
  studentId: string;
};

const StudentGroups = ({ studentId }: StudentGroupsProps) => {
  return (
    <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Groups
        </h1>
        {studentId}
      </div>
  );
};

export default StudentGroups;
