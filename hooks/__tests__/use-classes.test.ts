import { renderHook, waitFor, act } from "@testing-library/react";
import "@testing-library/jest-dom";
import { useClassTypes, useClasses, useClassDetail, useMyEnrollments } from "../use-classes";
import { api } from "@/utils/auth/axios-client";

jest.mock("@/utils/auth/axios-client", () => ({
    api: { get: jest.fn() },
}));

const mockGet = api.get as jest.MockedFunction<typeof api.get>;

beforeEach(() => jest.clearAllMocks());

const classType = { id: "ct1", name: "Believers' Class", description: null, isActive: true, nextClassType: null };
const churchClass = {
    id: "c1", name: "Believers' Class — Jan", classType, description: null,
    status: "ACTIVE" as const, facilitator: null, startDate: null, endDate: null,
};

describe("useClassTypes", () => {
    it("loads and filters out inactive class types", async () => {
        mockGet.mockResolvedValueOnce({ data: { data: [classType, { ...classType, id: "ct2", isActive: false }] } });
        const { result } = renderHook(() => useClassTypes());

        await waitFor(() => expect(result.current.isLoading).toBe(false));

        expect(mockGet).toHaveBeenCalledWith("/classes/types");
        expect(result.current.classTypes).toEqual([classType]);
    });

    it("sets an error message on failure", async () => {
        mockGet.mockRejectedValueOnce(new Error("Forbidden"));
        const { result } = renderHook(() => useClassTypes());

        await waitFor(() => expect(result.current.isLoading).toBe(false));

        expect(result.current.error).toBe("Forbidden");
    });
});

describe("useClasses", () => {
    it("fetches page 1 with the default limit", async () => {
        mockGet.mockResolvedValueOnce({ data: { data: { data: [churchClass], page: 1, limit: 10, totalCount: 1, totalPages: 1 } } });
        const { result } = renderHook(() => useClasses());

        await waitFor(() => expect(result.current.isLoading).toBe(false));

        expect(mockGet).toHaveBeenCalledWith(expect.stringContaining("page=1&limit=10"));
        expect(result.current.classes).toEqual([churchClass]);
        expect(result.current.totalPages).toBe(1);
    });

    it("includes classTypeId in the query when a type filter is set", async () => {
        mockGet.mockResolvedValueOnce({ data: { data: { data: [], page: 1, limit: 10, totalCount: 0, totalPages: 1 } } });
        const { result } = renderHook(() => useClasses());
        await waitFor(() => expect(result.current.isLoading).toBe(false));

        mockGet.mockResolvedValueOnce({ data: { data: { data: [churchClass], page: 1, limit: 10, totalCount: 1, totalPages: 1 } } });
        act(() => { result.current.setTypeFilter("ct1"); });

        await waitFor(() => expect(mockGet).toHaveBeenLastCalledWith(expect.stringContaining("classTypeId=ct1")));
    });

    it("resets to page 1 when the type filter changes", async () => {
        mockGet.mockResolvedValueOnce({ data: { data: { data: [], page: 2, limit: 10, totalCount: 0, totalPages: 3 } } });
        const { result } = renderHook(() => useClasses());
        await waitFor(() => expect(result.current.isLoading).toBe(false));

        act(() => { result.current.goToPage(2); });
        await waitFor(() => expect(result.current.page).toBe(2));

        mockGet.mockResolvedValueOnce({ data: { data: { data: [], page: 1, limit: 10, totalCount: 0, totalPages: 1 } } });
        act(() => { result.current.setTypeFilter("ct1"); });

        await waitFor(() => expect(result.current.page).toBe(1));
    });
});

describe("useClassDetail", () => {
    it("fetches the class when an id is provided", async () => {
        mockGet.mockResolvedValueOnce({ data: { data: churchClass } });
        const { result } = renderHook(() => useClassDetail("c1"));

        await waitFor(() => expect(result.current.isLoading).toBe(false));

        expect(mockGet).toHaveBeenCalledWith("/classes/c1");
        expect(result.current.churchClass).toEqual(churchClass);
    });

    it("does nothing and reports not-loading when id is null", () => {
        const { result } = renderHook(() => useClassDetail(null));

        expect(mockGet).not.toHaveBeenCalled();
        expect(result.current.isLoading).toBe(false);
        expect(result.current.churchClass).toBeNull();
    });
});

describe("useMyEnrollments", () => {
    it("loads the caller's enrollments", async () => {
        const enrollment = { id: "e1", status: "IN_PROGRESS" as const, enrolledAt: "2026-06-01", completedAt: null, cancelledAt: null, churchClass };
        mockGet.mockResolvedValueOnce({ data: { data: [enrollment] } });

        const { result } = renderHook(() => useMyEnrollments());
        await waitFor(() => expect(result.current.isLoading).toBe(false));

        expect(mockGet).toHaveBeenCalledWith("/classes/my/enrollments");
        expect(result.current.enrollments).toEqual([enrollment]);
    });

    it("sets an error message on failure", async () => {
        mockGet.mockRejectedValueOnce(new Error("Server error"));
        const { result } = renderHook(() => useMyEnrollments());

        await waitFor(() => expect(result.current.isLoading).toBe(false));

        expect(result.current.error).toBe("Server error");
    });
});
