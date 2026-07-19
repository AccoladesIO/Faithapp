"use client";

import { useState, useEffect, useCallback } from "react";
import { api } from "@/utils/auth/axios-client";

export type FollowUpTaskStatus = "PENDING" | "IN_PROGRESS" | "COMPLETED" | "UNREACHABLE";
export type FollowUpOutcome = "JOINED" | "DECLINED" | "NO_ANSWER" | "PRAYED_WITH";
export type ContactMethod = "PHONE_CALL" | "WHATSAPP" | "IN_PERSON" | "SMS" | "EMAIL";
export type FirstTimerSource = "WALK_IN" | "ONLINE" | "REFERRAL";

export interface FollowUpNote {
    id: string;
    content: string;
    contactMethod: ContactMethod | null;
    createdAt: string;
    addedBy: { id: string } | null;
}

export interface FirstTimer {
    id: string;
    firstname: string;
    lastname: string;
    phone: string;
    email: string | null;
    source: FirstTimerSource;
    wantsToJoinChurch: boolean;
    wantsToJoinWorkforce: boolean;
    notes: string | null;
}

export interface FollowUpTask {
    id: string;
    type: "FIRST_TIMER" | "ONLINE_NO_RESPONSE" | "MANUAL";
    status: FollowUpTaskStatus;
    firstTimer: FirstTimer | null;
    member: { id: string; firstname: string; lastname: string } | null;
    event: { id: string; name: string } | null;
    outcome: FollowUpOutcome | null;
    outcomeNotes: string | null;
    dueDate: string | null;
    lastActivityAt: string;
    notes: FollowUpNote[];
}

export interface FollowUpTasksPage {
    data: FollowUpTask[];
    page: number;
    limit: number;
    totalCount: number;
    totalPages: number;
}

export interface UseFollowUpTasksReturn {
    tasks: FollowUpTask[];
    isLoading: boolean;
    error: string | null;
    page: number;
    totalPages: number;
    goToPage: (page: number) => void;
    statusFilter: FollowUpTaskStatus | null;
    setStatusFilter: (status: FollowUpTaskStatus | null) => void;
    refetch: () => void;
}

export function useFollowUpTasks(limit = 20): UseFollowUpTasksReturn {
    const [tasks, setTasks] = useState<FollowUpTask[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [statusFilter, setStatusFilterState] = useState<FollowUpTaskStatus | null>(null);
    const [fetchTick, setFetchTick] = useState(0);

    useEffect(() => {
        let cancelled = false;

        async function load() {
            setIsLoading(true);
            setError(null);
            try {
                const params = new URLSearchParams({ page: String(page), limit: String(limit) });
                if (statusFilter) params.set("status", statusFilter);
                const res = await api.get<{ data: FollowUpTasksPage }>(
                    `/follow-up/tasks/mine?${params.toString()}`
                );
                if (!cancelled) {
                    setTasks(res.data.data.data);
                    setTotalPages(res.data.data.totalPages);
                }
            } catch (err: unknown) {
                if (!cancelled)
                    setError(err instanceof Error ? err.message : "Could not load your follow-up tasks.");
            } finally {
                if (!cancelled) setIsLoading(false);
            }
        }

        load();
        return () => { cancelled = true; };
    }, [page, limit, statusFilter, fetchTick]);

    const setStatusFilter = (status: FollowUpTaskStatus | null) => {
        setStatusFilterState(status);
        setPage(1);
    };

    const refetch = useCallback(() => setFetchTick((t) => t + 1), []);

    return { tasks, isLoading, error, page, totalPages, goToPage: setPage, statusFilter, setStatusFilter, refetch };
}

export interface CreateFirstTimerPayload {
    firstname: string;
    lastname: string;
    phone: string;
    email?: string;
    source?: FirstTimerSource;
    wantsToJoinChurch?: boolean;
    enjoyedAboutChurch?: string;
    wantsToJoinWorkforce?: boolean;
    notes?: string;
}

export interface UpdateTaskPayload {
    status?: FollowUpTaskStatus;
    outcome?: FollowUpOutcome;
    outcomeNotes?: string;
}

export interface UseFollowUpActionsReturn {
    isSubmitting: boolean;
    submitError: string | null;
    createFirstTimer: (payload: CreateFirstTimerPayload) => Promise<void>;
    updateTask: (taskId: string, payload: UpdateTaskPayload) => Promise<void>;
    addNote: (taskId: string, content: string, contactMethod?: ContactMethod) => Promise<void>;
}

export function useFollowUpActions(): UseFollowUpActionsReturn {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitError, setSubmitError] = useState<string | null>(null);

    const createFirstTimer = useCallback(async (payload: CreateFirstTimerPayload) => {
        setIsSubmitting(true);
        setSubmitError(null);
        try {
            await api.post("/follow-up/first-timers", payload);
        } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : "Could not record this first-timer.";
            setSubmitError(msg);
            throw new Error(msg);
        } finally {
            setIsSubmitting(false);
        }
    }, []);

    const updateTask = useCallback(async (taskId: string, payload: UpdateTaskPayload) => {
        setIsSubmitting(true);
        setSubmitError(null);
        try {
            await api.patch(`/follow-up/tasks/${taskId}`, payload);
        } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : "Could not update this task.";
            setSubmitError(msg);
            throw new Error(msg);
        } finally {
            setIsSubmitting(false);
        }
    }, []);

    const addNote = useCallback(async (taskId: string, content: string, contactMethod?: ContactMethod) => {
        setIsSubmitting(true);
        setSubmitError(null);
        try {
            await api.post(`/follow-up/tasks/${taskId}/notes`, { content, contactMethod });
        } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : "Could not add this note.";
            setSubmitError(msg);
            throw new Error(msg);
        } finally {
            setIsSubmitting(false);
        }
    }, []);

    return { isSubmitting, submitError, createFirstTimer, updateTask, addNote };
}
