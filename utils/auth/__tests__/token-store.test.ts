import { tokenStore, passwordChangeStore } from "../token-store";

beforeEach(() => {
    tokenStore.clear();
});

describe("tokenStore", () => {
    it("returns null when nothing has been set", () => {
        expect(tokenStore.get()).toBeNull();
    });

    it("set() persists the refresh token to localStorage and returns it via get()", () => {
        tokenStore.set({ accessToken: "at1", refreshToken: "rt1", expiresAt: 12345 });
        expect(tokenStore.get()).toEqual({ accessToken: "at1", refreshToken: "rt1", expiresAt: 12345 });
        expect(localStorage.getItem("dc_rt")).toBe("rt1");
    });

    it("only persists the refresh token — not the access token or expiry — across a fresh module load", () => {
        // Simulates a full app close/reopen: the in-memory `tokens` singleton is
        // gone, so get() must fall back to what's actually durable in storage.
        tokenStore.set({ accessToken: "at1", refreshToken: "rt1", expiresAt: 12345 });
        localStorage.setItem("dc_rt", "rt1"); // already true, but make the fallback path explicit
        jest.resetModules();
        return import("../token-store").then(({ tokenStore: freshStore }) => {
            expect(freshStore.get()).toEqual({ accessToken: "", refreshToken: "rt1", expiresAt: 0 });
        });
    });

    it("clear() removes both the refresh token and the password-change flag", () => {
        tokenStore.set({ accessToken: "at1", refreshToken: "rt1", expiresAt: 12345 });
        passwordChangeStore.set(true);

        tokenStore.clear();

        expect(tokenStore.get()).toBeNull();
        expect(passwordChangeStore.get()).toBe(false);
    });

    it("notifies subscribers on set() and clear()", () => {
        const listener = jest.fn();
        const unsubscribe = tokenStore.subscribe(listener);

        tokenStore.set({ accessToken: "at1", refreshToken: "rt1", expiresAt: 1 });
        expect(listener).toHaveBeenLastCalledWith({ accessToken: "at1", refreshToken: "rt1", expiresAt: 1 });

        tokenStore.clear();
        expect(listener).toHaveBeenLastCalledWith(null);

        unsubscribe();
        tokenStore.set({ accessToken: "at2", refreshToken: "rt2", expiresAt: 2 });
        expect(listener).toHaveBeenCalledTimes(2);
    });
});

describe("passwordChangeStore", () => {
    it("defaults to false", () => {
        expect(passwordChangeStore.get()).toBe(false);
    });

    it("set(true) persists the flag", () => {
        passwordChangeStore.set(true);
        expect(passwordChangeStore.get()).toBe(true);
        expect(localStorage.getItem("dc_pwd_chg")).toBe("1");
    });

    it("set(false) clears the flag", () => {
        passwordChangeStore.set(true);
        passwordChangeStore.set(false);
        expect(passwordChangeStore.get()).toBe(false);
        expect(localStorage.getItem("dc_pwd_chg")).toBeNull();
    });
});
