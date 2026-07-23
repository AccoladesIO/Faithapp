import { renderHook, act } from "@testing-library/react";
import "@testing-library/jest-dom";
import { useSundaySchool } from "../use-sunday-school";
import { api } from "@/utils/auth/axios-client";

jest.mock("@/utils/auth/axios-client", () => ({
    api: { get: jest.fn(), post: jest.fn(), patch: jest.fn(), delete: jest.fn() },
}));

const mockGet = api.get as jest.MockedFunction<typeof api.get>;
const mockPost = api.post as jest.MockedFunction<typeof api.post>;
const mockPatch = api.patch as jest.MockedFunction<typeof api.patch>;
const mockDelete = api.delete as jest.MockedFunction<typeof api.delete>;

const ssClass = { id: "c1", name: "Toddlers", description: null, teacher: null, createdAt: "2026-01-01" };
const session = { id: "s1", sessionDate: "2026-06-14", selfMarkClosesAt: null, notes: null };
const roster = {
    sessionId: "s1", classId: "c1", sessionDate: "2026-06-14", selfMarkOpen: false, selfMarkClosesAt: null,
    members: [{ memberId: "m1", name: "Jane Doe", status: null, markedByTeacher: false, markedAt: null }],
};

beforeEach(() => jest.clearAllMocks());

describe("useSundaySchool", () => {
    it("does not fetch anything automatically", () => {
        renderHook(() => useSundaySchool());
        expect(mockGet).not.toHaveBeenCalled();
    });

    it("fetchMyAttendance loads the caller's attendance history with pagination", async () => {
        mockGet.mockResolvedValueOnce({ data: { data: { data: [], totalPages: 2 } } });
        const { result } = renderHook(() => useSundaySchool());

        await act(async () => { await result.current.fetchMyAttendance(1); });

        expect(mockGet).toHaveBeenCalledWith("/sunday-school/attendance/me?page=1&limit=10");
        expect(result.current.myAttendanceTotalPages).toBe(2);
    });

    it("checkIn posts and removes the session from openSessions", async () => {
        mockGet.mockResolvedValueOnce({ data: { data: [{ ...session, sundaySchoolClass: { id: "c1", name: "Toddlers" } }] } });
        const { result } = renderHook(() => useSundaySchool());
        await act(async () => { await result.current.fetchOpenSessions(); });
        expect(result.current.openSessions).toHaveLength(1);

        mockPost.mockResolvedValueOnce({ data: {} });
        await act(async () => { await result.current.checkIn("s1"); });

        expect(mockPost).toHaveBeenCalledWith("/sunday-school/sessions/s1/checkin");
        expect(result.current.openSessions).toHaveLength(0);
    });

    it("checkIn sets an error and rethrows on failure", async () => {
        const { result } = renderHook(() => useSundaySchool());
        mockPost.mockRejectedValueOnce({ response: { data: { message: "Self-mark window closed" } } });

        let caught: Error | undefined;
        await act(async () => {
            try { await result.current.checkIn("s1"); } catch (e: unknown) { caught = e as Error; }
        });

        expect(caught?.message).toBe("Self-mark window closed");
        expect(result.current.error).toBe("Self-mark window closed");
    });

    it("fetchClasses loads the teacher's classes", async () => {
        mockGet.mockResolvedValueOnce({ data: { data: { data: [ssClass], totalPages: 1 } } });
        const { result } = renderHook(() => useSundaySchool());

        await act(async () => { await result.current.fetchClasses(); });

        expect(result.current.classes).toEqual([ssClass]);
    });

    it("createClass posts and prepends the new class", async () => {
        mockPost.mockResolvedValueOnce({ data: { data: ssClass } });
        const { result } = renderHook(() => useSundaySchool());

        await act(async () => { await result.current.createClass({ name: "Toddlers" }); });

        expect(result.current.classes).toEqual([ssClass]);
    });

    it("fetchRoster loads the session roster", async () => {
        mockGet.mockResolvedValueOnce({ data: { data: roster } });
        const { result } = renderHook(() => useSundaySchool());

        await act(async () => { await result.current.fetchRoster("s1"); });

        expect(mockGet).toHaveBeenCalledWith("/sunday-school/sessions/s1/roster");
        expect(result.current.roster).toEqual(roster);
    });

    it("bulkMarkAttendance posts attendances and updates the roster locally", async () => {
        mockGet.mockResolvedValueOnce({ data: { data: roster } });
        const { result } = renderHook(() => useSundaySchool());
        await act(async () => { await result.current.fetchRoster("s1"); });

        mockPost.mockResolvedValueOnce({ data: {} });
        await act(async () => {
            await result.current.bulkMarkAttendance("s1", [{ memberId: "m1", status: "PRESENT" }]);
        });

        expect(mockPost).toHaveBeenCalledWith("/sunday-school/sessions/s1/bulk-mark", {
            attendances: [{ memberId: "m1", status: "PRESENT" }],
        });
        expect(result.current.roster?.members[0].status).toBe("PRESENT");
        expect(result.current.roster?.members[0].markedByTeacher).toBe(true);
    });

    it("openSelfMark patches the session and reflects it in the current roster", async () => {
        mockGet.mockResolvedValueOnce({ data: { data: { data: [session], totalPages: 1 } } });
        const { result } = renderHook(() => useSundaySchool());
        await act(async () => { await result.current.fetchSessions("c1"); });

        mockGet.mockResolvedValueOnce({ data: { data: roster } });
        await act(async () => { await result.current.fetchRoster("s1"); });

        const opened = { ...session, selfMarkClosesAt: "2026-06-14T10:00:00.000Z" };
        mockPatch.mockResolvedValueOnce({ data: { data: opened } });
        await act(async () => { await result.current.openSelfMark("s1", 30); });

        expect(mockPatch).toHaveBeenCalledWith("/sunday-school/sessions/s1/open", { closesInMinutes: 30 });
        expect(result.current.roster?.selfMarkOpen).toBe(true);
    });

    it("removeMember deletes and updates classMembers locally", async () => {
        mockGet.mockResolvedValueOnce({
            data: { data: { data: [{ id: "as1", member: { id: "m1", firstname: "Jane", lastname: "Doe" }, assignedAt: "2026-01-01" }], totalPages: 1 } },
        });
        const { result } = renderHook(() => useSundaySchool());
        await act(async () => { await result.current.fetchClassMembers("c1"); });
        expect(result.current.classMembers).toHaveLength(1);

        mockDelete.mockResolvedValueOnce({ data: {} });
        await act(async () => { await result.current.removeMember("c1", "m1"); });

        expect(mockDelete).toHaveBeenCalledWith("/sunday-school/classes/c1/members/m1");
        expect(result.current.classMembers).toHaveLength(0);
    });
});
