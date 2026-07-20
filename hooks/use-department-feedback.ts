"use client";

import { useState, useEffect, useCallback } from "react";
import { api } from "@/utils/auth/axios-client";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface DepartmentFeedbackRecord {
    id: string;
    department: { id: string; name: string };
    weekOf: string;
    attendanceNotes: string;
    highlights: string;
    challenges: string;
    prayerRequests: string | null;
    additionalNotes: string | null;
    submittedByName: string;
    submittedAt: string;
    respondedByPastorName: string | null;
    pastorResponse: string | null;
    pastorRespondedAt: string | null;
}

export interface SubmitDepartmentFeedbackPayload {
    departmentId: string;
    weekOf: string;
    attendanceNotes: string;
    highlights: string;
    challenges: string;
    prayerRequests?: string;
    additionalNotes?: string;
}

export interface UseDepartmentFeedbackReturn {
    records: DepartmentFeedbackRecord[];
    isLoading: boolean;
    isSubmitting: boolean;
    error: string | null;
    submitError: string | null;
    submitFeedback: (payload: SubmitDepartmentFeedbackPayload) => Promise<void>;
    refetch: () => void;
}

// ─── Hook — HOD/Assistant HOD's own submission + history ──────────────────────

export function useDepartmentFeedback(): UseDepartmentFeedbackReturn {
    const [records, setRecords] = useState<DepartmentFeedbackRecord[]>([]);
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
                const res = await api.get<{ data: { data: DepartmentFeedbackRecord[] } }>(
                    "/department-feedback/my?page=1&limit=20"
                );
                if (!cancelled) setRecords(res.data.data.data);
            } catch (err: unknown) {
                if (!cancelled)
                    setError(err instanceof Error ? err.message : "Failed to load feedback history.");
            } finally {
                if (!cancelled) setIsLoading(false);
            }
        }

        load();
        return () => { cancelled = true; };
    }, [fetchTick]);

    const submitFeedback = useCallback(async (payload: SubmitDepartmentFeedbackPayload) => {
        setIsSubmitting(true);
        setSubmitError(null);
        try {
            await api.post("/department-feedback", payload);
            setFetchTick((t) => t + 1);
        } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : "Failed to submit feedback.";
            setSubmitError(msg);
            throw new Error(msg);
        } finally {
            setIsSubmitting(false);
        }
    }, []);

    const refetch = useCallback(() => setFetchTick((t) => t + 1), []);

    return { records, isLoading, isSubmitting, error, submitError, submitFeedback, refetch };
}
