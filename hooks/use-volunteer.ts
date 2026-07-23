"use client";

import { useCallback, useEffect, useState } from "react";
import { api } from "@/utils/auth/axios-client";

export interface VolunteerOpportunity {
    id: string;
    title: string;
    description: string | null;
    department: { id: string; name: string } | null;
    date: string;
    capacity: number | null;
    confirmedCount: number;
    mySignupStatus: "CONFIRMED" | "CANCELLED" | null;
}

type ApiError = { response?: { data?: { message?: string } }; message?: string };

export function useVolunteerOpportunities() {
    const [opportunities, setOpportunities] = useState<VolunteerOpportunity[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [actionError, setActionError] = useState<string | null>(null);
    const [fetchTick, setFetchTick] = useState(0);

    useEffect(() => {
        let cancelled = false;

        async function load() {
            setIsLoading(true);
            setError(null);
            try {
                const res = await api.get("/volunteer-opportunities?page=1&limit=50");
                if (!cancelled) setOpportunities(res.data?.data?.data ?? []);
            } catch (err: unknown) {
                if (!cancelled) {
                    const e = err as ApiError;
                    setError(e?.response?.data?.message || e?.message || "Could not load volunteer opportunities.");
                }
            } finally {
                if (!cancelled) setIsLoading(false);
            }
        }

        load();
        return () => { cancelled = true; };
    }, [fetchTick]);

    const refetch = useCallback(() => setFetchTick((t) => t + 1), []);

    const signUp = useCallback(async (id: string) => {
        setActionError(null);
        try {
            await api.post(`/volunteer-opportunities/${id}/signup`);
            // Backend sign-up is idempotent (a second call while already
            // CONFIRMED is a no-op) — only bump the local count if this call
            // is the one that actually changes the status, so a fast
            // double-tap can't inflate the displayed count.
            setOpportunities((prev) => prev.map((o) =>
                o.id === id && o.mySignupStatus !== "CONFIRMED"
                    ? { ...o, mySignupStatus: "CONFIRMED", confirmedCount: o.confirmedCount + 1 }
                    : o
            ));
            return true;
        } catch (err: unknown) {
            const e = err as ApiError;
            setActionError(e?.response?.data?.message || e?.message || "Could not sign up.");
            return false;
        }
    }, []);

    const cancelSignUp = useCallback(async (id: string) => {
        setActionError(null);
        try {
            await api.delete(`/volunteer-opportunities/${id}/signup`);
            setOpportunities((prev) => prev.map((o) =>
                o.id === id && o.mySignupStatus === "CONFIRMED"
                    ? { ...o, mySignupStatus: null, confirmedCount: Math.max(0, o.confirmedCount - 1) }
                    : o
            ));
            return true;
        } catch (err: unknown) {
            const e = err as ApiError;
            setActionError(e?.response?.data?.message || e?.message || "Could not cancel your sign-up.");
            return false;
        }
    }, []);

    return { opportunities, isLoading, error, actionError, signUp, cancelSignUp, refetch };
}
