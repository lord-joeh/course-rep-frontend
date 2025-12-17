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
import { isAxiosError } from "axios";
import { FaSearchLocation } from "react-icons/fa";

const AddNewAttendanceInstance = (courses: Course[]) => {
  const [location, setLocation] = useState<{ lat: number; lon: number } | null>(
    null,
  );
  const [instanceData, setInstanceData] =
    useState<AddNewAttendanceInstanceInterface>({
      courseId: "IT 323",
      date: new Date().toISOString().split("T")[0],
      classType: "in-person",
    });
  const crudServices = {
    list: async () => {
      return { data: [] as AddNewAttendanceInstanceInterface[] };
    },
    add: addAttendanceInstance,
  };

  const { add, showToast } =
    useCrud<AddNewAttendanceInstanceInterface>(crudServices);

  const handleTypeChange = (e: ChangeEvent<HTMLInputElement>) => {
    setInstanceData((prev) => ({
      ...prev,
      classType: e.target.value as "in-person" | "online",
    }));
  };

  const handleSubmit = async (e: ChangeEvent<HTMLFormElement>) => {
    e.preventDefault();

    let errMessage = "";
    if (!instanceData.courseId) {
      errMessage = "Please select a course.";
    } else if (!instanceData.date) {
      errMessage = "Please select a date.";
    } else if (instanceData.classType === "in-person" && location === null) {
      errMessage =
        "Location services must be enabled to create face-to-face attendance instances.";
    }

    if (errMessage) {
      return showToast(errMessage, "error");
    }

    try {
      const response = await add(instanceData);
      if (response) {
        showToast(
          response.message || "Attendance instance created successfully.",
          "success",
        );
      }
    } catch (error) {
      if (isAxiosError(error)) {
        showToast(
          error.response?.data?.message ||
            "An error occurred while creating the attendance instance.",
          "error",
        );
      } else {
        showToast("An unexpected error occurred.", "error");
      }
    }
  };

  const getLocation = useCallback(() => {
    if (!navigator.geolocation) {
      showToast("Geolocation is not supported by this browser.", "error");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocation({
          lat: position.coords.latitude,
          lon: position.coords.longitude,
        });
      },
      (error) => {
        showToast(error?.message || "Error obtaining location", "error");
      },
    );
  }, []);

  const getLocationPermission = useCallback(async () => {
    try {
      const permissionStatus = await navigator.permissions.query({
        name: "geolocation",
      });

      if (permissionStatus.state === "granted") {
        getLocation();
      } else if (permissionStatus.state === "prompt") {
        getLocation();
      } else if (permissionStatus.state === "denied") {
        showToast(
          "Location access is blocked. Please click the lock icon in your address bar to enable it.",
          "error",
        );
      }
    } catch (error) {
      getLocation();
    }
  }, [getLocation]);

  useEffect(() => {
    getLocationPermission();
    setInstanceData((prev) => ({
      ...prev,
      latitude: location?.lat,
      longitude: location?.lon,
    }));
  }, [getLocationPermission]);

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

          <Select id="course" name="courseId" defaultValue="">
            <option value="" disabled>
              Select Course
            </option>
            {/* {courses?.map((course) => (
              <option key={course?.id} value={course?.id}>
                {course?.name}
              </option>
            ))} */}
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
            onChange={(e: ChangeEvent<HTMLInputElement>) =>
              setInstanceData((prev) => ({
                ...prev,
                date: e.target.value,
              }))
            }
            required
            placeholder="Select Date"
          />
        </div>

        <div className="block">
          <Label htmlFor="classType" className="mb-2 block font-medium">
            Type of Class
          </Label>

          <div className="mt-3 flex gap-7">
            <div className="flex items-center gap-4">
              <Radio
                id="in-person"
                name="classType"
                value="in-person"
                checked={instanceData.classType === "in-person"}
                onChange={handleTypeChange}
              />
              <Label htmlFor="in-person"> Face To Face </Label>
            </div>

            <div className="flex items-center gap-4">
              <Radio
                id="online"
                name="classType"
                value="online"
                checked={instanceData.classType === "online"}
                onChange={handleTypeChange}
              />
              <Label htmlFor="online"> Online </Label>
            </div>
          </div>
        </div>

        <span className="text-md text-gray-500 dark:text-gray-300">
          <small>
            Location services are required when creating face-to-face attendance
            instances.
          </small>
        </span>

        {location ? (
          <div className="text-white-600 flex text-sm">
            <span>
              <RiUserLocationFill size={24} color="red" className="me-2" />
            </span>
            <span>
              {" "}
              Latitude: {location.lat}, Longitude: {location.lon}
            </span>
          </div>
        ) : (
          <div className="text-sm text-red-600">
            <p>
              Unable to obtain location. Please ensure location services are
              enabled.
            </p>
            <FaSearchLocation
              size={32}
              className="mt-2 cursor-pointer"
              onClick={getLocationPermission}
            />
          </div>
        )}

        <Button type="submit" className="cursor-pointer">
          <MdBookmarkAdd size={24} className="me-2" />
          Create Attendance Instance{" "}
        </Button>
      </form>
    </div>
  );
};

export default AddNewAttendanceInstance;
