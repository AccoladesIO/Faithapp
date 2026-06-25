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

export interface AttendanceStats {
    totalCount: number;
    presentCount: number;
    attendanceRatePercentage: number;
    lastCheckedInDate: string | null;
    attendanceStreak: number;
}

function getISOWeek(date: Date): string {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    const weekNo = Math.ceil(((d.getTime() - yearStart.getTime()) / 86_400_000 + 1) / 7);
    return `${d.getUTCFullYear()}-W${weekNo.toString().padStart(2, "0")}`;
}

function deriveStats(records: AttendanceRecord[]): AttendanceStats {
    const totalCount = records.length;

    const presentRecords = records.filter(
        (r) => r.status === "PRESENT" || r.status === "EARLY" || r.status === "LATE"
    );
    const presentCount = presentRecords.length;

    const attendanceRatePercentage =
        totalCount === 0 ? 0 : Math.round((presentCount / totalCount) * 100);

    const checkinTimes = presentRecords
        .map((r) => r.checkinTime)
        .filter((t): t is string => t !== null)
        .sort()
        .reverse();
    const lastCheckedInDate = checkinTimes[0] ?? null;

    const presentWeeks = new Set(
        presentRecords
            .filter((r) => r.checkinTime)
            .map((r) => getISOWeek(new Date(r.checkinTime!)))
    );

    let streak = 0;
    const cursor = new Date();
    for (let i = 0; i < 104; i++) {
        const week = getISOWeek(cursor);
        if (presentWeeks.has(week)) {
            streak++;
            cursor.setDate(cursor.getDate() - 7);
        } else {
            break;
        }
    }

    return { totalCount, presentCount, attendanceRatePercentage, lastCheckedInDate, attendanceStreak: streak };
}

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
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [fetchTick, setFetchTick] = useState(0);

    useEffect(() => {
        let cancelled = false;

        async function load() {
            setIsLoading(true);
            setError(null);
            try {
                const res = await api.get<{ data: { data: AttendanceRecord[] } }>(
                    "/attendances/my-history?page=1&limit=10"
                );
                if (!cancelled) setRecords(res.data.data.data);
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
    const stats = deriveStats(records);

    return { records, stats, isLoading, error, refetch };
}