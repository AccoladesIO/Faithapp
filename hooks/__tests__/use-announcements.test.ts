import { renderHook, waitFor, act } from "@testing-library/react";
import "@testing-library/jest-dom";
import { useAnnouncements } from "../use-announcements";
import { api } from "@/utils/auth/axios-client";

jest.mock("@/utils/auth/axios-client", () => ({
    api: { get: jest.fn() },
}));

const mockGet = api.get as jest.MockedFunction<typeof api.get>;
const announcement = { id: "a1", title: "New wing dedication", body: "...", audience: "ALL", createdAt: "2026-06-01" };

beforeEach(() => jest.clearAllMocks());

describe("useAnnouncements", () => {
    it("fetches the feed without a departmentId by default", async () => {
        mockGet.mockResolvedValueOnce({ data: { data: { data: [announcement], page: 1, limit: 10, totalCount: 1, totalPages: 1 } } });
        const { result } = renderHook(() => useAnnouncements());

        await waitFor(() => expect(result.current.isLoading).toBe(false));

        const url = mockGet.mock.calls[0][0] as string;
        expect(url).toContain("/announcements/feed?page=1&limit=10");
        expect(url).not.toContain("departmentId");
        expect(result.current.announcements).toEqual([announcement]);
    });

    it("includes departmentId in the query when provided", async () => {
        mockGet.mockResolvedValueOnce({ data: { data: { data: [], page: 1, limit: 10, totalCount: 0, totalPages: 1 } } });
        renderHook(() => useAnnouncements("dept-1"));

        await waitFor(() => expect(mockGet).toHaveBeenCalledWith(expect.stringContaining("departmentId=dept-1")));
    });

    it("sets an error message on failure", async () => {
        mockGet.mockRejectedValueOnce(new Error("Server error"));
        const { result } = renderHook(() => useAnnouncements());

        await waitFor(() => expect(result.current.isLoading).toBe(false));

        expect(result.current.error).toBe("Server error");
    });

    it("refetch() triggers another request", async () => {
        mockGet.mockResolvedValueOnce({ data: { data: { data: [], page: 1, limit: 10, totalCount: 0, totalPages: 1 } } });
        const { result } = renderHook(() => useAnnouncements());
        await waitFor(() => expect(result.current.isLoading).toBe(false));

        mockGet.mockResolvedValueOnce({ data: { data: { data: [announcement], page: 1, limit: 10, totalCount: 1, totalPages: 1 } } });
        act(() => { result.current.refetch(); });

        await waitFor(() => expect(result.current.announcements).toEqual([announcement]));
    });
});
