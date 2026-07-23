import { renderHook, waitFor, act } from "@testing-library/react";
import "@testing-library/jest-dom";
import { useFollowUpTasks, useFollowUpActions } from "../use-follow-up";
import { api } from "@/utils/auth/axios-client";

jest.mock("@/utils/auth/axios-client", () => ({
    api: { get: jest.fn(), post: jest.fn(), patch: jest.fn() },
}));

const mockGet = api.get as jest.MockedFunction<typeof api.get>;
const mockPost = api.post as jest.MockedFunction<typeof api.post>;
const mockPatch = api.patch as jest.MockedFunction<typeof api.patch>;

const task = {
    id: "t1", type: "FIRST_TIMER" as const, status: "PENDING" as const,
    firstTimer: { id: "ft1", firstname: "Jane", lastname: "Doe", phone: "0800", email: null, source: "WALK_IN" as const, wantsToJoinChurch: true, wantsToJoinWorkforce: false, notes: null },
    member: null, event: null, outcome: null, outcomeNotes: null, dueDate: null,
    lastActivityAt: "2026-06-01", notes: [],
};

beforeEach(() => jest.clearAllMocks());

describe("useFollowUpTasks", () => {
    it("fetches the caller's follow-up tasks with default pagination", async () => {
        mockGet.mockResolvedValueOnce({ data: { data: { data: [task], page: 1, limit: 20, totalCount: 1, totalPages: 1 } } });
        const { result } = renderHook(() => useFollowUpTasks());

        await waitFor(() => expect(result.current.isLoading).toBe(false));

        expect(mockGet).toHaveBeenCalledWith(expect.stringContaining("/follow-up/tasks/mine?page=1&limit=20"));
        expect(result.current.tasks).toEqual([task]);
    });

    it("includes a status filter and resets to page 1 when it changes", async () => {
        mockGet.mockResolvedValueOnce({ data: { data: { data: [], page: 1, limit: 20, totalCount: 0, totalPages: 1 } } });
        const { result } = renderHook(() => useFollowUpTasks());
        await waitFor(() => expect(result.current.isLoading).toBe(false));

        act(() => { result.current.goToPage(2); });
        await waitFor(() => expect(result.current.page).toBe(2));

        mockGet.mockResolvedValueOnce({ data: { data: { data: [], page: 1, limit: 20, totalCount: 0, totalPages: 1 } } });
        act(() => { result.current.setStatusFilter("COMPLETED"); });

        await waitFor(() => expect(result.current.page).toBe(1));
        expect(mockGet).toHaveBeenLastCalledWith(expect.stringContaining("status=COMPLETED"));
    });

    it("sets an error message on failure", async () => {
        mockGet.mockRejectedValueOnce(new Error("Server error"));
        const { result } = renderHook(() => useFollowUpTasks());

        await waitFor(() => expect(result.current.isLoading).toBe(false));

        expect(result.current.error).toBe("Server error");
    });
});

describe("useFollowUpActions", () => {
    it("createFirstTimer posts the payload", async () => {
        mockPost.mockResolvedValueOnce({ data: {} });
        const { result } = renderHook(() => useFollowUpActions());

        await act(async () => {
            await result.current.createFirstTimer({ firstname: "Jane", lastname: "Doe", phone: "0800" });
        });

        expect(mockPost).toHaveBeenCalledWith("/follow-up/first-timers", { firstname: "Jane", lastname: "Doe", phone: "0800" });
    });

    it("createFirstTimer sets submitError and rethrows on failure", async () => {
        mockPost.mockRejectedValueOnce(new Error("Phone already recorded"));
        const { result } = renderHook(() => useFollowUpActions());

        let caught: Error | undefined;
        await act(async () => {
            try {
                await result.current.createFirstTimer({ firstname: "x", lastname: "y", phone: "z" });
            } catch (e: unknown) { caught = e as Error; }
        });

        expect(caught?.message).toBe("Phone already recorded");
        expect(result.current.submitError).toBe("Phone already recorded");
    });

    it("updateTask patches the task", async () => {
        mockPatch.mockResolvedValueOnce({ data: {} });
        const { result } = renderHook(() => useFollowUpActions());

        await act(async () => { await result.current.updateTask("t1", { status: "COMPLETED" }); });

        expect(mockPatch).toHaveBeenCalledWith("/follow-up/tasks/t1", { status: "COMPLETED" });
    });

    it("addNote posts the note content and contact method", async () => {
        mockPost.mockResolvedValueOnce({ data: {} });
        const { result } = renderHook(() => useFollowUpActions());

        await act(async () => { await result.current.addNote("t1", "Called, no answer", "PHONE_CALL"); });

        expect(mockPost).toHaveBeenCalledWith("/follow-up/tasks/t1/notes", { content: "Called, no answer", contactMethod: "PHONE_CALL" });
    });
});
