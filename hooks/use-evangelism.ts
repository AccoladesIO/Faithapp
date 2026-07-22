"use client";

import { useState, useCallback } from "react";
import { api } from "@/utils/auth/axios-client";
import { PrayerPagination } from "./use-prayer-requests";

export type ConvertStatus = "UNSAVED" | "SAVED" | "UNDERGOING_DISCIPLESHIP";

export interface ConvertRecord {
    id: string;
    name: string;
    phone: string | null;
    notes: string | null;
    status: ConvertStatus;
    onboardedByName: string;
    assignedTo: { id: string; member: { firstname: string; lastname: string } } | null;
    lastContactedAt: string | null;
    daysSinceLastContact: number | null;
    isOverdue: boolean;
    createdAt: string;
}

export interface CreateConvertPayload {
    name: string;
    phone?: string;
    notes?: string;
    status?: ConvertStatus;
}

export interface FollowUpLogRecord {
    id: string;
    loggedByName: string;
    note: string | null;
    contactedAt: string;
}

type Paged = { data: { data: ConvertRecord[]; page: number; limit: number; totalCount: number; totalPages: number } };

const extractMessage = (err: unknown, fallback: string) =>
    err instanceof Error ? err.message : fallback;

// Any worker can create a convert. Only fetchTeamConverts/logFollowUp/
// updateStatus require the caller to be an Evangelism-department worker
// (enforced server-side) — kept in one hook since both actions are on the
// same "/evangelism" screen, just gated by tab visibility.
export function useEvangelism() {
    const [converts, setConverts] = useState<ConvertRecord[]>([]);
    const [pagination, setPagination] = useState<PrayerPagination | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitError, setSubmitError] = useState<string | null>(null);

    const createConvert = useCallback(async (payload: CreateConvertPayload): Promise<void> => {
        setIsSubmitting(true);
        setSubmitError(null);
        try {
            await api.post("/evangelism/converts", payload);
        } catch (err: unknown) {
            const msg = extractMessage(err, "Failed to create convert.");
            setSubmitError(msg);
            throw new Error(msg);
        } finally {
            setIsSubmitting(false);
        }
    }, []);

    const fetchTeamConverts = useCallback(async (page = 1, status?: ConvertStatus) => {
        setIsLoading(true);
        setError(null);
        try {
            const params = new URLSearchParams({ page: String(page), limit: "10" });
            if (status) params.set("status", status);
            const res = await api.get<Paged>(`/evangelism/converts/team?${params.toString()}`);
            setConverts(res.data.data.data);
            setPagination({
                page: res.data.data.page, limit: res.data.data.limit,
                totalCount: res.data.data.totalCount, totalPages: res.data.data.totalPages,
            });
        } catch (err: unknown) {
            setError(extractMessage(err, "Failed to load converts."));
        } finally {
            setIsLoading(false);
        }
    }, []);

    const logFollowUp = useCallback(async (convertId: string, note?: string): Promise<void> => {
        setIsSubmitting(true);
        setSubmitError(null);
        try {
            await api.post(`/evangelism/converts/${convertId}/follow-up`, { note });
            setConverts((prev) => prev.map((c) =>
                c.id === convertId ? { ...c, lastContactedAt: new Date().toISOString(), daysSinceLastContact: 0, isOverdue: false } : c
            ));
        } catch (err: unknown) {
            const msg = extractMessage(err, "Failed to log follow-up.");
            setSubmitError(msg);
            throw new Error(msg);
        } finally {
            setIsSubmitting(false);
        }
    }, []);

    const updateStatus = useCallback(async (convertId: string, status: ConvertStatus): Promise<void> => {
        setIsSubmitting(true);
        setSubmitError(null);
        try {
            const res = await api.patch<{ data: ConvertRecord }>(
                `/evangelism/converts/${convertId}/status`,
                { status }
            );
            setConverts((prev) => prev.map((c) => (c.id === convertId ? res.data.data : c)));
        } catch (err: unknown) {
            const msg = extractMessage(err, "Failed to update status.");
            setSubmitError(msg);
            throw new Error(msg);
        } finally {
            setIsSubmitting(false);
        }
    }, []);

    const fetchFollowUpHistory = useCallback(async (
        convertId: string,
        page = 1
    ): Promise<{ logs: FollowUpLogRecord[]; pagination: PrayerPagination | null }> => {
        try {
            const res = await api.get<{ data: { data: FollowUpLogRecord[]; page: number; limit: number; totalCount: number; totalPages: number } }>(
                `/evangelism/converts/${convertId}/follow-up-history?page=${page}&limit=10`
            );
            const outer = res.data.data;
            return {
                logs: outer.data,
                pagination: { page: outer.page, limit: outer.limit, totalCount: outer.totalCount, totalPages: outer.totalPages },
            };
        } catch {
            return { logs: [], pagination: null };
        }
    }, []);

    return {
        converts, pagination, isLoading, error,
        isSubmitting, submitError,
        createConvert, fetchTeamConverts, logFollowUp, updateStatus,
        fetchFollowUpHistory,
    };
}
