import { renderHook, act } from "@testing-library/react";
import "@testing-library/jest-dom";
import { useFacilityRental } from "../use-facility-rental";
import { api } from "@/utils/auth/axios-client";

jest.mock("@/utils/auth/axios-client", () => ({
    api: { get: jest.fn(), post: jest.fn(), patch: jest.fn() },
}));

const mockGet = api.get as jest.MockedFunction<typeof api.get>;
const mockPost = api.post as jest.MockedFunction<typeof api.post>;
const mockPatch = api.patch as jest.MockedFunction<typeof api.patch>;

const facility = { id: "fac1", name: "Main Hall", description: null, basePrice: 50000, capacity: 200, isActive: true };
const booking = {
    id: "bk1", facility: { id: "fac1", name: "Main Hall" }, startDateTime: "2026-07-01T09:00:00.000Z",
    endDateTime: "2026-07-01T12:00:00.000Z", status: "PENDING" as const, memberCategory: "MEMBER",
    basePrice: 50000, discountType: null, discountValue: null, discountSource: "NONE", serviceFee: 5000,
    cautionTotal: 10000, grandTotal: 65000, purpose: "Wedding", notes: null, rejectionReason: null,
    bookingAddons: [], payments: [], createdAt: "2026-06-01",
};

beforeEach(() => jest.clearAllMocks());

describe("useFacilityRental", () => {
    it("does not fetch anything automatically — every call is manually triggered", () => {
        renderHook(() => useFacilityRental());
        expect(mockGet).not.toHaveBeenCalled();
    });

    it("fetchFacilities loads and filters out inactive facilities", async () => {
        mockGet.mockResolvedValueOnce({ data: { data: [facility, { ...facility, id: "fac2", isActive: false }] } });
        const { result } = renderHook(() => useFacilityRental());

        await act(async () => { await result.current.fetchFacilities(); });

        expect(result.current.facilities).toEqual([facility]);
    });

    it("fetchFacilities sets an error message on failure", async () => {
        mockGet.mockRejectedValueOnce({ response: { data: { message: "Server error" } } });
        const { result } = renderHook(() => useFacilityRental());

        await act(async () => { await result.current.fetchFacilities(); });

        expect(result.current.error).toBe("Server error");
    });

    it("checkAvailability returns the blocked ranges", async () => {
        const blocked = [{ start: "2026-07-01T09:00:00Z", end: "2026-07-01T12:00:00Z", reason: "Booked" }];
        mockGet.mockResolvedValueOnce({ data: { data: { blocked } } });
        const { result } = renderHook(() => useFacilityRental());

        let response;
        await act(async () => { response = await result.current.checkAvailability("fac1", "2026-07-01", "2026-07-02"); });

        expect(mockGet).toHaveBeenCalledWith("/facility-rental/facilities/fac1/availability", {
            params: { from: "2026-07-01", to: "2026-07-02" },
        });
        expect(response).toEqual(blocked);
    });

    it("checkAvailability returns an empty array on failure instead of throwing", async () => {
        mockGet.mockRejectedValueOnce(new Error("Server error"));
        const { result } = renderHook(() => useFacilityRental());

        let response;
        await act(async () => { response = await result.current.checkAvailability("fac1", "2026-07-01", "2026-07-02"); });

        expect(response).toEqual([]);
    });

    it("createBooking posts the booking and prepends it to local state", async () => {
        mockPost.mockResolvedValueOnce({ data: { data: booking } });
        const { result } = renderHook(() => useFacilityRental());

        await act(async () => {
            await result.current.createBooking({ facilityId: "fac1", startDateTime: booking.startDateTime, endDateTime: booking.endDateTime });
        });

        expect(result.current.bookings).toEqual([booking]);
    });

    it("cancelBooking marks the matching booking CANCELLED locally", async () => {
        mockPost.mockResolvedValueOnce({ data: { data: booking } });
        const { result } = renderHook(() => useFacilityRental());
        await act(async () => {
            await result.current.createBooking({ facilityId: "fac1", startDateTime: booking.startDateTime, endDateTime: booking.endDateTime });
        });

        mockPatch.mockResolvedValueOnce({ data: {} });
        await act(async () => { await result.current.cancelBooking("bk1"); });

        expect(mockPatch).toHaveBeenCalledWith("/facility-rental/bookings/bk1/cancel");
        expect(result.current.bookings[0].status).toBe("CANCELLED");
    });

    it("fetchMyBookings loads the caller's bookings", async () => {
        mockGet.mockResolvedValueOnce({ data: { data: [booking] } });
        const { result } = renderHook(() => useFacilityRental());

        await act(async () => { await result.current.fetchMyBookings(); });

        expect(mockGet).toHaveBeenCalledWith("/facility-rental/bookings");
        expect(result.current.bookings).toEqual([booking]);
    });
});
