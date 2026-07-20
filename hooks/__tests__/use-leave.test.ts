import { renderHook, waitFor, act } from "@testing-library/react";
import "@testing-library/jest-dom";
import { useLeave } from "../use-leave";
import { api } from "@/utils/auth/axios-client";

jest.mock("@/utils/auth/axios-client", () => ({
    api: { get: jest.fn(), post: jest.fn(), delete: jest.fn() },
}));

const mockGet = api.get as jest.MockedFunction<typeof api.get>;
const mockPost = api.post as jest.MockedFunction<typeof api.post>;
const mockDelete = api.delete as jest.MockedFunction<typeof api.delete>;

const record = {
    id: "l1", reason: "Family event", dateFrom: "2026-07-01", dateTo: "2026-07-03",
    status: "PENDING" as const, createdAt: "2026-06-01",
    worker: { id: "w1", member: { firstname: "Ada", lastname: "Lovelace" } },
};

beforeEach(() => jest.clearAllMocks());

describe("useLeave — fetching", () => {
    it("fetches the caller's leave history without a status filter by default", async () => {
        mockGet.mockResolvedValueOnce({ data: { data: { data: [record] } } });
        const { result } = renderHook(() => useLeave());

        await waitFor(() => expect(result.current.isLoading).toBe(false));

        const url = mockGet.mock.calls[0][0] as string;
        expect(url).toContain("/leave/my-history?page=1&limit=20");
        expect(url).not.toContain("status");
        expect(result.current.records).toEqual([record]);
    });

    it("includes the status filter in the query once set", async () => {
        mockGet.mockResolvedValueOnce({ data: { data: { data: [] } } });
        const { result } = renderHook(() => useLeave());
        await waitFor(() => expect(result.current.isLoading).toBe(false));

        mockGet.mockResolvedValueOnce({ data: { data: { data: [record] } } });
        act(() => { result.current.setStatusFilter("APPROVED"); });

        await waitFor(() => expect(mockGet).toHaveBeenLastCalledWith(expect.stringContaining("status=APPROVED")));
    });

    it("sets an error message on fetch failure", async () => {
        mockGet.mockRejectedValueOnce(new Error("Server error"));
        const { result } = renderHook(() => useLeave());

        await waitFor(() => expect(result.current.isLoading).toBe(false));

        expect(result.current.error).toBe("Server error");
    });
});

describe("useLeave — mutations", () => {
    it("createLeave posts the payload and refetches", async () => {
        mockGet.mockResolvedValueOnce({ data: { data: { data: [] } } });
        const { result } = renderHook(() => useLeave());
        await waitFor(() => expect(result.current.isLoading).toBe(false));

        mockPost.mockResolvedValueOnce({ data: {} });
        mockGet.mockResolvedValueOnce({ data: { data: { data: [record] } } });

        await act(async () => {
            await result.current.createLeave({ dateFrom: "2026-07-01", dateTo: "2026-07-03", reason: "Family event" });
        });

        expect(mockPost).toHaveBeenCalledWith("/leave", { dateFrom: "2026-07-01", dateTo: "2026-07-03", reason: "Family event" });
        await waitFor(() => expect(result.current.records).toEqual([record]));
    });

    it("createLeave sets submitError and rethrows on failure", async () => {
        mockGet.mockResolvedValueOnce({ data: { data: { data: [] } } });
        const { result } = renderHook(() => useLeave());
        await waitFor(() => expect(result.current.isLoading).toBe(false));

        mockPost.mockRejectedValueOnce(new Error("Overlaps an existing request"));

        let caught: Error | undefined;
        await act(async () => {
            try {
                await result.current.createLeave({ dateFrom: "2026-07-01", dateTo: "2026-07-03", reason: "x" });
            } catch (e: unknown) { caught = e as Error; }
        });

        expect(caught?.message).toBe("Overlaps an existing request");
        expect(result.current.submitError).toBe("Overlaps an existing request");
    });

    it("deleteLeave removes the request from local state", async () => {
        mockGet.mockResolvedValueOnce({ data: { data: { data: [record] } } });
        const { result } = renderHook(() => useLeave());
        await waitFor(() => expect(result.current.records).toEqual([record]));

        mockDelete.mockResolvedValueOnce({ data: {} });

        await act(async () => { await result.current.deleteLeave("l1"); });

        expect(mockDelete).toHaveBeenCalledWith("/leave/l1");
        expect(result.current.records).toEqual([]);
    });
});
