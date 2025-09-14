import api from "../utils/api";
interface Course {
  id: string;
  name: string;
  lecturerId: string;
  day: string;
  start_time: string;
  end_time: string;
  semester: string;
  slidesFolderID: string;
  createdAt: string;
}

interface CourseStudentData {
  courseId: string;
  studentId: string;
}

export const courses = async () => {
  const response = await api.get(`/courses/`);
  if (!response?.data) throw new Error("Failed fetching courses");
  return response.data;
};

export const courseByStudent = async (id: string) => {
  const response = await api.get(`/courses/student/${id}`);
  if (!response?.data) throw new Error("Failed fetching course by student");
  return response.data;
};

export const updateCourse = async (id: string, courseData: Course) => {
  const response = await api.put(`/courses/${id}`, courseData);
  if (!response?.data) throw new Error("Failed updating course");
  return response.data;
};

export const registerCourse = async (courseData: CourseStudentData) => {
  const response = await api.post(`/courses/register`, courseData);
  if (!response?.data) throw new Error("Failed registering course");
  return response.data;
};

export const addCourse = async (courseData: Course) => {
  const response = await api.post(`/courses/`, courseData);
  if (!response?.data) throw new Error("Failed adding course");
  return response.data;
};

export const deleteCourse = async (id: string) => {
  const response = await api.delete(`/courses/${id}`);
  if (!response?.data) throw new Error("Failed deleting course");
  return response.data;
};
