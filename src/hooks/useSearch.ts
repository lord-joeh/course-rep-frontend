import { useMemo } from "react";

export function useSearch<T>(items: T[], query: string) {
    return useMemo(() => {
        if (!query) return items;
        const lower = query.toLowerCase();
        return items.filter((it) =>
            Object.values(it as Record<string, unknown>).some((val) => String(val ?? "").toLowerCase().includes(lower)),
        );
    }, [items, query]);
}
