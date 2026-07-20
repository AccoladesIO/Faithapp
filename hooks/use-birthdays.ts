"use client";

import { useState, useEffect, useCallback } from "react";
import { api } from "@/utils/auth/axios-client";

export interface BirthdayMember {
    id: string;
    firstname: string;
    lastname: string;
    role: "MEMBER" | "WORKER";
    departmentName: string | null;
    pastorType: "LEAD" | "PARISH" | "ASSOCIATE" | null;
    alreadyWishedByMe: boolean;
    photoUrl: string | null;
}

export interface UseTodaysBirthdaysReturn {
    birthdays: BirthdayMember[];
    isLoading: boolean;
    error: string | null;
}

export function useTodaysBirthdays(): UseTodaysBirthdaysReturn {
    const [birthdays, setBirthdays] = useState<BirthdayMember[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        let cancelled = false;

        async function load() {
            setIsLoading(true);
            setError(null);
            try {
                const res = await api.get<{ data: BirthdayMember[] }>("/birthday/today");
                if (!cancelled) setBirthdays(res.data.data);
            } catch (err: unknown) {
                if (!cancelled)
                    setError(err instanceof Error ? err.message : "Could not load today's birthdays.");
            } finally {
                if (!cancelled) setIsLoading(false);
            }
        }

        load();
        return () => { cancelled = true; };
    }, []);

    return { birthdays, isLoading, error };
}

export interface UseSendBirthdayWishReturn {
    sentIds: Set<string>;
    isSending: boolean;
    error: string | null;
    sendWish: (recipientId: string, message: string) => Promise<void>;
}

export function useSendBirthdayWish(): UseSendBirthdayWishReturn {
    const [sentIds, setSentIds] = useState<Set<string>>(new Set());
    const [isSending, setIsSending] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const sendWish = useCallback(async (recipientId: string, message: string) => {
        setIsSending(true);
        setError(null);
        try {
            await api.post(`/birthday/wishes/${recipientId}`, { message });
            setSentIds((prev) => new Set(prev).add(recipientId));
        } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : "Could not send your wish.";
            setError(msg);
            throw new Error(msg);
        } finally {
            setIsSending(false);
        }
    }, []);

    return { sentIds, isSending, error, sendWish };
}

export interface BirthdayWish {
    id: string;
    message: string;
    year: number;
    createdAt: string;
    sender: { id: string; firstname: string; lastname: string } | null;
}

export interface UseMyBirthdayWishesReturn {
    wishes: BirthdayWish[];
    isLoading: boolean;
    error: string | null;
}

export function useMyBirthdayWishes(enabled: boolean): UseMyBirthdayWishesReturn {
    const [wishes, setWishes] = useState<BirthdayWish[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!enabled) return;
        let cancelled = false;

        async function load() {
            setIsLoading(true);
            setError(null);
            try {
                const res = await api.get<{ data: BirthdayWish[] }>("/birthday/wishes/me");
                if (!cancelled) setWishes(res.data.data);
            } catch (err: unknown) {
                if (!cancelled)
                    setError(err instanceof Error ? err.message : "Could not load your birthday wishes.");
            } finally {
                if (!cancelled) setIsLoading(false);
            }
        }

        load();
        return () => { cancelled = true; };
    }, [enabled]);

    return { wishes, isLoading, error };
}
