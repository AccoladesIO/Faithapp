"use client";

import React from "react";
import Image from "next/image";
import {
    ArrowLeft, Flame, Trophy, CheckCircle2, XCircle, AlertCircle,
    Users, ClipboardList, Layers, BarChart3,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useDashboard } from "@/hooks/use-dashboard";
import { getAttendanceRateStyle } from "@/utils/attendance-rate-style";

function formatEventDate(iso: string): string {
    return new Date(iso + "T00:00:00").toLocaleDateString("en-GB", {
        weekday: "short", day: "numeric", month: "short",
    });
}

function DashboardSkeleton() {
    return (
        <div className="px-6 mt-8 max-w-md mx-auto space-y-4 animate-pulse">
            <div className="grid grid-cols-2 gap-3">
                {[1, 2, 3, 4].map((i) => <div key={i} className="h-20 bg-gray-100 rounded" />)}
            </div>
            <div className="h-32 bg-gray-100 rounded" />
        </div>
    );
}

export const DashboardPage = () => {
    const router = useRouter();
    const { dashboard, isLoading, error } = useDashboard();
    const attendanceRateStyle = getAttendanceRateStyle(dashboard?.personalAttendancePercentage ?? null);

    return (
        <div className="min-h-screen bg-[#FFFFFF] text-[#121212] pb-32 font-sans selection:bg-[#121212] selection:text-[#FFFFFF]">

            {/* ── Hero ─────────────────────────────────────────────────── */}
            <div className="relative w-full h-[40vh] overflow-hidden">
                <Image
                    src="/images/dashboard-bible.jpg"
                    alt="Stats backdrop"
                    fill
                    priority
                    sizes="100vw"
                    className="object-cover"
                />
                <div className="absolute inset-0 bg-black/50" />
                <div className="absolute top-4 left-4 z-10">
                    <button
                        onClick={() => router.back()}
                        className="p-2.5 bg-black/25 backdrop-blur-md hover:bg-black/40 text-white rounded-full transition-colors border border-white/10"
                        aria-label="Go back"
                    >
                        <ArrowLeft size={16} />
                    </button>
                </div>
                <div className="absolute bottom-0 inset-x-0 p-6">
                    <span className="text-xs uppercase tracking-widest text-white/80 font-semibold flex items-center gap-1 drop-shadow-sm">
                        <BarChart3 size={12} /> Personal Progress
                    </span>
                    <h1 className="text-2xl font-light tracking-tight text-white mt-1 drop-shadow-md">
                        My Stats
                    </h1>
                </div>
            </div>

            {isLoading ? (
                <DashboardSkeleton />
            ) : error ? (
                <div className="px-6 mt-8 max-w-md mx-auto flex flex-col items-start gap-3 py-12 text-gray-500">
                    <AlertCircle size={24} />
                    <p className="text-sm font-light">{error}</p>
                </div>
            ) : dashboard ? (
                <div className="px-6 mt-8 max-w-md mx-auto space-y-6">

                    {/* ── Top stats ─────────────────────────────────────── */}
                    <div className="grid grid-cols-2 gap-2.5">
                        <div className={`${attendanceRateStyle.bg} p-4 border ${attendanceRateStyle.border} shadow-sm flex flex-col items-center text-center gap-1.5 transition-colors duration-500`}>
                            <div className={`relative w-10 h-10 flex items-center justify-center flex-shrink-0 ${attendanceRateStyle.ring}`}>
                                <svg viewBox="0 0 36 36" className="absolute inset-0 -rotate-90">
                                    <circle cx="18" cy="18" r="16" fill="none" stroke="currentColor" strokeOpacity="0.15" strokeWidth="3" />
                                    <circle
                                        cx="18" cy="18" r="16" fill="none" stroke="currentColor" strokeWidth="3"
                                        strokeLinecap="round"
                                        strokeDasharray={2 * Math.PI * 16}
                                        strokeDashoffset={2 * Math.PI * 16 * (1 - dashboard.personalAttendancePercentage / 100)}
                                        className="transition-all duration-500"
                                    />
                                </svg>
                                <div className="w-6 h-6 rounded-full bg-white shadow-sm flex items-center justify-center">
                                    <BarChart3 size={12} className={attendanceRateStyle.icon} />
                                </div>
                            </div>
                            <p className="text-xl font-semibold tracking-tight leading-none text-[#121212]">
                                {dashboard.personalAttendancePercentage}%
                            </p>
                            <p className="text-[9px] uppercase tracking-wider text-gray-500 font-semibold leading-tight">
                                Attendance
                            </p>
                        </div>

                        <div className="bg-orange-50/60 p-4 border border-orange-100 shadow-sm flex flex-col items-center text-center gap-1.5">
                            <div className="w-8 h-8 rounded-full bg-white shadow-sm flex items-center justify-center flex-shrink-0">
                                <Flame size={14} className="text-orange-500" />
                            </div>
                            <p className="text-xl font-semibold tracking-tight leading-none text-[#121212]">
                                {dashboard.attendanceStreak}
                                <span className="text-[10px] text-gray-500 font-normal ml-0.5">wks</span>
                            </p>
                            <p className="text-[9px] uppercase tracking-wider text-gray-500 font-semibold leading-tight">
                                Streak
                            </p>
                        </div>

                        <div className="bg-yellow-50/60 p-4 border border-yellow-100 shadow-sm flex flex-col items-center text-center gap-1.5">
                            <div className="w-8 h-8 rounded-full bg-white shadow-sm flex items-center justify-center flex-shrink-0">
                                <Trophy size={14} className="text-yellow-600" />
                            </div>
                            <p className="text-xl font-semibold tracking-tight leading-none text-[#121212]">
                                #{dashboard.rank}
                            </p>
                            <p className="text-[9px] uppercase tracking-wider text-gray-500 font-semibold leading-tight">
                                Rank
                            </p>
                        </div>

                        <div className="bg-gray-50 p-4 border border-gray-200 shadow-sm flex flex-col items-center text-center gap-1.5">
                            <div className="w-8 h-8 rounded-full bg-white shadow-sm flex items-center justify-center flex-shrink-0">
                                <ClipboardList size={14} className="text-gray-500" />
                            </div>
                            <p className="text-xl font-semibold tracking-tight leading-none text-[#121212]">
                                {dashboard.totalPendingLeaveRequests ?? "—"}
                            </p>
                            <p className="text-[9px] uppercase tracking-wider text-gray-500 font-semibold leading-tight">
                                Pending Leave
                            </p>
                        </div>
                    </div>

                    {/* ── Period breakdown ──────────────────────────────── */}
                    <div className="bg-white border border-[#121212]/5 shadow-sm p-4">
                        <p className="text-[10px] uppercase tracking-wider text-gray-500 font-semibold mb-3">Last 30 Days</p>
                        <div className="grid grid-cols-4 gap-2 text-center">
                            <div>
                                <p className="text-lg font-medium text-green-600">{dashboard.periodStats.present}</p>
                                <p className="text-[9px] uppercase tracking-wider text-gray-500 font-bold">Present</p>
                            </div>
                            <div>
                                <p className="text-lg font-medium text-amber-600">{dashboard.periodStats.late}</p>
                                <p className="text-[9px] uppercase tracking-wider text-gray-500 font-bold">Late</p>
                            </div>
                            <div>
                                <p className="text-lg font-medium text-red-600">{dashboard.periodStats.absent}</p>
                                <p className="text-[9px] uppercase tracking-wider text-gray-500 font-bold">Absent</p>
                            </div>
                            <div>
                                <p className="text-lg font-medium text-gray-500">{dashboard.periodStats.onLeave}</p>
                                <p className="text-[9px] uppercase tracking-wider text-gray-500 font-bold">On Leave</p>
                            </div>
                        </div>
                    </div>

                    {/* ── Department lead card ─────────────────────────── */}
                    {dashboard.isDepartmentLead && dashboard.departmentLeadDetails && (
                        <div className="bg-[#F4F1EA]/60 border border-[#121212]/10 rounded-xl p-4">
                            <p className="text-[10px] uppercase tracking-wider text-gray-500 font-semibold mb-3 flex items-center gap-1.5">
                                <Users size={12} /> Department Overview
                            </p>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <p className="text-xl font-medium text-[#121212]">{dashboard.departmentLeadDetails.departmentAttendancePercentage}%</p>
                                    <p className="text-[10px] text-gray-500 font-light">Dept. Attendance</p>
                                </div>
                                <div>
                                    <p className="text-xl font-medium text-[#121212]">{dashboard.departmentLeadDetails.totalDepartmentPendingLeaveRequests}</p>
                                    <p className="text-[10px] text-gray-500 font-light">Pending Leave Requests</p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* ── Enrollments ───────────────────────────────────── */}
                    {dashboard.enrollments.length > 0 && (
                        <div className="bg-white border border-[#121212]/5 shadow-sm p-4">
                            <p className="text-[10px] uppercase tracking-wider text-gray-500 font-semibold mb-3 flex items-center gap-1.5">
                                <Layers size={12} /> My Classes
                            </p>
                            <div className="space-y-2">
                                {dashboard.enrollments.map((e) => (
                                    <div key={e.id} className="flex items-center justify-between">
                                        <span className="text-xs text-[#121212] font-medium">{e.class?.name ?? "—"}</span>
                                        <span className="text-[9px] uppercase tracking-wider font-bold text-gray-500">{e.status}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* ── Upcoming events ───────────────────────────────── */}
                    {dashboard.upcomingEvents.length > 0 && (
                        <div>
                            <p className="text-[10px] uppercase tracking-wider text-gray-500 font-semibold mb-3">Upcoming</p>
                            <div className="space-y-2">
                                {dashboard.upcomingEvents.map((e) => (
                                    <div key={e.id} className="flex items-center justify-between bg-white border border-[#121212]/5 shadow-sm px-4 py-3">
                                        <span className="text-xs text-[#121212] font-medium">{e.name}</span>
                                        <span className="text-[10px] text-gray-500 font-light">{formatEventDate(e.eventDate)}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* ── Recent attendance ─────────────────────────────── */}
                    {dashboard.recentAttendance.length > 0 && (
                        <div>
                            <p className="text-[10px] uppercase tracking-wider text-gray-500 font-semibold mb-3 flex items-center gap-1.5">
                                <ClipboardList size={12} /> Recent Attendance
                            </p>
                            <div className="space-y-2">
                                {dashboard.recentAttendance.map((r) => (
                                    <div key={r.id} className="flex items-center justify-between bg-white border border-[#121212]/5 shadow-sm px-4 py-3">
                                        <span className="text-xs text-[#121212] font-medium truncate pr-2">{r.event?.name ?? "Unrecorded"}</span>
                                        {r.status === "ABSENT" ? (
                                            <span className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-red-600"><XCircle size={11} /> Absent</span>
                                        ) : (
                                            <span className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-green-600"><CheckCircle2 size={11} /> {r.status}</span>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            ) : null}
        </div>
    );
};
