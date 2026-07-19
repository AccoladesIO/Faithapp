"use client";

import React from "react";
import Image from "next/image";
import { Clock, CalendarX, RefreshCw, CheckCircle2, Calendar, Radio, CalendarCheck } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEvents, Event } from "@/hooks/use-events";
import { parseSlotMs, formatLocalSlotTime } from "@/utils/parse-local-time";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatEventDate(isoDate: string): { dayNum: string; monthStr: string; weekday: string } {
    const d = new Date(isoDate + "T00:00:00");
    return {
        dayNum: d.getDate().toString(),
        monthStr: d.toLocaleString("en-GB", { month: "short" }),
        weekday: d.toLocaleString("en-GB", { weekday: "short" }).toUpperCase(),
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
                    className={`text-xs font-semibold tracking-wide ${isActive ? "text-[#121212]" : "text-[#756E69]"
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
                <span className="text-[10px] text-gray-500 font-light">
                    {venue.name}
                </span>
            </div>

            <div className="flex flex-col items-end text-right">
                <span className="text-xs font-medium text-[#121212]/70 flex items-center gap-1">
                    <Clock size={11} className="text-[#756E69]" />
                    {timeStr.split(" – ")[0]}
                </span>
                <span className="text-[10px] uppercase tracking-wider text-gray-500 font-bold mt-0.5">
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

function EventCard({ event, variant, activeSlotId }: Readonly<EventCardProps>) {
    const router = useRouter();
    const isHighlight = variant === "highlight";
    const isMuted = variant === "muted";
    const { dayNum, monthStr, weekday } = formatEventDate(event.eventDate);
    const firstSlot = event.serviceSlots[0];

    return (
        <button
            onClick={() => router.push(`/events/${event.id}`)}
            className={`w-full text-left transition-all duration-300 flex items-start p-4 border ${isHighlight
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
                <span className="text-[9px] uppercase tracking-wider font-semibold opacity-50">
                    {weekday}
                </span>
                <span className="text-xl font-bold leading-none mt-0.5">{dayNum}</span>
                <span className="text-[10px] uppercase tracking-wider font-bold opacity-70 mt-1">
                    {monthStr}
                </span>
            </div>

            {/* Content */}
            <div className="ml-5 flex-grow min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                    <h4 className="text-lg font-normal tracking-tight text-[#121212] leading-snug">
                        {event.name}
                    </h4>
                    {isHighlight && (
                        <span className="flex items-center gap-1 text-[9px] uppercase tracking-wider font-bold px-2 py-0.5 rounded-full bg-red-50 text-red-600 shrink-0">
                            <span className="w-1 h-1 rounded-full bg-red-500 animate-pulse inline-block" />
                            Happening Now
                        </span>
                    )}
                    {isMuted && (
                        <span className="text-[9px] uppercase tracking-wider font-bold px-2 py-0.5 rounded-full bg-gray-100 text-gray-500 shrink-0">
                            Ended
                        </span>
                    )}
                    {event.myCheckin && (
                        <span className="flex items-center gap-1 text-[9px] uppercase tracking-wider font-bold px-2 py-0.5 rounded-full bg-green-50 text-green-700 shrink-0">
                            <CheckCircle2 size={9} /> Checked In
                        </span>
                    )}
                </div>
                {event.description && (
                    <span className="text-xs font-light text-[#756E69] block mt-0.5">
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
        </button>
    );
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function EventCardSkeleton() {
    return (
        <div className="w-full flex items-start p-4 border border-[#121212]/5 shadow-sm animate-pulse">
            <div className="bg-[#F4F1EA] min-w-[64px] h-[100px] flex-shrink-0" />
            <div className="ml-5 flex-grow space-y-2 pt-1">
                <div className="h-2.5 w-16 bg-gray-100 rounded" />
                <div className="h-4 w-2/3 bg-gray-100 rounded" />
                <div className="h-3 w-1/3 bg-gray-100 rounded mt-3" />
            </div>
        </div>
    );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export const EventsPage = () => {
    const { events, activeSlot, isLoading, error, refetch } = useEvents();
    const now = new Date();

    const upcomingEvents = events.filter((event) => deriveVariant(event, now) !== "muted");
    const pastEvents = events.filter((event) => deriveVariant(event, now) === "muted");

    // Soonest upcoming event by date
    const nextUpcomingEvent = upcomingEvents.length > 0
        ? [...upcomingEvents].sort((a, b) => a.eventDate.localeCompare(b.eventDate))[0]
        : null;
    const nextUpcomingDate = nextUpcomingEvent ? formatEventDate(nextUpcomingEvent.eventDate) : null;

    return (
        <div className="min-h-screen bg-[#FFFFFF] text-[#121212] pb-32 font-sans selection:bg-[#121212] selection:text-[#F4F1EA]">

            {/* ── Hero banner ────────────────────────────────────────────── */}
            <div className="relative w-full h-[40vh] overflow-hidden">
                <Image
                    src="/images/events-hero.jpg"
                    alt="Church gathering banner"
                    fill
                    priority
                    sizes="100vw"
                    className="object-cover"
                />
                <div className="absolute inset-0 bg-black/40" />
                <div className="absolute bottom-0 inset-x-0 p-6">
                    <span className="text-xs uppercase tracking-widest text-white/80 font-semibold flex items-center gap-1 drop-shadow-sm">
                        <Calendar size={12} /> Services
                    </span>
                    <h1 className="text-2xl font-light tracking-tight text-white mt-1 drop-shadow-md">
                        Events
                    </h1>
                </div>
            </div>

            {/* ── Stats block ────────────────────────────────────────────── */}
            <div className="px-6 pb-6 border-b border-[#121212]/5 bg-[#F9F9F9] mt-3">
                <div className="grid grid-cols-3 gap-2.5">
                    <div className={`${activeSlot ? "bg-red-50/60 border-red-100" : "bg-gray-50 border-gray-200"} p-3 border shadow-sm flex flex-col items-center text-center gap-1.5 transition-colors duration-500`}>
                        <div className="w-8 h-8 rounded-full bg-white shadow-sm flex items-center justify-center flex-shrink-0">
                            <Radio size={14} className={activeSlot ? "text-red-500" : "text-gray-500"} />
                        </div>
                        <p className="text-xl font-semibold tracking-tight leading-none text-[#121212]">
                            {isLoading ? "—" : activeSlot ? "LIVE" : "—"}
                        </p>
                        <p className="text-[9px] uppercase tracking-wider text-gray-500 font-semibold leading-tight">
                            Now
                        </p>
                    </div>

                    <div className="bg-[#F4F1EA] p-3 border border-[#8A817C]/15 shadow-sm flex flex-col items-center text-center gap-1.5">
                        <div className="w-8 h-8 rounded-full bg-white shadow-sm flex items-center justify-center flex-shrink-0">
                            <Calendar size={14} className="text-[#756E69]" />
                        </div>
                        <p className="text-xl font-semibold tracking-tight leading-none text-[#121212]">
                            {isLoading ? "—" : nextUpcomingDate ? nextUpcomingDate.dayNum : "—"}
                            {!isLoading && nextUpcomingDate && (
                                <span className="text-[10px] text-gray-500 font-normal ml-0.5">{nextUpcomingDate.monthStr}</span>
                            )}
                        </p>
                        <p className="text-[9px] uppercase tracking-wider text-gray-500 font-semibold leading-tight">
                            Next Up
                        </p>
                    </div>

                    <div className="bg-blue-50/60 p-3 border border-blue-100 shadow-sm flex flex-col items-center text-center gap-1.5">
                        <div className="w-8 h-8 rounded-full bg-white shadow-sm flex items-center justify-center flex-shrink-0">
                            <CalendarCheck size={14} className="text-blue-600" />
                        </div>
                        <p className="text-xl font-semibold tracking-tight leading-none text-[#121212]">
                            {isLoading ? "—" : upcomingEvents.length}
                        </p>
                        <p className="text-[9px] uppercase tracking-wider text-gray-500 font-semibold leading-tight">
                            Upcoming
                        </p>
                    </div>
                </div>
            </div>

            {/* ── Events list ───────────────────────────────────── */}
            <div className="px-6 mt-8">
                {isLoading ? (
                    <div className="space-y-3">
                        {[1, 2, 3].map((i) => <EventCardSkeleton key={i} />)}
                    </div>
                ) : error ? (
                    <div className="flex flex-col items-start gap-3 py-12 text-gray-500">
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
                    <div className="flex flex-col items-start gap-2 py-12 text-gray-500">
                        <CalendarX size={28} />
                        <p className="text-sm font-light">
                            No upcoming services scheduled.
                        </p>
                    </div>
                ) : (
                    <>
                        <section>
                            <h3 className="text-2xl font-light tracking-tight mb-6 text-[#121212]">
                                Upcoming Services
                            </h3>

                            {upcomingEvents.length === 0 ? (
                                <div className="flex flex-col items-start gap-2 py-8 text-gray-500">
                                    <CalendarX size={28} />
                                    <p className="text-sm font-light">
                                        No upcoming services scheduled — check back soon.
                                    </p>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {upcomingEvents.map((event) => (
                                        <EventCard
                                            key={event.id}
                                            event={event}
                                            variant={deriveVariant(event, now)}
                                            activeSlotId={activeSlot?.id ?? null}
                                        />
                                    ))}
                                </div>
                            )}
                        </section>

                        {pastEvents.length > 0 && (
                            <section className="mt-10">
                                <h3 className="text-2xl font-light tracking-tight mb-6 text-[#756E69]">
                                    Recent Services
                                </h3>
                                <div className="space-y-3">
                                    {pastEvents.map((event) => (
                                        <EventCard
                                            key={event.id}
                                            event={event}
                                            variant={deriveVariant(event, now)}
                                            activeSlotId={activeSlot?.id ?? null}
                                        />
                                    ))}
                                </div>
                            </section>
                        )}
                    </>
                )}
            </div>
        </div>
    );
};