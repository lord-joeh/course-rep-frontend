import { GroupInterface, MagicInterface } from "../utils/Interfaces";
import api from "../utils/api";

export const getGroups = async (
  page: number,
  limit: number,
  courseId: string,
) => {
  const response = await api.get(
    `/groups/?page=${page}&limit=${limit}&courseId=${courseId}`,
  );
  if (!response?.data) throw new Error("Failed fetching feedbacks");
  return response.data;
};

export const addGroup = async (formData: GroupInterface) => {
  const response = await api.post(`/groups/`, formData);
  if (!response?.data) throw new Error("Failed creating group");
  return response.data;
};
export const createMagicGroups = async (magicData: MagicInterface) => {
  const response = await api.post(`/groups/custom`, magicData);
  if (!response?.data) throw new Error("Failed creating groups");
  return response.data;
};

export const updateGroup = async (
  id: string,
  formData: Partial<GroupInterface>,
) => {
  const response = await api.put(`/groups/${id}`, formData);
  if (!response?.data) throw new Error("Failed updating group");
  return response.data;
};

export const getGroupMembers = async (id: string) => {
  const response = await api.get(`/groups/${id}`);
  if (!response?.data) throw new Error("Failed fetching group");
  return response.data;
};

export const deleteGroup = async (id: string) => {
  const response = await api.delete(`/groups/${id}`);
  if (!response?.data) throw new Error("Failed deleting group");
  return response.data;
};
