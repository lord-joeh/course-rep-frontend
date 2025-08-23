import StudentInfo from "./StudentInfo";
import StudentGroups from "./StudentGroups";
import { Button } from "flowbite-react";
import { FaArrowLeft } from "react-icons/fa";
import { useNavigate } from "react-router-dom";

const StudentDetails = () => {
  const navigate = useNavigate();
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
        <StudentInfo />

        <StudentGroups />
      </div>
    </>
  );
};

export default StudentDetails;
