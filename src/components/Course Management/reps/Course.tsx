import React, { useState, useEffect, useMemo } from "react";
import { isAxiosError } from "axios";
import * as courseService from "../../../services/courseService";
import useAuth from "../../../hooks/useAuth";
import { DeleteConfirmationDialogue } from "../../common/DeleteConfirmationDialogue";
import ToastMessage from "../../common/ToastMessage";
import CommonModal from "../../common/CommonModal";
import { getLecturers } from "../../../services/lecturerService";
import {
  MdDeleteForever,
  MdOutlineBookmarkAdd,
  MdRefresh,
} from "react-icons/md";
import {
  Button,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeadCell,
  TableRow,
  Spinner,
  Tooltip,
} from "flowbite-react";
import { formatTimeWithOffset } from "../../../helpers/formatTime";
import { CiEdit } from "react-icons/ci";
import { IoCheckmarkCircleSharp } from "react-icons/io5";

import {
  CourseInterface,
  ModalState,
  ToastInterface,
  Lecturer,
  CourseStudentData,
} from "../../../utils/Interfaces";
import { CourseModalContent } from "./CourseModalContent";

const Course = () => {
  const [courses, setCourses] = useState<CourseInterface[]>([]);
  const [lecturers, setLecturers] = useState<Lecturer[]>([]);
  const { user } = useAuth();
  const [courseStudent, setCourseStudent] = useState<CourseStudentData>({
    courseId: "",
    studentId: user ? user?.data?.id : "",
  });
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setLoading] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [editId, setEditId] = useState<string | null>(null);

  const [formData, setFormData] = useState<CourseInterface>({
    id: "",
    name: "",
    day: "",
    start_time: "",
    end_time: "",
    semester: "",
    slidesFolderID: "",
    lecturerId: "",
    createdAt: "",
  });

  const [toast, setToast] = useState<ToastInterface>({
    message: "",
    type: "error",
    isVisible: false,
  });
  const [modalState, setModalState] = useState<ModalState>({
    isDeleteDialogueOpen: false,
    isModalOpen: false,
    isDeleting: false,
    isEditing: false,
    itemToDelete: "",
    idToDelete: "",
    isAdding: false,
  });

  const courseTableHeader = [
    "#",
    "COURSE CODE",
    "COURSE",
    "DAY",
    "TIME",
    "ACTIONS",
  ];

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const showToast = (message: string, type: "success" | "error") =>
    setToast({ message, type, isVisible: true });

  const closeToast = () => {
    setToast((prev) => ({ ...prev, isVisible: false }));
  };

  const closeDialogue = () =>
    setModalState((prev) => ({ ...prev, isDeleteDialogueOpen: false }));

  const closeModal = () =>
    setModalState((prev) => ({ ...prev, isModalOpen: false }));

  const fetchCoursesData = async () => {
    try {
      setLoading(true);
      setError(null);
      const apiCalls = [courseService.courses(), getLecturers()];

      const [courseResponse, lecturerResponse] = await Promise.all(apiCalls);

      setCourses(courseResponse.data || []);
      setLecturers(lecturerResponse?.data || []);
    } catch (error) {
      if (isAxiosError(error)) {
        showToast(
          error.response?.data?.message?.error || "Error fetching courses",
          "error",
        );
      } else {
        showToast("An unexpected error occurred.", "error");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCourseRegister = async (courseId: string) => {
    try {
      setLoading(true);
      setError(null);

      const registerData = { ...courseStudent, courseId: courseId };

      const response = await courseService.registerCourse(registerData);

      if (!response) return;
      showToast(response?.message, "success");
    } catch (error) {
      if (isAxiosError(error)) {
        showToast(
          error.response?.data?.error || "Error registering courses",
          "error",
        );
      } else {
        showToast(
          "An unexpected error occurred while registering course.",
          "error",
        );
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = () => {
    fetchCoursesData().catch((err) => console.log(err));
  };

  const filteredCourses = useMemo(() => {
    if (!searchQuery) return courses;
    const lowerQuery = searchQuery.toLowerCase();
    return courses.filter((course) =>
      Object.values(course).some((value) =>
        String(value).toLowerCase().includes(lowerQuery),
      ),
    );
  }, [courses, searchQuery]);

  useEffect(() => {
    fetchCoursesData().catch((err) => console.log(err));
    setCourseStudent((prev) => ({
      ...prev,
      studentId: user ? user?.data?.id : "",
    }));
  }, []);

  const handleCourseSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const courseData = {
      ...formData,
      start_time: `${formData.start_time}:00+01`,
      end_time: `${formData.end_time}:00+01`,
    };
    if (modalState.isEditing && editId) {
      try {
        setModalState((prev) => ({ ...prev, isAdding: true }));
        const response = await courseService.updateCourse(editId, courseData);
        showToast(
          response?.message ||
          response?.data?.message ||
          "Course updated successfully",
          "success",
        );
        fetchCoursesData().catch((err) => console.log(err));
      } catch (err) {
        if (isAxiosError(err)) {
          showToast(
            err.response?.data?.error || "Failed to update Course.",
            "error",
          );
        } else {
          showToast(
            "An unexpected error occurred while updating Course.",
            "error",
          );
        }
      } finally {
        setModalState((prev) => ({
          ...prev,
          isAdding: false,
          isModalOpen: false,
          isEditing: false,
        }));
        setEditId(null);
        setFormData((prev) => ({
          ...prev,
          id: "",
          name: "",
          day: "",
          start_time: "",
          end_time: "",
          semester: "",
          slidesFolderID: "",
          lecturerId: "",
        }));
      }
    } else {
      try {
        setModalState((prev) => ({ ...prev, isAdding: true }));
        const response = await courseService.addCourse(courseData);
        showToast(
          response?.data?.message || "Course added successfully",
          "success",
        );
        fetchCoursesData().catch((err) => console.log(err));
      } catch (err) {
        if (isAxiosError(err)) {
          showToast(
            err.response?.data?.error || "Failed to add Course.",
            "error",
          );
        } else {
          showToast(
            "An unexpected error occurred while adding Event.",
            "error",
          );
        }
      } finally {
        setModalState((prev) => ({
          ...prev,
          isAdding: false,
          isModalOpen: false,
          isEditing: false,
        }));
        setFormData((prev) => ({
          ...prev,
          id: "",
          name: "",
          day: "",
          start_time: "",
          end_time: "",
          semester: "",
          slidesFolderID: "",
          lecturerId: "",
        }));
        setEditId(null);
      }
    }
  };

  const handleCourseDelete = async (id: string) => {
    try {
      setModalState((prev) => ({ ...prev, isDeleting: true }));
      const response = await courseService.deleteCourse(id);
      showToast(
        response?.data?.message || "Event deleted successfully",
        "success",
      );
      fetchCoursesData().catch((err) => console.log(err));
    } catch (err) {
      if (isAxiosError(err)) {
        showToast(
          err.response?.data?.error || "Failed to delete Event.",
          "error",
        );
      } else {
        showToast(
          "An unexpected error occurred while deleting Event.",
          "error",
        );
      }
    } finally {
      setModalState((prev) => ({
        ...prev,
        isDeleting: false,
        isDeleteDialogueOpen: false,
      }));
    }
  };

  return (
    <div className="flex flex-col gap-6 p-6 font-sans md:p-1">
      <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
        {user && user.isRep ? "Course Management" : "Courses"}
      </h1>

      <div className="flex w-full items-center gap-3">
        <div className="flex min-w-0 flex-1">
          <input
            id="search"
            type="search"
            placeholder="Search course..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            aria-label="Search courses"
            className="w-full min-w-0 rounded-lg border px-4 py-2 focus:outline-none"
          />
        </div>

        <Button
          onClick={handleRefresh}
          className="shrink-0 flex items-center gap-2 px-3 py-2"
          aria-label="Refresh courses"
        >
          <MdRefresh size={18} className="me-1" /> Refresh
        </Button>
      </div>
      {user?.isRep && (
        <Button
          onClick={() => {
            setModalState((prev) => ({
              ...prev,
              isModalOpen: true,
              isEditing: false,
            }));
          }}
          className="flex w-50 justify-start"
        >
          <MdOutlineBookmarkAdd className="me-2 h-4 w-4" /> Add New Course
        </Button>
      )}
      <div className="overflow-x-auto rounded-lg shadow-md">
        <Table striped>
          <TableHead>
            <TableRow>
              {courseTableHeader.map((head, idx) => (
                <TableHeadCell key={idx}>{head}</TableHeadCell>
              ))}
            </TableRow>
          </TableHead>

          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={courseTableHeader.length}>
                  <Spinner size="lg" className="me-4 animate-spin" />{" "}
                </TableCell>
              </TableRow>
            ) : filteredCourses.length > 0 ? (
              filteredCourses.map((course: CourseInterface, index) => (
                <TableRow
                  key={course?.id}
                  className="hover:bg-gray-200 hover:dark:bg-gray-600"
                >
                  <TableCell>{index + 1}</TableCell>
                  <TableCell>{course?.id}</TableCell>
                  <TableCell>{course?.name}</TableCell>
                  <TableCell>{course?.day}</TableCell>
                  <TableCell>{`${formatTimeWithOffset(course?.createdAt, course?.start_time)} - ${formatTimeWithOffset(course?.createdAt, course?.end_time)}`}</TableCell>
                  <TableCell>
                    <div className="flex gap-3">
                      <Tooltip content="Register Course">
                        <IoCheckmarkCircleSharp
                          size={30}
                          className="cursor-pointer"
                          onClick={() => handleCourseRegister(course?.id)}
                        />
                      </Tooltip>
                      {user?.isRep && (
                        <>
                          {" "}
                          <Tooltip content="Edit">
                            <CiEdit
                              size={24}
                              color="green"
                              className="cursor-pointer"
                              onClick={() => {
                                setFormData((prev) => ({
                                  ...prev,
                                  id: course?.id,
                                  name: course?.name,
                                  lecturerId: course?.lecturerId,
                                  day: course?.day,
                                  start_time: course?.start_time,
                                  end_time: course?.end_time,
                                  semester: course?.semester,
                                  slidesFolderID: course?.slidesFolderID,
                                }));
                                setEditId(course?.id);
                                setModalState((prev) => ({
                                  ...prev,
                                  isModalOpen: true,
                                  isEditing: true,
                                }));
                              }}
                            />
                          </Tooltip>
                          <Tooltip content="Delete">
                            <MdDeleteForever
                              size={24}
                              color="red"
                              className="cursor-pointer"
                              onClick={() =>
                                setModalState((prev) => ({
                                  ...prev,
                                  isDeleteDialogueOpen: true,
                                  itemToDelete: course?.name || "",
                                  idToDelete: course?.id || "",
                                }))
                              }
                            />
                          </Tooltip>{" "}
                        </>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={courseTableHeader.length}
                  className="py-8 text-center text-gray-500"
                >
                  No course found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      {error && <p className="text-red-700">{error}</p>}
      {toast.isVisible && (
        <ToastMessage
          message={toast.message}
          type={toast.type}
          onClose={closeToast}
        />
      )}
      <DeleteConfirmationDialogue
        isOpen={modalState.isDeleteDialogueOpen}
        isDeleting={modalState.isDeleting}
        handleDelete={() => handleCourseDelete(modalState.idToDelete)}
        onClose={closeDialogue}
        itemToDelete={modalState.itemToDelete}
      />
      <CommonModal
        open={modalState.isModalOpen}
        onClose={() => {
          closeModal();
          setEditId(null);
          setModalState((prev) => ({
            ...prev,
            isEditing: false,
          }));
          setFormData((prev) => ({
            ...prev,
            id: "",
            name: "",
            day: "",
            start_time: "",
            end_time: "",
            semester: "",
            slidesFolderID: "",
            lecturerId: "",
          }));
        }}
      >
        {
          <CourseModalContent
            modalState={modalState}
            setModalState={setModalState}
            handleCourseSubmit={handleCourseSubmit}
            formData={formData}
            setFormData={setFormData}
            handleChange={handleChange}
            setEditId={setEditId}
            lecturers={lecturers}
          />
        }
      </CommonModal>
    </div>
  );
};

export default Course;
