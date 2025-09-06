import { useState, useEffect, useMemo } from "react";
import ToastMessage from "../../common/ToastMessage";
import * as lecturerService from "../../../services/lecturerService";
import { isAxiosError } from "axios";
import { MdEmail, MdRefresh } from "react-icons/md";
import { FaUserEdit } from "react-icons/fa";
import { FaPhone } from "react-icons/fa6";
import { MdDeleteForever } from "react-icons/md";
import CommonModal from "../../common/CommonModal";
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
  Label,
  TextInput,
} from "flowbite-react";
import { DeleteConfirmationDialogue } from "../../common/DeleteConfirmationDialogue";
import { HiUser } from "react-icons/hi";

interface Lecturer {
  id: string;
  name: string;
  phone: string;
  email: string;
  Courses: [];
}

type ModalState = {
  isAdding: boolean;
  isDeleteDialogueOpen: boolean;
  isModalOpen: boolean;
  isDeleting: boolean;
  isEditing: boolean;
  itemToDelete: string;
  idToDelete: string;
  currentModal: React.ReactNode | null;
};
type courseType = { name: string };

const Lecturers = () => {
  const [lecturers, setLecturers] = useState<Lecturer[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setLoading] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>("");

  const [toast, setToast] = useState<{
    message: string;
    type: "error" | "success";
    isVisible: boolean;
  }>({
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
    currentModal: null,
  });

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
  });
  const [editId, setEditId] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
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

  const fetchLecturersData = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await lecturerService.getLecturers();

      setLecturers(response.data || []);
      console.log(lecturers);
    } catch (error) {
      if (isAxiosError(error)) {
        setToast({
          message: error.response?.data?.error || "Error fetching lecturers",
          type: "error",
          isVisible: true,
        });
      } else {
        setToast({
          message: "An unexpected error occurred.",
          type: "error",
          isVisible: true,
        });
      }
      setError("An unexpected error occurred while fetching data.");
    } finally {
      setLoading(false);
    }
  };

  const handleUserDelete = async (id: string) => {
    try {
      setModalState((prev) => ({ ...prev, isDeleting: true }));
      const response = await lecturerService.deleteLecturers(id);
      showToast(
        response?.data?.message || "Lecturer deleted successfully",
        "success",
      );
      fetchLecturersData();
    } catch (err) {
      if (isAxiosError(err)) {
        showToast(
          err.response?.data?.error || "Failed to delete Lecturer.",
          "error",
        );
      } else {
        showToast(
          "An unexpected error occurred while deleting Lecturer.",
          "error",
        );
      }
    } finally {
      setModalState((prev) => ({
        ...prev,
        isDeleting: false,
        isDeleteDialogueOpen: false,
      }));

      setFormData({
        name: "",
        email: "",
        phone: "",
      });
    }
  };

  const handleLecturerSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (modalState.isEditing && editId) {
      try {
        setModalState((prev) => ({ ...prev, isAdding: true }));
        const response = await lecturerService.updateLecturer(editId, formData);
        showToast(
          response?.message ||
            response?.data?.message ||
            "Lecturer updated successfully",
          "success",
        );
        fetchLecturersData();
      } catch (err) {
        if (isAxiosError(err)) {
          showToast(
            err.response?.data?.error || "Failed to update Lecturer.",
            "error",
          );
        } else {
          showToast(
            "An unexpected error occurred while updating Lecturer.",
            "error",
          );
        }
      } finally {
        setModalState((prev) => ({
          ...prev,
          isAdding: false,
          isModalOpen: false,
          isEditing: false,
          currentModal: null,
        }));
        setEditId(null);
        setFormData({ name: "", email: "", phone: "" });
      }
    } else {
      try {
        setModalState((prev) => ({ ...prev, isAdding: true }));
        const response = await lecturerService.addLecturer(formData);
        showToast(
          response?.data?.message || "Lecturer added successfully",
          "success",
        );
        fetchLecturersData();
      } catch (err) {
        if (isAxiosError(err)) {
          showToast(
            err.response?.data?.error || "Failed to add Lecturer.",
            "error",
          );
        } else {
          showToast(
            "An unexpected error occurred while adding Lecturer.",
            "error",
          );
        }
      } finally {
        setModalState((prev) => ({
          ...prev,
          isAdding: false,
          isModalOpen: false,
          isEditing: false,
          currentModal: null,
        }));
        setFormData({ name: "", email: "", phone: "" });
        setEditId(null);
      }
    }
  };

  const handleRefresh = () => {
    fetchLecturersData();
  };

  const filteredLecturers = useMemo(() => {
    if (!searchQuery) return lecturers;
    const lowerQuery = searchQuery.toLowerCase();
    return lecturers.filter((lecturer) =>
      Object.values(lecturer).some((value) =>
        String(value).toLowerCase().includes(lowerQuery),
      ),
    );
  }, [lecturers, searchQuery]);

  useEffect(() => {
    fetchLecturersData();
  }, []);

  const lecturersTableHeader = [
    "#",
    "Name",
    "Phone Number",
    "Email",
    "Course",
    "Actions",
  ];

  const lecturerModalContent = (
    <div className="flex flex-col justify-center gap-5">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
        {modalState.isEditing ? "Edit Lecturer" : "New Lecturer"}
      </h1>

      <form onSubmit={handleLecturerSubmit} className="flex flex-col gap-4">
        <>
          <div>
            <div className="md-4 mt-2 block">
              <Label htmlFor="Lecturer Name"> Name</Label>
            </div>
            <TextInput
              type="text"
              id="lecturer-name"
              placeholder="Lecturer's Name"
              name="name"
              required
              value={formData.name}
              onChange={handleChange}
              disabled={modalState.isAdding}
              icon={HiUser}
              className="sm:text-sm md:text-base"
              autoComplete="off"
            />
          </div>
          <div>
            <div className="md-4 mt-2 block">
              <Label htmlFor="Lecturer Email"> Email</Label>
            </div>
            <TextInput
              type="text"
              id="lecturer-email"
              placeholder="Lecturer's Email"
              name="email"
              required
              value={formData.email}
              onChange={handleChange}
              disabled={modalState.isAdding}
              icon={MdEmail}
              className="sm:text-sm md:text-base"
              autoComplete="off"
            />
          </div>
          <div>
            <div className="md-4 mt-2 block">
              <Label htmlFor="Lecturer phone"> Phone</Label>
            </div>
            <TextInput
              type="text"
              id="lecturer-phone"
              placeholder="Lecturer's Phone Number"
              name="phone"
              required
              value={formData.phone}
              onChange={handleChange}
              disabled={modalState.isAdding}
              icon={FaPhone}
              className="sm:text-sm md:text-base"
              autoComplete="off"
            />
          </div>
        </>
        <div className="flex justify-center gap-4">
          <Button type="submit" disabled={modalState.isAdding} color="green">
            {modalState.isAdding
              ? modalState.isEditing
                ? "Updating Lecturer..."
                : "Adding Lecturer..."
              : modalState.isEditing
                ? "Update Lecturer"
                : "Add Lecturer"}
          </Button>

          <Button
            color="alternative"
            type="button"
            onClick={() => {
              setModalState((prev) => ({
                ...prev,
                isModalOpen: false,
                isEditing: false,
                currentModal: null,
              }));
              setEditId(null);
              setFormData({ name: "", email: "", phone: "" });
            }}
          >
            Cancel
          </Button>
        </div>
      </form>
    </div>
  );
  return (
    <div className="flex flex-col gap-6 p-6 font-sans md:p-1">
      <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
        Lecturers Management
      </h1>
      <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
        <input
          id="search"
          type="search"
          placeholder="Search lecturers..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full flex-grow rounded-lg border px-4 py-2 focus:outline-none md:w-auto"
        />
        <Button onClick={handleRefresh}>
          <MdRefresh className="me-2 h-4 w-4" /> Refresh
        </Button>
      </div>
      <Button
        onClick={() => {
          setFormData({ name: "", email: "", phone: "" });
          setEditId(null);
          setModalState((prev) => ({
            ...prev,
            isModalOpen: true,
            isEditing: false,
            currentModal: null,
          }));
        }}
        className="flex w-50 justify-start"
      >
        <HiUser className="me-2 h-4 w-4" /> Add New Lecturer
      </Button>
      <div className="overflow-x-auto rounded-lg shadow-md">
        <Table striped>
          <TableHead>
            <TableRow>
              {lecturersTableHeader.map((head, idx) => (
                <TableHeadCell key={idx}>{head}</TableHeadCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={lecturersTableHeader.length}>
                  <Spinner size="lg" className="me-4 animate-spin" />{" "}
                </TableCell>
              </TableRow>
            ) : filteredLecturers.length > 0 ? (
              filteredLecturers.map((lecturer, index) => (
                <TableRow
                  key={lecturer?.id}
                  className="hover:bg-gray-200 hover:dark:bg-gray-600"
                >
                  <TableCell>{index + 1}</TableCell>
                  <TableCell>{lecturer?.name}</TableCell>
                  <TableCell>{lecturer?.phone}</TableCell>
                  <TableCell>{lecturer?.email}</TableCell>
                  <TableCell>
                    {lecturer?.Courses.map(
                      (course: courseType) => course?.name,
                    )}
                  </TableCell>

                  <TableCell>
                    <div className="flex gap-3">
                      <Tooltip content="Edit">
                        <FaUserEdit
                          size="30px"
                          color="green"
                          className="cursor-pointer"
                          onClick={() => {
                            setFormData({
                              name: lecturer.name,
                              email: lecturer.email,
                              phone: lecturer.phone,
                            });
                            setEditId(lecturer.id);
                            setModalState((prev) => ({
                              ...prev,
                              isModalOpen: true,
                              isEditing: true,
                              currentModal: null,
                            }));
                          }}
                        />
                      </Tooltip>

                      <Tooltip content="Delete">
                        <MdDeleteForever
                          size="30px"
                          color="red"
                          className="cursor-pointer"
                          onClick={() =>
                            setModalState((prev) => ({
                              ...prev,
                              isDeleteDialogueOpen: true,
                              itemToDelete: lecturer?.name || "",
                              idToDelete: lecturer?.id || "",
                            }))
                          }
                        />
                      </Tooltip>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={lecturersTableHeader.length}
                  className="py-8 text-center text-gray-500"
                >
                  No lecturer found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {error && (
        <ToastMessage message={error} type="error" onClose={closeToast} />
      )}
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
        handleDelete={() => handleUserDelete(modalState.idToDelete)}
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
            currentModal: null,
          }));
          setFormData({ name: "", email: "", phone: "" });
        }}
      >
        {lecturerModalContent}
      </CommonModal>
    </div>
  );
};

export default Lecturers;
