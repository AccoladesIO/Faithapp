const SESSION_KEY = "dc_rt";
const PASSWORD_CHANGE_KEY = "dc_pwd_chg";

type Tokens = {
    accessToken: string;
    refreshToken: string;
    expiresAt: number;
};

let tokens: Tokens | null = null;
const listeners = new Set<(t: Tokens | null) => void>();

export const tokenStore = {
    get: (): Tokens | null => {
        if (tokens) return tokens;
        const rt = localStorage.getItem(SESSION_KEY);
        if (!rt) return null;
        return { accessToken: "", refreshToken: rt, expiresAt: 0 };
    },

    set: (next: Tokens | null) => {
        tokens = next;
        if (next) {
            localStorage.setItem(SESSION_KEY, next.refreshToken);
        } else {
            localStorage.removeItem(SESSION_KEY);
        }
        listeners.forEach((l) => l(next));
    },

    clear: () => {
        tokens = null;
        localStorage.removeItem(SESSION_KEY);
        localStorage.removeItem(PASSWORD_CHANGE_KEY);
        listeners.forEach((l) => l(null));
    },

    subscribe: (fn: (t: Tokens | null) => void) => {
        listeners.add(fn);
        return () => listeners.delete(fn);
    },
};

// Mirrors the refresh token's persistence: the JS heap resets on a full app
// close, so this has to survive in localStorage too, not just React state,
// for the gate to know on reopen — before any network round trip completes —
// whether a forced password change is still outstanding.
export const passwordChangeStore = {
    get: (): boolean => localStorage.getItem(PASSWORD_CHANGE_KEY) === "1",
    set: (required: boolean) => {
        if (required) localStorage.setItem(PASSWORD_CHANGE_KEY, "1");
        else localStorage.removeItem(PASSWORD_CHANGE_KEY);
    },
};