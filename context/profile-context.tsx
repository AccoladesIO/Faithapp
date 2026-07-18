"use client";

import React, { createContext, useCallback, useContext, useEffect, useState } from "react";
import { api } from "@/utils/auth/axios-client";
import { useAuth } from "./auth-context";

export interface Department {
    id: string;
    name: string;
    key: string | null;
}

export interface WorkerProfile {
    id: string;
    status: string;
    profession: string;
    yearJoinedWorkforce: string;
    completedSOD: boolean;
    completedBibleCollege: boolean;
    department: Department;
    secondaryDepartment: Department | null;
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
    birthDay: number | null;
    birthMonth: number | null;
    birthYear: number | null;
    changedPassword: boolean;
    workerProfile: WorkerProfile | null;
    isHod: boolean;
    pastorType: "LEAD" | "PARISH" | "ASSOCIATE" | null;
}

export const PASTOR_TYPE_LABELS: Record<"LEAD" | "PARISH" | "ASSOCIATE", string> = {
    LEAD: "Lead Pastor",
    PARISH: "Parish Pastor",
    ASSOCIATE: "Associate Pastor",
};

type ProfileState = {
    profile: UserProfile | null;
    isLoading: boolean;
    error: string | null;
    refetch: () => void;
};

const ProfileContext = createContext<ProfileState | null>(null);

export function ProfileProvider({ children }: { children: React.ReactNode }) {
    const { isAuthenticated } = useAuth();
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const load = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const res = await api.get<{ data: UserProfile }>("/auth/me");
            setProfile(res.data.data);
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : "Failed to load profile.");
        } finally {
            setIsLoading(false);
        }
    }, []);

    const reset = useCallback(() => {
        setProfile(null);
        setIsLoading(false);
    }, []);

    useEffect(() => {
        if (isAuthenticated) {
            load();
        } else {
            reset();
        }
    }, [isAuthenticated, load, reset]);

    return (
        <ProfileContext.Provider value={{ profile, isLoading, error, refetch: load }}>
            {children}
        </ProfileContext.Provider>
    );
}

export function useProfile(): ProfileState {
    const ctx = useContext(ProfileContext);
    if (!ctx) throw new Error("useProfile must be used within ProfileProvider");
    return ctx;
}
