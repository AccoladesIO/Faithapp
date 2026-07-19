"use client";

import { useState, useEffect } from "react";
import { api } from "@/utils/auth/axios-client";

export type ChurchClassType =
    | "BELIEVERS"
    | "BAPTISMAL"
    | "WORKERS_IN_TRAINING"
    | "BIBLE_COLLEGE"
    | "SCHOOL_OF_DISCIPLESHIP";

export const CLASS_TYPE_LABELS: Record<ChurchClassType, string> = {
    BELIEVERS: "Believers' Class",
    BAPTISMAL: "Baptismal Class",
    WORKERS_IN_TRAINING: "Workers in Training",
    BIBLE_COLLEGE: "Bible College",
    SCHOOL_OF_DISCIPLESHIP: "School of Discipleship",
};

export type EnrollmentStatus = "IN_PROGRESS" | "COMPLETED" | "CANCELLED";

export interface ChurchClass {
    id: string;
    name: string;
    type: ChurchClassType;
    description: string | null;
    status: "ACTIVE" | "CLOSED";
    facilitator: { id: string; firstname: string; lastname: string } | null;
    startDate: string | null;
    endDate: string | null;
}

export interface ClassesPage {
    data: ChurchClass[];
    page: number;
    limit: number;
    totalCount: number;
    totalPages: number;
}

export interface UseClassesReturn {
    classes: ChurchClass[];
    isLoading: boolean;
    error: string | null;
    page: number;
    totalPages: number;
    goToPage: (page: number) => void;
    typeFilter: ChurchClassType | null;
    setTypeFilter: (type: ChurchClassType | null) => void;
}

export function useClasses(limit = 10): UseClassesReturn {
    const [classes, setClasses] = useState<ChurchClass[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [typeFilter, setTypeFilterState] = useState<ChurchClassType | null>(null);

    useEffect(() => {
        let cancelled = false;

        async function load() {
            setIsLoading(true);
            setError(null);
            try {
                const params = new URLSearchParams({ page: String(page), limit: String(limit) });
                if (typeFilter) params.set("type", typeFilter);
                const res = await api.get<{ data: ClassesPage }>(`/classes?${params.toString()}`);
                if (!cancelled) {
                    setClasses(res.data.data.data);
                    setTotalPages(res.data.data.totalPages);
                }
            } catch (err: unknown) {
                if (!cancelled)
                    setError(err instanceof Error ? err.message : "Could not load classes.");
            } finally {
                if (!cancelled) setIsLoading(false);
            }
        }

        load();
        return () => { cancelled = true; };
    }, [page, limit, typeFilter]);

    const setTypeFilter = (type: ChurchClassType | null) => {
        setTypeFilterState(type);
        setPage(1);
    };

    return { classes, isLoading, error, page, totalPages, goToPage: setPage, typeFilter, setTypeFilter };
}

export interface UseClassDetailReturn {
    churchClass: ChurchClass | null;
    isLoading: boolean;
    error: string | null;
}

export function useClassDetail(id: string | null | undefined): UseClassDetailReturn {
    const [churchClass, setChurchClass] = useState<ChurchClass | null>(null);
    const [isLoading, setIsLoading] = useState(() => !!id);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!id) return;
        let cancelled = false;

        async function load() {
            setIsLoading(true);
            setError(null);
            try {
                const res = await api.get<{ data: ChurchClass }>(`/classes/${id}`);
                if (!cancelled) setChurchClass(res.data.data);
            } catch (err: unknown) {
                if (!cancelled)
                    setError(err instanceof Error ? err.message : "Could not load this class.");
            } finally {
                if (!cancelled) setIsLoading(false);
            }
        }

        load();
        return () => { cancelled = true; };
    }, [id]);

    return { churchClass: id ? churchClass : null, isLoading: id ? isLoading : false, error: id ? error : null };
}

export interface MyClassEnrollment {
    id: string;
    status: EnrollmentStatus;
    enrolledAt: string;
    completedAt: string | null;
    cancelledAt: string | null;
    churchClass: ChurchClass;
}

export interface UseMyEnrollmentsReturn {
    enrollments: MyClassEnrollment[];
    isLoading: boolean;
    error: string | null;
}

export function useMyEnrollments(): UseMyEnrollmentsReturn {
    const [enrollments, setEnrollments] = useState<MyClassEnrollment[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        let cancelled = false;

        async function load() {
            setIsLoading(true);
            setError(null);
            try {
                const res = await api.get<{ data: MyClassEnrollment[] }>("/classes/my/enrollments");
                if (!cancelled) setEnrollments(res.data.data);
            } catch (err: unknown) {
                if (!cancelled)
                    setError(err instanceof Error ? err.message : "Could not load your enrollments.");
            } finally {
                if (!cancelled) setIsLoading(false);
            }
        }

        load();
        return () => { cancelled = true; };
    }, []);

    return { enrollments, isLoading, error };
}
