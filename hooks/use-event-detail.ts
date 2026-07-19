"use client";

import { useState, useEffect, useCallback } from "react";
import { api, extractErrorMessage } from "@/utils/auth/axios-client";
import { Event } from "@/hooks/use-events";

export interface UseEventDetailReturn {
    event: Event | null;
    isLoading: boolean;
    error: string | null;
    isConfirmingOnline: boolean;
    onlineConfirmMessage: string | null;
    onlineConfirmError: string | null;
    confirmOnlineAttendance: () => Promise<void>;
}

export function useEventDetail(id: string | null | undefined): UseEventDetailReturn {
    const [event, setEvent] = useState<Event | null>(null);
    const [isLoading, setIsLoading] = useState(() => !!id);
    const [error, setError] = useState<string | null>(null);
    const [fetchTick, setFetchTick] = useState(0);

    const [isConfirmingOnline, setIsConfirmingOnline] = useState(false);
    const [onlineConfirmMessage, setOnlineConfirmMessage] = useState<string | null>(null);
    const [onlineConfirmError, setOnlineConfirmError] = useState<string | null>(null);

    useEffect(() => {
        if (!id) return;
        let cancelled = false;

        async function load() {
            setIsLoading(true);
            setError(null);
            try {
                const res = await api.get<{ data: Event }>(`/events/${id}`);
                if (!cancelled) setEvent(res.data.data);
            } catch (err: unknown) {
                if (!cancelled) setError(extractErrorMessage(err));
            } finally {
                if (!cancelled) setIsLoading(false);
            }
        }

        load();
        return () => { cancelled = true; };
    }, [id, fetchTick]);

    const confirmOnlineAttendance = useCallback(async () => {
        if (!id) return;
        setIsConfirmingOnline(true);
        setOnlineConfirmMessage(null);
        setOnlineConfirmError(null);
        try {
            const res = await api.post<{ data: { message: string } }>(
                "/attendances/online-confirm",
                { eventId: id }
            );
            setOnlineConfirmMessage(res.data.data.message);
            setFetchTick((t) => t + 1);
        } catch (err: unknown) {
            setOnlineConfirmError(extractErrorMessage(err));
        } finally {
            setIsConfirmingOnline(false);
        }
    }, [id]);

    return {
        event: id ? event : null,
        isLoading: id ? isLoading : false,
        error: id ? error : null,
        isConfirmingOnline,
        onlineConfirmMessage,
        onlineConfirmError,
        confirmOnlineAttendance,
    };
}
