import { renderHook, waitFor, act } from "@testing-library/react";
import "@testing-library/jest-dom";
import { useMyAssignments } from "../use-my-assignments";
import { api } from "@/utils/auth/axios-client";

jest.mock("@/utils/auth/axios-client", () => ({
    api: { get: jest.fn() },
}));

const mockGet = api.get as jest.MockedFunction<typeof api.get>;

const assignment = {
    slotId: "s1", programmeId: "p1", eventName: "Sunday Service", serviceSlotName: "First Service",
    startTime: "2026-06-14T07:00:00.000Z", endTime: "2026-06-14T09:00:00.000Z",
    type: "PREACHING", topic: "Faith", allocatedMinutes: 30, isBackup: false,
    programmeStatus: "DRAFT" as const, sessionCode: null,
};

beforeEach(() => jest.clearAllMocks());

describe("useMyAssignments", () => {
    it("loads the caller's upcoming assignments", async () => {
        mockGet.mockResolvedValueOnce({ data: { data: [assignment] } });
        const { result } = renderHook(() => useMyAssignments());

        await waitFor(() => expect(result.current.isLoading).toBe(false));

        expect(mockGet).toHaveBeenCalledWith("/service-programme/my-assignments");
        expect(result.current.assignments).toEqual([assignment]);
    });

    it("defaults to an empty list when the API returns no data", async () => {
        mockGet.mockResolvedValueOnce({ data: {} });
        const { result } = renderHook(() => useMyAssignments());

        await waitFor(() => expect(result.current.isLoading).toBe(false));

        expect(result.current.assignments).toEqual([]);
    });

    it("sets a generic error message on failure", async () => {
        mockGet.mockRejectedValueOnce(new Error("Server error"));
        const { result } = renderHook(() => useMyAssignments());

        await waitFor(() => expect(result.current.isLoading).toBe(false));

        expect(result.current.error).toBe("Could not load your upcoming assignments.");
    });

    it("refetch() triggers another request", async () => {
        mockGet.mockResolvedValueOnce({ data: { data: [] } });
        const { result } = renderHook(() => useMyAssignments());
        await waitFor(() => expect(result.current.isLoading).toBe(false));

        mockGet.mockResolvedValueOnce({ data: { data: [assignment] } });
        act(() => { result.current.refetch(); });

        await waitFor(() => expect(result.current.assignments).toEqual([assignment]));
    });
});
