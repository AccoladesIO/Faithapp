"use client";

import { useState, useEffect, useCallback } from "react";
import { api } from "@/utils/auth/axios-client";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ClassGroup {
    id: string;
    name: string;
    ageGroup?: { id: string; name: string };
    teacherCount?: number;
}

export interface AgeGroup {
    id: string;
    name: string;
    minAge: number;
    maxAge: number;
}

export interface Guardian {
    id: string;
    firstname?: string;
    lastname?: string;
    fullName?: string;
    relationship: string;
    phoneNumber?: string;
    email?: string;
    isAuthorizedPickup?: boolean;
}

export interface Child {
    id: string;
    firstname: string;
    lastname: string;
    dateOfBirth: string;
    photoUrl: string | null;
    specialNotes?: string;
    classGroup: ClassGroup | null;
    guardians: Guardian[];
}

export interface CheckinRecord {
    id: string;
    child: { id: string; firstname: string; lastname: string };
    checkedInAt: string;
    pickupCode: string;
    checkedOut: boolean;
    flagged: boolean;
}

export interface ActiveCheckIn {
    id: string;
    child: { id: string; firstname: string; lastname: string; classGroup: ClassGroup | null };
    droppedOffByName: string | null;
    checkinTime: string;
    pickupCode: string;
    flagReason: string | null;
    serviceSlot: { id: string; name: string } | null;
}

export interface CheckinResult {
    id: string;
    pickupCode: string;
    status: string;
    checkinTime: string;
}

export interface VerifyResult {
    id: string;
    pickupCode: string;
    status: string;
    child: { id: string; firstname: string; lastname: string };
    authorizedGuardians: Guardian[];
}

export interface CreateChildPayload {
    firstname: string;
    lastname: string;
    dateOfBirth: string;
    photoUrl: string | null;
    specialNotes: string;
    registeredByMemberId: string;
}

export interface AddGuardianPayload {
    fullName: string;
    relationship: string;
    phoneNumber: string;
    email: string;
    isAuthorizedPickup: boolean;
    memberId?: string;
}

export interface CheckinPayload {
    childId: string;
    serviceSlotId?: string;
    droppedOffByGuardianId?: string;
    droppedOffByName: string;
}

export interface CheckoutPayload {
    pickupCode: string;
    pickedUpByGuardianId?: string;
    pickedUpByName: string;
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export interface UseChildrenChurchReturn {
    // data
    children: Child[];
    ageGroups: AgeGroup[];
    classGroups: ClassGroup[];

    // loading
    isLoading: boolean;
    isSubmitting: boolean;

    // errors
    error: string | null;
    submitError: string | null;

    // child CRUD
    createChild: (payload: CreateChildPayload) => Promise<Child>;
    updateChild: (id: string, patch: Partial<CreateChildPayload>) => Promise<void>;
    getChild: (id: string) => Promise<Child>;
    getCheckinHistory: (childId: string) => Promise<CheckinRecord[]>;

    // guardian CRUD
    addGuardian: (childId: string, payload: AddGuardianPayload) => Promise<void>;
    getGuardians: (childId: string) => Promise<Guardian[]>;
    deleteGuardian: (guardianId: string) => Promise<void>;

    // check-in / check-out
    checkin: (payload: CheckinPayload) => Promise<CheckinResult>;
    verifyPickupCode: (code: string) => Promise<VerifyResult>;
    checkout: (payload: CheckoutPayload) => Promise<void>;
    flagCheckin: (checkinId: string) => Promise<void>;

    // roster search & active board
    searchChildren: (name?: string, classGroupId?: string, page?: number) => Promise<{ data: Child[]; totalPages: number; totalCount: number }>;
    getActiveCheckIns: (classGroupId?: string) => Promise<ActiveCheckIn[]>;

    refetch: () => void;
}

export function useChildrenChurch(memberId?: string): UseChildrenChurchReturn {
    const [children, setChildren] = useState<Child[]>([]);
    const [ageGroups, setAgeGroups] = useState<AgeGroup[]>([]);
    const [classGroups, setClassGroups] = useState<ClassGroup[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [submitError, setSubmitError] = useState<string | null>(null);
    const [fetchTick, setFetchTick] = useState(0);

    // ── Initial load ──────────────────────────────────────────────────────────
    useEffect(() => {
        let cancelled = false;
        async function load() {
            setIsLoading(true);
            setError(null);
            try {
                const [ageRes, classRes] = await Promise.all([
                    api.get<{ data: AgeGroup[] }>("/children-church/age-groups"),
                    api.get<{ data: ClassGroup[] }>("/children-church/class-groups"),
                ]);
                if (!cancelled) {
                    setAgeGroups(ageRes.data.data);
                    setClassGroups(classRes.data.data);
                }
            } catch (err: unknown) {
                if (!cancelled)
                    setError(err instanceof Error ? err.message : "Failed to load children church data.");
            } finally {
                if (!cancelled) setIsLoading(false);
            }
        }
        load();
        return () => { cancelled = true; };
    }, [fetchTick]);

    // ── Child CRUD ────────────────────────────────────────────────────────────
    const createChild = useCallback(async (payload: CreateChildPayload): Promise<Child> => {
        setIsSubmitting(true);
        setSubmitError(null);
        try {
            const res = await api.post<{ data: Child }>("/children-church/children", payload);
            const child = res.data.data;
            setChildren((prev) => [child, ...prev]);
            return child;
        } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : "Failed to register child.";
            setSubmitError(msg); throw new Error(msg);
        } finally { setIsSubmitting(false); }
    }, []);

    const updateChild = useCallback(async (id: string, patch: Partial<CreateChildPayload>) => {
        setIsSubmitting(true);
        setSubmitError(null);
        try {
            await api.patch(`/children-church/children/${id}`, patch);
            setFetchTick((t) => t + 1);
        } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : "Failed to update child.";
            setSubmitError(msg); throw new Error(msg);
        } finally { setIsSubmitting(false); }
    }, []);

    const getChild = useCallback(async (id: string): Promise<Child> => {
        const res = await api.get<{ data: Child }>(`/children-church/children/${id}`);
        return res.data.data;
    }, []);

    const getCheckinHistory = useCallback(async (childId: string): Promise<CheckinRecord[]> => {
        const res = await api.get<{ data: { data: CheckinRecord[] } }>(
            `/children-church/children/${childId}/checkin-history?page=1&limit=20`
        );
        return res.data.data.data;
    }, []);

    // ── Guardian CRUD ─────────────────────────────────────────────────────────
    const addGuardian = useCallback(async (childId: string, payload: AddGuardianPayload) => {
        setIsSubmitting(true);
        setSubmitError(null);
        try {
            await api.post(`/children-church/children/${childId}/guardians`, payload);
        } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : "Failed to add guardian.";
            setSubmitError(msg); throw new Error(msg);
        } finally { setIsSubmitting(false); }
    }, []);

    const getGuardians = useCallback(async (childId: string): Promise<Guardian[]> => {
        const res = await api.get<{ data: Guardian[] }>(`/children-church/children/${childId}/guardians`);
        return res.data.data;
    }, []);

    const deleteGuardian = useCallback(async (guardianId: string) => {
        setIsSubmitting(true);
        setSubmitError(null);
        try {
            await api.delete(`/children-church/guardians/${guardianId}`);
        } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : "Failed to remove guardian.";
            setSubmitError(msg); throw new Error(msg);
        } finally { setIsSubmitting(false); }
    }, []);

    // ── Check-in / out ────────────────────────────────────────────────────────
    const checkin = useCallback(async (payload: CheckinPayload): Promise<CheckinResult> => {
        setIsSubmitting(true);
        setSubmitError(null);
        try {
            const res = await api.post<{ data: CheckinResult }>("/children-church/checkin", payload);
            return res.data.data;
        } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : "Check-in failed.";
            setSubmitError(msg); throw new Error(msg);
        } finally { setIsSubmitting(false); }
    }, []);

    const verifyPickupCode = useCallback(async (code: string): Promise<VerifyResult> => {
        const res = await api.get<{ data: VerifyResult }>(
            `/children-church/checkin/verify/${code.toUpperCase()}`
        );
        return res.data.data;
    }, []);

    const checkout = useCallback(async (payload: CheckoutPayload) => {
        setIsSubmitting(true);
        setSubmitError(null);
        try {
            await api.post("/children-church/checkout", payload);
        } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : "Checkout failed.";
            setSubmitError(msg); throw new Error(msg);
        } finally { setIsSubmitting(false); }
    }, []);

    const flagCheckin = useCallback(async (checkinId: string) => {
        await api.patch(`/children-church/checkin/${checkinId}/flag`);
    }, []);

    // ── Roster search & active board ─────────────────────────────────────────
    const searchChildren = useCallback(async (
        name?: string, classGroupId?: string, page = 1
    ): Promise<{ data: Child[]; totalPages: number; totalCount: number }> => {
        const params = new URLSearchParams({ page: String(page), limit: "20" });
        if (name) params.set("name", name);
        if (classGroupId) params.set("classGroupId", classGroupId);
        const res = await api.get<{ data: { data: Child[]; totalPages: number; totalCount: number } }>(
            `/children-church/children?${params.toString()}`
        );
        return res.data.data;
    }, []);

    const getActiveCheckIns = useCallback(async (classGroupId?: string): Promise<ActiveCheckIn[]> => {
        const params = classGroupId ? `?classGroupId=${classGroupId}` : "";
        const res = await api.get<{ data: ActiveCheckIn[] }>(`/children-church/checkin/active${params}`);
        return res.data.data;
    }, []);

    const refetch = useCallback(() => setFetchTick((t) => t + 1), []);

    return {
        children, ageGroups, classGroups,
        isLoading, isSubmitting, error, submitError,
        createChild, updateChild, getChild, getCheckinHistory,
        addGuardian, getGuardians, deleteGuardian,
        checkin, verifyPickupCode, checkout, flagCheckin,
        searchChildren, getActiveCheckIns,
        refetch,
    };
}