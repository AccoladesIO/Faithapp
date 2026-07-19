"use client";

import React from "react";
import Image from "next/image";
import {
    Calendar as CalendarIcon,
    Clock,
    XCircle,
    AlertCircle,
    CheckCircle2,
    Flame,
    BarChart3,
    RefreshCw,
    Info,
} from "lucide-react";
import { useRouter } from "next/navigation";
import {
    useAttendanceHistory,
    AttendanceRecord,
    AttendanceStatus,
} from "@/hooks/use-attendance-history";
import { getAttendanceRateStyle } from "@/utils/attendance-rate-style";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDateBlock(iso: string): { month: string; day: string } {
    const d = new Date(iso);
    return {
        month: d.toLocaleString("en-GB", { month: "short" }),
        day: d.getDate().toString(),
    };
}

function formatCheckinTime(iso: string): string {
    return new Date(iso).toLocaleTimeString("en-GB", {
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
    });
}

function formatLastCheckinDate(iso: string): string {
    return new Date(iso).toLocaleDateString("en-GB", {
        day: "numeric",
        month: "long",
        year: "numeric",
    });
}

function formatEventType(record: AttendanceRecord): string {
    const name = (record.event?.name ?? "").toUpperCase();
    if (name.includes("SUNDAY")) return "SUNDAY SERVICE";
    if (name.includes("MIDWEEK") || name.includes("WEDNESDAY")) return "MIDWEEK SERVICE";
    if (name.includes("SATURDAY")) return "SATURDAY SERVICE";
    if (record.serviceSlot) return "SERVICE";
    return "SERVICE";
}

// ─── Status badge ─────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: AttendanceStatus }) {
    switch (status) {
        case "EARLY":
            return (
                <div className="flex items-center gap-1 text-green-600 bg-green-50 px-2 py-0.5 rounded-full">
                    <CheckCircle2 size={11} />
                    <span className="text-[10px] font-bold uppercase tracking-wider">Early</span>
                </div>
            );
        case "PRESENT":
            return (
                <div className="flex items-center gap-1 text-green-600 bg-green-50 px-2 py-0.5 rounded-full">
                    <CheckCircle2 size={11} />
                    <span className="text-[10px] font-bold uppercase tracking-wider">Present</span>
                </div>
            );
        case "LATE":
            return (
                <div className="flex items-center gap-1 text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">
                    <AlertCircle size={11} />
                    <span className="text-[10px] font-bold uppercase tracking-wider">Late</span>
                </div>
            );
        case "ABSENT":
            return (
                <div className="flex items-center gap-1 text-red-600 bg-red-50 px-2 py-0.5 rounded-full">
                    <XCircle size={11} />
                    <span className="text-[10px] font-bold uppercase tracking-wider">Absent</span>
                </div>
            );
    }
}

// ─── Attendance card ──────────────────────────────────────────────────────────

function AttendanceCard({ record }: { record: AttendanceRecord }) {
    const isAbsent = record.status === "ABSENT";

    // Date: prefer event.eventDate, fall back to createdAt
    const dateSource = record.event?.eventDate
        ? record.event.eventDate + "T00:00:00"
        : record.createdAt;
    const { month, day } = formatDateBlock(dateSource);

    // Title: prefer event name, fall back to "Unrecorded Absence"
    const title = record.event?.name ?? "Unrecorded Absence";

    // Subtitle: prefer event description, then slot name
    const subtitle = record.event?.description ?? record.serviceSlot?.name ?? null;

    const eventType = formatEventType(record);

    return (
        <div className={`bg-white border border-[#121212]/5 p-4 shadow-sm flex items-center justify-between transition-all hover:border-[#121212]/10 ${isAbsent ? "opacity-65" : ""}`}>
            <div className="flex items-start gap-4 flex-grow pr-2">
                <div className="bg-[#F4F1EA] text-[#121212] px-3 py-2 h-[100px] flex flex-col items-center justify-center min-w-[68px] border border-[#121212]/5 flex-shrink-0">
                    <span className="text-xs font-bold leading-none text-center">{month}</span>
                    <span className="text-lg font-bold tracking-tighter leading-none mt-1">{day}</span>
                </div>

                <div className="space-y-0.5">
                    <span className="text-[9px] uppercase tracking-wider font-bold text-gray-500">{eventType}</span>
                    <h3 className="text-sm font-medium text-[#121212] leading-snug">{title}</h3>
                    {subtitle && <p className="text-xs text-gray-500 font-light">{subtitle}</p>}
                </div>
            </div>

            <div className="flex flex-col items-end justify-between self-stretch min-w-[85px] text-right">
                <StatusBadge status={record.status} />
                {record.checkinTime && (
                    <span className="text-[10px] text-gray-500 font-light flex items-center justify-end gap-0.5">
                        <Clock size={10} />
                        {formatCheckinTime(record.checkinTime)}
                    </span>
                )}
            </div>
        </div>
    );
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function HistorySkeleton() {
    return (
        <div className="space-y-3">
            {[1, 2, 3].map((i) => (
                <div key={i} className="bg-white border border-[#121212]/5 p-4 shadow-sm flex items-center gap-4 animate-pulse">
                    <div className="bg-[#F4F1EA] h-[100px] min-w-[68px]" />
                    <div className="flex-1 space-y-2">
                        <div className="h-2.5 w-16 bg-gray-100 rounded" />
                        <div className="h-4 w-2/3 bg-gray-100 rounded" />
                        <div className="h-3 w-1/3 bg-gray-100 rounded" />
                    </div>
                </div>
            ))}
        </div>
    );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export const PersonalAttendancePage = () => {
    const router = useRouter();
    const { records, stats, isLoading, error, refetch } = useAttendanceHistory();
    const rateStyle = getAttendanceRateStyle(isLoading ? null : stats.attendanceRatePercentage);

    return (
        <div className="min-h-screen bg-[#FFFFFF] text-[#121212] pb-32 font-sans selection:bg-[#121212] selection:text-[#FFFFFF]">

            {/* ── Hero banner ────────────────────────────────────────────── */}
            <div className="relative w-full h-[40vh] md:h-[40vh] overflow-hidden">
                <Image
                    src="/images/attendance-backdrop.jpg"
                    alt="Sanctuary atmosphere"
                    fill
                    priority
                    sizes="100vw"
                    className="object-cover"
                />
                <div className="absolute inset-0 bg-black/40" />
                <div className="absolute bottom-0 inset-x-0 p-6 ">
                    <span className="text-xs uppercase tracking-widest text-white/80 font-semibold flex items-center gap-1 drop-shadow-sm">
                        <CalendarIcon size={12} /> My Profile
                    </span>
                    <h1 className="text-2xl font-light tracking-tight text-white mt-1 drop-shadow-md">
                        Attendance History
                    </h1>
                </div>
            </div>

            {/* ── Stats block ────────────────────────────────────────────── */}
            <div className="px-6 pb-6 border-b border-[#121212]/5 bg-[#F9F9F9] mt-3">
                <div className="grid grid-cols-3 gap-2.5">
                    <div className="bg-orange-50/60 p-3 border border-orange-100 shadow-sm flex flex-col items-center text-center gap-1.5">
                        <div className="w-8 h-8 rounded-full bg-white shadow-sm flex items-center justify-center flex-shrink-0">
                            <Flame size={14} className="text-orange-500" />
                        </div>
                        <p className="text-xl font-semibold tracking-tight leading-none text-[#121212]">
                            {isLoading ? "—" : stats.attendanceStreak}
                            {!isLoading && <span className="text-[10px] text-gray-500 font-normal ml-0.5">wks</span>}
                        </p>
                        <p className="text-[9px] uppercase tracking-wider text-gray-500 font-semibold leading-tight">
                            Streak
                        </p>
                    </div>

                    <div className="bg-green-50/60 p-3 border border-green-100 shadow-sm flex flex-col items-center text-center gap-1.5">
                        <div className="w-8 h-8 rounded-full bg-white shadow-sm flex items-center justify-center flex-shrink-0">
                            <CheckCircle2 size={14} className="text-green-600" />
                        </div>
                        <p className="text-xl font-semibold tracking-tight leading-none text-[#121212]">
                            {isLoading ? "—" : stats.presentCount}
                        </p>
                        <p className="text-[9px] uppercase tracking-wider text-gray-500 font-semibold leading-tight">
                            Present
                        </p>
                    </div>

                    <div className={`${rateStyle.bg} p-3 border ${rateStyle.border} shadow-sm flex flex-col items-center text-center gap-1.5 transition-colors duration-500`}>
                        <div className={`relative w-8 h-8 flex items-center justify-center flex-shrink-0 ${rateStyle.ring}`}>
                            <svg viewBox="0 0 36 36" className="absolute inset-0 -rotate-90">
                                <circle cx="18" cy="18" r="16" fill="none" stroke="currentColor" strokeOpacity="0.15" strokeWidth="3" />
                                <circle
                                    cx="18" cy="18" r="16" fill="none" stroke="currentColor" strokeWidth="3"
                                    strokeLinecap="round"
                                    strokeDasharray={2 * Math.PI * 16}
                                    strokeDashoffset={2 * Math.PI * 16 * (1 - (isLoading ? 0 : stats.attendanceRatePercentage / 100))}
                                    className="transition-all duration-500"
                                />
                            </svg>
                            <div className="w-5 h-5 rounded-full bg-white shadow-sm flex items-center justify-center">
                                <BarChart3 size={10} className={rateStyle.icon} />
                            </div>
                        </div>
                        <p className="text-xl font-semibold tracking-tight leading-none text-[#121212]">
                            {isLoading ? "—" : `${stats.attendanceRatePercentage}%`}
                        </p>
                        <p className="text-[9px] uppercase tracking-wider text-gray-500 font-semibold leading-tight">
                            Attendance Rate
                        </p>
                    </div>
                </div>

                {!isLoading && (
                    <div className="flex items-start gap-1.5 mt-3 text-[10px] text-gray-500 font-light leading-relaxed">
                        <Info size={11} className="mt-0.5 flex-shrink-0" />
                        <span>
                            Based on your last {records.length} check-in{records.length === 1 ? "" : "s"} only — not your full history.
                            {" "}For your all-time attendance %, streak, and rank, see{" "}
                            <button onClick={() => router.push("/dashboard")} className="underline text-[#121212] font-medium">
                                My Stats
                            </button>.
                        </span>
                    </div>
                )}
            </div>

            {/* ── History list ───────────────────────────────────────────── */}
            <div className="px-6 mt-8 space-y-4">
                <div className="flex justify-between items-center px-1">
                    <span className="text-xs font-semibold text-gray-500 uppercase tracking-widest">
                        Check-in History
                    </span>
                    {stats.lastCheckedInDate && !isLoading && (
                        <span className="text-xs text-gray-500 font-light">
                            Last log: {formatLastCheckinDate(stats.lastCheckedInDate)}
                        </span>
                    )}
                </div>

                {isLoading ? (
                    <HistorySkeleton />
                ) : error ? (
                    <div className="flex flex-col items-start gap-3 py-10 text-gray-500">
                        <p className="text-sm font-light">{error}</p>
                        <button onClick={refetch} className="flex items-center gap-1.5 text-xs font-semibold text-[#121212] hover:underline">
                            <RefreshCw size={12} /> Retry
                        </button>
                    </div>
                ) : records.length === 0 ? (
                    <p className="text-sm text-gray-500 font-light py-10 text-center">No attendance records yet.</p>
                ) : (
                    <div className="space-y-3">
                        {records.map((record) => (
                            <AttendanceCard key={record.id} record={record} />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};