import { renderHook, waitFor, act } from "@testing-library/react";
import "@testing-library/jest-dom";
import { useEventDetail } from "../use-event-detail";
import { api } from "@/utils/auth/axios-client";

jest.mock("@/utils/auth/axios-client", () => {
    const actual = jest.requireActual("@/utils/auth/axios-client");
    return {
        ...actual,
        api: { get: jest.fn(), post: jest.fn() },
    };
});

const mockGet = api.get as jest.MockedFunction<typeof api.get>;
const mockPost = api.post as jest.MockedFunction<typeof api.post>;

const event = {
    id: "e1", name: "Sunday Service", description: "", eventDate: "2026-06-14", endDate: "2026-06-14",
    attendanceMarked: false, onlineAttendanceEnabled: true, serviceSlots: [], checkedIn: false, myCheckin: null,
};

beforeEach(() => jest.clearAllMocks());

describe("useEventDetail", () => {
    it("does nothing when id is null", () => {
        const { result } = renderHook(() => useEventDetail(null));
        expect(mockGet).not.toHaveBeenCalled();
        expect(result.current.event).toBeNull();
        expect(result.current.isLoading).toBe(false);
    });

    it("fetches the event by id", async () => {
        mockGet.mockResolvedValueOnce({ data: { data: event } });
        const { result } = renderHook(() => useEventDetail("e1"));

        await waitFor(() => expect(result.current.isLoading).toBe(false));

        expect(mockGet).toHaveBeenCalledWith("/events/e1");
        expect(result.current.event).toEqual(event);
    });

    it("sets an error message via extractErrorMessage on failure", async () => {
        mockGet.mockRejectedValueOnce(new Error("Not found"));
        const { result } = renderHook(() => useEventDetail("e1"));

        await waitFor(() => expect(result.current.isLoading).toBe(false));

        expect(result.current.error).toBe("Not found");
    });

    it("confirmOnlineAttendance posts and sets a success message, then refetches", async () => {
        mockGet.mockResolvedValueOnce({ data: { data: event } });
        const { result } = renderHook(() => useEventDetail("e1"));
        await waitFor(() => expect(result.current.isLoading).toBe(false));

        mockPost.mockResolvedValueOnce({ data: { data: { message: "Attendance confirmed." } } });
        mockGet.mockResolvedValueOnce({ data: { data: event } });

        await act(async () => { await result.current.confirmOnlineAttendance(); });

        expect(mockPost).toHaveBeenCalledWith("/attendances/online-confirm", { eventId: "e1" });
        expect(result.current.onlineConfirmMessage).toBe("Attendance confirmed.");
    });

    it("confirmOnlineAttendance sets onlineConfirmError on failure", async () => {
        mockGet.mockResolvedValueOnce({ data: { data: event } });
        const { result } = renderHook(() => useEventDetail("e1"));
        await waitFor(() => expect(result.current.isLoading).toBe(false));

        mockPost.mockRejectedValueOnce(new Error("Already confirmed"));

        await act(async () => { await result.current.confirmOnlineAttendance(); });

        expect(result.current.onlineConfirmError).toBe("Already confirmed");
    });
});
