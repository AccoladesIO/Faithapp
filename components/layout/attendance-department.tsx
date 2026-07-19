"use client";

import React, { useState } from "react";
import Image from "next/image";
import { ArrowLeft, Loader2, AlertCircle, Clock, X, Users2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEvents } from "@/hooks/use-events";
import {
    useDepartmentEventAttendance,
    useDepartmentSlotHistory,
    AttendanceStatus,
} from "@/hooks/use-department-attendance";

function formatEventDate(iso: string): string {
    return new Date(iso + "T00:00:00").toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

function formatTime(iso: string): string {
    return new Date(iso).toLocaleTimeString("en-GB", { hour: "numeric", minute: "2-digit", hour12: true });
}

function StatusDot({ status }: { status: AttendanceStatus | null }) {
    if (!status) return <span className="w-2 h-2 rounded-full bg-gray-200 inline-block" title="No record" />;
    const colors: Record<AttendanceStatus, string> = {
        PRESENT: "bg-green-500",
        LATE: "bg-amber-500",
        ABSENT: "bg-red-500",
        ON_LEAVE: "bg-gray-400",
        ATTENDED_ONLINE: "bg-blue-500",
    };
    return <span className={`w-2 h-2 rounded-full inline-block ${colors[status]}`} title={status} />;
}

function SlotLogModal({ slotId, slotName, onClose }: { slotId: string; slotName: string; onClose: () => void }) {
    const { records, isLoading, error } = useDepartmentSlotHistory(slotId);
    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-4" onClick={onClose}>
            <div
                className="bg-white rounded-2xl w-full max-w-sm max-h-[70vh] overflow-y-auto p-5"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-medium text-[#121212]">{slotName}</h3>
                    <button onClick={onClose} className="text-gray-500 hover:text-[#121212]"><X size={16} /></button>
                </div>
                {isLoading ? (
                    <div className="flex items-center gap-2 py-6 text-gray-500"><Loader2 size={14} className="animate-spin" /> Loading…</div>
                ) : error ? (
                    <p className="text-xs text-red-500">{error}</p>
                ) : records.length === 0 ? (
                    <p className="text-xs text-gray-500 font-light py-4">No attendance records for this slot.</p>
                ) : (
                    <div className="space-y-2">
                        {records.map((r) => (
                            <div key={r.id} className="flex items-center justify-between border-b border-[#121212]/5 pb-2 last:border-0">
                                <span className="text-xs text-[#121212] font-medium">
                                    {r.member ? `${r.member.firstname} ${r.member.lastname}` : "—"}
                                </span>
                                <div className="flex items-center gap-2">
                                    {r.checkinTime && (
                                        <span className="text-[10px] text-gray-500 font-light flex items-center gap-0.5">
                                            <Clock size={10} /> {formatTime(r.checkinTime)}
                                        </span>
                                    )}
                                    <StatusDot status={r.status} />
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

export const AttendanceDepartmentPage = () => {
    const router = useRouter();
    const { events, isLoading: eventsLoading } = useEvents();
    const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
    const [openSlot, setOpenSlot] = useState<{ id: string; name: string } | null>(null);
    const { attendance, isLoading, error } = useDepartmentEventAttendance(selectedEventId);

    return (
        <div className="min-h-screen bg-[#FFFFFF] text-[#121212] pb-32 font-sans selection:bg-[#121212] selection:text-[#FFFFFF]">

            {/* ── Hero ─────────────────────────────────────────────────── */}
            <div className="relative w-full h-[40vh] overflow-hidden">
                <Image
                    src="/images/attendance-department-backdrop.jpg"
                    alt="Department attendance backdrop"
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
                        <Users2 size={12} /> Worker Operations
                    </span>
                    <h1 className="text-2xl font-light tracking-tight text-white mt-1 drop-shadow-md">
                        Department Attendance
                    </h1>
                </div>
            </div>

            <div className="px-6 mt-6 max-w-2xl mx-auto space-y-5">
                <div>
                    <label className="text-[10px] uppercase tracking-wider text-gray-500 font-bold block mb-1.5">Select Service</label>
                    <select
                        value={selectedEventId ?? ""}
                        onChange={(e) => setSelectedEventId(e.target.value || null)}
                        disabled={eventsLoading}
                        className="w-full bg-white border border-[#121212]/10 rounded-xl px-3 py-2.5 text-xs font-sans outline-none focus:border-[#121212]/30 appearance-none"
                    >
                        <option value="">{eventsLoading ? "Loading…" : "Choose a service…"}</option>
                        {events.map((e) => (
                            <option key={e.id} value={e.id}>{e.name} — {formatEventDate(e.eventDate)}</option>
                        ))}
                    </select>
                </div>

                {isLoading ? (
                    <div className="flex items-center gap-3 py-12 text-gray-500">
                        <Loader2 size={18} className="animate-spin" />
                        <span className="text-sm font-light">Loading attendance…</span>
                    </div>
                ) : error ? (
                    <div className="flex flex-col items-start gap-3 py-12 text-gray-500">
                        <AlertCircle size={24} />
                        <p className="text-sm font-light">{error}</p>
                    </div>
                ) : attendance ? (
                    <div className="overflow-x-auto -mx-6 px-6">
                        <table className="w-full text-xs border-collapse min-w-[480px]">
                            <thead>
                                <tr>
                                    <th className="text-left text-[10px] uppercase tracking-wider text-gray-500 font-semibold py-2 pr-3 sticky left-0 bg-white">Worker</th>
                                    {attendance.slots.map((slot) => (
                                        <th key={slot.slotId} className="text-center py-2 px-2">
                                            <button
                                                onClick={() => setOpenSlot({ id: slot.slotId, name: slot.slotName })}
                                                className="text-[10px] uppercase tracking-wider text-gray-500 font-semibold hover:text-[#121212] transition-colors"
                                            >
                                                {slot.slotName}
                                            </button>
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {attendance.workers.map((w) => (
                                    <tr key={w.workerId} className="border-t border-[#121212]/5">
                                        <td className="py-2.5 pr-3 font-medium text-[#121212] sticky left-0 bg-white whitespace-nowrap">{w.name}</td>
                                        {w.attendance.map((a) => (
                                            <td key={a.slotId} className="text-center py-2.5 px-2">
                                                <StatusDot status={a.status} />
                                            </td>
                                        ))}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        <div className="flex items-center gap-4 mt-4 flex-wrap">
                            {(["PRESENT", "LATE", "ABSENT", "ON_LEAVE", "ATTENDED_ONLINE"] as AttendanceStatus[]).map((s) => (
                                <span key={s} className="flex items-center gap-1.5 text-[10px] text-gray-500 font-light">
                                    <StatusDot status={s} /> {s.replace("_", " ")}
                                </span>
                            ))}
                        </div>
                    </div>
                ) : selectedEventId ? null : (
                    <p className="text-sm text-gray-500 font-light py-12 text-center">Choose a service above to see your department&apos;s attendance.</p>
                )}
            </div>

            {openSlot && (
                <SlotLogModal slotId={openSlot.id} slotName={openSlot.name} onClose={() => setOpenSlot(null)} />
            )}
        </div>
    );
};
