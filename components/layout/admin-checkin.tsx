"use client";

import React, { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { ArrowLeft, Search, UserCheck, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import { useEvents } from "@/hooks/use-events";
import { useAdminCheckin, AttendanceStatus, CheckinMemberResult } from "@/hooks/use-admin-checkin";

const STATUS_OPTIONS: { value: AttendanceStatus; label: string }[] = [
    { value: "PRESENT", label: "Present" },
    { value: "LATE", label: "Late" },
    { value: "ON_LEAVE", label: "On Leave" },
    { value: "ABSENT", label: "Absent" },
    { value: "ATTENDED_ONLINE", label: "Attended Online" },
];

export const AdminCheckinPage = () => {
    const router = useRouter();
    const { events, isLoading: eventsLoading } = useEvents();
    const { isSearching, isSubmitting, error, searchMembers, markAttendance } = useAdminCheckin();

    const [query, setQuery] = useState("");
    const [results, setResults] = useState<CheckinMemberResult[]>([]);
    const [selectedMember, setSelectedMember] = useState<CheckinMemberResult | null>(null);
    const [eventId, setEventId] = useState("");
    const [slotId, setSlotId] = useState("");
    const [status, setStatus] = useState<AttendanceStatus>("PRESENT");
    const [success, setSuccess] = useState(false);
    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    useEffect(() => {
        if (debounceRef.current) clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(async () => {
            setResults(await searchMembers(query));
        }, 350);
        return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [query]);

    const selectedEvent = events.find((e) => e.id === eventId);
    const slots = selectedEvent?.serviceSlots ?? [];

    const handleSubmit = async () => {
        if (!selectedMember || !slotId) return;
        try {
            await markAttendance(selectedMember.id, slotId, status);
            setSuccess(true);
            setSelectedMember(null);
            setQuery("");
            setResults([]);
            setTimeout(() => setSuccess(false), 3000);
        } catch { /* error shown below */ }
    };

    return (
        <div className="min-h-screen bg-[#FFFFFF] text-[#121212] pb-32 font-sans selection:bg-[#121212] selection:text-[#FFFFFF]">
            <div className="relative w-full h-[32vh] overflow-hidden">
                <Image src="/images/attendance-backdrop.jpg" alt="Check-in" fill priority sizes="100vw" className="object-cover" />
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
                        <UserCheck size={12} /> Admin Desk
                    </span>
                    <h1 className="text-2xl font-light tracking-tight text-white mt-1 drop-shadow-md">Check Someone In</h1>
                    <p className="text-xs text-white/70 font-light mt-1">For members/workers without a phone, or to fix a missed check-in</p>
                </div>
            </div>

            <div className="px-6 mt-8 max-w-md mx-auto space-y-5">
                {success && (
                    <div className="flex items-center gap-2 bg-green-50 border border-green-100 text-green-700 px-4 py-3 rounded-xl text-xs font-medium">
                        <CheckCircle2 size={14} /> Attendance marked.
                    </div>
                )}

                <div>
                    <label className="text-[10px] uppercase tracking-wider text-gray-500 font-bold block mb-1.5">Find Member</label>
                    <div className="relative">
                        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                            type="text"
                            value={query}
                            onChange={(e) => { setQuery(e.target.value); setSelectedMember(null); }}
                            placeholder="Search by name…"
                            className="w-full bg-[#F9F9F9] border border-[#121212]/10 rounded-xl pl-9 pr-3 py-2.5 text-sm font-sans outline-none focus:border-[#121212]/30"
                        />
                    </div>
                    {isSearching && <p className="text-[10px] text-gray-400 mt-2">Searching…</p>}
                    {!isSearching && results.length > 0 && !selectedMember && (
                        <div className="mt-2 space-y-1 max-h-40 overflow-y-auto">
                            {results.map((m) => (
                                <button
                                    key={m.id}
                                    onClick={() => { setSelectedMember(m); setQuery(`${m.firstname} ${m.lastname}`); setResults([]); }}
                                    className="w-full text-left px-3 py-2 rounded-lg text-xs bg-white border border-[#121212]/5 hover:bg-[#F4F1EA] transition-colors"
                                >
                                    {m.firstname} {m.lastname} <span className="text-gray-400">— {m.role === "WORKER" ? "Worker" : "Member"}</span>
                                </button>
                            ))}
                        </div>
                    )}
                    {selectedMember && (
                        <p className="text-xs text-[#121212] mt-1.5">Selected: <span className="font-medium">{selectedMember.firstname} {selectedMember.lastname}</span></p>
                    )}
                </div>

                <div>
                    <label className="text-[10px] uppercase tracking-wider text-gray-500 font-bold block mb-1.5">Event</label>
                    <select
                        value={eventId}
                        onChange={(e) => { setEventId(e.target.value); setSlotId(""); }}
                        disabled={eventsLoading}
                        className="w-full bg-[#F9F9F9] border border-[#121212]/10 rounded-xl px-3 py-2.5 text-sm font-sans outline-none focus:border-[#121212]/30 appearance-none"
                    >
                        <option value="">Select an event…</option>
                        {events.map((ev) => (
                            <option key={ev.id} value={ev.id}>{ev.name}</option>
                        ))}
                    </select>
                </div>

                {eventId && (
                    <div>
                        <label className="text-[10px] uppercase tracking-wider text-gray-500 font-bold block mb-1.5">Service Slot</label>
                        <select
                            value={slotId}
                            onChange={(e) => setSlotId(e.target.value)}
                            className="w-full bg-[#F9F9F9] border border-[#121212]/10 rounded-xl px-3 py-2.5 text-sm font-sans outline-none focus:border-[#121212]/30 appearance-none"
                        >
                            <option value="">Select a slot…</option>
                            {slots.map((s) => (
                                <option key={s.id} value={s.id}>{s.name}</option>
                            ))}
                        </select>
                    </div>
                )}

                <div>
                    <label className="text-[10px] uppercase tracking-wider text-gray-500 font-bold block mb-1.5">Status</label>
                    <select
                        value={status}
                        onChange={(e) => setStatus(e.target.value as AttendanceStatus)}
                        className="w-full bg-[#F9F9F9] border border-[#121212]/10 rounded-xl px-3 py-2.5 text-sm font-sans outline-none focus:border-[#121212]/30 appearance-none"
                    >
                        {STATUS_OPTIONS.map((s) => (
                            <option key={s.value} value={s.value}>{s.label}</option>
                        ))}
                    </select>
                </div>

                {error && (
                    <div className="flex items-center gap-2 bg-red-50 border border-red-100 text-red-600 px-4 py-3 rounded-xl text-xs font-medium">
                        <AlertCircle size={14} /> {error}
                    </div>
                )}

                <button
                    onClick={handleSubmit}
                    disabled={isSubmitting || !selectedMember || !slotId}
                    className="w-full bg-[#121212] text-white text-xs uppercase tracking-widest font-semibold py-4 rounded-xl hover:bg-gray-800 transition-all shadow-md flex items-center justify-center gap-2 disabled:opacity-50"
                >
                    {isSubmitting ? <Loader2 size={14} className="animate-spin" /> : <UserCheck size={14} />}
                    Mark Attendance
                </button>
            </div>
        </div>
    );
};
