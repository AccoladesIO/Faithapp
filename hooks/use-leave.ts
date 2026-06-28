"use client";

import { useState, useEffect, useCallback } from "react";
import { api } from "@/utils/auth/axios-client";

// ─── Types ────────────────────────────────────────────────────────────────────

export type LeaveStatus = "PENDING" | "APPROVED" | "REJECTED";

export interface LeaveRecord {
    id: string;
    reason: string;
    startDate: string;
    endDate: string;
    status: LeaveStatus;
    createdAt: string;
    worker: {
        id: string;
        member: { firstname: string; lastname: string };
    };
}

export interface CreateLeavePayload {
    dateFrom: string; // "YYYY-MM-DD"
    dateTo: string;
    reason: string;
}

export interface UseLeaveReturn {
    records: LeaveRecord[];
    statusFilter: LeaveStatus | undefined;
    setStatusFilter: (s: LeaveStatus | undefined) => void;
    isLoading: boolean;
    isSubmitting: boolean;
    error: string | null;
    submitError: string | null;
    createLeave: (payload: CreateLeavePayload) => Promise<void>;
    deleteLeave: (id: string) => Promise<void>;
    refetch: () => void;
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useLeave(): UseLeaveReturn {
    const [records, setRecords] = useState<LeaveRecord[]>([]);
    const [statusFilter, setStatusFilter] = useState<LeaveStatus | undefined>(undefined);
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [submitError, setSubmitError] = useState<string | null>(null);
    const [fetchTick, setFetchTick] = useState(0);

    useEffect(() => {
        let cancelled = false;

        async function load() {
            setIsLoading(true);
            setError(null);
            try {
                const params = new URLSearchParams({ page: "1", limit: "20" });
                if (statusFilter) params.set("status", statusFilter);
                const res = await api.get<{ data: { data: LeaveRecord[] } }>(
                    `/leave/my-history?${params.toString()}`
                );
                if (!cancelled) setRecords(res.data.data.data);
            } catch (err: unknown) {
                if (!cancelled)
                    setError(err instanceof Error ? err.message : "Failed to load leave history.");
            } finally {
                if (!cancelled) setIsLoading(false);
            }
        }

        load();
        return () => { cancelled = true; };
    }, [fetchTick, statusFilter]);

    const createLeave = useCallback(async (payload: CreateLeavePayload) => {
        setIsSubmitting(true);
        setSubmitError(null);
        try {
            await api.post("/leave", payload);
            setFetchTick((t) => t + 1);
        } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : "Failed to submit leave request.";
            setSubmitError(msg);
            throw new Error(msg);
        } finally {
            setIsSubmitting(false);
        }
    }, []);

    const deleteLeave = useCallback(async (id: string) => {
        setIsSubmitting(true);
        setSubmitError(null);
        try {
            await api.delete(`/leave/${id}`);
            setRecords((prev) => prev.filter((r) => r.id !== id));
        } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : "Failed to cancel leave request.";
            setSubmitError(msg);
            throw new Error(msg);
        } finally {
            setIsSubmitting(false);
        }
    }, []);

    const refetch = useCallback(() => setFetchTick((t) => t + 1), []);

    return {
        records,
        statusFilter,
        setStatusFilter,
        isLoading,
        isSubmitting,
        error,
        submitError,
        createLeave,
        deleteLeave,
        refetch,
    };
}