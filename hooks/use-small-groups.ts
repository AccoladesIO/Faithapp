"use client";

import { useCallback, useEffect, useState } from "react";
import { api } from "@/utils/auth/axios-client";

export interface SmallGroup {
    id: string;
    name: string;
    description: string | null;
    leader: { id: string; firstname: string; lastname: string } | null;
    meetingDay: string | null;
    meetingLocation: string | null;
    memberCount?: number;
}

export interface SmallGroupMemberRow {
    id: string;
    member: { id: string; firstname: string; lastname: string };
}

type ApiError = { response?: { data?: { message?: string } }; message?: string };

export function useSmallGroups() {
    const [groups, setGroups] = useState<SmallGroup[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [fetchTick, setFetchTick] = useState(0);

    useEffect(() => {
        let cancelled = false;

        async function load() {
            setIsLoading(true);
            setError(null);
            try {
                const res = await api.get("/small-groups?page=1&limit=50");
                if (!cancelled) setGroups(res.data?.data?.data ?? []);
            } catch (err: unknown) {
                if (!cancelled) {
                    const e = err as ApiError;
                    setError(e?.response?.data?.message || e?.message || "Could not load fellowships.");
                }
            } finally {
                if (!cancelled) setIsLoading(false);
            }
        }

        load();
        return () => { cancelled = true; };
    }, [fetchTick]);

    const refetch = useCallback(() => setFetchTick((t) => t + 1), []);

    return { groups, isLoading, error, refetch };
}

export function useMyGroups() {
    const [groups, setGroups] = useState<SmallGroup[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [fetchTick, setFetchTick] = useState(0);

    useEffect(() => {
        let cancelled = false;

        async function load() {
            setIsLoading(true);
            setError(null);
            try {
                const res = await api.get("/small-groups/mine");
                if (!cancelled) setGroups(res.data?.data ?? []);
            } catch (err: unknown) {
                if (!cancelled) {
                    const e = err as ApiError;
                    setError(e?.response?.data?.message || e?.message || "Could not load your fellowships.");
                }
            } finally {
                if (!cancelled) setIsLoading(false);
            }
        }

        load();
        return () => { cancelled = true; };
    }, [fetchTick]);

    const refetch = useCallback(() => setFetchTick((t) => t + 1), []);

    return { groups, isLoading, error, refetch };
}

export function useSmallGroupActions() {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const join = useCallback(async (id: string): Promise<boolean> => {
        setIsSubmitting(true);
        setError(null);
        try {
            await api.post(`/small-groups/${id}/join`);
            return true;
        } catch (err: unknown) {
            const e = err as ApiError;
            setError(e?.response?.data?.message || e?.message || "Could not join this fellowship.");
            return false;
        } finally {
            setIsSubmitting(false);
        }
    }, []);

    const leave = useCallback(async (id: string): Promise<boolean> => {
        setIsSubmitting(true);
        setError(null);
        try {
            await api.delete(`/small-groups/${id}/leave`);
            return true;
        } catch (err: unknown) {
            const e = err as ApiError;
            setError(e?.response?.data?.message || e?.message || "Could not leave this fellowship.");
            return false;
        } finally {
            setIsSubmitting(false);
        }
    }, []);

    const fetchMembers = useCallback(async (id: string): Promise<SmallGroupMemberRow[]> => {
        const res = await api.get(`/small-groups/${id}/members`);
        return res.data?.data ?? [];
    }, []);

    const recordAttendance = useCallback(async (
        id: string,
        meetingDate: string,
        records: { memberId: string; status: "PRESENT" | "ABSENT" }[],
    ): Promise<boolean> => {
        setIsSubmitting(true);
        setError(null);
        try {
            await api.post(`/small-groups/${id}/attendance`, { meetingDate, records });
            return true;
        } catch (err: unknown) {
            const e = err as ApiError;
            setError(e?.response?.data?.message || e?.message || "Could not save attendance.");
            return false;
        } finally {
            setIsSubmitting(false);
        }
    }, []);

    return { isSubmitting, error, join, leave, fetchMembers, recordAttendance };
}
