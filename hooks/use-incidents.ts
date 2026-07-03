"use client";

import { useCallback, useState } from "react";
import { api } from "@/utils/auth/axios-client";

export interface SubmitIncidentPayload {
    title: string;
    description: string;
    location: string;
    isAnonymous: boolean;
    images: File[];
}

export interface UseIncidentsReturn {
    isSubmitting: boolean;
    submitError: string | null;
    submitIncident: (payload: SubmitIncidentPayload) => Promise<void>;
}

export function useIncidents(): UseIncidentsReturn {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitError, setSubmitError] = useState<string | null>(null);

    const submitIncident = useCallback(async (payload: SubmitIncidentPayload) => {
        setIsSubmitting(true);
        setSubmitError(null);
        try {
            const formData = new FormData();
            formData.append("title", payload.title);
            formData.append("description", payload.description);
            formData.append("location", payload.location);
            formData.append("isAnonymous", payload.isAnonymous ? "true" : "false");
            payload.images.forEach((img) => formData.append("images", img));

            await api.post("/incidents", formData, {
                headers: { "Content-Type": "multipart/form-data" },
            });
        } catch (err: unknown) {
            const msg =
                err instanceof Error ? err.message : "Failed to submit incident report.";
            setSubmitError(msg);
            throw new Error(msg);
        } finally {
            setIsSubmitting(false);
        }
    }, []);

    return { isSubmitting, submitError, submitIncident };
}