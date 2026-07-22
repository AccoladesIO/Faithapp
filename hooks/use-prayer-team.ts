"use client";

import { useState, useCallback } from "react";
import { api } from "@/utils/auth/axios-client";
import { PrayerRequestRecord, PrayerRequestStatus, PrayerPagination } from "./use-prayer-requests";

type Paged = { data: { data: PrayerRequestRecord[]; page: number; limit: number; totalCount: number; totalPages: number } };

const extractMessage = (err: unknown, fallback: string) =>
    err instanceof Error ? err.message : fallback;

// Prayer-department-worker-or-Pastor inbox — kept separate from
// usePrayerRequests() (the submitter's own view) since a plain member/worker
// should never trigger this fetch at all.
export function usePrayerTeam() {
    const [records, setRecords] = useState<PrayerRequestRecord[]>([]);
    const [pagination, setPagination] = useState<PrayerPagination | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isUpdating, setIsUpdating] = useState(false);
    const [updateError, setUpdateError] = useState<string | null>(null);

    const fetchTeamRequests = useCallback(async (page = 1, status?: PrayerRequestStatus) => {
        setIsLoading(true);
        setError(null);
        try {
            const params = new URLSearchParams({ page: String(page), limit: "10" });
            if (status) params.set("status", status);
            const res = await api.get<Paged>(`/prayer-requests/team?${params.toString()}`);
            setRecords(res.data.data.data);
            setPagination({
                page: res.data.data.page, limit: res.data.data.limit,
                totalCount: res.data.data.totalCount, totalPages: res.data.data.totalPages,
            });
        } catch (err: unknown) {
            setError(extractMessage(err, "Failed to load prayer requests."));
        } finally {
            setIsLoading(false);
        }
    }, []);

    const updateStatus = useCallback(async (id: string, status: PrayerRequestStatus): Promise<void> => {
        setIsUpdating(true);
        setUpdateError(null);
        try {
            const res = await api.patch<{ data: PrayerRequestRecord }>(
                `/prayer-requests/team/${id}/status`,
                { status }
            );
            setRecords((prev) => prev.map((r) => (r.id === id ? res.data.data : r)));
        } catch (err: unknown) {
            const msg = extractMessage(err, "Failed to update status.");
            setUpdateError(msg);
            throw new Error(msg);
        } finally {
            setIsUpdating(false);
        }
    }, []);

    return { records, pagination, isLoading, error, isUpdating, updateError, fetchTeamRequests, updateStatus };
}
