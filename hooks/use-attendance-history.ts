"use client";

import { useState, useEffect, useCallback } from "react";
import { api } from "@/utils/auth/axios-client";

// ─── API shapes ───────────────────────────────────────────────────────────────

export type AttendanceStatus = "PRESENT" | "EARLY" | "LATE" | "ABSENT";

export interface AttendanceEvent {
    id: string;
    name: string;
    description: string;
    eventDate: string;
    endDate: string;
    attendanceMarked: boolean;
    onlineAttendanceEnabled: boolean;
    onlineNotificationSentAt: string | null;
    recurringEventId: string | null;
}

export interface AttendanceSlot {
    id: string;
    name: string;
    startTime: string;
    endTime: string;
    workerCheckinStartOverride: string | null;
    workerLateOverride: string | null;
    memberCheckinStartOverride: string | null;
    checkinStopOverride: string | null;
    allowedDistanceOverride: number | null;
    // NOTE: event is now a sibling of serviceSlot on the record, not nested inside it
}

export interface AttendanceRecord {
    id: string;
    createdAt: string;
    updatedAt: string;
    checkinTime: string | null;
    status: AttendanceStatus;
    roleAtCheckin: string;
    location: { latitude: number; longitude: number } | null;
    event: AttendanceEvent | null;       // top-level sibling
    serviceSlot: AttendanceSlot | null;  // top-level sibling, no nested event
}

// ─── Derived stats ────────────────────────────────────────────────────────────
// Computed server-side over the member's FULL history (not just the page of
// records fetched for display below) — see GET /attendances/my-summary.

export interface AttendanceStats {
    totalCount: number;
    presentCount: number;
    attendanceRatePercentage: number;
    lastCheckedInDate: string | null;
    attendanceStreak: number;
}

const EMPTY_STATS: AttendanceStats = {
    totalCount: 0,
    presentCount: 0,
    attendanceRatePercentage: 0,
    lastCheckedInDate: null,
    attendanceStreak: 0,
};

// ─── Hook ─────────────────────────────────────────────────────────────────────

export interface UseAttendanceHistoryReturn {
    records: AttendanceRecord[];
    stats: AttendanceStats;
    isLoading: boolean;
    error: string | null;
    refetch: () => void;
}

export function useAttendanceHistory(): UseAttendanceHistoryReturn {
    const [records, setRecords] = useState<AttendanceRecord[]>([]);
    const [stats, setStats] = useState<AttendanceStats>(EMPTY_STATS);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [fetchTick, setFetchTick] = useState(0);

    useEffect(() => {
        let cancelled = false;

        async function load() {
            setIsLoading(true);
            setError(null);
            try {
                const [historyRes, summaryRes] = await Promise.all([
                    api.get<{ data: { data: AttendanceRecord[] } }>(
                        "/attendances/my-history?page=1&limit=10"
                    ),
                    api.get<{ data: AttendanceStats }>("/attendances/my-summary"),
                ]);
                if (!cancelled) {
                    setRecords(historyRes.data.data.data);
                    setStats(summaryRes.data.data);
                }
            } catch (err: unknown) {
                if (!cancelled)
                    setError(err instanceof Error ? err.message : "Failed to load attendance history.");
            } finally {
                if (!cancelled) setIsLoading(false);
            }
        }

        load();
        return () => { cancelled = true; };
    }, [fetchTick]);

    const refetch = useCallback(() => setFetchTick((t) => t + 1), []);

    return { records, stats, isLoading, error, refetch };
}
