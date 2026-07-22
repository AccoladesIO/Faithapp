import { renderHook, act } from "@testing-library/react";
import "@testing-library/jest-dom";
import { usePrayerTeam } from "../use-prayer-team";
import { api } from "@/utils/auth/axios-client";

jest.mock("@/utils/auth/axios-client", () => ({
    api: { get: jest.fn(), patch: jest.fn() },
}));

const mockGet = api.get as jest.MockedFunction<typeof api.get>;
const mockPatch = api.patch as jest.MockedFunction<typeof api.patch>;

const request = {
    id: "pr-1", submittedByName: "Ada Lovelace", content: "Please pray for my family",
    status: "OPEN" as const, createdAt: "2026-07-01T00:00:00.000Z", updatedAt: "2026-07-01T00:00:00.000Z",
};

beforeEach(() => jest.clearAllMocks());

describe("usePrayerTeam", () => {
    it("does not fetch automatically on mount — only an eligible caller triggers it", () => {
        renderHook(() => usePrayerTeam());
        expect(mockGet).not.toHaveBeenCalled();
    });

    it("fetchTeamRequests loads cross-member requests with pagination", async () => {
        mockGet.mockResolvedValueOnce({
            data: { data: { data: [request], page: 1, limit: 10, totalCount: 1, totalPages: 1 } },
        });
        const { result } = renderHook(() => usePrayerTeam());

        await act(async () => { await result.current.fetchTeamRequests(); });

        expect(mockGet).toHaveBeenCalledWith("/prayer-requests/team?page=1&limit=10");
        expect(result.current.records).toEqual([request]);
        expect(result.current.pagination).toEqual({ page: 1, limit: 10, totalCount: 1, totalPages: 1 });
    });

    it("fetchTeamRequests includes status when provided", async () => {
        mockGet.mockResolvedValueOnce({ data: { data: { data: [], page: 1, limit: 10, totalCount: 0, totalPages: 0 } } });
        const { result } = renderHook(() => usePrayerTeam());

        await act(async () => { await result.current.fetchTeamRequests(1, "ANSWERED"); });

        expect(mockGet).toHaveBeenCalledWith("/prayer-requests/team?page=1&limit=10&status=ANSWERED");
    });

    it("fetchTeamRequests sets an error message on failure", async () => {
        mockGet.mockRejectedValueOnce(new Error("Forbidden"));
        const { result } = renderHook(() => usePrayerTeam());

        await act(async () => { await result.current.fetchTeamRequests(); });

        expect(result.current.error).toBe("Forbidden");
    });

    it("updateStatus patches and merges the updated record into the list", async () => {
        mockGet.mockResolvedValueOnce({
            data: { data: { data: [request], page: 1, limit: 10, totalCount: 1, totalPages: 1 } },
        });
        const { result } = renderHook(() => usePrayerTeam());
        await act(async () => { await result.current.fetchTeamRequests(); });

        const updated = { ...request, status: "ANSWERED" as const };
        mockPatch.mockResolvedValueOnce({ data: { data: updated } });

        await act(async () => { await result.current.updateStatus("pr-1", "ANSWERED"); });

        expect(mockPatch).toHaveBeenCalledWith("/prayer-requests/team/pr-1/status", { status: "ANSWERED" });
        expect(result.current.records[0].status).toBe("ANSWERED");
    });

    it("updateStatus sets updateError and rethrows on failure", async () => {
        mockPatch.mockRejectedValueOnce(new Error("Request not found"));
        const { result } = renderHook(() => usePrayerTeam());

        let caught: Error | undefined;
        await act(async () => {
            try { await result.current.updateStatus("pr-1", "ANSWERED"); } catch (e: unknown) { caught = e as Error; }
        });

        expect(caught?.message).toBe("Request not found");
        expect(result.current.updateError).toBe("Request not found");
    });
});
