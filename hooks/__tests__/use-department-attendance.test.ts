import { renderHook, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import { useDepartmentEventAttendance, useDepartmentSlotHistory } from "../use-department-attendance";
import { api } from "@/utils/auth/axios-client";

jest.mock("@/utils/auth/axios-client", () => ({
    api: { get: jest.fn() },
}));

const mockGet = api.get as jest.MockedFunction<typeof api.get>;

const attendance = { eventId: "e1", eventName: "Sunday Service", slots: [], workers: [] };
const historyRecord = { id: "r1", status: "PRESENT" as const, checkinTime: "2026-06-14T09:00:00.000Z", member: { id: "m1", firstname: "Jane", lastname: "Doe" } };

beforeEach(() => jest.clearAllMocks());

describe("useDepartmentEventAttendance", () => {
    it("does not fetch and returns nulls when eventId is null", () => {
        const { result } = renderHook(() => useDepartmentEventAttendance(null));
        expect(mockGet).not.toHaveBeenCalled();
        expect(result.current.attendance).toBeNull();
        expect(result.current.isLoading).toBe(false);
    });

    it("fetches department attendance for the given event", async () => {
        mockGet.mockResolvedValueOnce({ data: { data: attendance } });
        const { result } = renderHook(() => useDepartmentEventAttendance("e1"));

        await waitFor(() => expect(result.current.isLoading).toBe(false));

        expect(mockGet).toHaveBeenCalledWith("/attendances/department/event/e1");
        expect(result.current.attendance).toEqual(attendance);
    });

    it("sets an error message on failure", async () => {
        mockGet.mockRejectedValueOnce(new Error("Server error"));
        const { result } = renderHook(() => useDepartmentEventAttendance("e1"));

        await waitFor(() => expect(result.current.isLoading).toBe(false));

        expect(result.current.error).toBe("Server error");
    });
});

describe("useDepartmentSlotHistory", () => {
    it("does not fetch when slotId is null", () => {
        const { result } = renderHook(() => useDepartmentSlotHistory(null));
        expect(mockGet).not.toHaveBeenCalled();
        expect(result.current.records).toEqual([]);
    });

    it("fetches the slot's attendance log", async () => {
        mockGet.mockResolvedValueOnce({ data: { data: [historyRecord] } });
        const { result } = renderHook(() => useDepartmentSlotHistory("s1"));

        await waitFor(() => expect(result.current.isLoading).toBe(false));

        expect(mockGet).toHaveBeenCalledWith("/attendances/history/department?slotId=s1");
        expect(result.current.records).toEqual([historyRecord]);
    });
});
