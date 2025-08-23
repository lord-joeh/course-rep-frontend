import { useState, useEffect } from "react";
import axios from "axios";
import { studentById } from "../services/studentService";

interface StudentInfoProps {
  name: string;
  phone: string;
  email: string;
  id: string;
  status: string;
  isRep: boolean;
  Groups: [];
}

const useStudentData = (studentId: string | undefined) => {
  const [studentData, setStudent] = useState<StudentInfoProps | null>(null);
  const [isLoading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!studentId) {
      setLoading(false);
      setError("Student ID is missing.");
      return;
    }

    const fetchStudent = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await studentById(studentId);
        const results = response?.data;
        console.log(response?.data);

        if (results) {
          setStudent(results);
        } else {
          setError("Student not found.");
        }
      } catch (err) {
        if (axios.isAxiosError(err)) {
          setError(
            err.response?.data?.error || "Failed to fetch student details.",
          );
        } else {
          setError("An unexpected error occurred while fetching student.");
        }
      } finally {
        setLoading(false);
      }
    };
    fetchStudent();
  }, [studentId]);

  return { studentData, isLoading, error };
};

export default useStudentData;
