import { renderHook, waitFor, act } from "@testing-library/react";
import "@testing-library/jest-dom";
import { useMyLiveStatus } from "../use-my-live-status";
import { api } from "@/utils/auth/axios-client";

jest.mock("@/utils/auth/axios-client", () => ({
    api: { get: jest.fn() },
}));

const mockGet = api.get as jest.MockedFunction<typeof api.get>;

const status = {
    sessionCode: "ABC123", sessionStatus: "LIVE" as const, myRole: "PRIMARY" as const,
    myPosition: 2, myType: "PREACHING", myTopic: "Faith", currentPosition: 1,
    isMyTurnNow: false, hasPassed: false, estimatedSecondsUntilMyTurn: 300, runningOrder: [],
};

beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
});

afterEach(() => {
    jest.useRealTimers();
});

describe("useMyLiveStatus", () => {
    it("does not poll when sessionCode is null", () => {
        renderHook(() => useMyLiveStatus(null));
        expect(mockGet).not.toHaveBeenCalled();
    });

    it("fetches immediately when a session code is provided", async () => {
        mockGet.mockResolvedValue({ data: { data: status } });
        const { result } = renderHook(() => useMyLiveStatus("ABC123"));

        await waitFor(() => expect(result.current.isLoading).toBe(false));

        expect(mockGet).toHaveBeenCalledWith("/service-session/ABC123/my-status");
        expect(result.current.status).toEqual(status);
    });

    it("polls again after the interval elapses", async () => {
        mockGet.mockResolvedValue({ data: { data: status } });
        renderHook(() => useMyLiveStatus("ABC123"));

        await waitFor(() => expect(mockGet).toHaveBeenCalledTimes(1));

        await act(async () => { await jest.advanceTimersByTimeAsync(8000); });

        expect(mockGet).toHaveBeenCalledTimes(2);
    });

    it("stops polling once unmounted", async () => {
        mockGet.mockResolvedValue({ data: { data: status } });
        const { unmount } = renderHook(() => useMyLiveStatus("ABC123"));

        await waitFor(() => expect(mockGet).toHaveBeenCalledTimes(1));
        unmount();

        await act(async () => { await jest.advanceTimersByTimeAsync(30_000); });

        expect(mockGet).toHaveBeenCalledTimes(1);
    });

    it("sets an error message when a poll fails", async () => {
        mockGet.mockRejectedValue(new Error("Session ended"));
        const { result } = renderHook(() => useMyLiveStatus("ABC123"));

        await waitFor(() => expect(result.current.isLoading).toBe(false));

        expect(result.current.error).toBe("Session ended");
    });
});
