import { useState, useEffect, useCallback, useMemo } from "react";
import * as groupService from "../../../services/groupsService";
import { courses as fetchCoursesList } from "../../../services/courseService";
import { isAxiosError } from "axios";
import ToastMessage from "../../common/ToastMessage";
import CommonModal from "../../common/CommonModal";
import { DeleteConfirmationDialogue } from "../../common/DeleteConfirmationDialogue";
import { MdDeleteForever, MdGroupAdd, MdRefresh } from "react-icons/md";
import {
  Button,
  Card,
  Pagination,
  Spinner,
  Label,
  Tooltip,
} from "flowbite-react";
import { FaEdit, FaMagic } from "react-icons/fa";
import AddNewGroup from "./AddNewGroup";
import { IoEyeOutline } from "react-icons/io5";
import {
  PaginationType,
  GroupInterface,
  Course,
  ToastInterface,
} from "../../../utils/Interfaces";
import EditGroup from "./EditGroup";
import CreateMagicGroups from "./CreateMagicGroups";
import { useNavigate } from "react-router-dom";

export interface ModalState {
  isAdding: boolean;
  doMagic: boolean;
  isDeleteDialogueOpen: boolean;
  isModalOpen: boolean;
  isDeleting: boolean;
  isEditing: boolean;
  itemToDelete: string;
  idToDelete: string;
}

const Groups = () => {
  const [groups, setGroups] = useState<GroupInterface[]>([]);
  const [coursesList, setCoursesList] = useState<Course[]>([]);
  const [isLoading, setLoading] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [filterQuery, setFilterQuery] = useState<string>("");
  const [editForm, setEditForm] = useState<Partial<GroupInterface>>({});
  const [toast, setToast] = useState<ToastInterface>({
    message: "",
    type: "error",
    isVisible: false,
  });
  const navigate = useNavigate();

  const [modalState, setModalState] = useState<ModalState>({
    isDeleteDialogueOpen: false,
    isModalOpen: false,
    isDeleting: false,
    isEditing: false,
    itemToDelete: "",
    idToDelete: "",
    isAdding: false,
    doMagic: false,
  });

  const [pagination, setPagination] = useState<PaginationType>({
    currentPage: 1,
    totalPages: 0,
    itemsPerPage: 12,
    totalItems: 0,
  });

  const showToast = (message: string, type: "success" | "error") =>
    setToast({ message, type, isVisible: true });

  const closeToast = () => {
    setToast((prev) => ({ ...prev, isVisible: false }));
  };

  const fetchCourses = async () => {
    try {
      const response = await fetchCoursesList();
      setCoursesList(response?.data);
    } catch (error) {
      if (isAxiosError(error)) {
        showToast(
          error.response?.data?.error || "Error fetching courses",
          "error",
        );
      } else {
        showToast("An unexpected error occurred.", "error");
      }
    }
  };

  const fetchGroupsData = async (
    page = 1,
    itemsPerPage = pagination.itemsPerPage,
    courseId = filterQuery,
  ) => {
    try {
      setLoading(true);

      const response = await groupService.getGroups(
        page,
        itemsPerPage,
        courseId,
      );

      setGroups(response.data?.groups || []);
      const pageInfo = response.data?.pagination;
      setPagination({
        currentPage: pageInfo.currentPage || page,
        itemsPerPage: pageInfo.itemsPerPage || itemsPerPage,
        totalItems: pageInfo.totalItems || 0,
        totalPages: pageInfo.totalPages || 1,
      });
    } catch (error) {
      if (isAxiosError(error)) {
        showToast(
          error.response?.data?.error || "Error fetching groups",
          "error",
        );
      } else {
        showToast("An unexpected error occurred.", "error");
      }
    } finally {
      setLoading(false);
    }
  };

  const debouncedGroupDataFetch = useCallback(
    (page: number, perPage: number, courseId: string) => {
      const timeoutId = setTimeout(() => {
        fetchGroupsData(page, perPage, courseId);
      }, 300);
      return () => clearTimeout(timeoutId);
    },
    [],
  );

  useEffect(() => {
    fetchCourses();
    const cleanup = debouncedGroupDataFetch(
      pagination.currentPage,
      pagination.itemsPerPage,
      filterQuery,
    );
    return () => cleanup();
  }, [
    pagination.currentPage,
    pagination.itemsPerPage,
    debouncedGroupDataFetch,
    filterQuery,
  ]);

  const handleRefresh = () => {
    fetchGroupsData(
      pagination.currentPage,
      pagination.itemsPerPage,
      filterQuery,
    );
  };

  const onPageChange = (pageNumber: number) => {
    setPagination((prev) => ({ ...prev, currentPage: pageNumber }));
  };

  const filteredGroup = useMemo(() => {
    if (!searchQuery) return groups;
    const lowerQuery = searchQuery.toLowerCase();
    return groups.filter((group) =>
      Object.values(group).some((value) =>
        String(value).toLowerCase().includes(lowerQuery),
      ),
    );
  }, [groups, searchQuery]);

  const handleGroupDelete = async () => {
    try {
      setModalState((prev) => ({ ...prev, isDeleting: true }));
      const response = await groupService.deleteGroup(modalState.idToDelete);
      showToast(
        response?.data?.message || "Group deleted successfully",
        "success",
      );
      fetchGroupsData(1, pagination.itemsPerPage, filterQuery);
    } catch (err) {
      if (isAxiosError(err)) {
        showToast(
          err.response?.data?.error || "Failed to delete group.",
          "error",
        );
      } else {
        showToast(
          "An unexpected error occurred while deleting group.",
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

  const conditionToShowModals: boolean =
    modalState.doMagic || modalState.isModalOpen || modalState.isAdding;

  const closeFunctions = () => {
    if (modalState.isAdding) {
      setModalState((prev) => ({
        ...prev,
        isAdding: false,
      }));
    }
    if (modalState.doMagic) {
      setModalState((prev) => ({
        ...prev,
        doMagic: false,
      }));
    }
    if (modalState.isModalOpen) {
      setEditForm({});
      setModalState((prev) => ({
        ...prev,
        isModalOpen: false,
        isEditing: false,
      }));
    }
  };
  return (
    <div className="flex flex-col gap-6 p-6 font-sans md:p-1">
      <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
        Groups Management
      </h1>

      <div className="flex flex-col items-center justify-between gap-2 md:flex-row">
        <input
          id="search"
          type="search"
          placeholder="Search groups..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-[90%] flex-grow rounded-lg border px-4 py-2 focus:outline-none md:w-auto"
        />
        <Button onClick={handleRefresh} className="w-50">
          <MdRefresh className="me-2 h-4 w-4" /> Refresh
        </Button>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <Button
          onClick={() => setModalState((prev) => ({ ...prev, isAdding: true }))}
          className="w-60"
        >
          <MdGroupAdd className="me-2 h-4 w-4" /> Add New Group
        </Button>

        <Button
          className="w-60"
          onClick={() => setModalState((prev) => ({ ...prev, doMagic: true }))}
        >
          <FaMagic className="me-2 h-4 w-4" /> Magic Groups
        </Button>

        <div className="flex items-center gap-2">
          <Label htmlFor="entries">Select course to get groups</Label>
          <select
            id="entries"
            className="rounded text-gray-900 dark:text-white"
            value={filterQuery}
            onChange={(e) => {
              setFilterQuery(e.target.value);
              setPagination((prev) => ({
                ...prev,
                currentPage: 1,
              }));
            }}
          >
            <option value="">General Groups</option>
            {coursesList?.map((c: Course) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Label htmlFor="entries">Show</Label>
        <select
          id="entries"
          className="rounded border-none text-gray-900 dark:text-white"
          value={pagination.itemsPerPage}
          onChange={(e) =>
            setPagination((prev) => ({
              ...prev,
              itemsPerPage: parseInt(e.target.value),
              currentPage: 1,
            }))
          }
        >
          <option value="10">10</option>
          <option value="25">25</option>
          <option value="50">50</option>
          <option value={pagination.totalItems}>All</option>
        </select>
        Entries
      </div>

      {groups && (
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Showing Groups For {filterQuery || "General"}
        </h1>
      )}
      <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
        {isLoading ? (
          <Spinner size="lg" />
        ) : filteredGroup.length > 0 ? (
          filteredGroup.map((group: GroupInterface) => (
            <Card key={group?.id} className="overscroll-x-auto">
              <div className="flex flex-col items-start justify-between">
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {group?.name}
                </p>
                <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
                  {group?.description}
                </p>
                <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
                  {group?.Course.name}
                </p>
                <div className="mt-2 flex justify-center gap-4 pt-2">
                  <Button
                    color="green"
                    onClick={() => {
                      setEditForm({ ...group });
                      setModalState((prev) => ({
                        ...prev,
                        isModalOpen: true,
                        isEditing: true,
                      }));
                    }}
                  >
                    <FaEdit className="me-2 h-4 w-4" />
                    Edit
                  </Button>
                  <Button
                    outline
                    color="red"
                    onClick={() =>
                      setModalState((prev) => ({
                        ...prev,
                        isDeleteDialogueOpen: true,
                        itemToDelete: `${group.name} from ${group.Course.name}`,
                        idToDelete: group.id,
                      }))
                    }
                  >
                    <MdDeleteForever
                      size={24}
                      color="red"
                      className="me-2 h-4 w-4"
                    />
                    Delete
                  </Button>

                  <Tooltip content="View Group Members">
                    <IoEyeOutline
                      size={24}
                      className="mt-2 cursor-pointer"
                      onClick={() => navigate(`${group.id}`)}
                    />
                  </Tooltip>
                </div>
              </div>
            </Card>
          ))
        ) : (
          <p>No Groups found. Try selecting a course </p>
        )}
      </div>

      <div className="m-2 flex place-self-center sm:justify-center">
        <Pagination
          layout="table"
          currentPage={Number(pagination.currentPage)}
          itemsPerPage={Number(pagination.itemsPerPage)}
          totalItems={Number(pagination.totalItems)}
          onPageChange={onPageChange}
          showIcons
        />
      </div>

      {toast.isVisible && (
        <ToastMessage
          message={toast.message}
          type={toast.type}
          onClose={closeToast}
        />
      )}

      <CommonModal
        open={conditionToShowModals}
        onClose={() => closeFunctions()}
      >
        {modalState.isAdding && (
          <AddNewGroup
            courses={coursesList}
            onSuccess={(message?: string) => {
              if (message) showToast(message, "success");
              setModalState((prev) => ({ ...prev, isAdding: false }));
              fetchGroupsData(1, pagination.itemsPerPage, filterQuery);
            }}
          />
        )}

        {modalState.isModalOpen && (
          <EditGroup
            coursesList={coursesList}
            selectedGroup={editForm}
            closeEditModal={() =>
              setModalState((prev) => ({
                ...prev,
                isModalOpen: false,
                isEditing: false,
              }))
            }
            onSuccess={(message?: string) => {
              if (message) showToast(message, "success");
              setModalState((prev) => ({
                ...prev,
                isEditing: false,
                isModalOpen: false,
              }));
              fetchGroupsData(1, pagination.itemsPerPage, filterQuery);
            }}
          />
        )}

        {modalState.doMagic && (
          <CreateMagicGroups
            coursesList={coursesList}
            onSuccess={(message?: string) => {
              if (message) showToast(message, "success");
              setModalState((prev) => ({
                ...prev,
                doMagic: false,
              }));
              fetchGroupsData(1, pagination.itemsPerPage, filterQuery);
            }}
          />
        )}
      </CommonModal>

      <DeleteConfirmationDialogue
        isDeleting={modalState.isDeleting}
        isOpen={modalState.isDeleteDialogueOpen}
        handleDelete={handleGroupDelete}
        itemToDelete={modalState.itemToDelete}
        onClose={() => {
          setModalState((prev) => ({
            ...prev,
            isDeleteDialogueOpen: false,
            isDeleting: false,
          }));
        }}
      />
    </div>
  );
};

export default Groups;
