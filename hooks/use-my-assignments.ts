"use client";

import { useState, useEffect, useCallback } from "react";
import { api } from "@/utils/auth/axios-client";

export interface MyAssignment {
    slotId: string;
    programmeId: string;
    eventName: string | null;
    serviceSlotName: string;
    startTime: string;
    endTime: string;
    type: string;
    topic: string | null;
    allocatedMinutes: number;
    isBackup: boolean;
    programmeStatus: "DRAFT" | "LIVE" | "COMPLETED";
    // Only present once the programme has actually gone LIVE.
    sessionCode: string | null;
}

export function useMyAssignments() {
    const [assignments, setAssignments] = useState<MyAssignment[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [fetchTick, setFetchTick] = useState(0);

    useEffect(() => {
        let cancelled = false;
        async function load() {
            setIsLoading(true);
            setError(null);
            try {
                const res = await api.get<{ data: MyAssignment[] }>("/service-programme/my-assignments");
                if (!cancelled) setAssignments(res.data.data ?? []);
            } catch {
                if (!cancelled) setError("Could not load your upcoming assignments.");
            } finally {
                if (!cancelled) setIsLoading(false);
            }
        }
        load();
        return () => { cancelled = true; };
    }, [fetchTick]);

    const refetch = useCallback(() => setFetchTick((t) => t + 1), []);

    return { assignments, isLoading, error, refetch };
}
