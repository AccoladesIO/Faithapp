"use client";

import { useState, useEffect } from "react";
import { api } from "@/utils/auth/axios-client";

export type AttendanceStatus = "PRESENT" | "LATE" | "ABSENT" | "ON_LEAVE" | "ATTENDED_ONLINE";

export interface DepartmentEventSlotSummary {
    slotId: string;
    slotName: string;
    startTime: string;
}

export interface DepartmentEventWorkerAttendance {
    workerId: string;
    memberId: string;
    name: string;
    attendance: { slotId: string; status: AttendanceStatus | null; checkinTime: string | null }[];
}

export interface DepartmentEventAttendance {
    eventId: string;
    eventName: string;
    slots: DepartmentEventSlotSummary[];
    workers: DepartmentEventWorkerAttendance[];
}

export interface UseDepartmentEventAttendanceReturn {
    attendance: DepartmentEventAttendance | null;
    isLoading: boolean;
    error: string | null;
}

export function useDepartmentEventAttendance(eventId: string | null): UseDepartmentEventAttendanceReturn {
    const [attendance, setAttendance] = useState<DepartmentEventAttendance | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!eventId) return;
        let cancelled = false;

        async function load() {
            setIsLoading(true);
            setError(null);
            try {
                const res = await api.get<{ data: DepartmentEventAttendance }>(
                    `/attendances/department/event/${eventId}`
                );
                if (!cancelled) setAttendance(res.data.data);
            } catch (err: unknown) {
                if (!cancelled)
                    setError(err instanceof Error ? err.message : "Could not load department attendance.");
            } finally {
                if (!cancelled) setIsLoading(false);
            }
        }

        load();
        return () => { cancelled = true; };
    }, [eventId]);

    return {
        attendance: eventId ? attendance : null,
        isLoading: eventId ? isLoading : false,
        error: eventId ? error : null,
    };
}

export interface DepartmentSlotHistoryRecord {
    id: string;
    status: AttendanceStatus;
    checkinTime: string | null;
    member: { id: string; firstname: string; lastname: string } | null;
}

export interface UseDepartmentSlotHistoryReturn {
    records: DepartmentSlotHistoryRecord[];
    isLoading: boolean;
    error: string | null;
}

export function useDepartmentSlotHistory(slotId: string | null): UseDepartmentSlotHistoryReturn {
    const [records, setRecords] = useState<DepartmentSlotHistoryRecord[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!slotId) return;
        let cancelled = false;

        async function load() {
            setIsLoading(true);
            setError(null);
            try {
                const res = await api.get<{ data: DepartmentSlotHistoryRecord[] }>(
                    `/attendances/history/department?slotId=${slotId}`
                );
                if (!cancelled) setRecords(res.data.data);
            } catch (err: unknown) {
                if (!cancelled)
                    setError(err instanceof Error ? err.message : "Could not load this slot's log.");
            } finally {
                if (!cancelled) setIsLoading(false);
            }
        }

        load();
        return () => { cancelled = true; };
    }, [slotId]);

    return {
        records: slotId ? records : [],
        isLoading: slotId ? isLoading : false,
        error: slotId ? error : null,
    };
}
