"use client";

import { useState, useEffect } from "react";
import { api } from "@/utils/auth/axios-client";

export interface AnnouncementDetail {
    id: string;
    title: string;
    body: string;
    audience: string;
    createdAt: string;
    publishedAt: string | null;
    expiresAt: string | null;
    author: { firstname: string; lastname: string } | null;
    department: { id: string; name: string } | null;
    group: { id: string; name: string } | null;
}

export interface UseAnnouncementDetailReturn {
    announcement: AnnouncementDetail | null;
    isLoading: boolean;
    error: string | null;
}

export function useAnnouncementDetail(id: string | null | undefined): UseAnnouncementDetailReturn {
    const [announcement, setAnnouncement] = useState<AnnouncementDetail | null>(null);
    const [isLoading, setIsLoading] = useState(() => !!id);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!id) return;
        let cancelled = false;

        async function load() {
            setIsLoading(true);
            setError(null);
            try {
                const res = await api.get<{ data: AnnouncementDetail }>(`/announcements/${id}`);
                if (!cancelled) setAnnouncement(res.data.data);
            } catch (err: unknown) {
                if (!cancelled)
                    setError(err instanceof Error ? err.message : "Could not load this announcement.");
            } finally {
                if (!cancelled) setIsLoading(false);
            }
        }

        load();
        return () => { cancelled = true; };
    }, [id]);

    return {
        announcement: id ? announcement : null,
        isLoading: id ? isLoading : false,
        error: id ? error : null,
    };
}
