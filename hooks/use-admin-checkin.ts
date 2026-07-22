"use client";

import { useState, useCallback } from "react";
import { api } from "@/utils/auth/axios-client";

// Admin-department-worker-only mobile flow — covers two cases with one
// backend action: checking in someone with no phone, and "restoring a
// streak" by fixing a record the system auto-marked ABSENT (streak is
// computed live from attendance rows, so fixing the row is the whole fix).

export type AttendanceStatus = "PRESENT" | "LATE" | "ABSENT" | "ON_LEAVE" | "ATTENDED_ONLINE";

export interface CheckinMemberResult {
    id: string;
    firstname: string;
    lastname: string;
    role: "MEMBER" | "WORKER";
}

function extractMessage(err: unknown, fallback: string): string {
    if (err && typeof err === "object" && "response" in err) {
        const res = (err as { response?: { data?: { message?: string } } }).response;
        if (res?.data?.message) return res.data.message;
    }
    if (err instanceof Error) return err.message;
    return fallback;
}

export function useAdminCheckin() {
    const [isSearching, setIsSearching] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const searchMembers = useCallback(async (query: string): Promise<CheckinMemberResult[]> => {
        if (!query.trim()) return [];
        setIsSearching(true);
        setError(null);
        try {
            const res = await api.get<{ data: CheckinMemberResult[] }>(
                `/attendances/department/search-members?q=${encodeURIComponent(query)}`
            );
            return res.data.data;
        } catch (err: unknown) {
            setError(extractMessage(err, "Could not search members."));
            return [];
        } finally {
            setIsSearching(false);
        }
    }, []);

    const markAttendance = useCallback(async (
        memberId: string,
        serviceSlotId: string,
        status: AttendanceStatus,
    ): Promise<void> => {
        setIsSubmitting(true);
        setError(null);
        try {
            await api.post("/attendances/department/mark", { memberId, serviceSlotId, status });
        } catch (err: unknown) {
            const msg = extractMessage(err, "Failed to mark attendance.");
            setError(msg);
            throw new Error(msg);
        } finally {
            setIsSubmitting(false);
        }
    }, []);

    return { isSearching, isSubmitting, error, searchMembers, markAttendance };
}
