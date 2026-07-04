"use client";

import React from "react";
import { Plus, Clock, MapPin, Loader2, CalendarX, RefreshCw } from "lucide-react";
import { useEvents, Event } from "@/hooks/use-events";
import { parseSlotMs, formatLocalSlotTime } from "@/utils/parse-local-time";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatEventDate(isoDate: string): { dayNum: string; monthStr: string } {
    const d = new Date(isoDate + "T00:00:00");
    return {
        dayNum: d.getDate().toString(),
        monthStr: d.toLocaleString("en-GB", { month: "short" }),
    };
}

/**
 * highlight  — at least one slot's check-in window is open right now
 * muted      — endDate is fully in the past
 * standard   — upcoming, no active window
 *
 * Uses real UTC ms — matches resolveSlot in use-events.
 */
function deriveVariant(
    event: Event,
    now: Date
): "highlight" | "standard" | "muted" {
    // Events with online check-in disabled are never highlighted
    if (!event.onlineAttendanceEnabled) {
        const endDate = new Date(event.endDate + "T23:59:59");
        return now > endDate ? "muted" : "standard";
    }

    for (const slot of event.serviceSlots) {
        // Real UTC ms — matches server window calculation exactly
        const startMs = parseSlotMs(slot.startTime);
        const endMs = parseSlotMs(slot.endTime);

        const memberOffsetMs =
            (slot.memberCheckinStartOverride !== null
                ? Number(slot.memberCheckinStartOverride)
                : slot.config.memberCheckinStartOffsetSeconds) * 1000;

        const stopOffsetMs =
            (slot.checkinStopOverride !== null
                ? Number(slot.checkinStopOverride)
                : slot.config.checkinStopOffsetSeconds) * 1000;

        if (
            now.getTime() >= startMs + memberOffsetMs &&
            now.getTime() <= endMs + stopOffsetMs
        ) {
            return "highlight";
        }
    }

    const endDate = new Date(event.endDate + "T23:59:59");
    if (now > endDate) return "muted";

    return "standard";
}

// ─── Slot row ─────────────────────────────────────────────────────────────────

interface SlotRowProps {
    slot: Event["serviceSlots"][number];
    isHighlight: boolean;
    isActive: boolean;
}

function SlotRow({ slot, isHighlight, isActive }: SlotRowProps) {
    // formatLocalSlotTime — toLocaleTimeString handles UTC→local automatically
    const timeStr = formatLocalSlotTime(slot.startTime, slot.endTime);
    const venue = slot.venueOverride ?? slot.config.defaultVenue;

    return (
        <div
            className={`flex items-center justify-between pt-2 mt-2 border-t ${isHighlight ? "border-[#8A817C]/15" : "border-[#121212]/5"
                }`}
        >
            <div className="flex flex-col gap-0.5">
                <span
                    className={`text-xs font-semibold tracking-wide ${isActive ? "text-[#121212]" : "text-[#8A817C]"
                        }`}
                >
                    {slot.name}
                    {isActive && (
                        <span className="ml-2 inline-flex items-center gap-1 text-[9px] uppercase tracking-widest font-bold text-red-500">
                            <span className="w-1 h-1 rounded-full bg-red-500 animate-pulse inline-block" />
                            Live
                        </span>
                    )}
                </span>
                <span className="text-[10px] text-gray-400 font-light">
                    {venue.name}
                </span>
            </div>

            <div className="flex flex-col items-end text-right">
                <span className="text-xs font-medium text-[#121212]/70 flex items-center gap-1">
                    <Clock size={11} className="text-[#8A817C]" />
                    {timeStr.split(" – ")[0]}
                </span>
                <span className="text-[10px] uppercase tracking-wider text-gray-400 font-bold mt-0.5">
                    – {timeStr.split(" – ")[1]}
                </span>
            </div>
        </div>
    );
}

// ─── Event card ───────────────────────────────────────────────────────────────

interface EventCardProps {
    event: Event;
    variant: "highlight" | "standard" | "muted";
    activeSlotId: string | null;
}

function EventCard({ event, variant, activeSlotId }: EventCardProps) {
    const isHighlight = variant === "highlight";
    const isMuted = variant === "muted";
    const { dayNum, monthStr } = formatEventDate(event.eventDate);
    const firstSlot = event.serviceSlots[0];

    return (
        <div
            className={`transition-all duration-300 flex items-start p-4 border ${isHighlight
                    ? "bg-[#EADCC9] border-[#8A817C]/20 shadow-sm"
                    : "bg-white border-[#121212]/5 shadow-sm hover:border-[#121212]/10"
                } ${isMuted ? "opacity-60" : ""}`}
        >
            {/* Date block */}
            <div
                className={`px-4 py-3 flex flex-col items-center justify-center min-w-[64px] h-[100px] border flex-shrink-0 ${isHighlight
                        ? "bg-white border-transparent text-[#121212]"
                        : "bg-[#F4F1EA] border-transparent text-[#121212]"
                    }`}
            >
                <span className="text-xl font-bold leading-none">{dayNum}</span>
                <span className="text-[10px] uppercase tracking-wider font-bold opacity-70 mt-1">
                    {monthStr}
                </span>
            </div>

            {/* Content */}
            <div className="ml-5 flex-grow min-w-0">
                <h4 className="text-lg font-normal tracking-tight text-[#121212] leading-snug">
                    {event.name}
                </h4>
                {event.description && (
                    <span className="text-xs font-light text-[#8A817C] block mt-0.5">
                        {event.description}
                    </span>
                )}

                {/* Mobile: show first slot time inline */}
                {firstSlot && (
                    <span className="text-xs text-gray-500 font-light block mt-1 lg:hidden">
                        {formatLocalSlotTime(firstSlot.startTime, firstSlot.endTime)}
                    </span>
                )}

                {/* All slot rows */}
                {event.serviceSlots.length > 0 && (
                    <div className="mt-1">
                        {event.serviceSlots.map((slot) => (
                            <SlotRow
                                key={slot.id}
                                slot={slot}
                                isHighlight={isHighlight}
                                isActive={slot.id === activeSlotId}
                            />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export const EventsPage = () => {
    const { events, activeSlot, isLoading, error, refetch } = useEvents();
    const now = new Date();

    const featuredEvent = events[0] ?? null;
    const featuredFirstSlot = featuredEvent?.serviceSlots[0] ?? null;
    const featuredVenue =
        featuredFirstSlot?.venueOverride ??
        featuredFirstSlot?.config.defaultVenue ??
        null;

    return (
        <div className="min-h-screen text-[#121212] pb-32 font-sans selection:bg-[#121212] selection:text-[#F4F1EA]">

            {/* ── Fixed left image panel ─────────────────────────────────── */}
            <div className="fixed top-0 left-0 w-full lg:w-[41.666667%] h-[40vh] lg:h-screen z-0 overflow-hidden">
                <img
                    src="https://images.unsplash.com/photo-1438232992991-995b7058bbb3?q=80&w=2073&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
                    alt="Church gathering banner"
                    className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-black/50" />
            </div>

            {/* ── Grid layout ───────────────────────────────────────────── */}
            <div className="grid grid-cols-1 lg:grid-cols-12 min-h-screen relative z-10 pointer-events-none">
                <div className="h-[40vh] lg:h-screen lg:col-span-5" />

                <div className="lg:col-span-7 bg-[#FFF] pt-6 lg:pt-12 pointer-events-auto">

                    {/* ── Hero content ──────────────────────────────────── */}
                    <div className="p-6 lg:px-12 flex flex-col justify-between gap-4 lg:min-h-[55vh]">
                        <div className="flex justify-between items-start">
                            <div>
                                <span className="text-xs uppercase tracking-widest text-[#8A817C] font-semibold">
                                    RCCG DISCOVERY CENTER
                                </span>
                                <h1 className="text-xl font-light tracking-tight text-[#121212]">
                                    Church
                                </h1>
                            </div>
                        </div>

                        <div className=" lg:mt-0 max-w-xl">
                            <h2 className="text-4xl lg:text-5xl font-light tracking-tight leading-tight text-[#121212]">
                                Take a{" "}
                                <span className="text-[#8A817C] font-normal">step</span>{" "}
                                toward the light
                            </h2>

                            {/* <div className="mt-6 flex items-center gap-3">
                                <div className="flex -space-x-2">
                                    <img
                                        className="w-8 h-8 rounded-full border-2 border-[#F4F1EA] object-cover"
                                        src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=100&auto=format&fit=crop"
                                        alt="Member avatar"
                                    />
                                    <img
                                        className="w-8 h-8 rounded-full border-2 border-[#F4F1EA] object-cover"
                                        src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=100&auto=format&fit=crop"
                                        alt="Member avatar"
                                    />
                                </div>
                                <button className="w-8 h-8 rounded-full bg-[#8A817C]/20 text-[#121212] flex items-center justify-center hover:bg-[#8A817C]/30 transition-colors">
                                    <Plus size={14} />
                                </button>
                                <span className="text-xs text-gray-500 font-medium">
                                    Join 142 others attending
                                </span>
                            </div> */}
                        </div>

                        {/* Stats bar */}
                        {/* <div className="mt-8 pt-6 border-t border-[#121212]/5 grid grid-cols-2 gap-4">
                            <div className="flex items-center gap-2 text-gray-600">
                                <Clock size={14} className="text-[#8A817C]" />
                                <span className="text-xs font-medium">
                                    {featuredFirstSlot
                                        ? formatLocalSlotTime(
                                            featuredFirstSlot.startTime,
                                            featuredFirstSlot.endTime
                                        )
                                        : "—"}
                                </span>
                            </div>
                            <div className="flex items-center gap-2 text-gray-600">
                                <MapPin size={14} className="text-[#8A817C]" />
                                <span className="text-xs font-medium">
                                    {featuredVenue?.name ?? "—"}
                                </span>
                            </div>
                        </div> */}
                    </div>

                    {/* ── Events list ───────────────────────────────────── */}
                    <div className="px-6 lg:px-12 mt-12 max-w-3xl">
                        <h3 className="text-2xl font-light tracking-tight mb-6 text-[#121212]">
                            Upcoming Services
                        </h3>

                        {isLoading ? (
                            <div className="flex items-center gap-3 py-12 text-gray-400">
                                <Loader2 size={18} className="animate-spin" />
                                <span className="text-sm font-light">Loading events…</span>
                            </div>
                        ) : error ? (
                            <div className="flex flex-col items-start gap-3 py-12 text-gray-400">
                                <CalendarX size={28} />
                                <p className="text-sm font-light">Could not load events.</p>
                                <button
                                    onClick={refetch}
                                    className="flex items-center gap-1.5 text-xs font-semibold text-[#121212] hover:underline"
                                >
                                    <RefreshCw size={12} /> Retry
                                </button>
                            </div>
                        ) : events.length === 0 ? (
                            <div className="flex flex-col items-start gap-2 py-12 text-gray-400">
                                <CalendarX size={28} />
                                <p className="text-sm font-light">
                                    No upcoming services scheduled.
                                </p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {events.map((event) => (
                                    <EventCard
                                        key={event.id}
                                        event={event}
                                        variant={deriveVariant(event, now)}
                                        activeSlotId={activeSlot?.id ?? null}
                                    />
                                ))}
                            </div>
                        )}
                    </div>

                </div>
            </div>
        </div>
    );
};