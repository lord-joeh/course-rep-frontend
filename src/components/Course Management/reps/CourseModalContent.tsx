import {
  CourseInterface,
  CourseModalContentInterface,
  Lecturer,
  ModalState,
} from "../../../utils/Interfaces.ts";
import { Button, Label, Select, TextInput } from "flowbite-react";
import { FaBook } from "react-icons/fa6";
import { IoTimeOutline, IoTodayOutline } from "react-icons/io5";

export const CourseModalContent = ({
  modalState,
  setModalState,
  handleChange,
  handleCourseSubmit,
  setFormData,
  formData,
  lecturers,
  setEditId
}: CourseModalContentInterface) => {


  return (
    <div className="flex flex-col justify-center gap-5">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
        {modalState.isEditing ? "Edit Course" : "New Course"}
      </h1>

      <form onSubmit={handleCourseSubmit} className="flex flex-col gap-4">
        <>
          <div>
            <div className="md-4 mt-2 block">
              <Label htmlFor="Course Id"> Code</Label>
            </div>
            <TextInput
              type="text"
              id="course-id"
              placeholder="Course code"
              name="id"
              required
              value={formData?.id}
              onChange={handleChange}
              disabled={modalState.isAdding}
              className="sm:text-sm md:text-base"
              autoComplete="off"
            />
          </div>

          <div>
            <div className="md-4 mt-2 block">
              <Label htmlFor="Course Name"> Title</Label>
            </div>
            <TextInput
              type="text"
              id="course-name"
              placeholder="Course title"
              name="name"
              required
              value={formData.name}
              onChange={handleChange}
              disabled={modalState.isAdding}
              icon={FaBook}
              className="sm:text-sm md:text-base"
              autoComplete="off"
            />
          </div>

          <div>
            <div className="md-4 mt-2 block">
              <Label htmlFor="Course day"> Day</Label>
            </div>
            <TextInput
              type="text"
              id="course-day"
              placeholder="Day"
              name="day"
              required
              value={formData.day}
              onChange={handleChange}
              disabled={modalState.isAdding}
              icon={IoTodayOutline}
              className="sm:text-sm md:text-base"
              autoComplete="off"
            />
          </div>

          <div>
            <div className="md-4 mt-2 block">
              <Label htmlFor="Course-start-time"> Start Time</Label>
            </div>
            <TextInput
              type="time"
              id="course-start-time"
              name="start_time"
              required
              value={formData.start_time ? formData.start_time.slice(0, 5) : ""}
              onChange={handleChange}
              disabled={modalState.isAdding}
              icon={IoTimeOutline}
              className="sm:text-sm md:text-base"
              autoComplete="off"
            />
          </div>

          <div>
            <div className="md-4 mt-2 block">
              <Label htmlFor="Course-end-time"> End Time</Label>
            </div>
            <TextInput
              type="time"
              id="course-end-time"
              name="end_time"
              required
              value={formData.end_time ? formData.end_time.slice(0, 5) : ""}
              onChange={handleChange}
              disabled={modalState.isAdding}
              icon={IoTimeOutline}
              className="sm:text-sm md:text-base"
              autoComplete="off"
            />
          </div>

          <div>
            <div className="md-4 mt-2 block">
              <Label htmlFor="Course-semester">Semester</Label>
            </div>
            <TextInput
              type="text"
              id="course-semester"
              name="semester"
              required
              placeholder="First semester / Second semester"
              value={formData.semester}
              onChange={handleChange}
              disabled={modalState.isAdding}
              className="sm:text-sm md:text-base"
              autoComplete="off"
            />
          </div>

          <div>
            <div className="md-4 mt-2 block">
              <Label htmlFor="Course-lecturer">Lecturer</Label>
            </div>
            <Select
              id="lecturers"
              required
              onChange={handleChange}
              value={formData?.lecturerId}
              name="lecturerId"
            >
              <option value="" disabled>
                Select Lecturer
              </option>
              {lecturers.map((lecturer: Lecturer) => (
                <option key={lecturer?.id} value={lecturer?.id}>
                  {lecturer?.name}
                </option>
              ))}
            </Select>
          </div>
        </>
        <div className="mt-4 flex justify-center gap-4">
          <Button type="submit" disabled={modalState.isAdding} color="green">
            {modalState.isAdding
              ? modalState.isEditing
                ? "Updating Course..."
                : "Adding Course..."
              : modalState.isEditing
                ? "Update Course"
                : "Add Course"}
          </Button>

          <Button
            color="alternative"
            type="button"
            onClick={() => {
              setModalState((prev: ModalState) => ({
                ...prev,
                isModalOpen: false,
                isEditing: false,
              }));
              setEditId(null);
              setFormData((prev: CourseInterface) => ({
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
            Cancel
          </Button>
        </div>
      </form>
    </div>
  )
};
