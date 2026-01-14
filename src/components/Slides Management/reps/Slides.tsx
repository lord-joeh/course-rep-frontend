import {
  CourseInterface,
  ModalState,
  PaginationType,
  SlideInterface,
} from "../../../utils/Interfaces.ts";
import React, { useCallback, useEffect, useState } from "react";
import useAuth from "../../../hooks/useAuth.ts";
import {
  Button,
  Card,
  Label,
  Pagination,
  Select,
  Spinner,
  Tooltip,
} from "flowbite-react";
import { MdDelete, MdRefresh } from "react-icons/md";
import {
  deleteSlide,
  downloadSlide,
  getSlidesByCourse,
} from "../../../services/slidesServices.ts";
import { isAxiosError } from "axios";
import ToastMessage from "../../common/ToastMessage.tsx";
import { courses as getCourses } from "../../../services/courseService.ts";
import { IoCloudUploadOutline } from "react-icons/io5";
import { FiDownload } from "react-icons/fi";
import CommonModal from "../../common/CommonModal.tsx";
import UploadSlide from "./UploadSlide.tsx";
import { DeleteConfirmationDialogue } from "../../common/DeleteConfirmationDialogue.tsx";
import { useSearch } from "../../../hooks/useSearch.ts";
import { useCrud } from "../../../hooks/useCrud.ts";

const Slides = () => {
  const [slides, setSlides] = useState<SlideInterface[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [currentCourse, setCurrentCourse] = useState<string>("");

  const [pagination, setPagination] = useState<PaginationType>({
    currentPage: 1,
    totalPages: 0,
    itemsPerPage: 12,
    totalItems: 0,
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
  const { user } = useAuth();

  const crudServices = {
    list: getCourses,
    download: downloadSlide,
    remove: deleteSlide,
  };
  const {
    items: courses,
    showToast,
    remove,
    download,
    toast,
    closeToast,
  } = useCrud<CourseInterface>(crudServices);

  const fetchSlidesData = async (
    page = 1,
    itemsPerPage = pagination.itemsPerPage || 10,
    courseId = currentCourse,
  ) => {
    if (!courseId || !page || !itemsPerPage) return;
    try {
      setLoading(true);

      const response = await getSlidesByCourse(courseId, itemsPerPage, page);
      if (response) {
        setSlides(response.data?.slides || []);
        setPagination({
          currentPage: response.data?.pagination?.currentPage || 1,
          totalPages: response.data?.pagination?.totalPages,
          itemsPerPage: response.data?.pagination?.itemsPerPage || 10,
          totalItems: response.data?.pagination?.totalItems,
        });
      }
    } catch (error) {
      if (isAxiosError(error)) {
        showToast(
          error.response?.data?.message || "Failed to fetch slides",
          "error",
        );
      } else {
        showToast("Failed to fetch slides", "error");
      }
    } finally {
      setLoading(false);
    }
  };

  const debouncedFetch = useCallback(
    (page: number, perPage: number, courseId: string) => {
      const timeoutId = setTimeout(() => {
        fetchSlidesData(page, perPage, courseId);
      }, 300);

      return () => clearTimeout(timeoutId);
    },
    [],
  );

  const handleRefresh = () => {
    fetchSlidesData(
      pagination.currentPage,
      pagination.itemsPerPage,
      currentCourse,
    ).catch((err) => console.log(err));
  };

  const onPageChange = (pageNumber: number) => {
    setPagination((prev) => ({ ...prev, currentPage: pageNumber }));
  };

  const handleSlideDelete = async (slideId: string) => {
    try {
      setModalState((prev) => ({ ...prev, isDeleting: true }));

      await remove(slideId);
    } catch (error) {
    } finally {
      setModalState((prev) => ({
        ...prev,
        isDeleting: false,
        isDeleteDialogueOpen: false,
      }));
    }
  };

  const handleFileDownload = async (slideId: string) => {
    if (!slideId) return;
    try {
      await download(slideId);
    } catch (error) {}
  };

  const filteredSlides = useSearch<SlideInterface>(slides, searchQuery);

  useEffect(() => {
    const cleanup = debouncedFetch(
      pagination?.currentPage,
      pagination?.itemsPerPage,
      currentCourse,
    );
    return () => cleanup();
  }, [
    pagination?.currentPage,
    pagination?.itemsPerPage,
    debouncedFetch,
    currentCourse,
  ]);

  return (
    <div className="flex flex-col gap-6 font-sans dark:text-white">
      <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
        {user?.isRep ? "Slides Management" : "Slides"}
      </h1>

      <div className="flex w-full items-center gap-3">
        <div className="flex min-w-0 flex-1">
          <input
            id="search"
            type="search"
            placeholder="Search slide..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            aria-label="Search slide"
            className="w-full min-w-0 rounded-lg border px-4 py-2 focus:outline-none dark:bg-gray-700 dark:text-white"
          />
        </div>

        <Button
          onClick={handleRefresh}
          className="flex shrink-0 items-center gap-2 px-3 py-2"
          aria-label="Refresh slides"
        >
          <MdRefresh size={18} className="me-1" /> Refresh
        </Button>
      </div>

      <div className="flex flex-col items-center justify-between gap-3 md:flex-row">
        {user && user.isRep && (
          <Button
            className="w-full justify-center md:w-50"
            onClick={() =>
              setModalState((prev) => ({ ...prev, isAdding: true }))
            }
          >
            <IoCloudUploadOutline className="me-2 h-5 w-5" />
            Upload Slides
          </Button>
        )}

        <Select
          id="courses"
          name="courseId"
          className="w-full justify-center md:w-auto"
          onChange={(e: React.ChangeEvent<HTMLSelectElement>) => {
            setCurrentCourse(e.target.value);
          }}
        >
          <option value="">Select Course for slides</option>
          {courses.map((course) => (
            <option key={course.id} value={course.id}>
              {course.name}
            </option>
          ))}
        </Select>
      </div>

      <div className="flex items-center gap-2">
        <Label htmlFor="entries">Show</Label>
        <Select
          id="entries"
          className="rounded border-none text-gray-900 dark:text-white"
          value={pagination.itemsPerPage}
          onChange={(e) =>
            setPagination((prev) => ({
              ...prev,
              itemsPerPage: Number.parseInt(e.target.value),
              currentPage: 1,
            }))
          }
        >
          <option value={10}>10</option>
          <option value={25}>25</option>
          <option value={50}>50</option>
          <option value={pagination?.totalItems}>All</option>
        </Select>
        Entries
      </div>

      {loading && <Spinner size="lg" className="mr-4 place-self-center" />}

      {filteredSlides?.length > 0 ? (
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
          {filteredSlides.map((slide: SlideInterface) => (
            <Card
              key={slide?.id}
              className="flex flex-col justify-between wrap-break-word"
            >
              <h5 className="text-lg font-bold tracking-tight text-gray-900 dark:text-white">
                {slide.fileName || "Untitled Slide"}
              </h5>

              <div className="flex items-center gap-3">
                <Button
                  className="mt-4 flex-1 cursor-pointer"
                  rel="noopener noreferrer"
                  onClick={() => handleFileDownload(slide.driveFileID)}
                >
                  <FiDownload size={24} className="me-2" />
                  Download Slide
                </Button>

                {user?.isRep && (
                  <Tooltip content="Delete Slide">
                    <MdDelete
                      size={32}
                      color="red"
                      className="me-2 mt-4 cursor-pointer"
                      onClick={() => {
                        setModalState((prev) => ({
                          ...prev,
                          idToDelete: slide.id,
                          itemToDelete: slide.fileName,
                          isDeleteDialogueOpen: true,
                        }));
                      }}
                    />
                  </Tooltip>
                )}
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <div className="text-center text-gray-500 dark:text-gray-400">
          No slides found, Select a course.
        </div>
      )}

      {filteredSlides.length > 0 && (
        <div className="m-2 flex place-self-center sm:justify-center">
          <Pagination
            layout="table"
            currentPage={pagination?.currentPage || 1}
            itemsPerPage={pagination?.itemsPerPage || 10}
            totalItems={pagination?.totalItems || 0}
            onPageChange={onPageChange}
            showIcons
          />
        </div>
      )}

      {toast.visible && (
        <ToastMessage
          message={toast.message}
          type={toast.type}
          onClose={closeToast}
        />
      )}

      {
        <CommonModal
          open={modalState.isAdding}
          onClose={() =>
            setModalState((prev) => ({ ...prev, isAdding: false }))
          }
        >
          <UploadSlide
            courses={courses}
            onSuccess={() =>
              setModalState((prev) => ({ ...prev, isAdding: false }))
            }
          />
        </CommonModal>
      }

      {
        <DeleteConfirmationDialogue
          isDeleting={modalState.isDeleting}
          isOpen={modalState.isDeleteDialogueOpen}
          handleDelete={() => handleSlideDelete(modalState.idToDelete)}
          itemToDelete={modalState.itemToDelete || "this slide"}
          onClose={() =>
            setModalState((prev) => ({ ...prev, isDeleteDialogueOpen: false }))
          }
        />
      }
    </div>
  );
};
export default Slides;
