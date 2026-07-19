"use client";

import { useCallback, useState, useEffect } from "react";
import { api } from "@/utils/auth/axios-client";

export interface SubmitIncidentPayload {
    title: string;
    description: string;
    location: string;
    isAnonymous: boolean;
    images: File[];
}

export type IncidentStatus = "OPEN" | "IN_PROGRESS" | "RESOLVED";

export interface IncidentReport {
    id: string;
    title: string;
    description: string;
    location: string | null;
    status: IncidentStatus;
    isAnonymous: boolean;
    images: string[] | null;
    adminNotes: string | null;
    resolvedAt: string | null;
    createdAt: string;
}

export interface IncidentReportsPage {
    data: IncidentReport[];
    page: number;
    limit: number;
    totalCount: number;
    totalPages: number;
}

export interface UseIncidentsReturn {
    isSubmitting: boolean;
    submitError: string | null;
    submitIncident: (payload: SubmitIncidentPayload) => Promise<void>;
}

export function useIncidents(): UseIncidentsReturn {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitError, setSubmitError] = useState<string | null>(null);

    const submitIncident = useCallback(async (payload: SubmitIncidentPayload) => {
        setIsSubmitting(true);
        setSubmitError(null);
        try {
            const formData = new FormData();
            formData.append("title", payload.title);
            formData.append("description", payload.description);
            formData.append("location", payload.location);
            formData.append("isAnonymous", payload.isAnonymous ? "true" : "false");
            payload.images.forEach((img) => formData.append("images", img));

            await api.post("/incidents", formData, {
                headers: { "Content-Type": "multipart/form-data" },
            });
        } catch (err: unknown) {
            const msg =
                err instanceof Error ? err.message : "Failed to submit incident report.";
            setSubmitError(msg);
            throw new Error(msg);
        } finally {
            setIsSubmitting(false);
        }
    }, []);

    return { isSubmitting, submitError, submitIncident };
}

export interface UseMyIncidentReportsReturn {
    reports: IncidentReport[];
    isLoading: boolean;
    error: string | null;
    page: number;
    totalPages: number;
    goToPage: (page: number) => void;
    refetch: () => void;
}

export function useMyIncidentReports(enabled: boolean, limit = 10): UseMyIncidentReportsReturn {
    const [reports, setReports] = useState<IncidentReport[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [fetchTick, setFetchTick] = useState(0);

    useEffect(() => {
        if (!enabled) return;
        let cancelled = false;

        async function load() {
            setIsLoading(true);
            setError(null);
            try {
                const res = await api.get<{ data: IncidentReportsPage }>(
                    `/incidents?page=${page}&limit=${limit}`
                );
                if (!cancelled) {
                    setReports(res.data.data.data);
                    setTotalPages(res.data.data.totalPages);
                }
            } catch (err: unknown) {
                if (!cancelled)
                    setError(err instanceof Error ? err.message : "Could not load your incident reports.");
            } finally {
                if (!cancelled) setIsLoading(false);
            }
        }

        load();
        return () => { cancelled = true; };
    }, [enabled, page, limit, fetchTick]);

    const refetch = useCallback(() => setFetchTick((t) => t + 1), []);

    return { reports, isLoading, error, page, totalPages, goToPage: setPage, refetch };
}