"use client";

import { useState, useCallback } from "react";
import { api } from "@/utils/auth/axios-client";
import { LeaveRecord, LeaveStatus } from "./use-leave";

export interface DepartmentLeavePagination {
    page: number;
    limit: number;
    totalCount: number;
    totalPages: number;
}

export interface UseDepartmentLeaveReturn {
    records: LeaveRecord[];
    pagination: DepartmentLeavePagination | null;
    isLoading: boolean;
    error: string | null;
    fetchDepartmentLeave: (page?: number, status?: LeaveStatus) => Promise<void>;
}

// HOD/Deputy HOD only — read-only view of the requester's own department's
// leave requests (who's requesting, and their current status). Kept separate
// from useLeave() (which is "my own" leave, auto-fetched on every mount) so a
// non-lead member never triggers this fetch at all.
export function useDepartmentLeave(): UseDepartmentLeaveReturn {
    const [records, setRecords] = useState<LeaveRecord[]>([]);
    const [pagination, setPagination] = useState<DepartmentLeavePagination | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchDepartmentLeave = useCallback(async (page = 1, status?: LeaveStatus) => {
        setIsLoading(true);
        setError(null);
        try {
            const params = new URLSearchParams({ page: String(page), limit: "10" });
            if (status) params.set("status", status);
            const res = await api.get<{
                data: {
                    data: LeaveRecord[];
                    page: number;
                    limit: number;
                    totalCount: number;
                    totalPages: number;
                };
            }>(`/leave/department?${params.toString()}`);
            setRecords(res.data.data.data);
            setPagination({
                page: res.data.data.page,
                limit: res.data.data.limit,
                totalCount: res.data.data.totalCount,
                totalPages: res.data.data.totalPages,
            });
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : "Failed to load department leave requests.");
        } finally {
            setIsLoading(false);
        }
    }, []);

    return { records, pagination, isLoading, error, fetchDepartmentLeave };
}
