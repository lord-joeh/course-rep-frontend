import api from "../utils/api";

export const uploadNewAssignment = async (formData: FormData) => {
  const baseURL = import.meta.env.VITE_API_URL || "";
  const url = `${baseURL}/api/assignments/`;

  const headers: Record<string, string> = { Accept: "application/json" };

  try {
    const userData = localStorage.getItem("user");
    if (userData) {
      const user = JSON.parse(userData);
      if (user?.token) headers["Authorization"] = `Bearer ${user?.token}`;
    }
  } catch (error) {}

  const response = await fetch(url, {
    method: "POST",
    body: formData,
    headers,
    credentials: "include",
  });

  if (!response.ok) {
    const text = await response.text();
    let data = text;
    try {
      data = JSON.parse(text);
    } catch (error) {}
    throw new Error((data && (data as any).message) || `Upload failed`);
  }
  return await response.json();
};

export const getAssignmentsByCourse = async (
  courseId: string,
  limit: number,
  page: number,
) => {
  const response = await api.get(
    `/api/assignments/?courseId=${courseId}&limit=${limit}&page=${page}`,
  );
  return response.data;
}


