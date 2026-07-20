import { renderHook, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import { useDashboard } from "../use-dashboard";
import { api } from "@/utils/auth/axios-client";
import { useProfile } from "@/hooks/use-profile";

jest.mock("@/utils/auth/axios-client", () => ({
    api: { get: jest.fn() },
}));
jest.mock("@/hooks/use-profile", () => ({
    useProfile: jest.fn(),
}));

const mockGet = api.get as jest.MockedFunction<typeof api.get>;
const mockUseProfile = useProfile as jest.MockedFunction<typeof useProfile>;

const rawDashboard = {
    personalAttendancePercentage: 90, attendanceStreak: 4, rank: 3,
    periodStats: { present: 9, late: 1, absent: 0, onLeave: 0, total: 10 },
    recentAttendance: [], upcomingEvents: [], enrollments: [],
    isDepartmentLead: false, departmentLeadDetails: null, totalPendingLeaveRequests: null,
};

beforeEach(() => jest.clearAllMocks());

describe("useDashboard", () => {
    it("waits for the profile to load before fetching", () => {
        mockUseProfile.mockReturnValue({ profile: null, isLoading: true, error: null, refetch: jest.fn() } as never);
        renderHook(() => useDashboard());

        expect(mockGet).not.toHaveBeenCalled();
    });

    it("fetches the member dashboard endpoint for a plain member", async () => {
        mockUseProfile.mockReturnValue({ profile: { role: "MEMBER" }, isLoading: false, error: null, refetch: jest.fn() } as never);
        mockGet.mockResolvedValueOnce({ data: { data: rawDashboard } });

        const { result } = renderHook(() => useDashboard());

        await waitFor(() => expect(result.current.isLoading).toBe(false));

        expect(mockGet).toHaveBeenCalledWith(expect.stringContaining("/dashboard/member?daysAgo=30"));
        expect(result.current.dashboard?.rank).toBe(3);
    });

    it("fetches the worker dashboard endpoint for a worker", async () => {
        mockUseProfile.mockReturnValue({ profile: { role: "WORKER" }, isLoading: false, error: null, refetch: jest.fn() } as never);
        mockGet.mockResolvedValueOnce({ data: { data: rawDashboard } });

        renderHook(() => useDashboard());

        await waitFor(() => expect(mockGet).toHaveBeenCalledWith(expect.stringContaining("/dashboard/worker?daysAgo=30")));
    });

    it("defaults array/object fields when the API omits them", async () => {
        mockUseProfile.mockReturnValue({ profile: { role: "MEMBER" }, isLoading: false, error: null, refetch: jest.fn() } as never);
        mockGet.mockResolvedValueOnce({ data: { data: { personalAttendancePercentage: 0, attendanceStreak: 0, rank: 0, periodStats: { present: 0, late: 0, absent: 0, onLeave: 0, total: 0 } } } });

        const { result } = renderHook(() => useDashboard());

        await waitFor(() => expect(result.current.isLoading).toBe(false));

        expect(result.current.dashboard?.recentAttendance).toEqual([]);
        expect(result.current.dashboard?.isDepartmentLead).toBe(false);
        expect(result.current.dashboard?.departmentLeadDetails).toBeNull();
    });

    it("sets an error message on fetch failure", async () => {
        mockUseProfile.mockReturnValue({ profile: { role: "MEMBER" }, isLoading: false, error: null, refetch: jest.fn() } as never);
        mockGet.mockRejectedValueOnce(new Error("Server error"));

        const { result } = renderHook(() => useDashboard());

        await waitFor(() => expect(result.current.isLoading).toBe(false));

        expect(result.current.error).toBe("Server error");
    });
});
