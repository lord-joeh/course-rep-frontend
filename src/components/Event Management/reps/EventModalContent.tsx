import React from "react";
import { Button, Textarea, Label, TextInput } from "flowbite-react";
import { IoLocationOutline, IoTimeOutline } from "react-icons/io5";
import { HiCalendarDateRange } from "react-icons/hi2";
import { ModalState, Event } from "../../../utils/Interfaces";

interface EventModalContentProps {
  modalState: ModalState;
  setModalState: React.Dispatch<React.SetStateAction<ModalState>>;
  handleEventFormSubmit: (e: React.FormEvent<HTMLFormElement>) => Promise<void>;
  formData: Event;
  setFormData: React.Dispatch<React.SetStateAction<Event>>;
  handleChange: (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => void;
  setEditId: React.Dispatch<React.SetStateAction<string | null>>;
}

const EventModalContent: React.FC<EventModalContentProps> = ({
  modalState,
  setModalState,
  handleEventFormSubmit,
  formData,
  setFormData,
  handleChange,
  setEditId,
}) => {
  return (
    <div className="flex flex-col justify-center gap-5">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
        {modalState.isEditing ? "Edit Event" : "New Event"}
      </h1>

      <form onSubmit={handleEventFormSubmit}>
        <div>
          <div className="mb-2 block">
            <Label htmlFor="description">Content</Label>
          </div>
          <Textarea
            id="description"
            name="description"
            value={formData.description}
            placeholder="Event Content..."
            required
            onChange={handleChange}
            autoComplete="off"
          />
        </div>

        <div>
          <div className="mb-2 block max-w-md">
            <Label htmlFor="date">Date</Label>
          </div>
          <TextInput
            id="date"
            name="date"
            type="date"
            value={formData.date ? formData.date.split("T")[0] : ""}
            required
            onChange={handleChange}
            autoComplete="off"
            icon={HiCalendarDateRange}
          />
        </div>

        <div>
          <div className="mb-2 block max-w-md">
            <Label htmlFor="time">Time</Label>
          </div>
          <TextInput
            id="time"
            name="time"
            type="time"
            value={formData.time ? formData.time.slice(0, 5) : ""}
            required
            onChange={handleChange}
            autoComplete="off"
            icon={IoTimeOutline}
          />
        </div>

        <div>
          <div className="mb-2 block">
            <Label htmlFor="venue">Venue</Label>
          </div>
          <TextInput
            id="venue"
            name="venue"
            placeholder="Venue "
            value={formData?.venue}
            required
            onChange={handleChange}
            autoComplete="off"
            icon={IoLocationOutline}
          />
        </div>
        <div className="mt-4 flex justify-center gap-4">
          <Button type="submit" disabled={modalState.isAdding} color="green">
            {modalState.isAdding
              ? modalState.isEditing
                ? "Updating Event..."
                : "Adding Event..."
              : modalState.isEditing
                ? "Update Event"
                : "Add Event"}
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
              setFormData({
                id: "",
                description: "",
                date: "",
                time: "",
                venue: "",
              });
            }}
          >
            Cancel
          </Button>
        </div>
      </form>
    </div>
  );
};

export default EventModalContent;
