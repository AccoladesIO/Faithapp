"use client";

import React, { useEffect, useState } from "react";
import { ArrowLeft, RefreshCw, CheckCircle2, Radio, Clock3 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useMyLiveStatus, EffectiveSessionSlot } from "@/hooks/use-my-live-status";
import { SLOT_TYPE_LABELS, SLOT_TYPE_ICONS } from "@/utils/slot-type-icons";

function formatCountdown(totalSeconds: number): string {
    const s = Math.max(0, Math.round(totalSeconds));
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = s % 60;
    if (h > 0) return `${h}h ${m}m`;
    if (m > 0) return `${m}m ${sec}s`;
    return `${sec}s`;
}

function RunningOrderRow({ slot, isMine }: { slot: EffectiveSessionSlot; isMine: boolean }) {
    const Icon = SLOT_TYPE_ICONS[slot.type] ?? Radio;
    const speaker = slot.memberName ?? slot.guestName ?? "TBD";
    const isDone = slot.status === "COMPLETED" || slot.status === "SKIPPED";
    const isCurrent = slot.status === "IN_PROGRESS";

    return (
        <div
            className={`flex items-center gap-3 p-3 rounded-xl border transition-colors ${isMine
                ? "bg-[#121212] border-[#121212] text-white"
                : isCurrent
                    ? "bg-[#F4F1EA]/60 border-[#121212]/10"
                    : "bg-white border-[#121212]/5"
                }`}
        >
            <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${isMine ? "bg-white/10" : "bg-[#F4F1EA]"
                }`}>
                {isDone ? (
                    <CheckCircle2 size={15} className={isMine ? "text-white/70" : "text-green-600"} />
                ) : (
                    <Icon size={14} className={isMine ? "text-[#EADCC9]" : "text-[#756E69]"} />
                )}
            </div>
            <div className="flex-1 min-w-0">
                <p className={`text-[10px] uppercase tracking-wider font-semibold truncate ${isMine ? "text-white/50" : "text-gray-500"
                    }`}>
                    {SLOT_TYPE_LABELS[slot.type] ?? slot.type}
                </p>
                <p className={`text-xs font-medium truncate ${isMine ? "text-white" : "text-[#121212]"}`}>
                    {speaker}{isMine ? " (You)" : ""}
                </p>
            </div>
            {isCurrent && !isMine && (
                <span className="flex items-center gap-1 text-[9px] uppercase tracking-wider font-bold px-2 py-0.5 rounded-full bg-red-600 text-white shrink-0">
                    <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" /> Now
                </span>
            )}
        </div>
    );
}

export function MyLiveAssignmentPage({ sessionCode }: { sessionCode: string }) {
    const router = useRouter();
    const { status, isLoading, error, fetchedAt, refetch } = useMyLiveStatus(sessionCode);
    const [now, setNow] = useState(() => Date.now());

    useEffect(() => {
        const id = setInterval(() => setNow(Date.now()), 1000);
        return () => clearInterval(id);
    }, []);

    const liveEstimate = status?.estimatedSecondsUntilMyTurn != null
        ? Math.max(0, status.estimatedSecondsUntilMyTurn - (now - fetchedAt) / 1000)
        : null;

    return (
        <div className="min-h-screen bg-[#FFFFFF] text-[#121212] pb-32 font-sans selection:bg-[#121212] selection:text-[#FFFFFF]">
            <div className="px-6 pt-6 pb-4 flex items-center gap-3">
                <button
                    onClick={() => router.back()}
                    className="w-8 h-8 rounded-full bg-[#F4F1EA] flex items-center justify-center text-[#121212] hover:bg-[#121212]/10 transition-colors"
                >
                    <ArrowLeft size={16} />
                </button>
                <span className="text-xs uppercase tracking-widest text-gray-500 font-semibold">Live Session</span>
            </div>

            <div className="px-6 max-w-lg mx-auto space-y-6">
                {isLoading && !status ? (
                    <div className="space-y-3">
                        <div className="h-28 bg-gray-100 rounded-2xl animate-pulse" />
                        <div className="h-16 bg-gray-100 rounded-xl animate-pulse" />
                        <div className="h-16 bg-gray-100 rounded-xl animate-pulse" />
                    </div>
                ) : error ? (
                    <div className="flex flex-col items-start gap-3 py-8 text-gray-500">
                        <p className="text-sm font-light">{error}</p>
                        <button
                            onClick={refetch}
                            className="flex items-center gap-1.5 text-xs font-semibold text-[#121212] hover:underline"
                        >
                            <RefreshCw size={12} /> Retry
                        </button>
                    </div>
                ) : status && (
                    <>
                        {/* ── Status banner ──────────────────────────────────── */}
                        {status.hasPassed ? (
                            <div className="bg-green-50 border border-green-100 rounded-2xl p-5 text-center">
                                <div className="w-12 h-12 rounded-full bg-green-100 text-green-600 flex items-center justify-center mx-auto mb-3">
                                    <CheckCircle2 size={22} />
                                </div>
                                <p className="text-sm font-medium text-green-700">Your part is complete</p>
                                <p className="text-xs text-green-600/80 font-light mt-1">Thank you for serving today.</p>
                            </div>
                        ) : status.isMyTurnNow ? (
                            <div className="bg-[#121212] rounded-2xl p-5 text-center text-white">
                                <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center mx-auto mb-3">
                                    <Radio size={22} className="text-[#EADCC9]" />
                                </div>
                                <p className="text-lg font-light tracking-tight">You&apos;re up now!</p>
                                {status.myTopic && (
                                    <p className="text-xs text-white/60 font-light mt-1">{status.myTopic}</p>
                                )}
                            </div>
                        ) : (
                            <div className="bg-[#F4F1EA]/60 border border-[#121212]/10 rounded-2xl p-5 text-center">
                                <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center mx-auto mb-3 shadow-sm">
                                    <Clock3 size={20} className="text-[#756E69]" />
                                </div>
                                <p className="text-[10px] uppercase tracking-wider text-gray-500 font-semibold mb-1">
                                    Estimated time until you&apos;re up
                                </p>
                                <p className="text-2xl font-light tracking-tight text-[#121212]">
                                    {liveEstimate != null ? formatCountdown(liveEstimate) : "—"}
                                </p>
                                {status.myTopic && (
                                    <p className="text-xs text-gray-500 font-light mt-2">{status.myTopic}</p>
                                )}
                            </div>
                        )}

                        {/* ── Running order ──────────────────────────────────── */}
                        <div>
                            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-3">
                                Running Order
                            </h3>
                            <div className="space-y-2">
                                {status.runningOrder.map((slot) => (
                                    <RunningOrderRow
                                        key={slot.id}
                                        slot={slot}
                                        isMine={slot.position === status.myPosition}
                                    />
                                ))}
                            </div>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
