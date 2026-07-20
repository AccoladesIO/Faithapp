import { renderHook, waitFor, act } from "@testing-library/react";
import "@testing-library/jest-dom";
import { useAttendanceHistory } from "../use-attendance-history";
import { api } from "@/utils/auth/axios-client";

jest.mock("@/utils/auth/axios-client", () => ({
    api: { get: jest.fn() },
}));

const mockGet = api.get as jest.MockedFunction<typeof api.get>;

const record = {
    id: "a1", createdAt: "2026-06-14", updatedAt: "2026-06-14", checkinTime: "2026-06-14T09:00:00.000Z",
    status: "PRESENT" as const, roleAtCheckin: "MEMBER", location: null, event: null, serviceSlot: null,
};
const stats = { totalCount: 10, presentCount: 9, attendanceRatePercentage: 90, lastCheckedInDate: "2026-06-14", attendanceStreak: 3 };

function mockHappyLoad() {
    mockGet
        .mockResolvedValueOnce({ data: { data: { data: [record] } } })
        .mockResolvedValueOnce({ data: { data: stats } });
}

beforeEach(() => jest.clearAllMocks());

describe("useAttendanceHistory", () => {
    it("loads history and summary stats together", async () => {
        mockHappyLoad();
        const { result } = renderHook(() => useAttendanceHistory());

        await waitFor(() => expect(result.current.isLoading).toBe(false));

        expect(result.current.records).toEqual([record]);
        expect(result.current.stats).toEqual(stats);
    });

    it("defaults to empty stats when the fetch fails", async () => {
        mockGet.mockRejectedValueOnce(new Error("Server error"));
        mockGet.mockResolvedValueOnce({ data: { data: stats } });
        const { result } = renderHook(() => useAttendanceHistory());

        await waitFor(() => expect(result.current.isLoading).toBe(false));

        expect(result.current.error).toBe("Server error");
        expect(result.current.stats).toEqual({ totalCount: 0, presentCount: 0, attendanceRatePercentage: 0, lastCheckedInDate: null, attendanceStreak: 0 });
    });

    it("refetch() triggers another request", async () => {
        mockHappyLoad();
        const { result } = renderHook(() => useAttendanceHistory());
        await waitFor(() => expect(result.current.isLoading).toBe(false));

        mockHappyLoad();
        act(() => { result.current.refetch(); });

        await waitFor(() => expect(mockGet).toHaveBeenCalledTimes(4));
    });
});
