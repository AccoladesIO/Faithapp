import { renderHook, waitFor, act } from "@testing-library/react";
import "@testing-library/jest-dom";
import { useChildrenChurch } from "../use-children-church";
import { api } from "@/utils/auth/axios-client";

jest.mock("@/utils/auth/axios-client", () => ({
    api: { get: jest.fn(), post: jest.fn(), patch: jest.fn(), delete: jest.fn() },
}));

const mockGet = api.get as jest.MockedFunction<typeof api.get>;
const mockPost = api.post as jest.MockedFunction<typeof api.post>;

const ageGroup = { id: "ag1", name: "Toddlers", minAge: 2, maxAge: 4 };
const classGroup = { id: "cg1", name: "Toddler Class" };
const child = { id: "ch1", firstname: "Jane", lastname: "Doe", dateOfBirth: "2022-01-01", photoUrl: null, classGroup: null, guardians: [] };

function mockInitialLoad() {
    mockGet
        .mockResolvedValueOnce({ data: { data: [ageGroup] } })
        .mockResolvedValueOnce({ data: { data: [classGroup] } });
}

beforeEach(() => jest.clearAllMocks());

describe("useChildrenChurch — initial load", () => {
    it("loads age groups and class groups on mount", async () => {
        mockInitialLoad();
        const { result } = renderHook(() => useChildrenChurch());

        await waitFor(() => expect(result.current.isLoading).toBe(false));

        expect(result.current.ageGroups).toEqual([ageGroup]);
        expect(result.current.classGroups).toEqual([classGroup]);
    });

    it("sets an error message when the initial load fails", async () => {
        mockGet.mockRejectedValueOnce(new Error("Server error"));
        mockGet.mockResolvedValueOnce({ data: { data: [] } });
        const { result } = renderHook(() => useChildrenChurch());

        await waitFor(() => expect(result.current.isLoading).toBe(false));

        expect(result.current.error).toBe("Server error");
    });
});

describe("useChildrenChurch — child + guardian actions", () => {
    it("createChild posts and prepends the child to local state", async () => {
        mockInitialLoad();
        const { result } = renderHook(() => useChildrenChurch());
        await waitFor(() => expect(result.current.isLoading).toBe(false));

        mockPost.mockResolvedValueOnce({ data: { data: child } });

        await act(async () => {
            await result.current.createChild({
                firstname: "Jane", lastname: "Doe", dateOfBirth: "2022-01-01", photoUrl: null,
                specialNotes: "", registeredByMemberId: "m1",
            });
        });

        expect(result.current.children).toEqual([child]);
    });

    it("createChild sets submitError and rethrows on failure", async () => {
        mockInitialLoad();
        const { result } = renderHook(() => useChildrenChurch());
        await waitFor(() => expect(result.current.isLoading).toBe(false));

        mockPost.mockRejectedValueOnce(new Error("Missing guardian"));

        let caught: Error | undefined;
        await act(async () => {
            try {
                await result.current.createChild({ firstname: "x", lastname: "y", dateOfBirth: "2022-01-01", photoUrl: null, specialNotes: "", registeredByMemberId: "m1" });
            } catch (e: unknown) { caught = e as Error; }
        });

        expect(caught?.message).toBe("Missing guardian");
        expect(result.current.submitError).toBe("Missing guardian");
    });

    it("getChild fetches a single child by id", async () => {
        mockInitialLoad();
        const { result } = renderHook(() => useChildrenChurch());
        await waitFor(() => expect(result.current.isLoading).toBe(false));

        mockGet.mockResolvedValueOnce({ data: { data: child } });

        let fetched;
        await act(async () => { fetched = await result.current.getChild("ch1"); });

        expect(mockGet).toHaveBeenCalledWith("/children-church/children/ch1");
        expect(fetched).toEqual(child);
    });
});

describe("useChildrenChurch — check-in/out", () => {
    it("checkin posts the payload and returns the result", async () => {
        mockInitialLoad();
        const { result } = renderHook(() => useChildrenChurch());
        await waitFor(() => expect(result.current.isLoading).toBe(false));

        const checkinResult = { id: "co1", pickupCode: "AB12", status: "CHECKED_IN", checkinTime: "2026-06-14T09:00:00.000Z" };
        mockPost.mockResolvedValueOnce({ data: { data: checkinResult } });

        let response;
        await act(async () => {
            response = await result.current.checkin({ childId: "ch1", droppedOffByName: "Jane's Mom" });
        });

        expect(mockPost).toHaveBeenCalledWith("/children-church/checkin", { childId: "ch1", droppedOffByName: "Jane's Mom" });
        expect(response).toEqual(checkinResult);
    });

    it("verifyPickupCode uppercases the code before requesting", async () => {
        mockInitialLoad();
        const { result } = renderHook(() => useChildrenChurch());
        await waitFor(() => expect(result.current.isLoading).toBe(false));

        mockGet.mockResolvedValueOnce({ data: { data: { id: "co1", pickupCode: "AB12", status: "CHECKED_IN", child, authorizedGuardians: [] } } });

        await act(async () => { await result.current.verifyPickupCode("ab12"); });

        expect(mockGet).toHaveBeenCalledWith("/children-church/checkin/verify/AB12");
    });
});

describe("useChildrenChurch — search", () => {
    it("searchChildren builds the query with name and classGroupId when provided", async () => {
        mockInitialLoad();
        const { result } = renderHook(() => useChildrenChurch());
        await waitFor(() => expect(result.current.isLoading).toBe(false));

        mockGet.mockResolvedValueOnce({ data: { data: { data: [child], totalPages: 1, totalCount: 1 } } });

        await act(async () => { await result.current.searchChildren("Jane", "cg1", 2); });

        const url = mockGet.mock.calls[mockGet.mock.calls.length - 1][0] as string;
        expect(url).toContain("page=2");
        expect(url).toContain("name=Jane");
        expect(url).toContain("classGroupId=cg1");
    });
});
