"use client";

import { useCallback, useState } from "react";
import { api } from "@/utils/auth/axios-client";

export interface UpdateMyProfilePayload {
    firstname?: string;
    lastname?: string;
    phoneNumber?: string;
    gender?: string;
    birthDay?: number;
    birthMonth?: number;
    birthYear?: number;
    maritalStatus?: string;
}

function extractMessage(err: unknown, fallback: string): string {
    if (err && typeof err === "object" && "response" in err) {
        const res = (err as { response?: { data?: { message?: string } } }).response;
        if (res?.data?.message) return res.data.message;
    }
    if (err instanceof Error) return err.message;
    return fallback;
}

export function useEditProfile() {
    const [isSubmitting, setIsSubmitting] = useState(false);

    const updateMyProfile = useCallback(async (payload: UpdateMyProfilePayload) => {
        setIsSubmitting(true);
        try {
            const res = await api.patch("/members/me", payload);
            return res.data?.data;
        } catch (err: unknown) {
            throw new Error(extractMessage(err, "Failed to update profile."));
        } finally {
            setIsSubmitting(false);
        }
    }, []);

    const requestEmailChange = useCallback(async (newEmail: string) => {
        setIsSubmitting(true);
        try {
            const res = await api.post("/auth/email-change/request", { newEmail });
            return res.data?.message as string;
        } catch (err: unknown) {
            throw new Error(extractMessage(err, "Failed to request email change."));
        } finally {
            setIsSubmitting(false);
        }
    }, []);

    const confirmEmailChange = useCallback(async (otp: string) => {
        setIsSubmitting(true);
        try {
            const res = await api.post("/auth/email-change/confirm", { otp });
            return res.data?.message as string;
        } catch (err: unknown) {
            throw new Error(extractMessage(err, "Failed to confirm email change."));
        } finally {
            setIsSubmitting(false);
        }
    }, []);

    return { isSubmitting, updateMyProfile, requestEmailChange, confirmEmailChange };
}
