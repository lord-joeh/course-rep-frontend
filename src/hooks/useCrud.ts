import { useEffect, useState } from "react";
import { isAxiosError } from "axios";

type Service<T, Create = any, Update = any> = {
  list: () => Promise<{ data: T[] }>;
  add?: (payload: Create) => Promise<any>;
  update?: (id: string, payload: Update) => Promise<any>;
  remove?: (id: string) => Promise<any>;
};

export function useCrud<T, Create = any, Update = any>(service: Service<T, Create, Update>) {
  const [items, setItems] = useState<T[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error"; visible: boolean }>({
    message: "",
    type: "error",
    visible: false,
  });

  const showToast = (message: string, type: "success" | "error") =>
    setToast({ message, type, visible: true });

  const closeToast = () => setToast((t) => ({ ...t, visible: false }));

  const fetch = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await service.list();
      setItems(res.data || []);
    } catch (err) {
      if (isAxiosError(err)) {
        setError(err.response?.data?.error || err.message);
        showToast(err.response?.data?.error || "Error fetching data", "error");
      } else {
        setError("Unexpected error");
        showToast("Unexpected error", "error");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetch().catch(() => {});
  }, []);

  const refresh = () => fetch().catch(() => {});

  const add = async (payload: Create) => {
    if (!service.add) throw new Error("add not implemented");
    setLoading(true);
    try {
      const res = await service.add(payload);
      showToast(res?.data?.message || res?.message || "Added", "success");
      await fetch();
      return res;
    } catch (err) {
      if (isAxiosError(err)) {
        showToast(err.response?.data?.error || "Failed to add", "error");
      } else {
        showToast("Failed to add", "error");
      }
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const update = async (id: string, payload: Update) => {
    if (!service.update) throw new Error("update not implemented");
    setLoading(true);
    try {
      const res = await service.update(id, payload);
      showToast(res?.data?.message || res?.message || "Updated", "success");
      await fetch();
      return res;
    } catch (err) {
      if (isAxiosError(err)) {
        showToast(err.response?.data?.error || "Failed to update", "error");
      } else {
        showToast("Failed to update", "error");
      }
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const remove = async (id: string) => {
    if (!service.remove) throw new Error("remove not implemented");
    setLoading(true);
    try {
      const res = await service.remove(id);
      showToast(res?.data?.message || res?.message || "Deleted", "success");
      await fetch();
      return res;
    } catch (err) {
      if (isAxiosError(err)) {
        showToast(err.response?.data?.error || "Failed to delete", "error");
      } else {
        showToast("Failed to delete", "error");
      }
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return {
    items,
    setItems,
    loading,
    error,
    toast,
    showToast,
    closeToast,
    refresh,
    add,
    update,
    remove,
  };
}