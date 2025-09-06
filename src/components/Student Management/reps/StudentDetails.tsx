import StudentInfo from "./StudentInfo";
import StudentGroups from "./StudentGroups";
import { Button } from "flowbite-react";
import { FaArrowLeft } from "react-icons/fa";
import { useNavigate, useParams } from "react-router-dom";
import useStudentData from "../../../hooks/useStudentData";

const StudentDetails = () => {
  const navigate = useNavigate();
  const { studentId } = useParams();
  const { studentData, isLoading, error } = useStudentData(studentId);

  const defaultStudentData = {
    name: "",
    phone: "",
    email: "",
    id: "",
    status: "",
    isRep: false,
    Groups: [],
  };

  return (
    <>
      <Button
        color="alternative"
        className="cursor-pointer"
        onClick={() => navigate(-1)}
      >
        <FaArrowLeft className="me-2" />
        Back
      </Button>
      <div className="grid grid-cols-1 gap-6 p-3 font-sans sm:grid-cols-2">
        <StudentInfo
          studentData={studentData ?? defaultStudentData}
          isLoading={isLoading}
          error={error}
        />

        <StudentGroups
          studentData={studentData ?? defaultStudentData}
          isLoading={isLoading}
          error={error}
        />
      </div>
    </>
  );
};

export default StudentDetails;
