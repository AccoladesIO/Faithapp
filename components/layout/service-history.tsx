"use client";

import React from "react";
import Image from "next/image";
import { ArrowLeft, History, ChevronLeft, ChevronRight, CalendarX, Timer } from "lucide-react";
import { useRouter } from "next/navigation";
import { useMyServiceHistory } from "@/hooks/use-my-service-history";
import { SLOT_TYPE_LABELS, SLOT_TYPE_ICONS } from "@/utils/slot-type-icons";

function formatDuration(totalSeconds: number | null): string {
    if (totalSeconds == null) return "—";
    const m = Math.floor(totalSeconds / 60);
    const s = Math.round(totalSeconds % 60);
    if (m === 0) return `${s}s`;
    return `${m}m ${s}s`;
}

function formatDate(iso: string): string {
    return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function HistorySkeleton() {
    return (
        <div className="space-y-3">
            {[1, 2, 3].map((i) => (
                <div key={i} className="bg-white border border-[#121212]/5 p-4 shadow-sm animate-pulse space-y-2">
                    <div className="h-3 w-24 bg-gray-100 rounded" />
                    <div className="h-4 w-48 bg-gray-100 rounded" />
                    <div className="h-3 w-32 bg-gray-100 rounded" />
                </div>
            ))}
        </div>
    );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export const ServiceHistoryPage = () => {
    const router = useRouter();
    const { result, isLoading, error, page, goToPage } = useMyServiceHistory();

    return (
        <div className="min-h-screen bg-[#FFFFFF] text-[#121212] pb-32 font-sans selection:bg-[#121212] selection:text-[#FFFFFF]">

            {/* ── Header ───────────────────────────────────────────────── */}
            <div className="relative w-full h-[40vh] overflow-hidden">
                <Image
                    src="/images/service-hands.jpg"
                    alt="Church backdrop"
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
                        <History size={12} /> Worker Operations
                    </span>
                    <h1 className="text-2xl font-light tracking-tight text-white mt-1 drop-shadow-md">Service History</h1>
                </div>
            </div>

            <div className="px-6 mt-6 space-y-6 max-w-md mx-auto">

                {isLoading && !result ? (
                    <HistorySkeleton />
                ) : error ? (
                    <div className="flex flex-col items-start gap-3 py-8 text-gray-500">
                        <p className="text-sm font-light">{error}</p>
                    </div>
                ) : result && (
                    <>
                        {/* ── Summary ───────────────────────────────────────── */}
                        <div className="grid grid-cols-2 gap-3">
                            <div className="bg-[#121212] text-white rounded-2xl p-4">
                                <p className="text-[10px] uppercase tracking-wider text-white/50 font-semibold mb-1">Total Services</p>
                                <p className="text-2xl font-light">{result.totalSlots}</p>
                            </div>
                            <div className="bg-[#F4F1EA]/60 border border-[#121212]/10 rounded-2xl p-4">
                                <p className="text-[10px] uppercase tracking-wider text-gray-500 font-semibold mb-1">Total Time Used</p>
                                <p className="text-2xl font-light text-[#121212]">{formatDuration(result.totalActualSeconds)}</p>
                            </div>
                        </div>

                        {result.bySlotType.length > 0 && (
                            <div className="bg-white border border-[#121212]/5 rounded-2xl p-4 shadow-sm space-y-2.5">
                                <p className="text-[10px] uppercase tracking-wider text-gray-500 font-semibold">By Type</p>
                                {result.bySlotType.map((s) => {
                                    const Icon = SLOT_TYPE_ICONS[s.type] ?? Timer;
                                    return (
                                        <div key={s.type} className="flex items-center gap-3">
                                            <Icon size={14} className="text-[#756E69] shrink-0" />
                                            <span className="text-xs text-[#121212] font-medium flex-1">
                                                {SLOT_TYPE_LABELS[s.type] ?? s.type}
                                            </span>
                                            <span className="text-xs text-gray-500 font-light">{s.count}×</span>
                                            <span className="text-xs text-[#121212] font-medium w-16 text-right">
                                                {formatDuration(s.totalActualSeconds)}
                                            </span>
                                        </div>
                                    );
                                })}
                            </div>
                        )}

                        {/* ── Entries ───────────────────────────────────────── */}
                        <div>
                            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-4">
                                Past Services
                            </h3>

                            {isLoading ? (
                                <HistorySkeleton />
                            ) : result.entries.length === 0 ? (
                                <div className="flex flex-col items-center gap-3 py-12 text-gray-500">
                                    <CalendarX size={28} />
                                    <p className="text-sm font-light">No completed services yet.</p>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {result.entries.map((entry, i) => {
                                        const Icon = SLOT_TYPE_ICONS[entry.type] ?? Timer;
                                        return (
                                            <div key={i} className="bg-white border border-[#121212]/5 p-4 shadow-sm">
                                                <div className="flex items-start justify-between gap-3">
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-center gap-1.5 mb-1.5">
                                                            <Icon size={12} className="text-[#756E69]" />
                                                            <span className="text-[10px] uppercase tracking-wider font-semibold text-gray-500">
                                                                {SLOT_TYPE_LABELS[entry.type] ?? entry.type}
                                                            </span>
                                                        </div>
                                                        <p className="text-xs font-medium text-[#121212] truncate">
                                                            {entry.eventName ? `${entry.eventName} — ${entry.serviceSlotName}` : entry.serviceSlotName}
                                                        </p>
                                                        {entry.topic && (
                                                            <p className="text-xs text-gray-500 font-light truncate mt-0.5">{entry.topic}</p>
                                                        )}
                                                        <p className="text-[10px] text-gray-500 font-light mt-1">{formatDate(entry.sessionDate)}</p>
                                                    </div>
                                                    <span className="text-xs font-semibold text-[#121212] shrink-0">
                                                        {formatDuration(entry.actualSeconds)}
                                                    </span>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}

                            {result.totalPages > 1 && (
                                <div className="flex items-center justify-between mt-4">
                                    <button
                                        onClick={() => goToPage(page - 1)}
                                        disabled={page <= 1}
                                        className="flex items-center gap-1 text-xs font-semibold text-[#756E69] hover:text-[#121212] disabled:opacity-40 disabled:hover:text-[#756E69] transition-colors"
                                    >
                                        <ChevronLeft size={14} /> Prev
                                    </button>
                                    <span className="text-[10px] text-gray-500 font-light">
                                        Page {page} of {result.totalPages}
                                    </span>
                                    <button
                                        onClick={() => goToPage(page + 1)}
                                        disabled={page >= result.totalPages}
                                        className="flex items-center gap-1 text-xs font-semibold text-[#756E69] hover:text-[#121212] disabled:opacity-40 disabled:hover:text-[#756E69] transition-colors"
                                    >
                                        Next <ChevronRight size={14} />
                                    </button>
                                </div>
                            )}
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};
