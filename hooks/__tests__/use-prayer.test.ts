import { renderHook, waitFor, act } from "@testing-library/react";
import "@testing-library/jest-dom";
import { usePrayer } from "../use-prayer";
import { api } from "@/utils/auth/axios-client";

jest.mock("@/utils/auth/axios-client", () => ({
    api: { get: jest.fn(), post: jest.fn() },
}));

const mockGet = api.get as jest.MockedFunction<typeof api.get>;
const mockPost = api.post as jest.MockedFunction<typeof api.post>;

const program = { id: "p1", name: "Morning Prayer", description: "", audience: "ALL" as const, isActive: true, selectionWindowDays: 7, createdAt: "2026-01-01", updatedAt: "2026-01-01" };
const meeting = {
    id: "m1", program, date: "2026-06-15", month: 6, year: 2026,
    dayConfig: { id: "d1", dayOfWeek: 1, mode: "PHYSICAL" as const, startTime: "06:00", endTime: "07:00", maxCapacity: 20, isActive: true },
    status: "OPEN", selectionStatus: "OPEN" as const, currentCapacity: 5, rosterEntries: [], createdAt: "2026-01-01",
};

function mockMeetingsLoad() {
    mockGet
        .mockResolvedValueOnce({ data: { data: [meeting] } })
        .mockResolvedValueOnce({ data: { data: [] } })
        .mockResolvedValueOnce({ data: { data: { month: 6, year: 2026, windowOpen: true, hasSelected: false, availableMeetings: [meeting], mySelections: [] } } });
}

beforeEach(() => jest.clearAllMocks());

describe("usePrayer", () => {
    it("loads programs and auto-selects the first one", async () => {
        mockGet.mockResolvedValueOnce({ data: { data: [program] } });
        mockMeetingsLoad();
        const { result } = renderHook(() => usePrayer());

        await waitFor(() => expect(result.current.isLoadingPrograms).toBe(false));
        expect(result.current.selectedProgramId).toBe("p1");

        await waitFor(() => expect(result.current.availableMeetings).toEqual([meeting]));
        expect(result.current.isLoadingMeetings).toBe(false);
        expect(result.current.prayerStatus?.windowOpen).toBe(true);
    });

    it("does not fetch meetings when there are no programs to select", async () => {
        mockGet.mockResolvedValueOnce({ data: { data: [] } });
        const { result } = renderHook(() => usePrayer());

        await waitFor(() => expect(result.current.isLoadingPrograms).toBe(false));

        expect(result.current.selectedProgramId).toBeNull();
        expect(mockGet).toHaveBeenCalledTimes(1);
    });

    it("sets programsError on failure", async () => {
        mockGet.mockRejectedValueOnce(new Error("Server error"));
        const { result } = renderHook(() => usePrayer());

        await waitFor(() => expect(result.current.isLoadingPrograms).toBe(false));

        expect(result.current.programsError).toBe("Server error");
    });

    it("selectMeeting posts the selection scoped to the current program and refetches", async () => {
        mockGet.mockResolvedValueOnce({ data: { data: [program] } });
        mockMeetingsLoad();
        const { result } = renderHook(() => usePrayer());
        await waitFor(() => expect(result.current.availableMeetings).toEqual([meeting]));

        mockPost.mockResolvedValueOnce({ data: {} });
        mockMeetingsLoad();

        await act(async () => { await result.current.selectMeeting("m1"); });

        expect(mockPost).toHaveBeenCalledWith("/prayer/select?programId=p1", { meetingId: "m1" });
    });

    it("selectMeeting sets selectError and rethrows on failure", async () => {
        mockGet.mockResolvedValueOnce({ data: { data: [program] } });
        mockMeetingsLoad();
        const { result } = renderHook(() => usePrayer());
        await waitFor(() => expect(result.current.availableMeetings).toEqual([meeting]));

        mockPost.mockRejectedValueOnce(new Error("Meeting is full"));

        let caught: Error | undefined;
        await act(async () => {
            try { await result.current.selectMeeting("m1"); } catch (e: unknown) { caught = e as Error; }
        });

        expect(caught?.message).toBe("Meeting is full");
        expect(result.current.selectError).toBe("Meeting is full");
    });
});
