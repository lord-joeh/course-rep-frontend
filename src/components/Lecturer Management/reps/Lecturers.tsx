import React, { useState } from "react";
import ToastMessage from "../../common/ToastMessage";
import * as lecturerService from "../../../services/lecturerService";
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
import {
  ModalState,
  Lecturer,
  courseType,
} from "../../../utils/Interfaces";
import { useCrud } from "../../../hooks/useCrud";
import { useSearch } from "../../../hooks/useSearch";
import LecturerModalContent from "./LecturerModalContent";

const Lecturers = () => {
  const [searchQuery, setSearchQuery] = useState<string>("");

  const [modalState, setModalState] = useState<ModalState>({
    isDeleteDialogueOpen: false,
    isModalOpen: false,
    isDeleting: false,
    isEditing: false,
    itemToDelete: "",
    idToDelete: "",
    isAdding: false,
  });

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
  });
  const [editId, setEditId] = useState<string | null>(null);

  const lecturerCrudService = {
    list: lecturerService.getLecturers,
    add: lecturerService.addLecturer,
    update: lecturerService.updateLecturer,
    remove: lecturerService.deleteLecturers,
  };

  const {
    items: lecturers,
    loading: isLoading,
    error,
    toast,
    closeToast,
    refresh,
    add,
    update,
    remove,
  } = useCrud<Lecturer>(lecturerCrudService);

  const filteredLecturers = useSearch<Lecturer>(lecturers, searchQuery);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const closeDialogue = () =>
    setModalState((prev) => ({ ...prev, isDeleteDialogueOpen: false }));

  const closeModal = () =>
    setModalState((prev) => ({ ...prev, isModalOpen: false }));

  const handleUserDelete = async (id: string) => {
    try {
      setModalState((prev) => ({ ...prev, isDeleting: true }));
      await remove(id);
    } catch (err) {
      // Error handling is done in useCrud
    } finally {
      setModalState((prev) => ({
        ...prev,
        isDeleting: false,
        isDeleteDialogueOpen: false,
      }));
    }
  };

  const handleLecturerSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    let userErrorMessage = "";
    if (formData.name.length < 1)
      userErrorMessage = "Lecturer's name cannot be empty";
    if (formData.email.length < 1)
      userErrorMessage = "Lecturer's email cannot be empty";
    if (formData.phone.length < 1)
      userErrorMessage = "Lecturer's phone cannot be empty";

    if (userErrorMessage) return alert(userErrorMessage);

    if (modalState.isEditing && editId) {
      try {
        setModalState((prev) => ({ ...prev, isAdding: true }));
        await update(editId, formData);
      } catch (err) {
        // Error handling is done in useCrud
      } finally {
        setModalState((prev) => ({
          ...prev,
          isAdding: false,
          isModalOpen: false,
          isEditing: false,
        }));
        setEditId(null);
        setFormData({ name: "", email: "", phone: "" });
      }
    } else {
      try {
        setModalState((prev) => ({ ...prev, isAdding: true }));
        await add(formData);
      } catch (err) {
        // Error handling is done in useCrud
      } finally {
        setModalState((prev) => ({
          ...prev,
          isAdding: false,
          isModalOpen: false,
          isEditing: false,
        }));
        setFormData({ name: "", email: "", phone: "" });
        setEditId(null);
      }
    }
  };

  const handleRefresh = () => {
    refresh();
  };

  const lecturersTableHeader = [
    "#",
    "Name",
    "Phone Number",
    "Email",
    "Course",
    "Actions",
  ];
  return (
    <div className="flex flex-col gap-6 p-6 font-sans md:p-1">
      <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
        Lecturers Management
      </h1>

      <div className="flex w-full items-center gap-3">
        <div className="flex min-w-0 flex-1">
          <input
            id="search"
            type="search"
            placeholder="Search lecturers..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            aria-label="Search lecturers"
            className="w-full min-w-0 rounded-lg border px-4 py-2 focus:outline-none"
          />
        </div>

        <Button
          onClick={handleRefresh}
          className="flex shrink-0 items-center gap-2 px-3 py-2"
          aria-label="Refresh lecturer"
        >
          <MdRefresh size={18} className="me-1" /> Refresh
        </Button>
      </div>

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
                    ).join(", ")}
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
      {toast.visible && (
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
        <LecturerModalContent
          modalState={modalState}
          setModalState={setModalState}
          handleLecturerSubmit={handleLecturerSubmit}
          formData={formData}
          setFormData={setFormData}
          handleChange={handleChange}
          setEditId={setEditId}
        />
      </CommonModal>
    </div>
  );
};

export default Lecturers;
