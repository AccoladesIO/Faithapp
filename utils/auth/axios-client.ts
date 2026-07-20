import axios, { AxiosError, InternalAxiosRequestConfig } from "axios";
import { tokenStore, passwordChangeStore } from "./token-store";

declare module "axios" {
    interface InternalAxiosRequestConfig {
        _skipAuth?: boolean;
    }
    interface AxiosRequestConfig {
        _skipAuth?: boolean;
    }
}

type RetriableConfig = InternalAxiosRequestConfig & {
    _retry?: boolean;
};

export type AuthPayload = {
    token_type: string;
    expires_in: number;
    access_token: string;
    refresh_token: string;
    requires_password_change?: boolean;
};


interface ApiErrorBody {
    statusCode?: number;
    message?: string | string[];
    error?: string;
}


export function extractErrorMessage(err: unknown): string {
    if (err instanceof AxiosError) {
        const data = err.response?.data as ApiErrorBody | undefined;

        if (data?.message) {
            if (Array.isArray(data.message) && data.message.length > 0) {
                return data.message[0];
            }
            if (typeof data.message === "string" && data.message.trim()) {
                return data.message.trim();
            }
        }

        if (typeof data?.error === "string" && data.error.trim()) {
            return data.error.trim();
        }

        if (!err.response) {
            return "Network error — please check your connection.";
        }

        return (
            err.response.statusText ||
            `Request failed with status ${err.response.status}`
        );
    }

    if (err instanceof Error) return err.message;
    return "An unexpected error occurred.";
}

// ─── Axios instance ───────────────────────────────────────────────────────────

export const api = axios.create({
    baseURL: process.env.NEXT_PUBLIC_API_URL,
    withCredentials: true,
});

// ─── Request interceptor — attach Bearer token ────────────────────────────────

api.interceptors.request.use((config) => {
    const cfg = config as RetriableConfig;
    const t = tokenStore.get();
    if (t?.accessToken && !cfg._skipAuth) {
        config.headers.Authorization = `Bearer ${t.accessToken}`;
    }
    return config;
});

// ─── Auth helpers ─────────────────────────────────────────────────────────────

export const commitAuthPayload = (payload: AuthPayload) => {
    const expiresAt = Date.now() + payload.expires_in * 1000;
    // Set before tokenStore.set() — that call synchronously notifies
    // subscribers (e.g. AuthContext), which read this flag right away.
    passwordChangeStore.set(!!payload.requires_password_change);
    tokenStore.set({
        accessToken: payload.access_token,
        refreshToken: payload.refresh_token,
        expiresAt,
    });
    const expiresAtTime = new Date(expiresAt).toLocaleTimeString("en-GB", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
    });
    console.log(
        `[Auth ${new Date().toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}]`,
        `💾 Token committed — expires_in: ${payload.expires_in}s — expires at: ${expiresAtTime}`
    );
};

// Best-effort backend notification when a session ends here (refresh failed on
// a 401 retry). Deliberately not importing authService from ./auth — that
// module imports `api` from this file, so importing it back here would be a
// circular dependency. This mirrors authService.logout()'s request shape
// exactly, using the raw axios client (not `api`) to avoid recursing into
// this same response interceptor.
const notifyLogoutBestEffort = async (): Promise<void> => {
    const current = tokenStore.get();
    if (!current?.accessToken) return;
    try {
        await axios.post(
            `${api.defaults.baseURL}/auth/logout`,
            {},
            { headers: { Authorization: `Bearer ${current.accessToken}` } }
        );
    } catch {
        // Best-effort — the access token may already be expired.
    }
};

let refreshPromise: Promise<string> | null = null;

const doRefresh = async (): Promise<string> => {
    const current = tokenStore.get();
    if (!current?.refreshToken) throw new Error("No refresh token available");

    console.log(
        `[Auth ${new Date().toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}]`,
        "📡 Sending refresh request to /auth/refresh..."
    );

    const res = await axios.post(
        `${api.defaults.baseURL}/auth/refresh`,
        {},
        {
            withCredentials: true,
            headers: {
                Authorization: `Bearer ${current.refreshToken}`,
            },
        }
    );

    const payload: AuthPayload = res.data?.data;
    if (!payload?.access_token) throw new Error("Malformed refresh response");
    commitAuthPayload(payload);
    return payload.access_token;
};

export const refreshAccessToken = (): Promise<string> => {
    if (!refreshPromise) {
        refreshPromise = doRefresh().finally(() => {
            refreshPromise = null;
        });
    } else {
        console.log(
            `[Auth ${new Date().toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}]`,
            "⏳ Refresh already in progress — reusing existing promise"
        );
    }
    return refreshPromise;
};


api.interceptors.response.use(
    (res) => res,
    async (error: AxiosError) => {
        const config = error.config as RetriableConfig | undefined;

        if (
            config &&
            !config._retry &&
            !config._skipAuth &&
            error.response?.status === 401
        ) {
            console.log(
                `[Auth ${new Date().toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}]`,
                `⚠️  401 on ${config.url} — attempting token refresh before retry`
            );
            config._retry = true;
            try {
                const newToken = await refreshAccessToken();
                config.headers = config.headers ?? {};
                (config.headers as Record<string, string>).Authorization = `Bearer ${newToken}`;
                console.log(
                    `[Auth ${new Date().toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}]`,
                    `🔁 Retrying ${config.url} with new token`
                );
                return api(config);
            } catch (refreshErr) {
                console.log(
                    `[Auth ${new Date().toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}]`,
                    "❌ Refresh failed on 401 retry — logging out"
                );
                // Read the access token before clearing — notifyLogoutBestEffort needs it.
                await notifyLogoutBestEffort();
                tokenStore.clear();
                return Promise.reject(new Error("Session expired. Please sign in again."));
            }
        }
        return Promise.reject(new Error(extractErrorMessage(error)));
    }
);