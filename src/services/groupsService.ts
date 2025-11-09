import { GroupInterface, MagicInterface, NewGroupMemberInterface } from "../utils/Interfaces";
import api from "../utils/api";

export const getGroups = async (
  page: number,
  limit: number,
  courseId: string,
) => {
  const response = await api.get(
    `/api/groups/?page=${page}&limit=${limit}&courseId=${courseId}`,
  );
  if (!response?.data) throw new Error("Failed fetching feedbacks");
  return response.data;
};

export const addGroup = async (formData: GroupInterface) => {
  const response = await api.post(`/api/groups/`, formData);
  if (!response?.data) throw new Error("Failed creating group");
  return response.data;
};

export const addGroupMember = async (formData: NewGroupMemberInterface) => {
  const response = await api.post(`/api/groups/member`, formData);
  if (!response?.data) throw new Error("Failed adding group member");
  return response.data;
};

export const createMagicGroups = async (magicData: MagicInterface) => {
  const response = await api.post(`/api/groups/custom`, magicData);
  if (!response?.data) throw new Error("Failed creating groups");
  return response.data;
};

export const updateGroup = async (
  id: string,
  formData: Partial<GroupInterface>,
) => {
  const response = await api.put(`/api/groups/${id}`, formData);
  if (!response?.data) throw new Error("Failed updating group");
  return response.data;
};

export const getGroupMembers = async (id: string) => {
  const response = await api.get(`/api/groups/${id}`);
  if (!response?.data) throw new Error("Failed fetching group");
  return response.data;
};

export const deleteGroup = async (id: string) => {
  const response = await api.delete(`/api/groups/${id}`);
  if (!response?.data) throw new Error("Failed deleting group");
  return response.data;
};

export const deleteGroupMember = async (id: string) => {
  const response = await api.delete(`/api/groups/member/${id}`);
  if (!response?.data) throw new Error("Failed deleting group member");
  return response.data;
};
