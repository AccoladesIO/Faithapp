import { renderHook, act } from "@testing-library/react";
import "@testing-library/jest-dom";
import { useAdminCheckin } from "../use-admin-checkin";
import { api } from "@/utils/auth/axios-client";

jest.mock("@/utils/auth/axios-client", () => ({
    api: { get: jest.fn(), post: jest.fn() },
}));

const mockGet = api.get as jest.MockedFunction<typeof api.get>;
const mockPost = api.post as jest.MockedFunction<typeof api.post>;

beforeEach(() => jest.clearAllMocks());

describe("useAdminCheckin.searchMembers", () => {
    it("returns an empty array without calling the API for a blank query", async () => {
        const { result } = renderHook(() => useAdminCheckin());

        let response;
        await act(async () => { response = await result.current.searchMembers("  "); });

        expect(mockGet).not.toHaveBeenCalled();
        expect(response).toEqual([]);
    });

    it("searches and returns matching members", async () => {
        const found = [{ id: "m1", firstname: "Ada", lastname: "Lovelace", role: "MEMBER" as const }];
        mockGet.mockResolvedValueOnce({ data: { data: found } });
        const { result } = renderHook(() => useAdminCheckin());

        let response;
        await act(async () => { response = await result.current.searchMembers("ada"); });

        expect(mockGet).toHaveBeenCalledWith("/attendances/department/search-members?q=ada");
        expect(response).toEqual(found);
    });

    it("sets an error message and returns an empty array on failure", async () => {
        mockGet.mockRejectedValueOnce({ response: { data: { message: "Forbidden" } } });
        const { result } = renderHook(() => useAdminCheckin());

        let response;
        await act(async () => { response = await result.current.searchMembers("ada"); });

        expect(response).toEqual([]);
        expect(result.current.error).toBe("Forbidden");
    });
});

describe("useAdminCheckin.markAttendance", () => {
    it("posts memberId, serviceSlotId, and status", async () => {
        mockPost.mockResolvedValueOnce({ data: {} });
        const { result } = renderHook(() => useAdminCheckin());

        await act(async () => { await result.current.markAttendance("m1", "slot1", "PRESENT"); });

        expect(mockPost).toHaveBeenCalledWith("/attendances/department/mark", {
            memberId: "m1", serviceSlotId: "slot1", status: "PRESENT",
        });
    });

    it("sets error and rethrows on failure", async () => {
        mockPost.mockRejectedValueOnce({ response: { data: { message: "Only Admin department workers can perform this action" } } });
        const { result } = renderHook(() => useAdminCheckin());

        let caught: Error | undefined;
        await act(async () => {
            try { await result.current.markAttendance("m1", "slot1", "PRESENT"); } catch (e: unknown) { caught = e as Error; }
        });

        expect(caught?.message).toBe("Only Admin department workers can perform this action");
        expect(result.current.error).toBe("Only Admin department workers can perform this action");
    });
});
