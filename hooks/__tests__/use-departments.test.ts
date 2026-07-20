import { renderHook, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import { useDepartmentSummary } from "../use-departments";
import { api } from "@/utils/auth/axios-client";

jest.mock("@/utils/auth/axios-client", () => ({
    api: { get: jest.fn() },
}));

const mockGet = api.get as jest.MockedFunction<typeof api.get>;

const summary = {
    departmentId: "d1", departmentName: "Media", myLeadRole: "head" as const,
    totalWorkers: 10, activeWorkers: 9, inactiveWorkers: 1, attendancePercentage: 88,
    workersOnLeave: [],
};

beforeEach(() => jest.clearAllMocks());

describe("useDepartmentSummary", () => {
    it("does not fetch when disabled", () => {
        renderHook(() => useDepartmentSummary(false));
        expect(mockGet).not.toHaveBeenCalled();
    });

    it("fetches the caller's department summary when enabled", async () => {
        mockGet.mockResolvedValueOnce({ data: { data: summary } });
        const { result } = renderHook(() => useDepartmentSummary(true));

        await waitFor(() => expect(result.current.isLoading).toBe(false));

        expect(mockGet).toHaveBeenCalledWith("/departments/my/summary");
        expect(result.current.summary).toEqual(summary);
    });

    it("sets an error message on failure", async () => {
        mockGet.mockRejectedValueOnce(new Error("Forbidden"));
        const { result } = renderHook(() => useDepartmentSummary(true));

        await waitFor(() => expect(result.current.isLoading).toBe(false));

        expect(result.current.error).toBe("Forbidden");
    });
});
