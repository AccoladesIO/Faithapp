"use client";

import { useState, useCallback, useEffect } from "react";
import { api } from "@/utils/auth/axios-client";

export const REACTION_EMOJIS = ["👍", "❤️", "🙏", "🎉", "👏"] as const;
export type ReactionEmoji = (typeof REACTION_EMOJIS)[number];

export interface ReactionSummaryEntry {
    emoji: string;
    count: number;
}

export function useAnnouncementReactions(announcementId: string) {
    const [summary, setSummary] = useState<ReactionSummaryEntry[]>([]);
    const [myReaction, setMyReaction] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const fetchSummary = useCallback(async () => {
        try {
            const res = await api.get<{ data: { summary: ReactionSummaryEntry[]; myReaction: string | null } }>(
                `/announcements/${announcementId}/reactions`
            );
            setSummary(res.data.data.summary);
            setMyReaction(res.data.data.myReaction);
        } catch {
            setSummary([]);
        }
    }, [announcementId]);

    useEffect(() => {
        fetchSummary();
    }, [fetchSummary]);

    const react = useCallback(async (emoji: ReactionEmoji) => {
        setIsSubmitting(true);
        const wasMine = myReaction === emoji;
        try {
            if (wasMine) {
                await api.delete(`/announcements/${announcementId}/react`);
                setMyReaction(null);
            } else {
                await api.post(`/announcements/${announcementId}/react`, { emoji });
                setMyReaction(emoji);
            }
            await fetchSummary();
        } finally {
            setIsSubmitting(false);
        }
    }, [announcementId, myReaction, fetchSummary]);

    return { summary, myReaction, isSubmitting, react };
}
