"use client";

import { useState, useCallback } from "react";
import { api } from "@/utils/auth/axios-client";

type ApiError = { response?: { data?: { message?: string } }; message?: string };

function extractError(err: unknown, fallback: string): string {
    const e = err as ApiError;
    return e?.response?.data?.message || e?.message || fallback;
}

// ─── Types ────────────────────────────────────────────────────────────────────

export interface RentalFacility {
    id: string;
    name: string;
    description: string | null;
    basePrice: number;
    capacity: number | null;
    isActive: boolean;
}

export interface RentalAddon {
    id: string;
    name: string;
    description: string | null;
    price: number;
    cautionAmount: number;
    isActive: boolean;
    asset: { id: string; name: string } | null;
}

export type RentalBookingStatus = "PENDING" | "CONFIRMED" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED" | "REJECTED";

export interface RentalBooking {
    id: string;
    facility: { id: string; name: string };
    startDateTime: string;
    endDateTime: string;
    status: RentalBookingStatus;
    memberCategory: string;
    basePrice: number;
    discountType: string | null;
    discountValue: number | null;
    discountSource: string;
    serviceFee: number;
    cautionTotal: number;
    grandTotal: number;
    purpose: string | null;
    notes: string | null;
    rejectionReason: string | null;
    bookingAddons: { id: string; quantity: number; addon: { name: string; price: number } }[];
    payments: { id: string; type: "SERVICE_FEE" | "CAUTION"; amount: number; status: "PENDING" | "PAID" | "REFUNDED" }[];
    createdAt: string;
}

export interface BlockedRange {
    start: string;
    end: string;
    reason: string;
}

export interface CreateBookingDto {
    facilityId: string;
    startDateTime: string;
    endDateTime: string;
    purpose?: string;
    addons?: { addonId: string; quantity: number }[];
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useFacilityRental() {
    const [facilities, setFacilities] = useState<RentalFacility[]>([]);
    const [addons, setAddons] = useState<RentalAddon[]>([]);
    const [bookings, setBookings] = useState<RentalBooking[]>([]);

    const [isLoading, setIsLoading] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchFacilities = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const res = await api.get("/facility-rental/facilities");
            const list: RentalFacility[] = Array.isArray(res.data?.data) ? res.data.data : [];
            setFacilities(list.filter((f) => f.isActive));
        } catch (err: unknown) {
            setError(extractError(err, "Failed to load facilities."));
        } finally {
            setIsLoading(false);
        }
    }, []);

    const fetchAddons = useCallback(async () => {
        try {
            const res = await api.get("/facility-rental/addons");
            const list: RentalAddon[] = Array.isArray(res.data?.data) ? res.data.data : [];
            setAddons(list);
        } catch (err: unknown) {
            setError(extractError(err, "Failed to load add-ons."));
        }
    }, []);

    const checkAvailability = useCallback(async (facilityId: string, from: string, to: string): Promise<BlockedRange[]> => {
        try {
            const res = await api.get(`/facility-rental/facilities/${facilityId}/availability`, { params: { from, to } });
            const blocked = res.data?.data?.blocked;
            return Array.isArray(blocked) ? blocked : [];
        } catch {
            return [];
        }
    }, []);

    const createBooking = useCallback(async (dto: CreateBookingDto): Promise<RentalBooking> => {
        setIsSubmitting(true);
        setError(null);
        try {
            const res = await api.post("/facility-rental/bookings", dto);
            const created: RentalBooking = res.data?.data;
            setBookings((prev) => [created, ...prev]);
            return created;
        } catch (err: unknown) {
            const message = extractError(err, "Failed to create booking.");
            setError(message);
            throw new Error(message);
        } finally {
            setIsSubmitting(false);
        }
    }, []);

    const fetchMyBookings = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const res = await api.get("/facility-rental/bookings");
            const list: RentalBooking[] = Array.isArray(res.data?.data) ? res.data.data : [];
            setBookings(list);
        } catch (err: unknown) {
            setError(extractError(err, "Failed to load your bookings."));
        } finally {
            setIsLoading(false);
        }
    }, []);

    const fetchBookingById = useCallback(async (id: string): Promise<RentalBooking> => {
        const res = await api.get(`/facility-rental/bookings/${id}`);
        return res.data?.data;
    }, []);

    const cancelBooking = useCallback(async (id: string): Promise<void> => {
        setIsSubmitting(true);
        setError(null);
        try {
            await api.patch(`/facility-rental/bookings/${id}/cancel`);
            setBookings((prev) => prev.map((b) => (b.id === id ? { ...b, status: "CANCELLED" as const } : b)));
        } catch (err: unknown) {
            const message = extractError(err, "Failed to cancel booking.");
            setError(message);
            throw new Error(message);
        } finally {
            setIsSubmitting(false);
        }
    }, []);

    return {
        facilities, addons, bookings,
        isLoading, isSubmitting, error, setError,
        fetchFacilities, fetchAddons, checkAvailability,
        createBooking, fetchMyBookings, fetchBookingById, cancelBooking,
    };
}
