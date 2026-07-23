import { renderHook, waitFor, act } from "@testing-library/react";
import "@testing-library/jest-dom";
import { usePastorFeedbackSubmission } from "../use-pastor-feedback-submission";
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

describe("usePastorFeedbackSubmission", () => {
    it("loads the caller's feedback history", async () => {
        mockGet.mockResolvedValueOnce({ data: { data: { data: [record] } } });
        const { result } = renderHook(() => usePastorFeedbackSubmission());

        await waitFor(() => expect(result.current.isLoading).toBe(false));

        expect(mockGet).toHaveBeenCalledWith("/pastor-feedback/my?page=1&limit=20");
        expect(result.current.records).toEqual([record]);
    });

    it("sets an error message on fetch failure", async () => {
        mockGet.mockRejectedValueOnce(new Error("Server error"));
        const { result } = renderHook(() => usePastorFeedbackSubmission());

        await waitFor(() => expect(result.current.isLoading).toBe(false));

        expect(result.current.error).toBe("Server error");
    });

    it("submitFeedback posts the payload and refetches", async () => {
        mockGet.mockResolvedValueOnce({ data: { data: { data: [] } } });
        const { result } = renderHook(() => usePastorFeedbackSubmission());
        await waitFor(() => expect(result.current.isLoading).toBe(false));

        mockPost.mockResolvedValueOnce({ data: {} });
        mockGet.mockResolvedValueOnce({ data: { data: { data: [record] } } });

        await act(async () => {
            await result.current.submitFeedback({
                departmentId: "d1", weekOf: "2026-06-08", attendanceNotes: "Good turnout",
                highlights: "New volunteers", challenges: "Equipment",
            });
        });

        expect(mockPost).toHaveBeenCalledWith("/pastor-feedback", {
            departmentId: "d1", weekOf: "2026-06-08", attendanceNotes: "Good turnout",
            highlights: "New volunteers", challenges: "Equipment",
        });
        await waitFor(() => expect(result.current.records).toEqual([record]));
    });

    it("submitFeedback sets submitError and rethrows when already submitted this week", async () => {
        mockGet.mockResolvedValueOnce({ data: { data: { data: [] } } });
        const { result } = renderHook(() => usePastorFeedbackSubmission());
        await waitFor(() => expect(result.current.isLoading).toBe(false));

        mockPost.mockRejectedValueOnce(new Error("Already submitted feedback for this week"));

        let caught: Error | undefined;
        await act(async () => {
            try {
                await result.current.submitFeedback({
                    departmentId: "d1", weekOf: "2026-06-08", attendanceNotes: "x", highlights: "y", challenges: "z",
                });
            } catch (e: unknown) { caught = e as Error; }
        });

        expect(caught?.message).toBe("Already submitted feedback for this week");
        expect(result.current.submitError).toBe("Already submitted feedback for this week");
    });
});
