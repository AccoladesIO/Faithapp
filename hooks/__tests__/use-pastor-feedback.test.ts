import { renderHook, waitFor, act } from "@testing-library/react";
import "@testing-library/jest-dom";
import { usePastorFeedback } from "../use-pastor-feedback";
import { api } from "@/utils/auth/axios-client";

jest.mock("@/utils/auth/axios-client", () => ({
    api: { get: jest.fn(), post: jest.fn() },
}));

const mockGet = api.get as jest.MockedFunction<typeof api.get>;
const mockPost = api.post as jest.MockedFunction<typeof api.post>;

const record = {
    id: "f1", department: { id: "d1", name: "Media" }, weekOf: "2026-06-08",
    attendanceNotes: "Good turnout", highlights: "New volunteers", challenges: "Equipment",
    prayerRequests: null, additionalNotes: null, submittedByName: "Ada Lovelace",
    submittedAt: "2026-06-08", respondedByPastorName: null, pastorResponse: null, pastorRespondedAt: null,
};

beforeEach(() => jest.clearAllMocks());

describe("usePastorFeedback", () => {
    it("does not fetch automatically on mount — a pastor must trigger it", () => {
        renderHook(() => usePastorFeedback());
        expect(mockGet).not.toHaveBeenCalled();
    });

    it("fetchFeedback loads cross-department feedback with pagination", async () => {
        mockGet.mockResolvedValueOnce({
            data: { data: { data: [record], page: 1, limit: 10, totalCount: 1, totalPages: 1 } },
        });
        const { result } = renderHook(() => usePastorFeedback());

        await act(async () => { await result.current.fetchFeedback(); });

        expect(mockGet).toHaveBeenCalledWith(expect.stringContaining("/department-feedback/pastor?page=1&limit=10"));
        expect(result.current.records).toEqual([record]);
        expect(result.current.pagination).toEqual({ page: 1, limit: 10, totalCount: 1, totalPages: 1 });
    });

    it("fetchFeedback includes departmentId when provided", async () => {
        mockGet.mockResolvedValueOnce({ data: { data: { data: [], page: 1, limit: 10, totalCount: 0, totalPages: 1 } } });
        const { result } = renderHook(() => usePastorFeedback());

        await act(async () => { await result.current.fetchFeedback(1, "d1"); });

        expect(mockGet).toHaveBeenCalledWith(expect.stringContaining("departmentId=d1"));
    });

    it("fetchFeedback sets an error message on failure", async () => {
        mockGet.mockRejectedValueOnce(new Error("Forbidden"));
        const { result } = renderHook(() => usePastorFeedback());

        await act(async () => { await result.current.fetchFeedback(); });

        expect(result.current.error).toBe("Forbidden");
    });

    it("respond() posts a reply and merges the updated record into the list", async () => {
        mockGet.mockResolvedValueOnce({ data: { data: { data: [record], page: 1, limit: 10, totalCount: 1, totalPages: 1 } } });
        const { result } = renderHook(() => usePastorFeedback());
        await act(async () => { await result.current.fetchFeedback(); });

        const responded = { ...record, pastorResponse: "Great work!", respondedByPastorName: "Pastor John" };
        mockPost.mockResolvedValueOnce({ data: { data: responded } });

        await act(async () => { await result.current.respond("f1", "Great work!"); });

        expect(mockPost).toHaveBeenCalledWith("/department-feedback/pastor/f1/respond", { response: "Great work!" });
        expect(result.current.records[0].pastorResponse).toBe("Great work!");
    });

    it("respond() sets respondError and rethrows on failure", async () => {
        mockGet.mockResolvedValueOnce({ data: { data: { data: [record], page: 1, limit: 10, totalCount: 1, totalPages: 1 } } });
        const { result } = renderHook(() => usePastorFeedback());
        await act(async () => { await result.current.fetchFeedback(); });

        mockPost.mockRejectedValueOnce(new Error("Response cannot be empty"));

        let caught: Error | undefined;
        await act(async () => {
            try { await result.current.respond("f1", ""); } catch (e: unknown) { caught = e as Error; }
        });

        expect(caught?.message).toBe("Response cannot be empty");
        expect(result.current.respondError).toBe("Response cannot be empty");
    });
});
