"use client";

import { useState, useCallback } from "react";
import { api } from "@/utils/auth/axios-client";
import { PastorFeedbackRecord } from "./use-pastor-feedback-submission";

export interface PastorFeedbackPagination {
    page: number;
    limit: number;
    totalCount: number;
    totalPages: number;
}

export interface UsePastorFeedbackReturn {
    records: PastorFeedbackRecord[];
    pagination: PastorFeedbackPagination | null;
    isLoading: boolean;
    error: string | null;
    isResponding: boolean;
    respondError: string | null;
    fetchFeedback: (page?: number, departmentId?: string, weekOf?: string) => Promise<void>;
    respond: (id: string, response: string) => Promise<void>;
}

// Pastor-only — cross-department browse + reply. Kept separate from
// usePastorFeedbackSubmission() (the HOD's own submission flow) since a
// non-pastor member should never trigger this fetch at all.
export function usePastorFeedback(): UsePastorFeedbackReturn {
    const [records, setRecords] = useState<PastorFeedbackRecord[]>([]);
    const [pagination, setPagination] = useState<PastorFeedbackPagination | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isResponding, setIsResponding] = useState(false);
    const [respondError, setRespondError] = useState<string | null>(null);

    const fetchFeedback = useCallback(async (page = 1, departmentId?: string, weekOf?: string) => {
        setIsLoading(true);
        setError(null);
        try {
            const params = new URLSearchParams({ page: String(page), limit: "10" });
            if (departmentId) params.set("departmentId", departmentId);
            if (weekOf) params.set("weekOf", weekOf);
            const res = await api.get<{
                data: {
                    data: PastorFeedbackRecord[];
                    page: number;
                    limit: number;
                    totalCount: number;
                    totalPages: number;
                };
            }>(`/pastor-feedback/pastor?${params.toString()}`);
            setRecords(res.data.data.data);
            setPagination({
                page: res.data.data.page,
                limit: res.data.data.limit,
                totalCount: res.data.data.totalCount,
                totalPages: res.data.data.totalPages,
            });
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : "Failed to load department feedback.");
        } finally {
            setIsLoading(false);
        }
    }, []);

    const respond = useCallback(async (id: string, response: string) => {
        setIsResponding(true);
        setRespondError(null);
        try {
            const res = await api.post<{ data: PastorFeedbackRecord }>(
                `/pastor-feedback/pastor/${id}/respond`,
                { response }
            );
            setRecords((prev) => prev.map((r) => (r.id === id ? res.data.data : r)));
        } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : "Failed to send response.";
            setRespondError(msg);
            throw new Error(msg);
        } finally {
            setIsResponding(false);
        }
    }, []);

    return { records, pagination, isLoading, error, isResponding, respondError, fetchFeedback, respond };
}
