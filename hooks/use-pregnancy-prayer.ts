"use client";

import { useState, useCallback } from "react";
import { api } from "@/utils/auth/axios-client";
import { PrayerPagination } from "./use-prayer-requests";

export type PregnancyCaseStatus = "ACTIVE" | "DELIVERED" | "DISCONTINUED";

export interface PregnancyCaseRecord {
    id: string;
    name: string;
    edd: string;
    details: string | null;
    status: PregnancyCaseStatus;
    lastPrayedAt: string | null;
    createdByName: string;
    createdAt: string;
}

export interface CreatePregnancyCasePayload {
    name: string;
    edd: string;
    details?: string;
    memberId?: string;
}

export interface PregnancyVisitRecord {
    id: string;
    loggedByName: string;
    note: string | null;
    visitedAt: string;
}

type Paged = { data: { data: PregnancyCaseRecord[]; page: number; limit: number; totalCount: number; totalPages: number } };

const extractMessage = (err: unknown, fallback: string) =>
    err instanceof Error ? err.message : fallback;

// Prayer-department-worker-or-Pastor only — kept separate from usePrayerTeam()
// since it tracks a distinct entity (pregnancy cases + visit logs), not
// member-submitted prayer requests.
export function usePregnancyPrayer() {
    const [cases, setCases] = useState<PregnancyCaseRecord[]>([]);
    const [pagination, setPagination] = useState<PrayerPagination | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitError, setSubmitError] = useState<string | null>(null);

    const fetchCases = useCallback(async (page = 1, status?: PregnancyCaseStatus) => {
        setIsLoading(true);
        setError(null);
        try {
            const params = new URLSearchParams({ page: String(page), limit: "10" });
            if (status) params.set("status", status);
            const res = await api.get<Paged>(`/prayer-requests/team/pregnancy-cases?${params.toString()}`);
            setCases(res.data.data.data);
            setPagination({
                page: res.data.data.page, limit: res.data.data.limit,
                totalCount: res.data.data.totalCount, totalPages: res.data.data.totalPages,
            });
        } catch (err: unknown) {
            setError(extractMessage(err, "Failed to load pregnancy prayer cases."));
        } finally {
            setIsLoading(false);
        }
    }, []);

    const createCase = useCallback(async (payload: CreatePregnancyCasePayload): Promise<void> => {
        setIsSubmitting(true);
        setSubmitError(null);
        try {
            await api.post("/prayer-requests/team/pregnancy-cases", payload);
            await fetchCases(1);
        } catch (err: unknown) {
            const msg = extractMessage(err, "Failed to create pregnancy case.");
            setSubmitError(msg);
            throw new Error(msg);
        } finally {
            setIsSubmitting(false);
        }
    }, [fetchCases]);

    const logVisit = useCallback(async (caseId: string, note?: string): Promise<void> => {
        setIsSubmitting(true);
        setSubmitError(null);
        try {
            const res = await api.post<{ data: { visitedAt: string } }>(
                `/prayer-requests/team/pregnancy-cases/${caseId}/visit`,
                { note }
            );
            setCases((prev) => prev.map((c) =>
                c.id === caseId ? { ...c, lastPrayedAt: res.data.data.visitedAt } : c
            ));
        } catch (err: unknown) {
            const msg = extractMessage(err, "Failed to log visit.");
            setSubmitError(msg);
            throw new Error(msg);
        } finally {
            setIsSubmitting(false);
        }
    }, []);

    const updateStatus = useCallback(async (caseId: string, status: PregnancyCaseStatus): Promise<void> => {
        setIsSubmitting(true);
        setSubmitError(null);
        try {
            const res = await api.patch<{ data: PregnancyCaseRecord }>(
                `/prayer-requests/team/pregnancy-cases/${caseId}/status`,
                { status }
            );
            setCases((prev) => prev.map((c) => (c.id === caseId ? res.data.data : c)));
        } catch (err: unknown) {
            const msg = extractMessage(err, "Failed to update status.");
            setSubmitError(msg);
            throw new Error(msg);
        } finally {
            setIsSubmitting(false);
        }
    }, []);

    const fetchVisitHistory = useCallback(async (
        caseId: string,
        page = 1
    ): Promise<{ visits: PregnancyVisitRecord[]; pagination: PrayerPagination | null }> => {
        try {
            const res = await api.get<{ data: { data: PregnancyVisitRecord[]; page: number; limit: number; totalCount: number; totalPages: number } }>(
                `/prayer-requests/team/pregnancy-cases/${caseId}/visits?page=${page}&limit=10`
            );
            const outer = res.data.data;
            return {
                visits: outer.data,
                pagination: { page: outer.page, limit: outer.limit, totalCount: outer.totalCount, totalPages: outer.totalPages },
            };
        } catch {
            return { visits: [], pagination: null };
        }
    }, []);

    return {
        cases, pagination, isLoading, error,
        isSubmitting, submitError,
        fetchCases, createCase, logVisit, updateStatus,
        fetchVisitHistory,
    };
}
