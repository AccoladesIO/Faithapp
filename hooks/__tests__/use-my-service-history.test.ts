import { renderHook, waitFor, act } from "@testing-library/react";
import "@testing-library/jest-dom";
import { useMyServiceHistory } from "../use-my-service-history";
import { api } from "@/utils/auth/axios-client";

jest.mock("@/utils/auth/axios-client", () => ({
    api: { get: jest.fn() },
}));

const mockGet = api.get as jest.MockedFunction<typeof api.get>;

const history = {
    totalSlots: 5, totalActualSeconds: 3600, bySlotType: [{ type: "PREACHING", count: 2, totalActualSeconds: 1800 }],
    entries: [], page: 1, limit: 10, totalCount: 5, totalPages: 1,
};

beforeEach(() => jest.clearAllMocks());

describe("useMyServiceHistory", () => {
    it("fetches page 1 with the default limit", async () => {
        mockGet.mockResolvedValueOnce({ data: { data: history } });
        const { result } = renderHook(() => useMyServiceHistory());

        await waitFor(() => expect(result.current.isLoading).toBe(false));

        expect(mockGet).toHaveBeenCalledWith("/service-session/my-history?page=1&limit=10");
        expect(result.current.result).toEqual(history);
    });

    it("refetches when goToPage is called", async () => {
        mockGet.mockResolvedValueOnce({ data: { data: history } });
        const { result } = renderHook(() => useMyServiceHistory());
        await waitFor(() => expect(result.current.isLoading).toBe(false));

        mockGet.mockResolvedValueOnce({ data: { data: { ...history, page: 2 } } });
        act(() => { result.current.goToPage(2); });

        await waitFor(() => expect(mockGet).toHaveBeenLastCalledWith("/service-session/my-history?page=2&limit=10"));
    });

    it("sets an error message on failure", async () => {
        mockGet.mockRejectedValueOnce(new Error("Server error"));
        const { result } = renderHook(() => useMyServiceHistory());

        await waitFor(() => expect(result.current.isLoading).toBe(false));

        expect(result.current.error).toBe("Server error");
    });
});
