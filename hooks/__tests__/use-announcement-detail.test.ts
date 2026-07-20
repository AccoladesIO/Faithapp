import { renderHook, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import { useAnnouncementDetail } from "../use-announcement-detail";
import { api } from "@/utils/auth/axios-client";

jest.mock("@/utils/auth/axios-client", () => ({
    api: { get: jest.fn() },
}));

const mockGet = api.get as jest.MockedFunction<typeof api.get>;

const announcement = {
    id: "a1", title: "New wing dedication", body: "...", audience: "ALL", createdAt: "2026-06-01",
    publishedAt: "2026-06-01", expiresAt: null, author: { firstname: "Ada", lastname: "Lovelace" },
    department: null, group: null,
};

beforeEach(() => jest.clearAllMocks());

describe("useAnnouncementDetail", () => {
    it("does nothing when id is null", () => {
        const { result } = renderHook(() => useAnnouncementDetail(null));
        expect(mockGet).not.toHaveBeenCalled();
        expect(result.current.announcement).toBeNull();
        expect(result.current.isLoading).toBe(false);
    });

    it("fetches the announcement by id", async () => {
        mockGet.mockResolvedValueOnce({ data: { data: announcement } });
        const { result } = renderHook(() => useAnnouncementDetail("a1"));

        await waitFor(() => expect(result.current.isLoading).toBe(false));

        expect(mockGet).toHaveBeenCalledWith("/announcements/a1");
        expect(result.current.announcement).toEqual(announcement);
    });

    it("sets an error message on failure", async () => {
        mockGet.mockRejectedValueOnce(new Error("Not found"));
        const { result } = renderHook(() => useAnnouncementDetail("a1"));

        await waitFor(() => expect(result.current.isLoading).toBe(false));

        expect(result.current.error).toBe("Not found");
    });
});
