import { renderHook, waitFor, act } from "@testing-library/react";
import "@testing-library/jest-dom";
import { useEvents, Venue, SlotConfig, ServiceSlot, Event } from "../use-events";
import { api } from "@/utils/auth/axios-client";

jest.mock("@/utils/auth/axios-client", () => ({
    api: { get: jest.fn(), post: jest.fn() },
}));

const mockGet = api.get as jest.MockedFunction<typeof api.get>;
const mockPost = api.post as jest.MockedFunction<typeof api.post>;

const NOW = new Date("2026-06-10T10:00:00.000Z");
const minutes = (n: number) => n * 60 * 1000;
const isoAt = (offsetMs: number) => new Date(NOW.getTime() + offsetMs).toISOString();

const venue: Venue = { id: "v1", name: "Main Auditorium", address: "1 Church Rd", latitude: 0, longitude: 0 };

const config: SlotConfig = {
    id: "cfg1",
    name: "Sunday Service",
    description: null,
    workerCheckinStartOffsetSeconds: 0,
    workerLateOffsetSeconds: 0,
    memberCheckinStartOffsetSeconds: 0,
    checkinStopOffsetSeconds: 0,
    allowedDistanceInMeters: 100,
    defaultVenue: venue,
};

function slot(overrides: Partial<ServiceSlot> & { startOffsetMs: number; endOffsetMs: number }): ServiceSlot {
    const { startOffsetMs, endOffsetMs, ...rest } = overrides;
    return {
        id: "slot1",
        name: "First Service",
        startTime: isoAt(startOffsetMs),
        endTime: isoAt(endOffsetMs),
        workerCheckinStartOverride: null,
        workerLateOverride: null,
        memberCheckinStartOverride: null,
        checkinStopOverride: null,
        allowedDistanceOverride: null,
        config,
        venueOverride: null,
        ...rest,
    };
}

function event(overrides: Partial<Event> & { serviceSlots: ServiceSlot[] }): Event {
    return {
        id: "event1",
        name: "Sunday Gathering",
        description: "",
        eventDate: NOW.toISOString(),
        endDate: NOW.toISOString(),
        attendanceMarked: false,
        onlineAttendanceEnabled: true,
        checkedIn: false,
        myCheckin: null,
        ...overrides,
    };
}

function mockEventsList(events: Event[]) {
    mockGet.mockResolvedValueOnce({
        data: { data: { data: events, page: 1, limit: 10, totalCount: events.length, totalPages: 1 } },
    });
}

beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    jest.setSystemTime(NOW);
    // The hook logs verbose check-in diagnostics on every call — silence them
    // so test output stays readable; behavior is asserted via state, not logs.
    jest.spyOn(console, "log").mockImplementation(() => {});
    jest.spyOn(console, "group").mockImplementation(() => {});
    jest.spyOn(console, "groupEnd").mockImplementation(() => {});
    jest.spyOn(console, "error").mockImplementation(() => {});
});

afterEach(() => {
    jest.useRealTimers();
    jest.restoreAllMocks();
});

describe("useEvents — fetching", () => {
    it("fetches events on mount", async () => {
        mockEventsList([]);
        const { result } = renderHook(() => useEvents());
        await waitFor(() => expect(result.current.isLoading).toBe(false));

        expect(mockGet).toHaveBeenCalledWith(expect.stringContaining("/events?"));
        expect(result.current.events).toEqual([]);
    });

    it("sets an error message when the fetch fails", async () => {
        mockGet.mockRejectedValueOnce(new Error("Network down"));
        const { result } = renderHook(() => useEvents());
        await waitFor(() => expect(result.current.isLoading).toBe(false));

        expect(result.current.error).toBe("Network down");
    });
});

describe("useEvents — hero/active slot derivation", () => {
    it("selects a slot whose check-in window currently covers 'now' as activeSlot", async () => {
        const openSlot = slot({ startOffsetMs: -minutes(10), endOffsetMs: minutes(50) });
        const ev = event({ serviceSlots: [openSlot] });
        mockEventsList([ev]);

        const { result } = renderHook(() => useEvents());
        await waitFor(() => expect(result.current.isLoading).toBe(false));

        expect(result.current.heroEvent?.id).toBe("event1");
        expect(result.current.activeSlot?.id).toBe("slot1");
        expect(result.current.upcomingSlot).toBeNull();
        expect(result.current.displaySlotStatus).toBe("ongoing");
    });

    it("ignores events with onlineAttendanceEnabled=false for check-in eligibility, but still shows one as a passive hero", async () => {
        const openSlot = slot({ startOffsetMs: -minutes(10), endOffsetMs: minutes(50) });
        const ev = event({ serviceSlots: [openSlot], onlineAttendanceEnabled: false });
        mockEventsList([ev]);

        const { result } = renderHook(() => useEvents());
        await waitFor(() => expect(result.current.isLoading).toBe(false));

        expect(result.current.activeSlot).toBeNull();
        expect(result.current.heroEvent?.id).toBe("event1");
    });

    it("prefers a slot that started within the last 3 hours over an older still-open slot", async () => {
        const fresh = slot({ id: "fresh", startOffsetMs: -minutes(60), endOffsetMs: minutes(60) });
        const stale = slot({ id: "stale", startOffsetMs: -minutes(240), endOffsetMs: minutes(240) });
        const ev = event({ serviceSlots: [stale, fresh] });
        mockEventsList([ev]);

        const { result } = renderHook(() => useEvents());
        await waitFor(() => expect(result.current.isLoading).toBe(false));

        expect(result.current.activeSlot?.id).toBe("fresh");
    });

    it("among multiple fresh candidates, picks the one that started most recently", async () => {
        const older = slot({ id: "older", startOffsetMs: -minutes(120), endOffsetMs: minutes(60) });
        const newer = slot({ id: "newer", startOffsetMs: -minutes(30), endOffsetMs: minutes(60) });
        const ev = event({ serviceSlots: [older, newer] });
        mockEventsList([ev]);

        const { result } = renderHook(() => useEvents());
        await waitFor(() => expect(result.current.isLoading).toBe(false));

        expect(result.current.activeSlot?.id).toBe("newer");
    });

    it("falls back to the soonest upcoming slot when nothing is open right now", async () => {
        const upcoming = slot({ startOffsetMs: minutes(60), endOffsetMs: minutes(120) });
        const ev = event({ serviceSlots: [upcoming] });
        mockEventsList([ev]);

        const { result } = renderHook(() => useEvents());
        await waitFor(() => expect(result.current.isLoading).toBe(false));

        expect(result.current.activeSlot).toBeNull();
        expect(result.current.upcomingSlot?.id).toBe("slot1");
        expect(result.current.displaySlotStatus).toBe("upcoming");
    });

    it("reports 'ended' when the only slot available is fully in the past with no future slots", async () => {
        const past = slot({ startOffsetMs: -minutes(180), endOffsetMs: -minutes(120) });
        const ev = event({ serviceSlots: [past] });
        mockEventsList([ev]);

        const { result } = renderHook(() => useEvents());
        await waitFor(() => expect(result.current.isLoading).toBe(false));

        expect(result.current.activeSlot).toBeNull();
        expect(result.current.upcomingSlot).toBeNull();
        expect(result.current.displaySlotStatus).toBe("ended");
    });
});

describe("useEvents — checkIn", () => {
    function setGeolocation(impl: (success: PositionCallback, error?: PositionErrorCallback) => void) {
        Object.defineProperty(window.navigator, "geolocation", {
            value: { getCurrentPosition: jest.fn(impl) },
            configurable: true,
        });
    }

    it("does nothing when there is no active slot", async () => {
        mockEventsList([]);
        const { result } = renderHook(() => useEvents());
        await waitFor(() => expect(result.current.isLoading).toBe(false));

        await act(async () => { await result.current.checkIn(); });

        expect(mockPost).not.toHaveBeenCalled();
        expect(result.current.checkInState.status).toBe("idle");
    });

    it("reports already_checked_in without calling geolocation when myCheckin matches the active slot", async () => {
        const openSlot = slot({ startOffsetMs: -minutes(10), endOffsetMs: minutes(50) });
        const ev = event({ serviceSlots: [openSlot], myCheckin: { slotId: "slot1", slotName: "First Service", status: "PRESENT", checkinTime: NOW.toISOString() } });
        mockEventsList([ev]);
        const geo = jest.fn();
        setGeolocation(geo);

        const { result } = renderHook(() => useEvents());
        await waitFor(() => expect(result.current.isLoading).toBe(false));

        await act(async () => { await result.current.checkIn(); });

        expect(result.current.checkInState.status).toBe("already_checked_in");
        expect(geo).not.toHaveBeenCalled();
    });

    it("succeeds when within range: posts the check-in and sets status to success", async () => {
        const openSlot = slot({ startOffsetMs: -minutes(10), endOffsetMs: minutes(50) });
        const ev = event({ serviceSlots: [openSlot] });
        mockEventsList([ev]);
        mockEventsList([ev]); // refetch triggered by successful check-in
        setGeolocation((success) => success({ coords: { latitude: 0, longitude: 0 } } as GeolocationPosition));
        mockPost.mockResolvedValueOnce({ data: {} });

        const { result } = renderHook(() => useEvents());
        await waitFor(() => expect(result.current.isLoading).toBe(false));

        await act(async () => { await result.current.checkIn(); });

        expect(mockPost).toHaveBeenCalledWith("/attendances/checkin", {
            serviceSlotId: "slot1",
            location: { latitude: 0, longitude: 0 },
        });
        expect(result.current.checkInState.status).toBe("success");
    });

    it("reports a distance error when outside the allowed radius", async () => {
        const openSlot = slot({ startOffsetMs: -minutes(10), endOffsetMs: minutes(50) });
        const ev = event({ serviceSlots: [openSlot] });
        mockEventsList([ev]);
        // ~111km away at the equator — far outside a 100m radius
        setGeolocation((success) => success({ coords: { latitude: 1, longitude: 0 } } as GeolocationPosition));

        const { result } = renderHook(() => useEvents());
        await waitFor(() => expect(result.current.isLoading).toBe(false));

        await act(async () => { await result.current.checkIn(); });

        expect(mockPost).not.toHaveBeenCalled();
        expect(result.current.checkInState.status).toBe("error");
        expect(result.current.checkInState.errorMessage).toContain("Main Auditorium");
    });

    it("reports a location error when geolocation fails", async () => {
        const openSlot = slot({ startOffsetMs: -minutes(10), endOffsetMs: minutes(50) });
        const ev = event({ serviceSlots: [openSlot] });
        mockEventsList([ev]);
        setGeolocation((_success, error) => error?.({ code: 1, message: "denied" } as GeolocationPositionError));

        const { result } = renderHook(() => useEvents());
        await waitFor(() => expect(result.current.isLoading).toBe(false));

        await act(async () => { await result.current.checkIn(); });

        expect(result.current.checkInState.status).toBe("error");
        expect(result.current.checkInState.errorMessage).toContain("location");
    });

    it("reports an API error when the check-in request fails", async () => {
        const openSlot = slot({ startOffsetMs: -minutes(10), endOffsetMs: minutes(50) });
        const ev = event({ serviceSlots: [openSlot] });
        mockEventsList([ev]);
        setGeolocation((success) => success({ coords: { latitude: 0, longitude: 0 } } as GeolocationPosition));
        mockPost.mockRejectedValueOnce(new Error("Already checked in"));

        const { result } = renderHook(() => useEvents());
        await waitFor(() => expect(result.current.isLoading).toBe(false));

        await act(async () => { await result.current.checkIn(); });

        expect(result.current.checkInState.status).toBe("error");
        expect(result.current.checkInState.errorMessage).toBe("Already checked in");
    });

    it("resetCheckIn() returns the status to idle", async () => {
        mockEventsList([]);
        const { result } = renderHook(() => useEvents());
        await waitFor(() => expect(result.current.isLoading).toBe(false));

        act(() => { result.current.resetCheckIn(); });

        expect(result.current.checkInState).toEqual({ status: "idle", errorMessage: null });
    });
});
