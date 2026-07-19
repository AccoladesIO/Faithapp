"use client";

import { useState, useEffect } from "react";
import { api } from "@/utils/auth/axios-client";
import { useProfile } from "@/hooks/use-profile";
import { AttendanceRecord } from "@/hooks/use-attendance-history";

export interface PeriodStats {
    present: number;
    late: number;
    absent: number;
    onLeave: number;
    total: number;
}

export interface DashboardUpcomingEvent {
    id: string;
    name: string;
    eventDate: string;
}

export interface DashboardEnrollment {
    id: string;
    status: string;
    class: { id: string; name: string } | null;
}

export interface DepartmentLeadDetails {
    departmentAttendancePercentage: number;
    totalDepartmentPendingLeaveRequests: number;
}

export interface DashboardData {
    personalAttendancePercentage: number;
    attendanceStreak: number;
    rank: number;
    periodStats: PeriodStats;
    recentAttendance: AttendanceRecord[];
    upcomingEvents: DashboardUpcomingEvent[];
    enrollments: DashboardEnrollment[];
    isDepartmentLead: boolean;
    departmentLeadDetails: DepartmentLeadDetails | null;
    totalPendingLeaveRequests: number | null;
}

export interface UseDashboardReturn {
    dashboard: DashboardData | null;
    isLoading: boolean;
    error: string | null;
}

export function useDashboard(daysAgo = 30): UseDashboardReturn {
    const { profile, isLoading: isLoadingProfile } = useProfile();
    const [dashboard, setDashboard] = useState<DashboardData | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (isLoadingProfile || !profile) return;
        let cancelled = false;
        const isWorker = profile.role === "WORKER";
        const endpoint = isWorker ? "/dashboard/worker" : "/dashboard/member";

        async function load() {
            setIsLoading(true);
            setError(null);
            try {
                const res = await api.get<{ data: Record<string, unknown> }>(
                    `${endpoint}?daysAgo=${daysAgo}`
                );
                const raw = res.data.data;
                if (!cancelled) {
                    setDashboard({
                        personalAttendancePercentage: raw.personalAttendancePercentage as number,
                        attendanceStreak: raw.attendanceStreak as number,
                        rank: raw.rank as number,
                        periodStats: raw.periodStats as PeriodStats,
                        recentAttendance: (raw.recentAttendance as AttendanceRecord[]) ?? [],
                        upcomingEvents: (raw.upcomingEvents as DashboardUpcomingEvent[]) ?? [],
                        enrollments: (raw.enrollments as DashboardEnrollment[]) ?? [],
                        isDepartmentLead: (raw.isDepartmentLead as boolean) ?? false,
                        departmentLeadDetails: (raw.departmentLeadDetails as DepartmentLeadDetails) ?? null,
                        totalPendingLeaveRequests: (raw.totalPendingLeaveRequests as number) ?? null,
                    });
                }
            } catch (err: unknown) {
                if (!cancelled)
                    setError(err instanceof Error ? err.message : "Could not load your dashboard.");
            } finally {
                if (!cancelled) setIsLoading(false);
            }
        }

        load();
        return () => { cancelled = true; };
    }, [profile, isLoadingProfile, daysAgo]);

    return { dashboard, isLoading: isLoadingProfile || isLoading, error };
}
