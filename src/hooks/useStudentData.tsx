import { useState, useEffect } from "react";
import { isAxiosError } from "axios";
import { studentById } from "../services/studentService";
import { groupType } from "../utils/Interfaces";

interface StudentInfoProps {
  name: string;
  phone: string;
  email: string;
  id: string;
  status: string;
  isRep: boolean;
  Groups: groupType[];
}

const useStudentData = (studentId: string | undefined) => {
  const [studentData, setStudentData] = useState<StudentInfoProps | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!studentId) {
      setIsLoading(false);
      setError("Student ID is missing.");
      return;
    }

    const fetchStudent = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await studentById(studentId);
        const results = response?.data;
        if (results) {
          setStudentData(results);
        } else {
          setError("Student not found.");
        }
      } catch (err) {
        if (isAxiosError(err)) {
          setError(
            err.response?.data?.error || "Failed to fetch student details.",
          );
        } else {
          setError("An unexpected error occurred while fetching student.");
        }
      } finally {
        setIsLoading(false);
      }
    };
    fetchStudent().catch((err) => {console.log(err)});
  }, [studentId]);

  return { studentData, isLoading, error };
};

export default useStudentData;
