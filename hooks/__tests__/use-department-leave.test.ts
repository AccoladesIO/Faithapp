import { renderHook, act } from "@testing-library/react";
import "@testing-library/jest-dom";
import { useDepartmentLeave } from "../use-department-leave";
import { api } from "@/utils/auth/axios-client";

jest.mock("@/utils/auth/axios-client", () => ({
    api: { get: jest.fn() },
}));

const mockGet = api.get as jest.MockedFunction<typeof api.get>;

const record = {
    id: "l1", reason: "Family event", dateFrom: "2026-07-01", dateTo: "2026-07-03",
    status: "PENDING" as const, createdAt: "2026-06-01",
    worker: { id: "w1", member: { firstname: "Ada", lastname: "Lovelace" } },
};

beforeEach(() => jest.clearAllMocks());

describe("useDepartmentLeave", () => {
    it("does not fetch automatically — a lead must call fetchDepartmentLeave", () => {
        renderHook(() => useDepartmentLeave());
        expect(mockGet).not.toHaveBeenCalled();
    });

    it("fetches the department's leave requests with pagination", async () => {
        mockGet.mockResolvedValueOnce({ data: { data: { data: [record], page: 1, limit: 10, totalCount: 1, totalPages: 1 } } });
        const { result } = renderHook(() => useDepartmentLeave());

        await act(async () => { await result.current.fetchDepartmentLeave(); });

        expect(mockGet).toHaveBeenCalledWith(expect.stringContaining("/leave/department?page=1&limit=10"));
        expect(result.current.records).toEqual([record]);
        expect(result.current.pagination).toEqual({ page: 1, limit: 10, totalCount: 1, totalPages: 1 });
    });

    it("includes a status filter when provided", async () => {
        mockGet.mockResolvedValueOnce({ data: { data: { data: [], page: 1, limit: 10, totalCount: 0, totalPages: 1 } } });
        const { result } = renderHook(() => useDepartmentLeave());

        await act(async () => { await result.current.fetchDepartmentLeave(1, "PENDING"); });

        expect(mockGet).toHaveBeenCalledWith(expect.stringContaining("status=PENDING"));
    });

    it("sets an error message on failure", async () => {
        mockGet.mockRejectedValueOnce(new Error("Forbidden"));
        const { result } = renderHook(() => useDepartmentLeave());

        await act(async () => { await result.current.fetchDepartmentLeave(); });

        expect(result.current.error).toBe("Forbidden");
    });
});
