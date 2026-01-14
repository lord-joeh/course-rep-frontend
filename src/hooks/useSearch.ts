import { useMemo } from "react";

export function useSearch<T extends object>(items: T[], query: string) {
  return useMemo(() => {
    const trimmedQuery = query?.trim().toLowerCase();
    if (!trimmedQuery) return items;

    return items.filter((item) => {
      return Object.values(item).some((val) => {
        if (val === null || val === undefined) return false;

        if (typeof val === "object" && !(val instanceof Date)) {
          return Object.values(val).some((subVal) =>
            String(subVal).toLowerCase().includes(trimmedQuery),
          );
        }

        return String(val).toLowerCase().includes(trimmedQuery);
      });
    });
  }, [items, query]);
}
