"use client";

import { useState, useEffect, useCallback } from "react";
import { api } from "@/utils/auth/axios-client";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface FinanceCategory {
    id: string;
    name: string;
    isActive: boolean;
}

export type FinanceRequestStatus = "PENDING" | "APPROVED" | "REJECTED";

export interface FinanceRequest {
    id: string;
    requestedBy: { id: string; firstname: string; lastname: string; email: string };
    department: { id: string; name: string };
    category: { id: string; name: string };
    amount: string;
    reason: string;
    status: FinanceRequestStatus;
    recipientBankName: string;
    recipientAccountNumber: string;
    recipientAccountName: string;
    createdAt: string;
}

export interface CreateFinanceRequestPayload {
    categoryId: string;
    departmentId: string;
    reason: string;
    amount: string;
    recipientBankName: string;
    recipientAccountNumber: string;
    recipientAccountName: string;
    attachment?: File;
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export interface UseFinanceRequestsReturn {
    categories: FinanceCategory[];
    requests: FinanceRequest[];
    isLoading: boolean;
    isSubmitting: boolean;
    error: string | null;
    submitError: string | null;
    createRequest: (payload: CreateFinanceRequestPayload) => Promise<void>;
    getRequestById: (id: string) => Promise<FinanceRequest>;
    refetch: () => void;
}

export function useFinanceRequests(): UseFinanceRequestsReturn {
    const [categories, setCategories] = useState<FinanceCategory[]>([]);
    const [requests, setRequests] = useState<FinanceRequest[]>([]);
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
                const [categoriesRes, requestsRes] = await Promise.all([
                    api.get<{ data: FinanceCategory[] }>("/finance/categories"),
                    api.get<{ data: { data: FinanceRequest[] } }>("/finance/requests?page=1&limit=20"),
                ]);
                if (!cancelled) {
                    setCategories(categoriesRes.data.data);
                    setRequests(requestsRes.data.data.data);
                }
            } catch (err: unknown) {
                if (!cancelled)
                    setError(err instanceof Error ? err.message : "Failed to load finance requests.");
            } finally {
                if (!cancelled) setIsLoading(false);
            }
        }

        load();
        return () => { cancelled = true; };
    }, [fetchTick]);

    const createRequest = useCallback(async (payload: CreateFinanceRequestPayload) => {
        setIsSubmitting(true);
        setSubmitError(null);
        try {
            const formData = new FormData();
            formData.append("categoryId", payload.categoryId);
            formData.append("departmentId", payload.departmentId);
            formData.append("reason", payload.reason);
            formData.append("amount", payload.amount);
            formData.append("recipientBankName", payload.recipientBankName);
            formData.append("recipientAccountNumber", payload.recipientAccountNumber);
            formData.append("recipientAccountName", payload.recipientAccountName);
            if (payload.attachment) formData.append("attachment", payload.attachment);

            await api.post("/finance/requests", formData, {
                headers: { "Content-Type": "multipart/form-data" },
            });
            setFetchTick((t) => t + 1);
        } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : "Failed to submit finance request.";
            setSubmitError(msg);
            throw new Error(msg);
        } finally {
            setIsSubmitting(false);
        }
    }, []);

    const getRequestById = useCallback(async (id: string): Promise<FinanceRequest> => {
        const res = await api.get<{ data: FinanceRequest }>(`/finance/requests/${id}`);
        return res.data.data;
    }, []);

    const refetch = useCallback(() => setFetchTick((t) => t + 1), []);

    return {
        categories,
        requests,
        isLoading,
        isSubmitting,
        error,
        submitError,
        createRequest,
        getRequestById,
        refetch,
    };
}