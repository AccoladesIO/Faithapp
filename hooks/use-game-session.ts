"use client";

import { useCallback, useState, useEffect } from "react";
import { api } from "@/utils/auth/axios-client";

export type GameSessionStatus = "SCHEDULED" | "LIVE" | "ENDED";

export interface PublicGameQuestion {
    id: string;
    order: number;
    questionText: string;
    options: string[];
    timeLimitSeconds: number;
    points: number;
}

export interface LeaderboardEntry {
    participantId: string;
    memberId: string;
    memberName: string;
    totalScore: number;
}

export interface GameSessionStatePayload {
    sessionCode: string;
    status: GameSessionStatus;
    currentQuestionIndex: number | null;
    totalQuestions: number;
    currentQuestion: PublicGameQuestion | null;
    secondsRemaining: number | null;
    answeredCount: number;
    participantCount: number;
    leaderboard: LeaderboardEntry[];
}

// While a question is on screen, polled fast enough to feel live without a
// socket connection — this app has no existing real-time client precedent,
// so joining that pattern here would be a new dependency for one feature.
// Between questions / once ended, polling backs off to conserve requests.
const LIVE_POLL_MS = 2000;
const IDLE_POLL_MS = 5000;

export function useGameSession(sessionCode: string) {
    const [state, setState] = useState<GameSessionStatePayload | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchState = useCallback(async () => {
        try {
            const res = await api.get<{ data: GameSessionStatePayload }>(`/games/sessions/${sessionCode}/state`);
            setState(res.data.data);
            setError(null);
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : "Could not load the game.");
        } finally {
            setIsLoading(false);
        }
    }, [sessionCode]);

    useEffect(() => {
        if (!sessionCode) return;
        let cancelled = false;
        let timeoutId: ReturnType<typeof setTimeout>;

        async function poll() {
            if (cancelled) return;
            await fetchState();
            if (cancelled) return;
            const delay = state?.status === "LIVE" && state?.currentQuestion ? LIVE_POLL_MS : IDLE_POLL_MS;
            timeoutId = setTimeout(poll, delay);
        }

        poll();
        return () => { cancelled = true; clearTimeout(timeoutId); };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [sessionCode, fetchState, state?.status, state?.currentQuestion?.id]);

    return { state, isLoading, error, refetch: fetchState };
}

export function useJoinGame() {
    const [isJoining, setIsJoining] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const join = useCallback(async (sessionCode: string): Promise<boolean> => {
        setIsJoining(true);
        setError(null);
        try {
            await api.post(`/games/sessions/${sessionCode}/join`);
            return true;
        } catch (err: unknown) {
            const e = err as { response?: { data?: { message?: string } }; message?: string };
            setError(e?.response?.data?.message || e?.message || "Could not join — check the code and try again.");
            return false;
        } finally {
            setIsJoining(false);
        }
    }, []);

    return { isJoining, error, join };
}

export function useSubmitAnswer(sessionCode: string) {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const submit = useCallback(async (
        questionId: string,
        selectedOptionIndex: number,
    ): Promise<{ isCorrect: boolean; pointsAwarded: number } | null> => {
        setIsSubmitting(true);
        setError(null);
        try {
            const res = await api.post<{ data: { isCorrect: boolean; pointsAwarded: number } }>(
                `/games/sessions/${sessionCode}/questions/${questionId}/answer`,
                { selectedOptionIndex },
            );
            return res.data.data;
        } catch (err: unknown) {
            const e = err as { response?: { data?: { message?: string } }; message?: string };
            setError(e?.response?.data?.message || e?.message || "Could not submit your answer.");
            return null;
        } finally {
            setIsSubmitting(false);
        }
    }, [sessionCode]);

    return { isSubmitting, error, submit };
}
