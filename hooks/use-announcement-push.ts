"use client";

/**
 * hooks/use-announcement-push.ts
 *
 * Polls /announcements/feed on a configurable interval and fires a
 * push notification via the service worker whenever a new announcement
 * appears (i.e. an id not seen in the previous fetch).
 *
 * The hook is designed to be mounted once at the app layout level so
 * it runs regardless of which page the user is on.
 */

import { useEffect, useRef } from "react";
import { api } from "@/utils/auth/axios-client";

interface Announcement {
    id: string;
    title: string;
    body: string;
    audience: string;
    createdAt: string;
}

interface UsePollAnnouncementsOptions {
    departmentId?: string;
    intervalMs?: number; // default: 60 000 (1 min)
}

export function useAnnouncementPush(opts: UsePollAnnouncementsOptions = {}) {
    const { departmentId, intervalMs = 60_000 } = opts;

    // Track which announcement IDs have already been notified this session.
    // We use a ref so the interval closure always reads the latest set.
    const seenIds = useRef<Set<string>>(new Set());
    // Flag so the very first fetch seeds seenIds without firing notifications
    // (we don't want to notify for all historical announcements on mount).
    const isFirstFetch = useRef(true);

    useEffect(() => {
        // Only run in browsers that support SW + Notifications
        if (
            typeof window === "undefined" ||
            !("serviceWorker" in navigator) ||
            !("Notification" in window)
        ) {
            return;
        }

        async function fetchAndNotify() {
            try {
                const params = new URLSearchParams({ page: "1", limit: "10" });
                if (departmentId) params.set("departmentId", departmentId);

                const res = await api.get<{ data: { data: Announcement[] } }>(
                    `/announcements/feed?${params.toString()}`
                );
                const announcements: Announcement[] = res.data.data.data;

                if (isFirstFetch.current) {
                    // Seed seen set so existing announcements don't fire on load
                    announcements.forEach((a) => seenIds.current.add(a.id));
                    isFirstFetch.current = false;
                    return;
                }

                // Find announcements not yet seen
                const newOnes = announcements.filter((a) => !seenIds.current.has(a.id));
                if (newOnes.length === 0) return;

                // Get the active SW registration
                const registration = await navigator.serviceWorker.ready;

                for (const ann of newOnes) {
                    seenIds.current.add(ann.id);

                    // Only show if permission is granted
                    if (Notification.permission !== "granted") continue;

                    // Cast to bypass `vibrate` missing from TS's NotificationOptions type.
                    // vibrate is valid in the SW Notifications spec.
                    const notifOptions = {
                        body: ann.body,
                        icon: "/icons/android-chrome-192x192.png",
                        badge: "/icons/android-chrome-192x192.png",
                        data: { url: "/home" },
                        vibrate: [200, 100, 200],
                        tag: ann.id,
                    } as NotificationOptions;
                    await registration.showNotification(ann.title, notifOptions);
                }
            } catch {
                // Silently ignore network or SW errors — this is best-effort
            }
        }

        // Immediate first call
        fetchAndNotify();

        // Then poll on interval
        const timer = setInterval(fetchAndNotify, intervalMs);
        return () => clearInterval(timer);
    }, [departmentId, intervalMs]);
}