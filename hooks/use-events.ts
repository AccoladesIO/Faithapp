"use client";

import { useState, useEffect, useCallback } from "react";
import { api } from "@/utils/auth/axios-client";
import { parseSlotMs } from "@/utils/parse-local-time";

// ─── API shapes ───────────────────────────────────────────────────────────────

export interface Venue {
    id: string;
    name: string;
    address: string;
    latitude: number;
    longitude: number;
}

export interface SlotConfig {
    id: string;
    name: string;
    description: string | null;
    workerCheckinStartOffsetSeconds: number;
    workerLateOffsetSeconds: number;
    memberCheckinStartOffsetSeconds: number;
    checkinStopOffsetSeconds: number;
    allowedDistanceInMeters: number;
    defaultVenue: Venue;
}

export interface ServiceSlot {
    id: string;
    name: string;
    startTime: string; // UTC ISO string — use parseSlotMs for math, formatLocalTime for display
    endTime: string;   // UTC ISO string — use parseSlotMs for math, formatLocalTime for display
    workerCheckinStartOverride: string | null;
    workerLateOverride: string | null;
    memberCheckinStartOverride: string | null;
    checkinStopOverride: string | null;
    allowedDistanceOverride: number | null;
    config: SlotConfig;
    venueOverride: Venue | null;
}

export interface MyCheckin {
    slotId: string;
    slotName: string;
    status: string;
    checkinTime: string;
}

export interface Event {
    id: string;
    name: string;
    description: string;
    eventDate: string;
    endDate: string;
    attendanceMarked: boolean;
    onlineAttendanceEnabled: boolean;
    serviceSlots: ServiceSlot[];
    checkedIn: boolean;
    myCheckin: MyCheckin | null;
}

export interface EventsPage {
    data: Event[];
    page: number;
    limit: number;
    totalCount: number;
    totalPages: number;
}

// ─── Derived types ────────────────────────────────────────────────────────────

export interface ResolvedSlot extends ServiceSlot {
    effectiveVenue: Venue;
    effectiveAllowedDistanceMeters: number;
    checkinWindowOpen: boolean;
    checkinWindowStart: Date;
    checkinWindowEnd: Date;
}

export type CheckInStatus =
    | "idle"
    | "locating"
    | "success"
    | "error"
    | "already_checked_in";

export interface CheckInState {
    status: CheckInStatus;
    errorMessage: string | null;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function resolveSlot(slot: ServiceSlot, now: Date): ResolvedSlot {
    const effectiveVenue = slot.venueOverride ?? slot.config.defaultVenue;
    const effectiveAllowedDistanceMeters =
        slot.allowedDistanceOverride ?? slot.config.allowedDistanceInMeters;

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

    const checkinWindowStart = new Date(startMs + memberOffsetMs);
    const checkinWindowEnd = new Date(endMs + stopOffsetMs);
    const checkinWindowOpen = now >= checkinWindowStart && now <= checkinWindowEnd;

    return {
        ...slot,
        effectiveVenue,
        effectiveAllowedDistanceMeters,
        checkinWindowOpen,
        checkinWindowStart,
        checkinWindowEnd,
    };
}

function haversineMeters(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
): number {
    const R = 6_371_000;
    const toRad = (d: number) => (d * Math.PI) / 180;
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a =
        Math.sin(dLat / 2) ** 2 +
        Math.cos(toRad(lat1)) *
        Math.cos(toRad(lat2)) *
        Math.sin(dLon / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function getCurrentPosition(): Promise<GeolocationPosition> {
    return new Promise((resolve, reject) => {
        if (!navigator.geolocation) {
            reject(new Error("Geolocation is not supported by your browser."));
            return;
        }
        navigator.geolocation.getCurrentPosition(resolve, reject, {
            enableHighAccuracy: true,
            timeout: 10_000,
        });
    });
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export interface UseEventsReturn {
    events: Event[];
    heroEvent: Event | null;
    /** Slot whose check-in window is open right now — triggers check-in CTA */
    activeSlot: ResolvedSlot | null;
    /** Next slot that will open — shown when nothing is active yet */
    upcomingSlot: ResolvedSlot | null;
    isLoading: boolean;
    error: string | null;
    checkInState: CheckInState;
    checkIn: () => Promise<void>;
    resetCheckIn: () => void;
    refetch: () => void;
}

export function useEvents(): UseEventsReturn {
    const [events, setEvents] = useState<Event[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [checkInState, setCheckInState] = useState<CheckInState>({
        status: "idle",
        errorMessage: null,
    });
    const [fetchTick, setFetchTick] = useState(0);

    // ── Fetch ─────────────────────────────────────────────────────────────────
    useEffect(() => {
        let cancelled = false;

        async function load() {
            setIsLoading(true);
            setError(null);
            try {
                const res = await api.get<{ data: EventsPage }>(
                    "/events?page=1&limit=10&orderBy=eventDate&order=DESC"
                );
                if (!cancelled) setEvents(res.data.data.data);
            } catch (err: unknown) {
                if (!cancelled)
                    setError(
                        err instanceof Error
                            ? err.message
                            : "Failed to load events."
                    );
            } finally {
                if (!cancelled) setIsLoading(false);
            }
        }

        load();
        return () => { cancelled = true; };
    }, [fetchTick]);

    // ── Derive hero + active slot ─────────────────────────────────────────────
    //
    // Rules:
    // 1. Only consider events where onlineAttendanceEnabled === true
    // 2. Among those, collect all slots whose check-in window is open now
    // 3. Prefer slots that started within the last FRESH_WINDOW_MS (3 hrs).
    //    If none are fresh, fall back to any open slot.
    // 4. Among eligible candidates, pick the one whose startTime is closest
    //    to now (most recently started = most likely currently attended).
    // 5. Fall back to events[0] as a passive hero (no CTA) if nothing is live.
    const { heroEvent, activeSlot, upcomingSlot } = (() => {
        const now = new Date();
        const nowMs = now.getTime();
        const FRESH_WINDOW_MS = 3 * 60 * 60 * 1000; // 3 hours

        type Candidate = {
            event: Event;
            resolved: ResolvedSlot;
            startMs: number;
        };

        const candidates: Candidate[] = [];

        for (const event of events) {
            // Skip events where online check-in is disabled
            if (!event.onlineAttendanceEnabled) continue;

            for (const slot of event.serviceSlots) {
                const resolved = resolveSlot(slot, now);
                if (resolved.checkinWindowOpen) {
                    candidates.push({
                        event,
                        resolved,
                        startMs: parseSlotMs(slot.startTime),
                    });
                }
            }
        }

        if (candidates.length === 0) {
            // No active slot — find the next upcoming slot across all online events
            const nowMs2 = now.getTime();
            let soonest: { event: Event; resolved: ResolvedSlot } | null = null;
            let soonestOpenMs = Infinity;

            for (const event of events) {
                if (!event.onlineAttendanceEnabled) continue;
                for (const slot of event.serviceSlots) {
                    const resolved = resolveSlot(slot, now);
                    const opensAt = resolved.checkinWindowStart.getTime();
                    if (opensAt > nowMs2 && opensAt < soonestOpenMs) {
                        soonestOpenMs = opensAt;
                        soonest = { event, resolved };
                    }
                }
            }

            return {
                heroEvent: soonest?.event ?? events[0] ?? null,
                activeSlot: null as ResolvedSlot | null,
                upcomingSlot: soonest?.resolved ?? null,
            };
        }

        // Prefer slots that started within the last 3 hours (fresh)
        const fresh = candidates.filter((c) => nowMs - c.startMs <= FRESH_WINDOW_MS);
        const pool = fresh.length > 0 ? fresh : candidates;

        // Pick the slot whose startTime is nearest to now
        const best = pool.reduce((prev, curr) => {
            const prevDelta = nowMs - prev.startMs;
            const currDelta = nowMs - curr.startMs;
            return currDelta < prevDelta ? curr : prev;
        });

        return {
            heroEvent: best.event,
            activeSlot: best.resolved as ResolvedSlot | null,
            upcomingSlot: null,
        };
    })();

    // ── Check-in ──────────────────────────────────────────────────────────────
    const checkIn = useCallback(async () => {
        if (!heroEvent || !activeSlot) return;

        if (heroEvent.myCheckin?.slotId === activeSlot.id) {
            setCheckInState({ status: "already_checked_in", errorMessage: null });
            return;
        }

        setCheckInState({ status: "locating", errorMessage: null });

        // ── Diagnostic log ────────────────────────────────────────────────────
        const now = new Date();
        console.group("[CheckIn] Window diagnostics");
        console.log("Slot ID         :", activeSlot.id);
        console.log("Slot name       :", activeSlot.name);
        console.log("Raw startTime   :", activeSlot.startTime);
        console.log("Raw endTime     :", activeSlot.endTime);
        console.log("startTime (UTC) :", new Date(activeSlot.startTime).toISOString());
        console.log("endTime   (UTC) :", new Date(activeSlot.endTime).toISOString());
        console.log("startTime (local, Z-stripped) :", new Date(activeSlot.checkinWindowStart).toISOString());
        console.log("endTime   (local, Z-stripped) :", new Date(activeSlot.checkinWindowEnd).toISOString());
        console.log("Window open at  :", activeSlot.checkinWindowStart.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false }));
        console.log("Window close at :", activeSlot.checkinWindowEnd.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false }));
        console.log("Device time now :", now.toISOString());
        console.log("Device local now:", now.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false }));
        console.log("Timezone offset :", -now.getTimezoneOffset() / 60, "hours (e.g. +1 = WAT)");
        console.log("Window open?    :", activeSlot.checkinWindowOpen);
        console.log("memberCheckinStartOffsetSeconds:", activeSlot.config.memberCheckinStartOffsetSeconds);
        console.log("checkinStopOffsetSeconds       :", activeSlot.config.checkinStopOffsetSeconds);
        console.groupEnd();
        // ─────────────────────────────────────────────────────────────────────

        let position: GeolocationPosition;
        try {
            position = await getCurrentPosition();
        } catch {
            setCheckInState({
                status: "error",
                errorMessage:
                    "Unable to read your location. Check that location access is enabled in your device settings.",
            });
            return;
        }

        const { latitude, longitude } = position.coords;
        const { effectiveVenue, effectiveAllowedDistanceMeters } = activeSlot;

        const distance = haversineMeters(
            latitude,
            longitude,
            effectiveVenue.latitude,
            effectiveVenue.longitude
        );

        console.log("[CheckIn] Distance to venue:", Math.round(distance), "m (allowed:", effectiveAllowedDistanceMeters, "m)");

        if (distance > effectiveAllowedDistanceMeters) {
            setCheckInState({
                status: "error",
                errorMessage: `You need to be within ${effectiveAllowedDistanceMeters}m of ${effectiveVenue.name} to check in. You appear to be about ${Math.round(distance)}m away.`,
            });
            return;
        }

        try {
            const payload = {
                serviceSlotId: activeSlot.id,
                location: { latitude, longitude },
            };
            console.log("[CheckIn] POST /attendances/checkin payload:", JSON.stringify(payload, null, 2));
            await api.post("/attendances/checkin", payload);
            setCheckInState({ status: "success", errorMessage: null });
            setFetchTick((t) => t + 1);
        } catch (err: unknown) {
            console.error("[CheckIn] API error:", err);
            setCheckInState({
                status: "error",
                errorMessage:
                    err instanceof Error
                        ? err.message
                        : "Check-in failed. Please try again.",
            });
        }
    }, [heroEvent, activeSlot]);

    const resetCheckIn = useCallback(() => {
        setCheckInState({ status: "idle", errorMessage: null });
    }, []);

    const refetch = useCallback(() => {
        setFetchTick((t) => t + 1);
    }, []);

    return {
        events,
        heroEvent,
        activeSlot,
        upcomingSlot,
        isLoading,
        error,
        checkInState,
        checkIn,
        resetCheckIn,
        refetch,
    };
}