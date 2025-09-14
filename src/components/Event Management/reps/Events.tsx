import React, { useState, useEffect, useMemo } from "react";
import { isAxiosError } from "axios";
import * as eventService from "../../../services/eventService";
import {
  Button,
  Card,
  Spinner,
  Textarea,
  Label,
  TextInput,
} from "flowbite-react";
import { MdDeleteForever, MdRefresh } from "react-icons/md";
import { IoLocationOutline, IoTimeOutline } from "react-icons/io5";
import { FiEdit3 } from "react-icons/fi";
import useAuth from "../../../hooks/useAuth";
import { TbTimelineEventPlus } from "react-icons/tb";
import { DeleteConfirmationDialogue } from "../../common/DeleteConfirmationDialogue";
import ToastMessage from "../../common/ToastMessage";
import CommonModal from "../../common/CommonModal";
import { HiCalendarDateRange } from "react-icons/hi2";
import { formatTimeWithOffset } from "../../../helpers/formatTime";

interface Event {
  id: string;
  description: string;
  date: string;
  time: string;
  venue: string;
}

type ModalState = {
  isAdding: boolean;
  isDeleteDialogueOpen: boolean;
  isModalOpen: boolean;
  isDeleting: boolean;
  isEditing: boolean;
  itemToDelete: string;
  idToDelete: string;
};

interface ToastInterface {
  message: string;
  type: "error" | "success";
  isVisible: boolean;
}

const Events = () => {
  const [events, setEvents] = useState<Event[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setLoading] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [formData, setFormData] = useState<Event>({
    id: "",
    description: "",
    time: "",
    venue: "",
    date: "",
  });
  const [editId, setEditId] = useState<string | null>(null);

  const [toast, setToast] = useState<ToastInterface>({
    message: "",
    type: "error",
    isVisible: false,
  });
  const { user } = useAuth();

  const [modalState, setModalState] = useState<ModalState>({
    isDeleteDialogueOpen: false,
    isModalOpen: false,
    isDeleting: false,
    isEditing: false,
    itemToDelete: "",
    idToDelete: "",
    isAdding: false,
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
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

  const fetchEventsData = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await eventService.getEvents();

      setEvents(response.data || []);
    } catch (error) {
      if (isAxiosError(error)) {
        setToast({
          message: error.response?.data?.error || "Error fetching events",
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

  const handleRefresh = () => {
    fetchEventsData();
  };

  const filteredEvents = useMemo(() => {
    if (!searchQuery) return events;
    const lowerQuery = searchQuery.toLowerCase();
    return events.filter((event) =>
      Object.values(event).some((value) =>
        String(value).toLowerCase().includes(lowerQuery),
      ),
    );
  }, [events, searchQuery]);

  useEffect(() => {
    fetchEventsData();
  }, []);

  const handleEventDelete = async (id: string) => {
    try {
      setModalState((prev) => ({ ...prev, isDeleting: true }));
      const response = await eventService.deleteEvent(id);
      showToast(
        response?.data?.message || "Event deleted successfully",
        "success",
      );
      fetchEventsData();
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

  const handleEventFormSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const eventData = {
      ...formData,
      time: `${formData.time}:00+01`,
    };
    if (modalState.isEditing && editId) {
      try {
        setModalState((prev) => ({ ...prev, isAdding: true }));
        const response = await eventService.updateEvent(editId, eventData);
        showToast(
          response?.message ||
            response?.data?.message ||
            "Lecturer updated successfully",
          "success",
        );
        fetchEventsData();
      } catch (err) {
        if (isAxiosError(err)) {
          showToast(
            err.response?.data?.error || "Failed to update Event.",
            "error",
          );
        } else {
          showToast(
            "An unexpected error occurred while updating Event.",
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
        setFormData({
          id: "",
          description: "",
          date: "",
          time: "",
          venue: "",
        });
      }
    } else {
      try {
        setModalState((prev) => ({ ...prev, isAdding: true }));
        const response = await eventService.addEvent(eventData);
        showToast(
          response?.data?.message || "Event added successfully",
          "success",
        );
        fetchEventsData();
      } catch (err) {
        if (isAxiosError(err)) {
          showToast(
            err.response?.data?.error || "Failed to add Event.",
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
        setFormData({
          id: "",
          description: "",
          date: formData?.date,
          time: "",
          venue: "",
        });
        setEditId(null);
      }
    }
  };

  const monthsInArr = [
    "JAN",
    "FEB",
    "MAR",
    "APR",
    "MAY",
    "JUN",
    "JUL",
    "AUG",
    "SEP",
    "OCT",
    "NOV",
    "DEC",
  ];

  const eventModalContent = (
    <div className="flex flex-col justify-center gap-5">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
        {modalState.isEditing ? "Edit Event" : "New Event"}
      </h1>

      <form onSubmit={handleEventFormSubmit}>
        <>
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
            <div className="mb-2 block">
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
            <div className="mb-2 block">
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
        </>
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
  return (
    <div className="flex flex-col gap-6 p-6 font-sans md:p-1">
      <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
        Events Management
      </h1>
      <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
        <input
          id="search"
          type="search"
          placeholder="Search event..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full flex-grow rounded-lg border px-4 py-2 focus:outline-none md:w-auto"
        />
        <Button onClick={handleRefresh}>
          <MdRefresh className="me-2 h-4 w-4" /> Refresh
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
          <TbTimelineEventPlus className="me-2 h-4 w-4" /> Add New Event
        </Button>
      )}
      <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
        Upcoming Events
      </h1>
      <div className="event-grid grid grid-cols-1 gap-2 sm:grid-cols-2">
        {isLoading ? (
          <Card>
            <Spinner size="lg" />
          </Card>
        ) : filteredEvents.length > 0 ? (
          filteredEvents.map((event: Event, idx) => (
            <div
              key={idx}
              className="my-4 flex max-w-sm rounded-xl bg-white shadow-lg dark:bg-gray-800"
            >
              <div className="flex flex-col items-center justify-center rounded-l-xl bg-blue-900 p-6 text-white">
                <span className="dark:text- text-6xl font-bold">
                  {new Date(event?.date).getDate()}
                </span>
                <span className="mt-2 rounded-b-lg bg-yellow-500 px-4 py-4 font-semibold text-blue-900">
                  {monthsInArr[new Date(event?.date).getMonth()]}
                </span>
              </div>

              <div className="flex flex-col justify-center space-y-2 p-2">
                <h2 className="text-xl leading-tight font-bold text-blue-900 dark:text-white">
                  {event?.description}
                </h2>
                <div className="flex items-center text-gray-700 dark:text-gray-400">
                  <IoTimeOutline className="me-2" />
                  <span>{formatTimeWithOffset(event?.date, event?.time)}</span>
                </div>
                <div className="flex items-center text-gray-700 dark:text-gray-400">
                  <IoLocationOutline className="me-2" />
                  <span>{event?.venue}</span>
                </div>
                {user?.isRep && (
                  <div className="mt-2 flex justify-evenly">
                    <span
                      onClick={() => {
                        setFormData((prev) => ({
                          ...prev,
                          description: event?.description,
                          date: event?.date,
                          time: event?.time,
                          venue: event?.venue,
                        }));
                        setEditId(event?.id);
                        setModalState((prev) => ({
                          ...prev,
                          isModalOpen: true,
                          isEditing: true,
                        }));
                      }}
                      className="cursor-pointer"
                    >
                      <FiEdit3 size={24} color="green" />
                    </span>
                    <span
                      onClick={() =>
                        setModalState((prev) => ({
                          ...prev,
                          isDeleteDialogueOpen: true,
                          itemToDelete:
                            `${event?.description.slice(0, 30)}...` || "",
                          idToDelete: event?.id || "",
                        }))
                      }
                      className="cursor-pointer"
                    >
                      <MdDeleteForever size={24} color="red" />
                    </span>
                  </div>
                )}
              </div>
            </div>
          ))
        ) : (
          <Card> No Events </Card>
        )}
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
        handleDelete={() => handleEventDelete(modalState.idToDelete)}
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
          setFormData({
            id: "",
            description: "",
            date: formData?.date,
            time: "",
            venue: "",
          });
        }}
      >
        {eventModalContent}
      </CommonModal>
    </div>
  );
};

export default Events;
