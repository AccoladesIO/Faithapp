"use client";

import { useCallback, useEffect, useState } from "react";
import { api } from "@/utils/auth/axios-client";

export interface SermonNote {
    id: string;
    note: string;
    createdAt: string;
    updatedAt: string;
}

export interface UseSermonNoteReturn {
    note: SermonNote | null;
    isLoading: boolean;
    isSaving: boolean;
    error: string | null;
    saveNote: (note: string) => Promise<void>;
    deleteNote: () => Promise<void>;
}

export function useSermonNote(sermonId: string): UseSermonNoteReturn {
    const [note, setNote] = useState<SermonNote | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        let cancelled = false;

        async function load() {
            setIsLoading(true);
            setError(null);
            try {
                const res = await api.get<{ data: SermonNote | null }>(`/sermons/${sermonId}/note`);
                if (!cancelled) setNote(res.data.data);
            } catch (err: unknown) {
                if (!cancelled)
                    setError(err instanceof Error ? err.message : "Could not load your note.");
            } finally {
                if (!cancelled) setIsLoading(false);
            }
        }

        load();
        return () => { cancelled = true; };
    }, [sermonId]);

    const saveNote = useCallback(async (text: string) => {
        setIsSaving(true);
        setError(null);
        try {
            const res = await api.put<{ data: SermonNote }>(`/sermons/${sermonId}/note`, { note: text });
            setNote(res.data.data);
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : "Could not save your note.");
            throw err;
        } finally {
            setIsSaving(false);
        }
    }, [sermonId]);

    const deleteNote = useCallback(async () => {
        setIsSaving(true);
        setError(null);
        try {
            await api.delete(`/sermons/${sermonId}/note`);
            setNote(null);
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : "Could not delete your note.");
            throw err;
        } finally {
            setIsSaving(false);
        }
    }, [sermonId]);

    return { note, isLoading, isSaving, error, saveNote, deleteNote };
}
