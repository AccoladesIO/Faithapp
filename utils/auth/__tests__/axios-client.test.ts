import { AxiosError } from "axios";

jest.mock("../token-store", () => ({
    tokenStore: { get: jest.fn(), set: jest.fn(), clear: jest.fn(), subscribe: jest.fn(() => () => {}) },
    passwordChangeStore: { get: jest.fn(), set: jest.fn() },
}));

import { extractErrorMessage, commitAuthPayload } from "../axios-client";
import { tokenStore, passwordChangeStore } from "../token-store";

describe("extractErrorMessage", () => {
    it("returns a single string message from the response body", () => {
        const err = new AxiosError("Request failed", undefined, undefined, undefined, {
            status: 400,
            statusText: "Bad Request",
            data: { statusCode: 400, message: "Invalid email address" },
        } as never);
        expect(extractErrorMessage(err)).toBe("Invalid email address");
    });

    it("returns the first message when the response body carries a validation array", () => {
        const err = new AxiosError("Request failed", undefined, undefined, undefined, {
            status: 400,
            statusText: "Bad Request",
            data: { statusCode: 400, message: ["phoneNumber must be 7–20 digits", "email must be valid"] },
        } as never);
        expect(extractErrorMessage(err)).toBe("phoneNumber must be 7–20 digits");
    });

    it("falls back to the error field when message is absent", () => {
        const err = new AxiosError("Request failed", undefined, undefined, undefined, {
            status: 403,
            statusText: "Forbidden",
            data: { statusCode: 403, error: "PASSWORD_CHANGE_REQUIRED" },
        } as never);
        expect(extractErrorMessage(err)).toBe("PASSWORD_CHANGE_REQUIRED");
    });

    it("reports a network error when there is no response at all", () => {
        const err = new AxiosError("Network Error");
        expect(extractErrorMessage(err)).toBe("Network error — please check your connection.");
    });

    it("falls back to the HTTP status text when the body has no usable message", () => {
        const err = new AxiosError("Request failed", undefined, undefined, undefined, {
            status: 500,
            statusText: "Internal Server Error",
            data: {},
        } as never);
        expect(extractErrorMessage(err)).toBe("Internal Server Error");
    });

    it("returns a plain Error's message when the error isn't an AxiosError", () => {
        expect(extractErrorMessage(new Error("boom"))).toBe("boom");
    });

    it("returns a generic fallback for a non-Error, non-Axios value", () => {
        expect(extractErrorMessage("just a string")).toBe("An unexpected error occurred.");
    });
});

describe("commitAuthPayload", () => {
    beforeEach(() => jest.clearAllMocks());

    it("stores the tokens and computes an expiry timestamp from expires_in", () => {
        const before = Date.now();
        commitAuthPayload({
            token_type: "Bearer",
            expires_in: 3600,
            access_token: "at1",
            refresh_token: "rt1",
        });

        expect(tokenStore.set).toHaveBeenCalledTimes(1);
        const stored = (tokenStore.set as jest.Mock).mock.calls[0][0];
        expect(stored.accessToken).toBe("at1");
        expect(stored.refreshToken).toBe("rt1");
        expect(stored.expiresAt).toBeGreaterThanOrEqual(before + 3600 * 1000);
    });

    it("sets passwordChangeStore before tokenStore, reflecting requires_password_change", () => {
        commitAuthPayload({
            token_type: "Bearer",
            expires_in: 900,
            access_token: "at1",
            refresh_token: "rt1",
            requires_password_change: true,
        });

        expect(passwordChangeStore.set).toHaveBeenCalledWith(true);
    });

    it("clears passwordChangeStore when requires_password_change is absent", () => {
        commitAuthPayload({
            token_type: "Bearer",
            expires_in: 900,
            access_token: "at1",
            refresh_token: "rt1",
        });

        expect(passwordChangeStore.set).toHaveBeenCalledWith(false);
    });
});
