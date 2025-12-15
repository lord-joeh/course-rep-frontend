import {
  createContext,
  useState,
  ReactNode,
  useCallback,
} from "react";

export interface ProgressItem {
  id: string;
  title: string;
  progress: number;
  status: "active" | "completed" | "error";
  message?: string;
  createdAt: number;
  metadata?: {
    jobType?: string;
    socketId?: string;
    [key: string]: any;
  };
}

interface ProgressContextType {
  items: ProgressItem[];
  addProgress: (
    id: string,
    title: string,
    metadata?: ProgressItem["metadata"],
  ) => void;
  updateProgress: (id: string, progress: number, message?: string) => void;
  completeProgress: (id: string, success: boolean, message?: string) => void;
  removeProgress: (id: string) => void;
  getProgressItem: (id: string) => ProgressItem | undefined;
}

export const ProgressContext = createContext<ProgressContextType | undefined>(
  undefined,
);

export const ProgressProvider = ({ children }: { children: ReactNode }) => {
  const [items, setItems] = useState<ProgressItem[]>([]);

  const addProgress = useCallback(
    (id: string, title: string, metadata?: ProgressItem["metadata"]) => {
      setItems((prev) => {
        // Prevent duplicates
        if (prev.find((item) => item.id === id)) return prev;
        return [
          ...prev,
          {
            id,
            title,
            progress: 0,
            status: "active",
            message: "Starting...",
            createdAt: Date.now(),
            metadata,
          },
        ];
      });
    },
    [],
  );

  const updateProgress = useCallback(
    (id: string, progress: number, message?: string) => {
      setItems((prev) =>
        prev.map((item) =>
          item.id === id
            ? { ...item, progress, message: message || item.message }
            : item,
        ),
      );
    },
    [],
  );

  const completeProgress = useCallback(
    (id: string, success: boolean, message?: string) => {
      setItems((prev) =>
        prev.map((item) =>
          item.id === id
            ? {
                ...item,
                progress: success ? 100 : item.progress,
                status: success ? "completed" : "error",
                message: message || (success ? "Done" : "Failed"),
              }
            : item,
        ),
      );

      // Auto-remove after delay
      setTimeout(() => {
        removeProgress(id);
      }, 4000);
    },
    [],
  );

  const removeProgress = useCallback((id: string) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
  }, []);

  const getProgressItem = useCallback(
    (id: string) => {
      return items.find((item) => item.id === id);
    },
    [items],
  );

  return (
    <ProgressContext.Provider
      value={{
        items,
        addProgress,
        updateProgress,
        completeProgress,
        removeProgress,
        getProgressItem,
      }}
    >
      {children}
    </ProgressContext.Provider>
  );
};
