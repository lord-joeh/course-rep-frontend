import React, { useState } from "react";
import * as eventService from "../../../services/eventService";
import { Button, Card, Spinner } from "flowbite-react";
import { MdDeleteForever, MdRefresh } from "react-icons/md";
import { IoLocationOutline, IoTimeOutline } from "react-icons/io5";
import { FiEdit3 } from "react-icons/fi";
import useAuth from "../../../hooks/useAuth";
import { TbTimelineEventPlus } from "react-icons/tb";
import { DeleteConfirmationDialogue } from "../../common/DeleteConfirmationDialogue";
import ToastMessage from "../../common/ToastMessage";
import CommonModal from "../../common/CommonModal";
import { formatTimeWithOffset } from "../../../helpers/formatTime";
import { ModalState, Event } from "../../../utils/Interfaces";
import { useCrud } from "../../../hooks/useCrud";
import { useSearch } from "../../../hooks/useSearch";
import EventModalContent from "./EventModalContent";

const Events = () => {
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [formData, setFormData] = useState<Event>({
    id: "",
    description: "",
    time: "",
    venue: "",
    date: "",
  });
  const [editId, setEditId] = useState<string | null>(null);

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

  const eventCrudService = {
    list: eventService.getEvents,
    add: eventService.addEvent,
    update: eventService.updateEvent,
    remove: eventService.deleteEvent,
  };

  const {
    items: events,
    loading: isLoading,
    error,
    toast,
    closeToast,
    refresh,
    add,
    update,
    remove,
  } = useCrud<Event>(eventCrudService);

  const filteredEvents = useSearch<Event>(events, searchQuery);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const closeDialogue = () =>
    setModalState((prev) => ({ ...prev, isDeleteDialogueOpen: false }));

  const closeModal = () =>
    setModalState((prev) => ({ ...prev, isModalOpen: false }));

  const handleRefresh = () => {
    refresh();
  };

  const handleEventDelete = async (id: string) => {
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

  const handleEventFormSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const eventData = {
      ...formData,
      time: `${formData.time}:00+01`,
    };
    try {
      setModalState((prev) => ({ ...prev, isAdding: true }));
      if (modalState.isEditing && editId) {
        await update(editId, eventData);
      } else {
        await add(eventData);
      }
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
      setFormData({
        id: "",
        description: "",
        date: "",
        time: "",
        venue: "",
      });
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

  
  return (
    <div className="flex flex-col gap-6 font-sans">
      <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
        {user?.isRep ? "Event Management" : "Events"}
      </h1>

      <div className="flex w-full items-center gap-3">
        <div className="flex min-w-0 flex-1">
          <input
            id="search"
            type="search"
            placeholder="Search event..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            aria-label="Search event"
            className="w-full min-w-0 rounded-lg border px-4 py-2 focus:outline-none"
          />
        </div>

        <Button
          onClick={handleRefresh}
          className="flex shrink-0 items-center gap-2 px-3 py-2"
          aria-label="Refresh event"
        >
          <MdRefresh size={18} className="me-1" /> Refresh
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
          className="flex w-full justify-center md:w-50"
        >
          <TbTimelineEventPlus className="me-2 h-4 w-4" /> Add New Event
        </Button>
      )}
      <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
        Upcoming Events
      </h1>
      <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
        {isLoading && (
          <Card>
            <Spinner size="lg" />
          </Card>
        )}
        {filteredEvents?.length > 0 ? (
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
          }));
          setFormData({
            id: "",
            description: "",
            date: "",
            time: "",
            venue: "",
          });
        }}
      >
        <EventModalContent
          modalState={modalState}
          setModalState={setModalState}
          handleEventFormSubmit={handleEventFormSubmit}
          formData={formData}
          setFormData={setFormData}
          handleChange={handleChange}
          setEditId={setEditId}
        />
      </CommonModal>
    </div>
  );
};

export default Events;
