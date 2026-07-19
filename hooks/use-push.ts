
"use client";

import { useState, useEffect, useCallback } from "react";
import { urlBase64ToUint8Array, arrayBufferToBase64 } from "@/lib/push-helpers";
import { api } from "@/utils/auth/axios-client";

export type PushPermission = "default" | "granted" | "denied" | "unsupported";

// LocalStorage key that marks "we have already subscribed on this device"
const SUBSCRIBED_FLAG = "push_subscribed_v1";

export interface UsePushReturn {
    isSubscribed: boolean;
    permission: PushPermission;
    isLoading: boolean;
    error: string | null;
    /** Call once after first-device login */
    subscribeOnFirstLogin: () => Promise<void>;
    /** Explicit opt-in from settings — always runs, no "already tried" guard */
    subscribe: () => Promise<void>;
    /** Explicit opt-out from settings */
    unsubscribe: () => Promise<void>;
}

export function usePush(): UsePushReturn {
    const [isSubscribed, setIsSubscribed] = useState(false);
    const [permission, setPermission] = useState<PushPermission>("default");
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // ── Read real state from browser on mount ─────────────────────────────────
    useEffect(() => {
        async function init() {
            if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
                setPermission("unsupported");
                setIsLoading(false);
                return;
            }

            setPermission(Notification.permission as PushPermission);

            if (Notification.permission === "granted") {
                const reg = await navigator.serviceWorker.ready;
                const existing = await reg.pushManager.getSubscription();
                setIsSubscribed(!!existing);
            } else {
                setIsSubscribed(false);
                localStorage.removeItem(SUBSCRIBED_FLAG);
            }

            setIsLoading(false);
        }
        init();
    }, []);

    // ── Subscribe — the real flow, always runs when called ────────────────────
    const subscribe = useCallback(async () => {
        // Guard: only run in browsers that support push
        if (!("serviceWorker" in navigator) || !("PushManager" in window)) return;

        setIsLoading(true);
        setError(null);

        try {
            // 1. Request permission
            const result = await Notification.requestPermission();
            setPermission(result as PushPermission);
            if (result !== "granted") return;

            // 2. Get VAPID public key
            const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
            if (!vapidKey) throw new Error("VAPID public key is not configured.");

            // 3. Create the push subscription via PushManager
            const reg = await navigator.serviceWorker.ready;
            const subscription = await reg.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: urlBase64ToUint8Array(vapidKey),
            });

            // 4. Extract the three fields the backend expects
            const endpoint = subscription.endpoint;
            const p256dh = arrayBufferToBase64(subscription.getKey("p256dh")!);
            const auth = arrayBufferToBase64(subscription.getKey("auth")!);

            // 5. Send to backend
            await api.post("/notifications/subscribe", { endpoint, p256dh, auth });

            // 6. Mark as subscribed so the first-login flow never re-prompts on this device
            localStorage.setItem(SUBSCRIBED_FLAG, "1");
            setIsSubscribed(true);
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : "Push subscription failed.");
        } finally {
            setIsLoading(false);
        }
    }, []);

    // ── Subscribe — called once after first-device login, skips if already tried ──
    const subscribeOnFirstLogin = useCallback(async () => {
        if (localStorage.getItem(SUBSCRIBED_FLAG)) return;
        await subscribe();
    }, [subscribe]);

    // ── Explicit opt-out ──────────────────────────────────────────────────────
    const unsubscribe = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            // Remove from browser
            const reg = await navigator.serviceWorker.ready;
            const subscription = await reg.pushManager.getSubscription();
            await subscription?.unsubscribe();

            // Remove from backend
            await api.delete("/notifications/subscribe");

            localStorage.removeItem(SUBSCRIBED_FLAG);
            setIsSubscribed(false);
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : "Failed to unsubscribe.");
        } finally {
            setIsLoading(false);
        }
    }, []);

    return { isSubscribed, permission, isLoading, error, subscribeOnFirstLogin, subscribe, unsubscribe };
}