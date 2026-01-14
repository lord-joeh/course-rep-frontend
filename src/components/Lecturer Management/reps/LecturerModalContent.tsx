import React from "react";
import { Button, Label, TextInput } from "flowbite-react";
import { MdEmail } from "react-icons/md";
import { FaPhone } from "react-icons/fa6";
import { HiUser } from "react-icons/hi";
import { ModalState } from "../../../utils/Interfaces";

interface LecturerModalContentProps {
  modalState: ModalState;
  setModalState: React.Dispatch<React.SetStateAction<ModalState>>;
  handleLecturerSubmit: (e: React.FormEvent<HTMLFormElement>) => Promise<void>;
  formData: {
    name: string;
    email: string;
    phone: string;
  };
  setFormData: React.Dispatch<
    React.SetStateAction<{
      name: string;
      email: string;
      phone: string;
    }>
  >;
  handleChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  setEditId: React.Dispatch<React.SetStateAction<string | null>>;
}

const LecturerModalContent: React.FC<LecturerModalContentProps> = ({
  modalState,
  setModalState,
  handleLecturerSubmit,
  formData,
  setFormData,
  handleChange,
  setEditId,
}) => {
  return (
    <div className="flex flex-col justify-center gap-5">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
        {modalState.isEditing ? "Edit Lecturer" : "New Lecturer"}
      </h1>

      <form onSubmit={handleLecturerSubmit} className="flex flex-col gap-4">
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
            type="tel"
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
            max={10}
          />
        </div>
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
};

export default LecturerModalContent;
