import { Button, Label, Radio, Select, TextInput } from "flowbite-react";
import { ChangeEvent, useCallback, useEffect, useState } from "react";
import { MdBookmarkAdd } from "react-icons/md";
import { RiUserLocationFill } from "react-icons/ri";
import {
  AddNewAttendanceInstanceInterface,
  Course,
} from "../../../utils/Interfaces";
import { addAttendanceInstance } from "../../../services/attendanceService";
import { useCrud } from "../../../hooks/useCrud";
import { FaSearchLocation } from "react-icons/fa";
import ToastMessage from "../../common/ToastMessage";

interface Props {
  courses: Course[];
  onSuccess?: () => void;
}

const AddNewAttendanceInstance = ({ courses, onSuccess }: Props) => {
  const [instanceData, setInstanceData] =
    useState<AddNewAttendanceInstanceInterface>({
      courseId: "",
      date: new Date().toISOString().split("T")[0],
      classType: "in-person",
      latitude: 0,
      longitude: 0,
    });

  const [isLocating, setIsLocating] = useState(false);

  const crudServices = {
    list: async () => {
      return { data: [] as AddNewAttendanceInstanceInterface[] };
    },
    add: addAttendanceInstance,
  };

  const { add, showToast, loading, toast, closeToast } =
    useCrud<AddNewAttendanceInstanceInterface>(crudServices);

  const handleTypeChange = (e: ChangeEvent<HTMLInputElement>) => {
    setInstanceData((prev) => ({
      ...prev,
      classType: e.target.value as "in-person" | "online",
    }));
  };

  const getLocation = useCallback(() => {
    if (!navigator.geolocation) {
      showToast("Geolocation is not supported by this browser.", "error");
      return;
    }

    setIsLocating(true);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setInstanceData((prev) => ({
          ...prev,
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        }));
        setIsLocating(false);
      },
      (error) => {
        setIsLocating(false);
        let msg = "Error obtaining location.";
        if (error.code === 1) msg = "Location permission denied.";
        else if (error.code === 2) msg = "Location unavailable (check GPS).";
        else if (error.code === 3) msg = "Location request timed out.";
        showToast(msg, "error");
      },
      { enableHighAccuracy: true, timeout: 15000 },
    );
  }, [showToast]);

  const handleSubmit = async (e: ChangeEvent<HTMLFormElement>) => {
    e.preventDefault();

    let errMessage = "";
    if (!instanceData.courseId) {
      errMessage = "Please select a course.";
    } else if (!instanceData.date) {
      errMessage = "Please select a date.";
    } else if (
      instanceData.classType === "in-person" &&
      (instanceData.latitude === 0 || instanceData.longitude === 0)
    ) {
      errMessage = "Valid location is required for in-person classes.";
    }

    if (errMessage) {
      return showToast(errMessage, "error");
    }

    await add(instanceData);
    onSuccess?.();
  };

  useEffect(() => {
    getLocation();
  }, []);

  return (
    <div className="container flex max-w-lg flex-col justify-center gap-5 dark:text-white">
      <h1 className="text-2xl font-semibold tracking-normal">
        Add New Attendance Instance
      </h1>

      <form
        className="container flex flex-col justify-center gap-5"
        onSubmit={handleSubmit}
      >
        <div className="block">
          <Label htmlFor="course" className="mb-2 block font-medium">
            Course
          </Label>
          <Select
            id="course"
            name="courseId"
            required
            value={instanceData.courseId}
            onChange={(e) =>
              setInstanceData((prev) => ({ ...prev, courseId: e.target.value }))
            }
          >
            <option value="" disabled>
              Select Course
            </option>
            {courses?.map((course) => (
              <option key={course?.id} value={course?.id}>
                {course?.name}
              </option>
            ))}
          </Select>
        </div>

        <div className="block">
          <Label htmlFor="date" className="mb-2 block font-medium">
            Date
          </Label>
          <TextInput
            id="date"
            name="date"
            type="date"
            value={instanceData.date}
            onChange={(e) =>
              setInstanceData((prev) => ({ ...prev, date: e.target.value }))
            }
            required
          />
        </div>

        <div className="block">
          <Label className="mb-2 block font-medium">Type of Class</Label>
          <div className="mt-3 flex gap-7">
            <div className="flex items-center gap-4">
              <Radio
                id="in-person"
                value="in-person"
                checked={instanceData.classType === "in-person"}
                onChange={handleTypeChange}
              />
              <Label htmlFor="in-person"> Face To Face </Label>
            </div>
            <div className="flex items-center gap-4">
              <Radio
                id="online"
                value="online"
                checked={instanceData.classType === "online"}
                onChange={handleTypeChange}
              />
              <Label htmlFor="online"> Online </Label>
            </div>
          </div>
        </div>

        <hr className="border-gray-200 dark:border-gray-700" />

        <div className="rounded-lg bg-gray-50 p-4 dark:bg-gray-800">
          <div className="flex items-center justify-between">
            <h3 className="font-medium">Location Status</h3>
            <Button
              size="xs"
              color="gray"
              onClick={getLocation}
              disabled={isLocating}
            >
              {isLocating ? "Locating..." : "Refresh Location"}
            </Button>
          </div>

          <div className="mt-3">
            {instanceData?.latitude ? (
              <div className="flex items-center gap-2 text-sm text-green-600 dark:text-green-400">
                <RiUserLocationFill size={20} />
                <span>
                  Lat: {instanceData.latitude.toFixed(6)}, Long:{" "}
                  {instanceData.longitude?.toFixed(6)}
                </span>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-sm text-red-500">
                <FaSearchLocation size={20} />
                <span>
                  {isLocating
                    ? "Acquiring GPS coordinates..."
                    : "Location not found. Click Refresh."}
                </span>
              </div>
            )}
            <p className="mt-2 text-xs text-gray-500">
              Required for Face-to-Face classes only.
            </p>
          </div>
        </div>

        <Button type="submit" className="mt-2" disabled={loading || isLocating}>
          <MdBookmarkAdd size={20} className="me-2" />
          Create Attendance Instance
        </Button>
      </form>

      {toast && (
        <ToastMessage
          message={toast.message}
          type={toast.type}
          onClose={closeToast}
        />
      )}
    </div>
  );
};

export default AddNewAttendanceInstance;
