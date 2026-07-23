import { renderHook, waitFor, act } from "@testing-library/react";
import "@testing-library/jest-dom";
import { useIncidents, useMyIncidentReports } from "../use-incidents";
import { api } from "@/utils/auth/axios-client";

jest.mock("@/utils/auth/axios-client", () => ({
    api: { get: jest.fn(), post: jest.fn() },
}));

const mockGet = api.get as jest.MockedFunction<typeof api.get>;
const mockPost = api.post as jest.MockedFunction<typeof api.post>;

const report = {
    id: "i1", title: "Broken chair", description: "In row 3", location: "Main hall",
    status: "OPEN" as const, isAnonymous: false, images: null, adminNotes: null,
    resolvedAt: null, createdAt: "2026-06-01",
};

beforeEach(() => jest.clearAllMocks());

describe("useIncidents.submitIncident", () => {
    it("posts multipart form data with all fields and images", async () => {
        mockPost.mockResolvedValueOnce({ data: {} });
        const { result } = renderHook(() => useIncidents());
        const image = new File(["img"], "photo.jpg", { type: "image/jpeg" });

        await act(async () => {
            await result.current.submitIncident({
                title: "Broken chair", description: "In row 3", location: "Main hall",
                isAnonymous: true, images: [image],
            });
        });

        expect(mockPost).toHaveBeenCalledWith("/incidents", expect.any(FormData), {
            headers: { "Content-Type": "multipart/form-data" },
        });
        const sent = mockPost.mock.calls[0][1] as FormData;
        expect(sent.get("title")).toBe("Broken chair");
        expect(sent.get("isAnonymous")).toBe("true");
        expect(sent.get("images")).toBe(image);
        expect(result.current.isSubmitting).toBe(false);
    });

    it("sets submitError and rethrows on failure", async () => {
        mockPost.mockRejectedValueOnce(new Error("Too many reports today"));
        const { result } = renderHook(() => useIncidents());

        let caught: Error | undefined;
        await act(async () => {
            try {
                await result.current.submitIncident({ title: "x", description: "y", location: "z", isAnonymous: false, images: [] });
            } catch (e: unknown) { caught = e as Error; }
        });

        expect(caught?.message).toBe("Too many reports today");
        expect(result.current.submitError).toBe("Too many reports today");
    });
});

describe("useMyIncidentReports", () => {
    it("does not fetch when disabled", () => {
        renderHook(() => useMyIncidentReports(false));
        expect(mockGet).not.toHaveBeenCalled();
    });

    it("fetches the caller's incident reports when enabled", async () => {
        mockGet.mockResolvedValueOnce({ data: { data: { data: [report], page: 1, limit: 10, totalCount: 1, totalPages: 1 } } });
        const { result } = renderHook(() => useMyIncidentReports(true));

        await waitFor(() => expect(result.current.isLoading).toBe(false));

        expect(mockGet).toHaveBeenCalledWith(expect.stringContaining("/incidents?page=1&limit=10"));
        expect(result.current.reports).toEqual([report]);
    });

    it("sets an error message on failure", async () => {
        mockGet.mockRejectedValueOnce(new Error("Server error"));
        const { result } = renderHook(() => useMyIncidentReports(true));

        await waitFor(() => expect(result.current.isLoading).toBe(false));

        expect(result.current.error).toBe("Server error");
    });

    it("refetch() triggers another request", async () => {
        mockGet.mockResolvedValueOnce({ data: { data: { data: [], page: 1, limit: 10, totalCount: 0, totalPages: 1 } } });
        const { result } = renderHook(() => useMyIncidentReports(true));
        await waitFor(() => expect(result.current.isLoading).toBe(false));

        mockGet.mockResolvedValueOnce({ data: { data: { data: [report], page: 1, limit: 10, totalCount: 1, totalPages: 1 } } });
        act(() => { result.current.refetch(); });

        await waitFor(() => expect(result.current.reports).toEqual([report]));
        expect(mockGet).toHaveBeenCalledTimes(2);
    });
});
