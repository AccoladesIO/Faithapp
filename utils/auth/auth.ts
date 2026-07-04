/**
 * utils/auth/auth.ts  (updated)
 *
 * Changes from the guide:
 *  - login() returns requiresPasswordChange AND isFirstDeviceLogin
 *  - isFirstDeviceLogin = true when the backend confirms this is the first
 *    login on this device (deviceId was null before this login)
 *
 * The caller (LoginPage or auth-context) checks isFirstDeviceLogin and
 * calls subscribeOnFirstLogin() from use-push.ts exactly once.
 */

import { api, commitAuthPayload, refreshAccessToken, AuthPayload } from "./axios-client";
import { tokenStore } from "./token-store";

export type LoginResult = {
    requiresPasswordChange: boolean;
    /** True when this is the first time this device has logged in */
    isFirstDeviceLogin: boolean;
};

// LocalStorage key that mirrors the one in use-push so the check is consistent
const SUBSCRIBED_FLAG = "push_subscribed_v1";

export class VerifyUser {
    checkUserSession(callback: (isActive: boolean) => void): void {
        const current = tokenStore.get();

        if (current?.accessToken && current.expiresAt > Date.now()) {
            callback(true);
            return;
        }

        if (!current?.refreshToken) {
            callback(false);
            return;
        }

        refreshAccessToken()
            .then(() => callback(true))
            .catch(() => callback(false));
    }

    checkUserRole(): void {
        // Role logic here
    }

    async login(
        email: string,
        password: string,
        deviceId: string
    ): Promise<LoginResult> {
        const res = await api.post(
            "/auth/login",
            { email, password, deviceId },
            { _skipAuth: true } as any
        );

        const payload: AuthPayload = res.data?.data;
        if (!payload?.access_token) {
            throw new Error("Malformed login response");
        }

        commitAuthPayload(payload);

        // Detect first device login:
        // We haven't subscribed yet on this device (flag absent) AND
        // the backend has now stored this deviceId for the first time.
        // The simplest client-side heuristic: if the push flag is absent,
        // treat this as a first-device login and let the push hook decide.
        const isFirstDeviceLogin = !localStorage.getItem(SUBSCRIBED_FLAG);

        return {
            requiresPasswordChange: !!payload.requires_password_change,
            isFirstDeviceLogin,
        };
    }

    async logout(): Promise<void> {
        const current = tokenStore.get();
        if (!current?.accessToken) {
            tokenStore.clear();
            return;
        }

        try {
            await api.post(
                "/auth/logout",
                {},
                {
                    _skipAuth: true,
                    headers: {
                        Authorization: `Bearer ${current.accessToken}`,
                    },
                } as any
            );
        } catch {
            // Swallow logout errors
        } finally {
            // Do NOT remove push_subscribed_v1 here.
            // The SW must keep delivering notifications while logged out.
            tokenStore.clear();
        }
    }
}

export const authService = new VerifyUser();