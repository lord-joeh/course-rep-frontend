import React from "react";
import StudentInfo from "../common/StudentInfo";
import StudentGroups from "../common/StudentGroups";
import { useLocation } from "react-router-dom";

const StudentDetails = () => {
  const location = useLocation();
  const studentDetails = location.state;
  const { name, phone, email, id } = studentDetails;

  return (
    <div className="grid grid-cols-1 gap-6 p-3 font-sans sm:grid-cols-2">
      <StudentInfo name={name} phone={phone} email={email} studentId={id} />

      <StudentGroups studentId={id} />
    </div>
  );
};

export default StudentDetails;
