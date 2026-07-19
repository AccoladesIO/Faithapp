"use client";

import { useState, useEffect } from "react";
import { api } from "@/utils/auth/axios-client";

export interface DepartmentWorkerOnLeave {
    workerProfileId: string;
    memberId: string;
    name: string;
    status: string;
    dateFrom: string;
    dateTo: string;
}

export interface DepartmentSummary {
    departmentId: string;
    departmentName: string;
    myLeadRole: "head" | "assistant" | "admin";
    totalWorkers: number;
    activeWorkers: number;
    inactiveWorkers: number;
    attendancePercentage: number;
    workersOnLeave: DepartmentWorkerOnLeave[];
}

export interface UseDepartmentSummaryReturn {
    summary: DepartmentSummary | null;
    isLoading: boolean;
    error: string | null;
}

export function useDepartmentSummary(enabled: boolean): UseDepartmentSummaryReturn {
    const [summary, setSummary] = useState<DepartmentSummary | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!enabled) return;
        let cancelled = false;

        async function load() {
            setIsLoading(true);
            setError(null);
            try {
                const res = await api.get<{ data: DepartmentSummary }>("/departments/my/summary");
                if (!cancelled) setSummary(res.data.data);
            } catch (err: unknown) {
                if (!cancelled)
                    setError(err instanceof Error ? err.message : "Could not load your department summary.");
            } finally {
                if (!cancelled) setIsLoading(false);
            }
        }

        load();
        return () => { cancelled = true; };
    }, [enabled]);

    return { summary, isLoading, error };
}
