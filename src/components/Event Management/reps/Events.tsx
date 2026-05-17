import React, { useState } from "react";
import * as eventService from "../../../services/eventService";
import {
  Button,
  Card,
  Label,
  Select,
  Spinner,
  TextInput,
} from "flowbite-react";

import useAuth from "../../../hooks/useAuth";
import { TbTimelineEventPlus } from "react-icons/tb";
import { DeleteConfirmationDialogue } from "../../common/DeleteConfirmationDialogue";
import ToastMessage from "../../common/ToastMessage";
import CommonModal from "../../common/CommonModal";
import { ModalState, Event } from "../../../utils/Interfaces";
import { useCrud } from "../../../hooks/useCrud";
import { useSearch } from "../../../hooks/useSearch";
import EventModalContent from "./EventModalContent";
import { HiOutlineSearch } from "react-icons/hi";
import { EventCard } from "../EventCard";

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

  return (
    <div className="flex flex-col gap-6 font-sans">
      <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
        {user?.isRep ? "Event Management" : "Events"}
      </h1>

      {user?.isRep && (
        <Button
          onClick={() => {
            setModalState((prev) => ({
              ...prev,
              isModalOpen: true,
              isEditing: false,
            }));
          }}
          className="flex w-full justify-center md:w-sm"
        >
          <TbTimelineEventPlus className="me-2 h-4 w-4" /> Add New Event
        </Button>
      )}

      <Card>
        <div className="grid grid-cols-1 items-center gap-4 md:grid-cols-12">
          <div className="md:col-span-2">
            <Label htmlFor="entries" className="mb-2 block font-medium">
              Show
            </Label>
            <Select
              id="entries"
              className="rounded border-none text-gray-900 dark:text-white"
              // value={pagination.itemsPerPage}
              // onChange={(e) =>
              //   setPagination((prev) => ({
              //     ...prev,
              //     itemsPerPage: Number.parseInt(e.target.value),
              //     currentPage: 1,
              //   }))
              // }
            >
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
              {/* <option value={pagination?.totalItems}>All</option> */}
            </Select>
          </div>

          <div className="md:col-span-5">
            <Label htmlFor="search" className="mb-2 block font-medium">
              Search Slides
            </Label>
            <TextInput
              id="search"
              placeholder="Search Events..."
              icon={HiOutlineSearch}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
      </Card>

      <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
        Upcoming Events
      </h1>

      {isLoading && <Spinner size="lg" />}
      <div className="grid grid-cols-1 gap-5 md:grid-cols-2 2xl:grid-cols-3">
        {filteredEvents?.length > 0 ? (
          filteredEvents.map((event: Event, _idx) => (
            <EventCard
              key={event.id}
              event={event}
              isRep={user?.isRep ?? false}
              onEdit={(e: Event) => {
                setFormData({
                  id: e.id,
                  description: e.description,
                  date: e.date,
                  time: e.time,
                  venue: e.venue,
                });
                setEditId(e.id);
                setModalState((prev) => ({
                  ...prev,
                  isModalOpen: true,
                  isEditing: true,
                }));
              }}
              onDelete={(id: string, label: string) =>
                setModalState((prev) => ({
                  ...prev,
                  isDeleteDialogueOpen: true,
                  itemToDelete: label,
                  idToDelete: id,
                }))
              }
            />
          ))
        ) : (
          <p> No Events </p>
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
