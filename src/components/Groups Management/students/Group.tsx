import StudentGroups from "../../Student Management/reps/StudentGroups.tsx";
import useStudentData from "../../../hooks/useStudentData.tsx";
import useAuth from "../../../hooks/useAuth.ts";

const Groups = () => {
  const { user } = useAuth();
  const { studentData, isLoading, error } = useStudentData(user?.data?.id);

  return (
    <StudentGroups
      isLoading={isLoading}
      error={error}
      studentData={studentData}
    />
  );
};

export default Groups;