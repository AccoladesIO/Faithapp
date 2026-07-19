"use client";

import { useState, useEffect, useCallback } from "react";
import { api } from "@/utils/auth/axios-client";

export interface EffectiveSessionSlot {
    id: string;
    position: number;
    status: "PENDING" | "IN_PROGRESS" | "COMPLETED" | "SKIPPED";
    type: string;
    topic: string | null;
    allocatedMinutes: number;
    memberName: string | null;
    guestName: string | null;
    backupMemberId: string | null;
    backupMemberName: string | null;
    backupGuestName: string | null;
    actualSeconds: number | null;
    startedAt: string | null;
    completedAt: string | null;
}

export interface MyLiveStatus {
    sessionCode: string;
    sessionStatus: "LIVE" | "COMPLETED";
    myRole: "PRIMARY" | "BACKUP";
    myPosition: number;
    myType: string;
    myTopic: string | null;
    currentPosition: number;
    isMyTurnNow: boolean;
    hasPassed: boolean;
    estimatedSecondsUntilMyTurn: number | null;
    runningOrder: EffectiveSessionSlot[];
}

const POLL_MS = 8000;

export interface UseMyLiveStatusReturn {
    status: MyLiveStatus | null;
    isLoading: boolean;
    error: string | null;
    fetchedAt: number;
    refetch: () => void;
}

// Polls GET /service-session/:code/my-status while a session code is live —
// pass null/undefined (i.e. the assignment isn't LIVE) to skip entirely.
export function useMyLiveStatus(sessionCode: string | null | undefined): UseMyLiveStatusReturn {
    const [status, setStatus] = useState<MyLiveStatus | null>(null);
    const [isLoading, setIsLoading] = useState(() => !!sessionCode);
    const [error, setError] = useState<string | null>(null);
    const [fetchedAt, setFetchedAt] = useState<number>(() => Date.now());
    const [fetchTick, setFetchTick] = useState(0);

    useEffect(() => {
        if (!sessionCode) return;
        let cancelled = false;

        async function poll() {
            setIsLoading(true);
            try {
                const res = await api.get<{ data: MyLiveStatus }>(`/service-session/${sessionCode}/my-status`);
                if (!cancelled) {
                    setStatus(res.data.data);
                    setFetchedAt(Date.now());
                    setError(null);
                }
            } catch (err: unknown) {
                if (!cancelled) setError(err instanceof Error ? err.message : "Could not load live status.");
            } finally {
                if (!cancelled) setIsLoading(false);
            }
        }

        poll();
        const id = setInterval(poll, POLL_MS);
        return () => { cancelled = true; clearInterval(id); };
    }, [sessionCode, fetchTick]);

    const refetch = useCallback(() => setFetchTick((t) => t + 1), []);

    return {
        status: sessionCode ? status : null,
        isLoading: sessionCode ? isLoading : false,
        error: sessionCode ? error : null,
        fetchedAt,
        refetch,
    };
}
