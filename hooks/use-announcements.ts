"use client";

import { useState, useEffect, useCallback } from "react";
import { api } from "@/utils/auth/axios-client";

export interface Announcement {
    id: string;
    title: string;
    body: string;
    audience: string;
    createdAt: string;
}

export interface AnnouncementsPage {
    data: Announcement[];
    page: number;
    limit: number;
    totalCount: number;
    totalPages: number;
}

export interface UseAnnouncementsReturn {
    announcements: Announcement[];
    isLoading: boolean;
    error: string | null;
    refetch: () => void;
}

export function useAnnouncements(departmentId?: string): UseAnnouncementsReturn {
    const [announcements, setAnnouncements] = useState<Announcement[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [fetchTick, setFetchTick] = useState(0);

    useEffect(() => {
        let cancelled = false;

        async function load() {
            setIsLoading(true);
            setError(null);
            try {
                const params = new URLSearchParams({ page: "1", limit: "10" });
                if (departmentId) params.set("departmentId", departmentId);

                const res = await api.get<{ data: AnnouncementsPage }>(
                    `/announcements/feed?${params.toString()}`
                );
                if (!cancelled) setAnnouncements(res.data.data.data);
            } catch (err: unknown) {
                if (!cancelled) {
                    setError(
                        err instanceof Error
                            ? err.message
                            : "Failed to load announcements."
                    );
                }
            } finally {
                if (!cancelled) setIsLoading(false);
            }
        }

        load();
        return () => { cancelled = true; };
    }, [fetchTick, departmentId]);

    const refetch = useCallback(() => setFetchTick((t) => t + 1), []);

    return { announcements, isLoading, error, refetch };
}