"use client";

import { useCallback, useEffect, useState } from "react";
import { api } from "@/utils/auth/axios-client";

export interface UseMyServiceRatingReturn {
    rating: number | null;
    isLoading: boolean;
}

// Pre-populates whether the caller already rated this service, so the widget
// doesn't re-prompt (and silently overwrite) an existing rating on revisit.
export function useMyServiceRating(eventId: string, serviceSlotId: string): UseMyServiceRatingReturn {
    const [rating, setRating] = useState<number | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        let cancelled = false;

        async function load() {
            setIsLoading(true);
            try {
                const res = await api.get(`/service-ratings/mine?eventId=${eventId}&serviceSlotId=${serviceSlotId}`);
                if (!cancelled) setRating(res.data?.data?.rating ?? null);
            } catch {
                if (!cancelled) setRating(null);
            } finally {
                if (!cancelled) setIsLoading(false);
            }
        }

        load();
        return () => { cancelled = true; };
    }, [eventId, serviceSlotId]);

    return { rating, isLoading };
}

export interface UseSubmitServiceRatingReturn {
    isSubmitting: boolean;
    error: string | null;
    submitRating: (eventId: string, serviceSlotId: string, rating: number, comment?: string) => Promise<boolean>;
}

export function useSubmitServiceRating(): UseSubmitServiceRatingReturn {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const submitRating = useCallback(async (
        eventId: string,
        serviceSlotId: string,
        rating: number,
        comment?: string,
    ): Promise<boolean> => {
        setIsSubmitting(true);
        setError(null);
        try {
            await api.post("/service-ratings", { eventId, serviceSlotId, rating, comment });
            return true;
        } catch (err: unknown) {
            const e = err as { response?: { data?: { message?: string } }; message?: string };
            setError(e?.response?.data?.message || e?.message || "Could not submit your rating.");
            return false;
        } finally {
            setIsSubmitting(false);
        }
    }, []);

    return { isSubmitting, error, submitRating };
}
