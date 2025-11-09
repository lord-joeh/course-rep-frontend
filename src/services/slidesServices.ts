// Explanation: Switch uploadSlides to use fetch instead of axios (api instance) so the browser sets
// the multipart boundary automatically. We still include credentials and Authorization header
// (from localStorage) and optional socket ID if available. Do NOT set Content-Type so boundary is added.

import api from "../utils/api";

export const uploadSlides = async (formData: FormData) => {
  // Build full URL from the api instance baseURL
  const baseURL =
    (api.defaults && (api.defaults as any).baseURL) ||
    import.meta.env.VITE_API_URL ||
    "";
  const url = `${baseURL.replace(/\/$/, "")}/api/slides/upload?courseId=${formData.get("courseId") as string}&folderId=${formData.get("folderId") as string}`;

  // Prepare headers: include Authorization and Accept but DO NOT set Content-Type
  const headers: Record<string, string> = { Accept: "application/json" };

  try {
    const userData = localStorage.getItem("user");
    if (userData) {
      const user = JSON.parse(userData);
      if (user?.token) headers["Authorization"] = `Bearer ${user.token}`;
    }
  } catch (err) {
    // ignore parsing errors; no auth header will be sent
  }

  // include credentials (cookies)
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
    } catch (e) {
      // keep text
    }
    throw new Error(
      (data && (data as any).message) || `Upload failed: ${response.status}`,
    );
  }

  return await response.json();
};

export const getSlidesByCourse = async (
  courseId: string,
  limit: number,
  page: number,
) => {
  const response = await api.get(
    `/api/slides/?courseId=${courseId}&limit=${limit}&page=${page}`,
  );
  return response.data;
};

export const deleteSlide = async (slideId: string) => {
  const response = await api.delete(`/api/slides/${slideId}/delete`);
  return response.data;
};

export const downloadSlide = async (slideId: string) => {
  return await api.get(`/google/download?fileId=${slideId}`, {
    responseType: "blob",
  });
};
