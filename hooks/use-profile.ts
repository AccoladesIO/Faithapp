// hooks/use-profile.ts
"use client";

import { useState, useEffect } from "react";
import { api } from "@/utils/auth/axios-client";

export interface Department {
    id: string;
    name: string;
    key: string | null;
}

export interface WorkerProfile {
    id: string;
    department: Department;
    status: string;
    profession: string;
    yearJoinedWorkforce: string;
    completedSOD: boolean;
    completedBibleCollege: boolean;
}

export interface UserProfile {
    id: string;
    firstname: string;
    lastname: string;
    email: string;
    phoneNumber: string;
    role: string;
    status: string;
    gender: string;
    maritalStatus: string;
    changedPassword: boolean;
    workerProfile: WorkerProfile | null;
}

export interface UseProfileReturn {
    profile: UserProfile | null;
    isLoading: boolean;
    error: string | null;
}

export function useProfile(): UseProfileReturn {
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        let cancelled = false;

        async function load() {
            setIsLoading(true);
            setError(null);
            try {
                const res = await api.get<{ data: UserProfile }>("/auth/me");
                if (!cancelled) setProfile(res.data.data);
            } catch (err: unknown) {
                if (!cancelled) {
                    setError(
                        err instanceof Error ? err.message : "Failed to load profile."
                    );
                }
            } finally {
                if (!cancelled) setIsLoading(false);
            }
        }

        load();
        return () => { cancelled = true; };
    }, []);

    return { profile, isLoading, error };
}