import { renderHook, act } from "@testing-library/react";
import "@testing-library/jest-dom";
import { usePrayerRequests } from "../use-prayer-requests";
import { api } from "@/utils/auth/axios-client";

jest.mock("@/utils/auth/axios-client", () => ({
    api: { get: jest.fn(), post: jest.fn() },
}));

const mockGet = api.get as jest.MockedFunction<typeof api.get>;
const mockPost = api.post as jest.MockedFunction<typeof api.post>;

const request = {
    id: "pr-1", submittedByName: "Ada Lovelace", content: "Please pray for my family",
    status: "OPEN" as const, createdAt: "2026-07-01T00:00:00.000Z", updatedAt: "2026-07-01T00:00:00.000Z",
};

const testimony = {
    id: "test-1", submittedByName: "Ada Lovelace", content: "God is faithful",
    isPublic: true, prayerRequest: null, createdAt: "2026-07-01T00:00:00.000Z",
};

beforeEach(() => jest.clearAllMocks());

describe("usePrayerRequests", () => {
    it("does not fetch automatically on mount", () => {
        renderHook(() => usePrayerRequests());
        expect(mockGet).not.toHaveBeenCalled();
    });

    it("fetchMyRequests loads the caller's requests with pagination", async () => {
        mockGet.mockResolvedValueOnce({
            data: { data: { data: [request], page: 1, limit: 10, totalCount: 1, totalPages: 1 } },
        });
        const { result } = renderHook(() => usePrayerRequests());

        await act(async () => { await result.current.fetchMyRequests(); });

        expect(mockGet).toHaveBeenCalledWith("/prayer-requests/mine?page=1&limit=10");
        expect(result.current.myRequests).toEqual([request]);
        expect(result.current.myRequestsPagination).toEqual({ page: 1, limit: 10, totalCount: 1, totalPages: 1 });
    });

    it("fetchMyRequests sets an error message on failure", async () => {
        mockGet.mockRejectedValueOnce(new Error("Network error"));
        const { result } = renderHook(() => usePrayerRequests());

        await act(async () => { await result.current.fetchMyRequests(); });

        expect(result.current.error).toBe("Network error");
    });

    it("fetchPublicTestimonies loads the public feed", async () => {
        mockGet.mockResolvedValueOnce({
            data: { data: { data: [testimony], page: 1, limit: 10, totalCount: 1, totalPages: 1 } },
        });
        const { result } = renderHook(() => usePrayerRequests());

        await act(async () => { await result.current.fetchPublicTestimonies(); });

        expect(mockGet).toHaveBeenCalledWith("/testimonies/public?page=1&limit=10");
        expect(result.current.publicTestimonies).toEqual([testimony]);
    });

    it("submitRequest posts the content and refetches my requests", async () => {
        mockPost.mockResolvedValueOnce({ data: {} });
        mockGet.mockResolvedValueOnce({
            data: { data: { data: [request], page: 1, limit: 10, totalCount: 1, totalPages: 1 } },
        });
        const { result } = renderHook(() => usePrayerRequests());

        await act(async () => { await result.current.submitRequest("Please pray for my family"); });

        expect(mockPost).toHaveBeenCalledWith("/prayer-requests", { content: "Please pray for my family" });
        expect(result.current.myRequests).toEqual([request]);
    });

    it("submitRequest sets error and rethrows on failure", async () => {
        mockPost.mockRejectedValueOnce(new Error("Content is required"));
        const { result } = renderHook(() => usePrayerRequests());

        let caught: Error | undefined;
        await act(async () => {
            try { await result.current.submitRequest(""); } catch (e: unknown) { caught = e as Error; }
        });

        expect(caught?.message).toBe("Content is required");
        expect(result.current.error).toBe("Content is required");
    });

    it("submitTestimony posts the payload and refetches my testimonies", async () => {
        mockPost.mockResolvedValueOnce({ data: {} });
        mockGet.mockResolvedValueOnce({
            data: { data: { data: [testimony], page: 1, limit: 10, totalCount: 1, totalPages: 1 } },
        });
        const { result } = renderHook(() => usePrayerRequests());

        await act(async () => {
            await result.current.submitTestimony({ content: "God is faithful", isPublic: true });
        });

        expect(mockPost).toHaveBeenCalledWith("/testimonies", { content: "God is faithful", isPublic: true });
        expect(result.current.myTestimonies).toEqual([testimony]);
    });
});
