"use client";

import { useCallback, useState, useEffect } from "react";
import { api } from "@/utils/auth/axios-client";

export interface Sermon {
    id: string;
    title: string;
    speakerName: string;
    date: string;
    description: string | null;
    youtubeUrl: string | null;
    mixlrUrl: string | null;
    series: string | null;
    createdAt: string;
}

export interface SermonsPageResult {
    data: Sermon[];
    page: number;
    limit: number;
    totalCount: number;
    totalPages: number;
}

export interface UseSermonsReturn {
    sermons: Sermon[];
    isLoading: boolean;
    error: string | null;
    page: number;
    totalPages: number;
    series: string | null;
    setSeries: (series: string | null) => void;
    goToPage: (page: number) => void;
    refetch: () => void;
}

export function useSermons(limit = 10): UseSermonsReturn {
    const [sermons, setSermons] = useState<Sermon[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [series, setSeriesState] = useState<string | null>(null);
    const [fetchTick, setFetchTick] = useState(0);

    const setSeries = useCallback((s: string | null) => {
        setSeriesState(s);
        setPage(1);
    }, []);

    useEffect(() => {
        let cancelled = false;

        async function load() {
            setIsLoading(true);
            setError(null);
            try {
                const qs = new URLSearchParams({ page: String(page), limit: String(limit) });
                if (series) qs.set("series", series);
                const res = await api.get<{ data: SermonsPageResult }>(`/sermons?${qs.toString()}`);
                if (!cancelled) {
                    setSermons(res.data.data.data);
                    setTotalPages(res.data.data.totalPages);
                }
            } catch (err: unknown) {
                if (!cancelled)
                    setError(err instanceof Error ? err.message : "Could not load the sermon archive.");
            } finally {
                if (!cancelled) setIsLoading(false);
            }
        }

        load();
        return () => { cancelled = true; };
    }, [page, limit, series, fetchTick]);

    const refetch = useCallback(() => setFetchTick((t) => t + 1), []);

    return { sermons, isLoading, error, page, totalPages, series, setSeries, goToPage: setPage, refetch };
}

export interface UseSermonReturn {
    sermon: Sermon | null;
    isLoading: boolean;
    error: string | null;
}

export function useSermon(id: string): UseSermonReturn {
    const [sermon, setSermon] = useState<Sermon | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        let cancelled = false;

        async function load() {
            setIsLoading(true);
            setError(null);
            try {
                const res = await api.get<{ data: Sermon }>(`/sermons/${id}`);
                if (!cancelled) setSermon(res.data.data);
            } catch (err: unknown) {
                if (!cancelled)
                    setError(err instanceof Error ? err.message : "Could not load this sermon.");
            } finally {
                if (!cancelled) setIsLoading(false);
            }
        }

        load();
        return () => { cancelled = true; };
    }, [id]);

    return { sermon, isLoading, error };
}
