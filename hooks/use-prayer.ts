"use client";

import { useState, useEffect, useCallback } from "react";
import { api } from "@/utils/auth/axios-client";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface PrayerProgram {
    id: string;
    name: string;
    description: string;
    audience: "WORKERS" | "ALL";
    isActive: boolean;
    selectionWindowDays: number;
    createdAt: string;
    updatedAt: string;
}

export interface DayConfig {
    id: string;
    dayOfWeek: number;
    mode: "PHYSICAL" | "ONLINE";
    startTime: string;
    endTime: string;
    maxCapacity: number;
    isActive: boolean;
}

export interface PrayerMeeting {
    id: string;
    program: PrayerProgram;
    date: string;
    month: number;
    year: number;
    dayConfig: DayConfig;
    status: string;
    selectionStatus: "OPEN" | "CLOSED";
    currentCapacity: number;
    rosterEntries: unknown[];
    createdAt: string;
}

export interface RosterEntry {
    id: string;
    meeting: PrayerMeeting;
    assignmentType: string;
    status: string;
    createdAt: string;
}

export interface PrayerStatus {
    month: number;
    year: number;
    windowOpen: boolean;
    hasSelected: boolean;
    availableMeetings: PrayerMeeting[];
    mySelections: PrayerMeeting[];
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export interface UsePrayerReturn {
    programs: PrayerProgram[];
    selectedProgramId: string | null;
    setSelectedProgramId: (id: string | null) => void;
    availableMeetings: PrayerMeeting[];
    myRoster: RosterEntry[];
    prayerStatus: PrayerStatus | null;

    isLoadingPrograms: boolean;
    isLoadingMeetings: boolean;
    isSelecting: boolean;

    programsError: string | null;
    meetingsError: string | null;
    selectError: string | null;

    selectedMonth: number;
    selectedYear: number;
    setSelectedMonth: (m: number) => void;
    setSelectedYear: (y: number) => void;

    selectMeeting: (meetingId: string) => Promise<void>;
    refetch: () => void;
}

export function usePrayer(): UsePrayerReturn {
    const now = new Date();
    const [programs, setPrograms] = useState<PrayerProgram[]>([]);
    const [selectedProgramId, setSelectedProgramId] = useState<string | null>(null);
    const [availableMeetings, setAvailableMeetings] = useState<PrayerMeeting[]>([]);
    const [myRoster, setMyRoster] = useState<RosterEntry[]>([]);
    const [prayerStatus, setPrayerStatus] = useState<PrayerStatus | null>(null);

    const [isLoadingPrograms, setIsLoadingPrograms] = useState(true);
    const [isLoadingMeetings, setIsLoadingMeetings] = useState(false);
    const [isSelecting, setIsSelecting] = useState(false);

    const [programsError, setProgramsError] = useState<string | null>(null);
    const [meetingsError, setMeetingsError] = useState<string | null>(null);
    const [selectError, setSelectError] = useState<string | null>(null);

    const [selectedMonth, setSelectedMonth] = useState(now.getMonth() + 1);
    const [selectedYear, setSelectedYear] = useState(now.getFullYear());
    const [fetchTick, setFetchTick] = useState(0);

    // ── Fetch programs ────────────────────────────────────────────────────────
    useEffect(() => {
        let cancelled = false;
        async function load() {
            setIsLoadingPrograms(true);
            setProgramsError(null);
            try {
                const res = await api.get<{ data: PrayerProgram[] }>("/prayer/programs");
                if (!cancelled) {
                    const list = res.data.data;
                    setPrograms(list);
                    // Auto-select first program
                    if (list.length > 0 && !selectedProgramId) {
                        setSelectedProgramId(list[0].id);
                    }
                }
            } catch (err: unknown) {
                if (!cancelled)
                    setProgramsError(err instanceof Error ? err.message : "Failed to load prayer programs.");
            } finally {
                if (!cancelled) setIsLoadingPrograms(false);
            }
        }
        load();
        return () => { cancelled = true; };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // ── Fetch meetings, roster, status for selected program + month/year ──────
    useEffect(() => {
        if (!selectedProgramId) return;
        let cancelled = false;

        async function load() {
            setIsLoadingMeetings(true);
            setMeetingsError(null);
            try {
                const params = `month=${selectedMonth}&year=${selectedYear}&programId=${selectedProgramId}`;
                const [availRes, rosterRes, statusRes] = await Promise.all([
                    api.get<{ data: PrayerMeeting[] }>(`/prayer/available?${params}`),
                    api.get<{ data: RosterEntry[] }>(`/prayer/my-roster?${params}`),
                    api.get<{ data: PrayerStatus }>(`/prayer/my-status?${params}`),
                ]);
                if (!cancelled) {
                    setAvailableMeetings(availRes.data.data);
                    setMyRoster(rosterRes.data.data);
                    setPrayerStatus(statusRes.data.data);
                }
            } catch (err: unknown) {
                if (!cancelled)
                    setMeetingsError(err instanceof Error ? err.message : "Failed to load prayer data.");
            } finally {
                if (!cancelled) setIsLoadingMeetings(false);
            }
        }

        load();
        return () => { cancelled = true; };
    }, [selectedProgramId, selectedMonth, selectedYear, fetchTick]);

    // ── Select a meeting ──────────────────────────────────────────────────────
    const selectMeeting = useCallback(async (meetingId: string) => {
        if (!selectedProgramId) return;
        setIsSelecting(true);
        setSelectError(null);
        try {
            await api.post(`/prayer/select?programId=${selectedProgramId}`, { meetingId });
            setFetchTick((t) => t + 1);
        } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : "Failed to select meeting.";
            setSelectError(msg);
            throw new Error(msg);
        } finally {
            setIsSelecting(false);
        }
    }, [selectedProgramId]);

    const refetch = useCallback(() => setFetchTick((t) => t + 1), []);

    return {
        programs,
        selectedProgramId,
        setSelectedProgramId,
        availableMeetings,
        myRoster,
        prayerStatus,
        isLoadingPrograms,
        isLoadingMeetings,
        isSelecting,
        programsError,
        meetingsError,
        selectError,
        selectedMonth,
        selectedYear,
        setSelectedMonth,
        setSelectedYear,
        selectMeeting,
        refetch,
    };
}