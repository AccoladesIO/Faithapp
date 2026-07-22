"use client";

import { useState, useCallback } from "react";
import { api } from "@/utils/auth/axios-client";

// ─── Types ────────────────────────────────────────────────────────────────────

export type PrayerRequestStatus = "OPEN" | "PRAYED_FOR" | "ANSWERED";

export interface PrayerRequestRecord {
    id: string;
    submittedByName: string;
    content: string;
    status: PrayerRequestStatus;
    createdAt: string;
    updatedAt: string;
}

export interface TestimonyRecord {
    id: string;
    submittedByName: string;
    content: string;
    isPublic: boolean;
    prayerRequest: { id: string; content: string } | null;
    createdAt: string;
}

export interface PrayerPagination {
    page: number;
    limit: number;
    totalCount: number;
    totalPages: number;
}

export interface SubmitTestimonyPayload {
    content: string;
    prayerRequestId?: string;
    isPublic?: boolean;
}

type Paged<T> = { data: { data: T[]; page: number; limit: number; totalCount: number; totalPages: number } };

const extractMessage = (err: unknown, fallback: string) =>
    err instanceof Error ? err.message : fallback;

// ─── Hook — member/worker's own prayer requests + testimonies ────────────────

export function usePrayerRequests() {
    const [myRequests, setMyRequests] = useState<PrayerRequestRecord[]>([]);
    const [myRequestsPagination, setMyRequestsPagination] = useState<PrayerPagination | null>(null);
    const [myTestimonies, setMyTestimonies] = useState<TestimonyRecord[]>([]);
    const [myTestimoniesPagination, setMyTestimoniesPagination] = useState<PrayerPagination | null>(null);
    const [publicTestimonies, setPublicTestimonies] = useState<TestimonyRecord[]>([]);
    const [publicTestimoniesPagination, setPublicTestimoniesPagination] = useState<PrayerPagination | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchMyRequests = useCallback(async (page = 1) => {
        setIsLoading(true);
        setError(null);
        try {
            const res = await api.get<Paged<PrayerRequestRecord>>(
                `/prayer-requests/mine?page=${page}&limit=10`
            );
            setMyRequests(res.data.data.data);
            setMyRequestsPagination({
                page: res.data.data.page, limit: res.data.data.limit,
                totalCount: res.data.data.totalCount, totalPages: res.data.data.totalPages,
            });
        } catch (err: unknown) {
            setError(extractMessage(err, "Failed to load your prayer requests."));
        } finally {
            setIsLoading(false);
        }
    }, []);

    const fetchMyTestimonies = useCallback(async (page = 1) => {
        setIsLoading(true);
        setError(null);
        try {
            const res = await api.get<Paged<TestimonyRecord>>(
                `/testimonies/mine?page=${page}&limit=10`
            );
            setMyTestimonies(res.data.data.data);
            setMyTestimoniesPagination({
                page: res.data.data.page, limit: res.data.data.limit,
                totalCount: res.data.data.totalCount, totalPages: res.data.data.totalPages,
            });
        } catch (err: unknown) {
            setError(extractMessage(err, "Failed to load your testimonies."));
        } finally {
            setIsLoading(false);
        }
    }, []);

    const fetchPublicTestimonies = useCallback(async (page = 1) => {
        setIsLoading(true);
        setError(null);
        try {
            const res = await api.get<Paged<TestimonyRecord>>(
                `/testimonies/public?page=${page}&limit=10`
            );
            setPublicTestimonies(res.data.data.data);
            setPublicTestimoniesPagination({
                page: res.data.data.page, limit: res.data.data.limit,
                totalCount: res.data.data.totalCount, totalPages: res.data.data.totalPages,
            });
        } catch (err: unknown) {
            setError(extractMessage(err, "Failed to load testimonies."));
        } finally {
            setIsLoading(false);
        }
    }, []);

    const submitRequest = useCallback(async (content: string): Promise<void> => {
        setIsSubmitting(true);
        setError(null);
        try {
            await api.post("/prayer-requests", { content });
            await fetchMyRequests(1);
        } catch (err: unknown) {
            const msg = extractMessage(err, "Failed to submit prayer request.");
            setError(msg);
            throw new Error(msg);
        } finally {
            setIsSubmitting(false);
        }
    }, [fetchMyRequests]);

    const submitTestimony = useCallback(async (payload: SubmitTestimonyPayload): Promise<void> => {
        setIsSubmitting(true);
        setError(null);
        try {
            await api.post("/testimonies", payload);
            await fetchMyTestimonies(1);
        } catch (err: unknown) {
            const msg = extractMessage(err, "Failed to submit testimony.");
            setError(msg);
            throw new Error(msg);
        } finally {
            setIsSubmitting(false);
        }
    }, [fetchMyTestimonies]);

    return {
        myRequests, myRequestsPagination,
        myTestimonies, myTestimoniesPagination,
        publicTestimonies, publicTestimoniesPagination,
        isLoading, isSubmitting, error,
        fetchMyRequests, fetchMyTestimonies, fetchPublicTestimonies,
        submitRequest, submitTestimony,
    };
}
