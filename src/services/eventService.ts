import api from "../utils/api";

interface Event {
  id: string;
  description: string;
  date: string;
  time: string;
  venue: string;
}

export const addEvent = async (formData: Event) => {
  const response = await api.post(`/api/events/`, formData);
  if (!response?.data) throw new Error("Failed adding event");
  return response.data;
};

export const updateEvent = async (id: string, formData: Event) => {
  const response = await api.put(`/api/events/${id}`, formData);
  if (!response?.data) throw new Error("Failed updating event");
  return response.data;
};

export const getEvents = async () => {
  const response = await api.get(`/api/events/`);
  if (!response?.data) throw new Error("Failed fetching events");
  return response.data;
};

export const deleteEvent = async (id: string) => {
  const response = await api.delete(`/api/events/${id}`);
  if (!response?.data) throw new Error("Failed deleting event");
  return response.data;
};
