"use client";

import React from "react";
import {
    Flame, Volume2, ArrowRight, MapPin, X,
    CheckCircle2, Loader2, CalendarX, RefreshCw, Clock,
} from "lucide-react";
import { useEvents } from "@/hooks/use-events";
import { useAnnouncements } from "@/hooks/use-announcements";
import { useProfile } from "@/hooks/use-profile";
import { formatLocalSlotTime, formatLocalTime } from "@/utils/parse-local-time";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatEventDate(isoDate: string): { day: string; month: string } {
    const d = new Date(isoDate + "T00:00:00");
    return {
        day: d.getDate().toString(),
        month: d.toLocaleString("en-GB", { month: "short" }),
    };
}

function formatAnnouncementDate(isoDate: string): string {
    const diff = Date.now() - new Date(isoDate).getTime();
    const days = Math.floor(diff / 86_400_000);
    if (days === 0) return "Today";
    if (days === 1) return "Yesterday";
    return `${days} days ago`;
}

// ─── Skeletons ────────────────────────────────────────────────────────────────

function HeroSkeleton() {
    return (
        <div className="relative w-full h-[60vh] md:h-[65vh] bg-gray-100 animate-pulse">
            <div className="absolute bottom-0 inset-x-0 p-6 space-y-3">
                <div className="h-3 w-24 bg-gray-200 rounded" />
                <div className="h-8 w-2/3 bg-gray-200 rounded" />
                <div className="h-4 w-1/3 bg-gray-200 rounded" />
                <div className="mt-6 h-12 w-full bg-gray-200 rounded" />
            </div>
        </div>
    );
}

function FeedSkeleton() {
    return (
        <div className="space-y-4">
            {[1, 2].map((i) => (
                <div key={i} className="bg-[#F9F9F9] p-5 border border-[#121212]/5 space-y-3 animate-pulse">
                    <div className="h-3 w-20 bg-gray-200 rounded-full" />
                    <div className="h-5 w-3/4 bg-gray-200 rounded" />
                    <div className="h-3 w-full bg-gray-200 rounded" />
                    <div className="h-3 w-5/6 bg-gray-200 rounded" />
                </div>
            ))}
        </div>
    );
}

// ─── Check-in Modal ───────────────────────────────────────────────────────────

interface CheckInModalProps {
    slotName: string;
    eventName: string;
    venueName: string;
    allowedDistanceMeters: number;
    status: "idle" | "locating" | "success" | "error" | "already_checked_in";
    errorMessage: string | null;
    onConfirm: () => void;
    onReset: () => void;
    onClose: () => void;
}

function CheckInModal({
    slotName, eventName, venueName, allowedDistanceMeters,
    status, errorMessage, onConfirm, onReset, onClose,
}: CheckInModalProps) {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-[#121212]/40 backdrop-blur-sm" onClick={onClose} />
            <div className="relative bg-white w-full max-w-sm rounded-3xl p-6 shadow-xl border border-gray-100">
                <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600" aria-label="Close">
                    <X size={18} />
                </button>

                {status === "idle" && (
                    <div className="text-center pt-4">
                        <div className="w-12 h-12 rounded-full bg-[#121212]/5 flex items-center justify-center mx-auto mb-4 text-[#8A817C]">
                            <MapPin size={22} />
                        </div>
                        <h3 className="text-xl font-normal tracking-tight mb-1">{slotName}</h3>
                        <p className="text-xs text-gray-400 uppercase tracking-widest font-semibold mb-4">{eventName}</p>
                        <p className="text-sm text-gray-500 font-light mb-6">
                            We'll verify you're within{" "}
                            <span className="text-[#121212] font-normal">{allowedDistanceMeters}m</span>{" "}
                            of{" "}
                            <span className="text-[#121212] font-normal">{venueName}</span>{" "}
                            before logging your attendance.
                        </p>
                        <button
                            onClick={onConfirm}
                            className="w-full bg-[#121212] text-white text-xs uppercase tracking-widest font-semibold py-3.5 rounded-xl hover:bg-gray-800 transition-colors"
                        >
                            Verify Location & Check In
                        </button>
                    </div>
                )}

                {status === "locating" && (
                    <div className="text-center py-12">
                        <Loader2 size={28} className="animate-spin mx-auto mb-4 text-[#121212]" />
                        <p className="text-xs uppercase tracking-widest text-gray-400 font-semibold">Verifying your location…</p>
                    </div>
                )}

                {status === "success" && (
                    <div className="text-center pt-4">
                        <div className="w-12 h-12 rounded-full bg-green-50 text-green-600 flex items-center justify-center mx-auto mb-4">
                            <CheckCircle2 size={24} />
                        </div>
                        <h3 className="text-xl font-normal tracking-tight mb-2">Checked In</h3>
                        <p className="text-sm text-gray-500 font-light mb-6">
                            Your attendance for{" "}
                            <span className="text-[#121212] font-normal">{slotName}</span>{" "}
                            has been recorded. Blessed fellowship!
                        </p>
                        <button onClick={onClose} className="w-full bg-gray-100 text-[#121212] text-xs uppercase tracking-widest font-semibold py-3.5 rounded-xl hover:bg-gray-200 transition-colors">
                            Dismiss
                        </button>
                    </div>
                )}

                {status === "already_checked_in" && (
                    <div className="text-center pt-4">
                        <div className="w-12 h-12 rounded-full bg-blue-50 text-blue-500 flex items-center justify-center mx-auto mb-4">
                            <CheckCircle2 size={24} />
                        </div>
                        <h3 className="text-xl font-normal tracking-tight mb-2">Already Checked In</h3>
                        <p className="text-sm text-gray-500 font-light mb-6">
                            You've already been recorded for{" "}
                            <span className="text-[#121212] font-normal">{slotName}</span>.
                        </p>
                        <button onClick={onClose} className="w-full bg-gray-100 text-[#121212] text-xs uppercase tracking-widest font-semibold py-3.5 rounded-xl hover:bg-gray-200 transition-colors">
                            Dismiss
                        </button>
                    </div>
                )}

                {status === "error" && (
                    <div className="text-center pt-4">
                        <div className="w-12 h-12 rounded-full bg-red-50 text-red-500 flex items-center justify-center mx-auto mb-4">
                            <X size={22} />
                        </div>
                        <h3 className="text-xl font-normal tracking-tight mb-2">Check-in Failed</h3>
                        <p className="text-sm text-gray-500 font-light mb-6">{errorMessage}</p>
                        <div className="flex gap-3">
                            <button onClick={onReset} className="flex-1 bg-gray-100 text-[#121212] text-xs uppercase tracking-widest font-semibold py-3.5 rounded-xl hover:bg-gray-200 transition-colors">
                                Try Again
                            </button>
                            <button onClick={onClose} className="flex-1 bg-[#121212] text-white text-xs uppercase tracking-widest font-semibold py-3.5 rounded-xl hover:bg-gray-800 transition-colors">
                                Close
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export const HomePage = () => {
    const [isModalOpen, setIsModalOpen] = React.useState(false);

    const {
        heroEvent, activeSlot, upcomingSlot,
        isLoading: eventsLoading, error: eventsError,
        checkInState, checkIn, resetCheckIn, refetch: refetchEvents,
    } = useEvents();

    const { profile } = useProfile();
    const departmentId = profile?.workerProfile?.department?.id;

    const {
        announcements,
        isLoading: announcementsLoading,
        error: announcementsError,
    } = useAnnouncements(departmentId);

    const handleOpenModal = () => { resetCheckIn(); setIsModalOpen(true); };
    const handleCloseModal = () => { setIsModalOpen(false); resetCheckIn(); };

    const heroDate = heroEvent ? formatEventDate(heroEvent.eventDate) : null;
    const displaySlot = activeSlot ?? upcomingSlot ?? heroEvent?.serviceSlots[0] ?? null;
    const isCheckedIntoActiveSlot = !!activeSlot && heroEvent?.myCheckin?.slotId === activeSlot.id;

    return (
        <div className="min-h-screen bg-[#FFFFFF] text-[#121212] pb-32 font-sans selection:bg-[#121212] selection:text-[#FFFFFF]">

            {/* ── Hero ─────────────────────────────────────────────────────── */}
            {eventsLoading ? (
                <HeroSkeleton />
            ) : eventsError ? (
                <div className="w-full h-[40vh] flex flex-col items-center justify-center gap-4 text-gray-400">
                    <CalendarX size={32} />
                    <p className="text-sm font-light">Could not load events.</p>
                    <button onClick={refetchEvents} className="flex items-center gap-1.5 text-xs font-semibold text-[#121212] hover:underline">
                        <RefreshCw size={12} /> Retry
                    </button>
                </div>
            ) : heroEvent ? (
                <div className="relative w-full h-[60vh] md:h-[65vh] overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-br from-[#1a1a2e] via-[#16213e] to-[#0f3460]" />
                    <div className="absolute inset-0 bg-black/20" />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#FFFFFF] via-transparent to-black/10" />

                    {/* Top bar */}
                    <div className="absolute top-0 inset-x-0 p-6 flex justify-between items-center bg-gradient-to-b from-black/40 to-transparent z-10">
                        <div>
                            <span className="text-xs uppercase tracking-widest text-white/70 font-semibold">RCCG DISCOVERY CENTER</span>
                            <h1 className="text-lg font-light tracking-tight text-white">Church</h1>
                        </div>
                        {activeSlot && (
                            <div className="flex items-center gap-2 bg-red-600 px-3 py-1 rounded-full shadow-md">
                                <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                                <span className="text-[10px] uppercase font-bold tracking-widest text-white">Live Now</span>
                            </div>
                        )}
                    </div>

                    {/* Bottom content */}
                    <div className="absolute bottom-0 inset-x-0 p-6 flex flex-col justify-end z-10">
                        <span className="text-[11px] uppercase tracking-widest text-[#EADCC9] font-bold mb-2 flex items-center gap-1.5">
                            {activeSlot
                                ? <Flame size={12} className="text-red-400 fill-red-400" />
                                : <Volume2 size={12} className="text-white" />}
                            {activeSlot ? "Current Gathering" : upcomingSlot ? "Up Next" : "Recent Event"}
                        </span>

                        <h2 className="text-3xl md:text-4xl font-light tracking-tight max-w-md leading-tight mb-1 text-white">
                            {heroEvent.name}
                        </h2>

                        {heroEvent.description && (
                            <p className="text-sm text-white/70 font-light mb-4 max-w-sm line-clamp-2">
                                {heroEvent.description}
                            </p>
                        )}

                        {activeSlot && (
                            <div className="mb-6">
                                {isCheckedIntoActiveSlot ? (
                                    <div className="self-start inline-flex items-center gap-2 bg-green-500/20 border border-green-400/30 text-green-300 text-xs uppercase tracking-widest font-semibold px-4 py-2.5 rounded-full">
                                        <CheckCircle2 size={13} />
                                        Checked in — {activeSlot.name}
                                    </div>
                                ) : (
                                    <button
                                        onClick={handleOpenModal}
                                        className="self-start bg-white text-[#121212] text-xs uppercase tracking-widest font-semibold px-5 py-2.5 rounded-full shadow-md hover:bg-gray-100 transition-colors"
                                    >
                                        Check in to {activeSlot.name}
                                    </button>
                                )}
                            </div>
                        )}

                        {heroDate && displaySlot && (
                            <div className="flex items-center justify-between bg-black/20 backdrop-blur-md border border-white/10 p-4 shadow-sm">
                                <div className="flex items-center gap-4">
                                    <div className="bg-white text-[#121212] px-3 py-1.5 flex flex-col items-center justify-center min-w-[50px]">
                                        <span className="text-lg font-bold leading-none">{heroDate.day}</span>
                                        <span className="text-[9px] uppercase tracking-wider font-semibold opacity-80">{heroDate.month}</span>
                                    </div>
                                    <div>
                                        <p className="text-xs text-white/60 font-light">
                                            {activeSlot ? activeSlot.name : displaySlot.name}
                                        </p>
                                        <p className="text-sm font-semibold text-white">
                                            {formatLocalSlotTime(displaySlot.startTime, displaySlot.endTime)}
                                        </p>
                                    </div>
                                </div>
                                {!activeSlot && (
                                    <div className="flex items-center gap-1.5 text-white/50">
                                        <Clock size={13} />
                                        <span className="text-[10px] uppercase tracking-wider font-semibold">
                                            {upcomingSlot
                                                ? `Opens ${formatLocalTime(upcomingSlot.checkinWindowStart.toISOString())}`
                                                : "Ended"}
                                        </span>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            ) : (
                <div className="w-full h-[40vh] flex flex-col items-center justify-center gap-3 text-gray-400">
                    <CalendarX size={32} />
                    <p className="text-sm font-light">No upcoming events.</p>
                </div>
            )}

            {/* ── Announcements ─────────────────────────────────────────────── */}
            <div className="px-6 mt-10 space-y-6">
                <div className="flex items-center justify-between">
                    <h3 className="text-xs uppercase tracking-widest text-gray-500 font-semibold">Updates & Notices</h3>
                    <button className="text-xs text-[#121212] font-semibold flex items-center gap-1 hover:underline">
                        See All <ArrowRight size={12} />
                    </button>
                </div>

                {announcementsLoading ? (
                    <FeedSkeleton />
                ) : announcementsError ? (
                    <p className="text-sm text-gray-400 font-light">Could not load announcements.</p>
                ) : announcements.length === 0 ? (
                    <p className="text-sm text-gray-400 font-light">No announcements at the moment.</p>
                ) : (
                    <div className="space-y-4">
                        {announcements.map((item) => (
                            <div key={item.id} className="bg-[#F9F9F9] p-5 border border-[#121212]/5 shadow-sm transition-all duration-300 hover:border-[#121212]/10">
                                <div className="flex items-center justify-between mb-3">
                                    <span className="text-[9px] uppercase tracking-wider px-2 py-0.5 rounded-full font-bold bg-[#121212]/10 text-[#121212]">
                                        {item.audience === "ALL" ? "General Notice" : item.audience}
                                    </span>
                                    <span className="text-[11px] text-gray-400 font-medium">
                                        {formatAnnouncementDate(item.createdAt)}
                                    </span>
                                </div>
                                <h4 className="text-lg font-normal tracking-tight text-[#121212] mb-2 leading-snug">{item.title}</h4>
                                <p className="text-sm text-gray-600 font-light line-clamp-2 leading-relaxed mb-4">{item.body}</p>
                                <div className="flex items-center justify-between pt-1 border-t border-[#121212]/5">
                                    <span className="text-xs text-gray-400 font-light">Official Notice</span>
                                    <button className="text-xs font-semibold text-[#121212] hover:text-gray-600 transition-colors">View Details</button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* ── Check-in Modal ────────────────────────────────────────────── */}
            {isModalOpen && activeSlot && heroEvent && (
                <CheckInModal
                    slotName={activeSlot.name}
                    eventName={heroEvent.name}
                    venueName={activeSlot.effectiveVenue.name}
                    allowedDistanceMeters={activeSlot.effectiveAllowedDistanceMeters}
                    status={checkInState.status}
                    errorMessage={checkInState.errorMessage}
                    onConfirm={checkIn}
                    onReset={resetCheckIn}
                    onClose={handleCloseModal}
                />
            )}
        </div>
    );
};