"use client";

import React, { useState } from "react";
import Image from "next/image";
import { ArrowLeft, HandMetal, ChevronLeft, ChevronRight, Clock, MapPin, Wifi, CheckCircle2, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { usePrayer, PrayerMeeting, RosterEntry } from "@/hooks/use-prayer";

const MONTH_NAMES = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December",
];

function formatMeetingDate(iso?: string | null): string {
    if (!iso) return "—";
    return new Date(iso + "T00:00:00").toLocaleDateString("en-GB", {
        weekday: "short", day: "numeric", month: "short",
    });
}

function MeetingCard({
    meeting, onSelect, isSelecting, isSelected,
}: {
    meeting?: PrayerMeeting;
    onSelect: (id: string) => void;
    isSelecting?: boolean;
    isSelected?: boolean;
}) {
    const dayConfig = meeting?.dayConfig;
    const isFull = (meeting?.currentCapacity ?? 0) >= (dayConfig?.maxCapacity ?? 0);
    return (
        <div className={`bg-white border rounded-xl p-3.5 transition-all ${isSelected ? "border-[#121212] bg-[#F4F1EA]/30" : "border-[#121212]/5"}`}>
            <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 mb-1 flex-wrap">
                        <span className="text-xs font-medium text-[#121212]">{formatMeetingDate(meeting?.date)}</span>
                        {isFull && <span className="text-[8px] uppercase tracking-wider font-bold bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded">Full</span>}
                        {meeting?.selectionStatus === "OPEN" && !isFull && <span className="text-[8px] uppercase tracking-wider font-bold bg-green-50 text-green-700 px-1.5 py-0.5 rounded">Open</span>}
                    </div>
                    <div className="flex items-center gap-3 text-[10px] text-gray-500 font-light">
                        <span className="flex items-center gap-1"><Clock size={10} /> {dayConfig?.startTime} – {dayConfig?.endTime}</span>
                        <span className="flex items-center gap-1">
                            {dayConfig?.mode === "PHYSICAL" ? <MapPin size={10} /> : <Wifi size={10} />}
                            {dayConfig?.mode === "PHYSICAL" ? "In-person" : "Online"}
                        </span>
                        <span>{meeting?.currentCapacity ?? 0}/{dayConfig?.maxCapacity ?? 0}</span>
                    </div>
                </div>
                {isSelected ? (
                    <div className="flex items-center gap-1 text-[10px] text-green-700 font-bold uppercase tracking-wider flex-shrink-0">
                        <CheckCircle2 size={13} /> Selected
                    </div>
                ) : (
                    <button type="button" onClick={() => meeting?.id && onSelect?.(meeting.id)}
                        disabled={isSelecting || isFull || meeting?.selectionStatus !== "OPEN"}
                        className="text-[10px] uppercase tracking-wider font-bold text-[#121212] border border-[#121212]/20 px-3 py-1.5 rounded-lg hover:bg-[#F4F1EA] transition-colors disabled:opacity-40 flex-shrink-0">
                        {isSelecting ? <Loader2 size={11} className="animate-spin" /> : "Select"}
                    </button>
                )}
            </div>
        </div>
    );
}

function RosterCard({ entry }: { entry?: RosterEntry }) {
    const meeting = entry?.meeting;
    return (
        <div className="bg-white border border-[#121212]/5 rounded-xl p-3.5">
            <div className="flex items-center justify-between">
                <div>
                    <p className="text-xs font-medium text-[#121212]">{formatMeetingDate(meeting?.date)}</p>
                    <p className="text-[10px] text-gray-500 font-light mt-0.5">
                        {meeting?.dayConfig?.startTime} – {meeting?.dayConfig?.endTime} · {meeting?.dayConfig?.mode === "PHYSICAL" ? "In-person" : "Online"}
                    </p>
                </div>
                <span className={`text-[8px] uppercase tracking-wider font-bold px-1.5 py-0.5 rounded ${entry?.status === "SCHEDULED" ? "bg-amber-50 text-amber-700" :
                    entry?.status === "COMPLETED" ? "bg-green-50 text-green-700" :
                        "bg-gray-100 text-gray-500"
                    }`}>{entry?.status}</span>
            </div>
        </div>
    );
}

export const PrayerPage = () => {
    const router = useRouter();
    const {
        programs, selectedProgramId, setSelectedProgramId,
        availableMeetings, myRoster, prayerStatus,
        isLoadingPrograms, isLoadingMeetings, isSelecting,
        programsError, meetingsError, selectError,
        selectedMonth, selectedYear, setSelectedMonth, setSelectedYear,
        selectMeeting,
    } = usePrayer() ?? {};

    const [view, setView] = useState<"roster" | "select">("roster");
    const now = new Date();
    const canGoBack = !(selectedMonth === now.getMonth() + 1 && selectedYear === now.getFullYear());

    const handlePrevMonth = () => {
        if (selectedMonth === 1) { setSelectedMonth?.(12); setSelectedYear?.((selectedYear ?? now.getFullYear()) - 1); }
        else setSelectedMonth?.((selectedMonth ?? 1) - 1);
    };
    const handleNextMonth = () => {
        if (selectedMonth === 12) { setSelectedMonth?.(1); setSelectedYear?.((selectedYear ?? now.getFullYear()) + 1); }
        else setSelectedMonth?.((selectedMonth ?? 1) + 1);
    };

    const selectedMeetingIds = new Set((prayerStatus?.mySelections ?? []).map((m) => m?.id));

    return (
        <div className="min-h-screen bg-[#FFFFFF] text-[#121212] pb-32 font-sans selection:bg-[#121212] selection:text-[#FFFFFF]">
            <div className="relative w-full h-[40vh] overflow-hidden">
                <Image src="/images/prayer-hands-bible.jpg" alt="Hands clasped in prayer" fill priority sizes="100vw" className="object-cover" />
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
                        <HandMetal size={12} /> Workers
                    </span>
                    <h1 className="text-2xl font-light tracking-tight text-white mt-1 drop-shadow-md">
                        Prayer Roster
                    </h1>
                </div>
            </div>

            <div className="px-6 mt-6 max-w-lg mx-auto space-y-4">
                {isLoadingPrograms ? (
                    <div className="space-y-2 animate-pulse">
                        <div className="h-8 bg-gray-100 rounded-xl" />
                        <div className="h-16 bg-gray-100 rounded-xl" />
                    </div>
                ) : programsError ? (
                    <p className="text-xs text-red-500">{programsError}</p>
                ) : (programs?.length ?? 0) === 0 ? (
                    <p className="text-xs text-gray-500 font-light">No prayer programmes available.</p>
                ) : (
                    <>
                        <div>
                            <label className="text-[10px] uppercase tracking-wider text-gray-500 font-bold block mb-1.5">Programme</label>
                            <select value={selectedProgramId ?? ""} onChange={(e) => setSelectedProgramId?.(e.target?.value)}
                                className="w-full bg-white border border-[#121212]/10 rounded-xl px-3 py-2.5 text-xs font-sans outline-none focus:border-[#121212]/30 appearance-none">
                                {programs?.map((p) => <option key={p?.id} value={p?.id}>{p?.name}</option>)}
                            </select>
                        </div>
                        <div className="flex items-center justify-between bg-white border border-[#121212]/5 rounded-xl px-4 py-2.5">
                            <button type="button" onClick={handlePrevMonth} disabled={!canGoBack}
                                className="p-1 text-[#756E69] hover:text-[#121212] transition-colors disabled:opacity-30">
                                <ChevronLeft size={14} />
                            </button>
                            <span className="text-xs font-semibold text-[#121212]">{MONTH_NAMES[(selectedMonth ?? 1) - 1]} {selectedYear}</span>
                            <button type="button" onClick={handleNextMonth} className="p-1 text-[#756E69] hover:text-[#121212] transition-colors">
                                <ChevronRight size={14} />
                            </button>
                        </div>
                        {prayerStatus && (
                            <div className={`text-xs px-3 py-2.5 rounded-xl border font-light ${prayerStatus?.windowOpen ? "bg-green-50 border-green-100 text-green-700" : "bg-gray-50 border-gray-100 text-gray-500"}`}>
                                {prayerStatus?.windowOpen
                                    ? prayerStatus?.hasSelected
                                        ? "✓ You've already selected your prayer slot this month."
                                        : "Selection window is open — pick a meeting below."
                                    : "Selection window is closed for this period."}
                            </div>
                        )}
                        <div className="flex bg-[#F4F1EA] p-0.5 rounded-xl">
                            <button onClick={() => setView("roster")}
                                className={`flex-1 py-2 text-[10px] font-bold uppercase tracking-wider rounded-lg transition-colors ${view === "roster" ? "bg-white text-[#121212] shadow-sm" : "text-[#756E69]"}`}>
                                My Roster {(myRoster?.length ?? 0) > 0 && `(${myRoster?.length})`}
                            </button>
                            <button onClick={() => setView("select")}
                                className={`flex-1 py-2 text-[10px] font-bold uppercase tracking-wider rounded-lg transition-colors ${view === "select" ? "bg-white text-[#121212] shadow-sm" : "text-[#756E69]"}`}>
                                Available {(availableMeetings?.length ?? 0) > 0 && `(${availableMeetings?.length})`}
                            </button>
                        </div>
                        {selectError && <p className="text-xs text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">{selectError}</p>}
                        {isLoadingMeetings ? (
                            <div className="space-y-2 animate-pulse">{[1, 2].map((i) => <div key={i} className="h-16 bg-gray-100 rounded-xl" />)}</div>
                        ) : meetingsError ? (
                            <p className="text-xs text-red-500">{meetingsError}</p>
                        ) : view === "roster" ? (
                            (myRoster?.length ?? 0) === 0
                                ? <p className="text-xs text-gray-500 font-light text-center py-4">No roster entries for {MONTH_NAMES[(selectedMonth ?? 1) - 1]}.</p>
                                : <div className="space-y-2">{myRoster?.map((e) => <RosterCard key={e?.id} entry={e} />)}</div>
                        ) : (
                            (availableMeetings?.length ?? 0) === 0
                                ? <p className="text-xs text-gray-500 font-light text-center py-4">No available meetings for {MONTH_NAMES[(selectedMonth ?? 1) - 1]}.</p>
                                : <div className="space-y-2">{availableMeetings?.map((m) => (
                                    <MeetingCard key={m?.id} meeting={m} onSelect={selectMeeting} isSelecting={isSelecting} isSelected={selectedMeetingIds?.has(m?.id)} />
                                ))}</div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
};
