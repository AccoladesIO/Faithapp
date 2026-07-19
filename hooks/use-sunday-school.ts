"use client";

import { useState, useCallback } from "react";
import { api } from "@/utils/auth/axios-client";

type ApiError = { response?: { data?: { message?: string } }; message?: string };

function extractError(err: unknown, fallback: string): string {
    const e = err as ApiError;
    return e?.response?.data?.message || e?.message || fallback;
}

// ─── Types ────────────────────────────────────────────────────────────────────

export type SSAttendanceStatus = "PRESENT" | "ABSENT" | "EXCUSED";

export interface SSClass {
    id: string;
    name: string;
    description: string | null;
    teacher: { id: string; firstname: string; lastname: string } | null;
    createdAt: string;
}

export interface SSSession {
    id: string;
    sessionDate: string;
    selfMarkClosesAt: string | null;
    notes: string | null;
}

export interface SSMemberAssignment {
    id: string;
    member: { id: string; firstname: string; lastname: string };
    assignedAt: string;
}

export interface SSMyAttendance {
    id: string;
    status: SSAttendanceStatus;
    markedAt: string;
    markedByTeacher: boolean;
    session: { id: string; sessionDate: string; sundaySchoolClass: { id: string; name: string } };
}

export interface SSRosterEntry {
    memberId: string;
    name: string;
    status: SSAttendanceStatus | null;
    markedByTeacher: boolean;
    markedAt: string | null;
}

export interface SSRoster {
    sessionId: string;
    classId: string;
    sessionDate: string;
    selfMarkOpen: boolean;
    selfMarkClosesAt: string | null;
    members: SSRosterEntry[];
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useSundaySchool(defaultLimit = 10) {
    const [myAttendance, setMyAttendance] = useState<SSMyAttendance[]>([]);
    const [myAttendancePage, setMyAttendancePage] = useState(1);
    const [myAttendanceTotalPages, setMyAttendanceTotalPages] = useState(1);

    const [openSessions, setOpenSessions] = useState<(SSSession & { sundaySchoolClass: { id: string; name: string } })[]>([]);

    const [classes, setClasses] = useState<SSClass[]>([]);
    const [classesTotalPages, setClassesTotalPages] = useState(1);

    const [sessions, setSessions] = useState<SSSession[]>([]);
    const [sessionsTotalPages, setSessionsTotalPages] = useState(1);

    const [classMembers, setClassMembers] = useState<SSMemberAssignment[]>([]);
    const [classMembersTotalPages, setClassMembersTotalPages] = useState(1);

    const [roster, setRoster] = useState<SSRoster | null>(null);

    const [isLoading, setIsLoading] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // ── Member self-service ─────────────────────────────────────────────────

    const fetchMyAttendance = useCallback(async (page = 1) => {
        setIsLoading(true);
        setError(null);
        try {
            const res = await api.get(`/sunday-school/attendance/me?page=${page}&limit=${defaultLimit}`);
            const outer = res.data?.data;
            setMyAttendance(Array.isArray(outer?.data) ? outer.data : []);
            setMyAttendancePage(page);
            setMyAttendanceTotalPages(outer?.totalPages ?? 1);
        } catch (err: unknown) {
            setError(extractError(err, "Failed to load your attendance history."));
        } finally {
            setIsLoading(false);
        }
    }, [defaultLimit]);

    const fetchOpenSessions = useCallback(async () => {
        try {
            const res = await api.get("/sunday-school/sessions/open");
            setOpenSessions(Array.isArray(res.data?.data) ? res.data.data : []);
        } catch (err: unknown) {
            setError(extractError(err, "Failed to load open sessions."));
        }
    }, []);

    const checkIn = useCallback(async (sessionId: string): Promise<void> => {
        setIsSubmitting(true);
        setError(null);
        try {
            await api.post(`/sunday-school/sessions/${sessionId}/checkin`);
            setOpenSessions((prev) => prev.filter((s) => s.id !== sessionId));
        } catch (err: unknown) {
            const message = extractError(err, "Failed to check in.");
            setError(message);
            throw new Error(message);
        } finally {
            setIsSubmitting(false);
        }
    }, []);

    // ── Teacher: classes ─────────────────────────────────────────────────────

    const fetchClasses = useCallback(async (page = 1) => {
        setIsLoading(true);
        setError(null);
        try {
            const res = await api.get(`/sunday-school/classes?page=${page}&limit=${defaultLimit}`);
            const outer = res.data?.data;
            setClasses(Array.isArray(outer?.data) ? outer.data : []);
            setClassesTotalPages(outer?.totalPages ?? 1);
        } catch (err: unknown) {
            setError(extractError(err, "Failed to load classes."));
        } finally {
            setIsLoading(false);
        }
    }, [defaultLimit]);

    const createClass = useCallback(async (dto: { name: string; description?: string }): Promise<SSClass> => {
        setIsSubmitting(true);
        setError(null);
        try {
            const res = await api.post("/sunday-school/classes", dto);
            const created: SSClass = res.data?.data;
            setClasses((prev) => [created, ...prev]);
            return created;
        } catch (err: unknown) {
            const message = extractError(err, "Failed to create class.");
            setError(message);
            throw new Error(message);
        } finally {
            setIsSubmitting(false);
        }
    }, []);

    const fetchClassMembers = useCallback(async (classId: string, page = 1) => {
        setIsLoading(true);
        setError(null);
        try {
            const res = await api.get(`/sunday-school/classes/${classId}/members?page=${page}&limit=${defaultLimit}`);
            const outer = res.data?.data;
            setClassMembers(Array.isArray(outer?.data) ? outer.data : []);
            setClassMembersTotalPages(outer?.totalPages ?? 1);
        } catch (err: unknown) {
            setError(extractError(err, "Failed to load class members."));
        } finally {
            setIsLoading(false);
        }
    }, [defaultLimit]);

    const removeMember = useCallback(async (classId: string, memberId: string): Promise<void> => {
        setIsSubmitting(true);
        setError(null);
        try {
            await api.delete(`/sunday-school/classes/${classId}/members/${memberId}`);
            setClassMembers((prev) => prev.filter((m) => m.member.id !== memberId));
        } catch (err: unknown) {
            const message = extractError(err, "Failed to remove member.");
            setError(message);
            throw new Error(message);
        } finally {
            setIsSubmitting(false);
        }
    }, []);

    // ── Teacher: sessions ────────────────────────────────────────────────────

    const fetchSessions = useCallback(async (classId: string, page = 1) => {
        setIsLoading(true);
        setError(null);
        try {
            const res = await api.get(`/sunday-school/sessions?classId=${classId}&page=${page}&limit=${defaultLimit}`);
            const outer = res.data?.data;
            setSessions(Array.isArray(outer?.data) ? outer.data : []);
            setSessionsTotalPages(outer?.totalPages ?? 1);
        } catch (err: unknown) {
            setError(extractError(err, "Failed to load sessions."));
        } finally {
            setIsLoading(false);
        }
    }, [defaultLimit]);

    const createSession = useCallback(async (dto: { classId: string; sessionDate: string; notes?: string }): Promise<SSSession> => {
        setIsSubmitting(true);
        setError(null);
        try {
            const res = await api.post("/sunday-school/sessions", dto);
            const created: SSSession = res.data?.data;
            setSessions((prev) => [created, ...prev]);
            return created;
        } catch (err: unknown) {
            const message = extractError(err, "Failed to create session.");
            setError(message);
            throw new Error(message);
        } finally {
            setIsSubmitting(false);
        }
    }, []);

    const deleteSession = useCallback(async (id: string): Promise<void> => {
        setIsSubmitting(true);
        setError(null);
        try {
            await api.delete(`/sunday-school/sessions/${id}`);
            setSessions((prev) => prev.filter((s) => s.id !== id));
        } catch (err: unknown) {
            const message = extractError(err, "Failed to delete session.");
            setError(message);
            throw new Error(message);
        } finally {
            setIsSubmitting(false);
        }
    }, []);

    const openSelfMark = useCallback(async (id: string, closesInMinutes: number): Promise<void> => {
        setIsSubmitting(true);
        setError(null);
        try {
            const res = await api.patch(`/sunday-school/sessions/${id}/open`, { closesInMinutes });
            const updated: SSSession = res.data?.data;
            setSessions((prev) => prev.map((s) => (s.id === id ? updated : s)));
            setRoster((prev) => (prev && prev.sessionId === id ? { ...prev, selfMarkOpen: true, selfMarkClosesAt: updated.selfMarkClosesAt } : prev));
        } catch (err: unknown) {
            const message = extractError(err, "Failed to open self-mark.");
            setError(message);
            throw new Error(message);
        } finally {
            setIsSubmitting(false);
        }
    }, []);

    const closeSelfMark = useCallback(async (id: string): Promise<void> => {
        setIsSubmitting(true);
        setError(null);
        try {
            const res = await api.patch(`/sunday-school/sessions/${id}/close`);
            const updated: SSSession = res.data?.data;
            setSessions((prev) => prev.map((s) => (s.id === id ? updated : s)));
            setRoster((prev) => (prev && prev.sessionId === id ? { ...prev, selfMarkOpen: false, selfMarkClosesAt: null } : prev));
        } catch (err: unknown) {
            const message = extractError(err, "Failed to close self-mark.");
            setError(message);
            throw new Error(message);
        } finally {
            setIsSubmitting(false);
        }
    }, []);

    const fetchRoster = useCallback(async (sessionId: string): Promise<void> => {
        setIsLoading(true);
        setError(null);
        try {
            const res = await api.get(`/sunday-school/sessions/${sessionId}/roster`);
            setRoster(res.data?.data ?? null);
        } catch (err: unknown) {
            setError(extractError(err, "Failed to load roster."));
        } finally {
            setIsLoading(false);
        }
    }, []);

    const bulkMarkAttendance = useCallback(async (
        sessionId: string,
        attendances: { memberId: string; status: SSAttendanceStatus }[]
    ): Promise<void> => {
        setIsSubmitting(true);
        setError(null);
        try {
            await api.post(`/sunday-school/sessions/${sessionId}/bulk-mark`, { attendances });
            setRoster((prev) => {
                if (!prev || prev.sessionId !== sessionId) return prev;
                const statusMap = new Map(attendances.map((a) => [a.memberId, a.status]));
                return {
                    ...prev,
                    members: prev.members.map((m) =>
                        statusMap.has(m.memberId)
                            ? { ...m, status: statusMap.get(m.memberId)!, markedByTeacher: true, markedAt: new Date().toISOString() }
                            : m
                    ),
                };
            });
        } catch (err: unknown) {
            const message = extractError(err, "Failed to save attendance.");
            setError(message);
            throw new Error(message);
        } finally {
            setIsSubmitting(false);
        }
    }, []);

    return {
        myAttendance, myAttendancePage, myAttendanceTotalPages,
        openSessions,
        classes, classesTotalPages,
        sessions, sessionsTotalPages,
        classMembers, classMembersTotalPages,
        roster,
        isLoading, isSubmitting, error, setError,

        fetchMyAttendance, fetchOpenSessions, checkIn,
        fetchClasses, createClass,
        fetchClassMembers, removeMember,
        fetchSessions, createSession, deleteSession,
        openSelfMark, closeSelfMark, fetchRoster, bulkMarkAttendance,
    };
}
