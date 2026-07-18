"use client";

import { useState, useEffect } from "react";
import { api } from "@/utils/auth/axios-client";

export interface MyServiceHistoryEntry {
    eventName: string | null;
    serviceSlotName: string;
    sessionDate: string;
    type: string;
    topic: string | null;
    allocatedMinutes: number;
    actualSeconds: number | null;
}

export interface MyServiceHistorySlotTypeSummary {
    type: string;
    count: number;
    totalActualSeconds: number;
}

export interface MyServiceHistoryResult {
    totalSlots: number;
    totalActualSeconds: number;
    bySlotType: MyServiceHistorySlotTypeSummary[];
    entries: MyServiceHistoryEntry[];
    page: number;
    limit: number;
    totalCount: number;
    totalPages: number;
}

export interface UseMyServiceHistoryReturn {
    result: MyServiceHistoryResult | null;
    isLoading: boolean;
    error: string | null;
    page: number;
    goToPage: (page: number) => void;
}

export function useMyServiceHistory(limit = 10): UseMyServiceHistoryReturn {
    const [result, setResult] = useState<MyServiceHistoryResult | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [page, setPage] = useState(1);

    useEffect(() => {
        let cancelled = false;

        async function load() {
            setIsLoading(true);
            setError(null);
            try {
                const res = await api.get<{ data: MyServiceHistoryResult }>(
                    `/service-session/my-history?page=${page}&limit=${limit}`
                );
                if (!cancelled) setResult(res.data.data);
            } catch (err: unknown) {
                if (!cancelled)
                    setError(err instanceof Error ? err.message : "Could not load your service history.");
            } finally {
                if (!cancelled) setIsLoading(false);
            }
        }

        load();
        return () => { cancelled = true; };
    }, [page, limit]);

    return { result, isLoading, error, page, goToPage: setPage };
}
