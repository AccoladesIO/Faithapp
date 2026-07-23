jest.mock("../axios-client", () => ({
    api: { post: jest.fn() },
    commitAuthPayload: jest.fn(),
    refreshAccessToken: jest.fn(),
}));
jest.mock("../token-store", () => ({
    tokenStore: { get: jest.fn(), clear: jest.fn() },
}));

import { authService } from "../auth";
import { api, commitAuthPayload, refreshAccessToken } from "../axios-client";
import { tokenStore } from "../token-store";

const mockPost = api.post as jest.MockedFunction<typeof api.post>;
const mockCommit = commitAuthPayload as jest.MockedFunction<typeof commitAuthPayload>;
const mockRefresh = refreshAccessToken as jest.MockedFunction<typeof refreshAccessToken>;
const mockGet = tokenStore.get as jest.MockedFunction<typeof tokenStore.get>;
const mockClear = tokenStore.clear as jest.MockedFunction<typeof tokenStore.clear>;

beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
});

describe("authService.login", () => {
    it("commits the payload and reports requiresPasswordChange from the response", async () => {
        mockPost.mockResolvedValueOnce({
            data: { data: { access_token: "at1", refresh_token: "rt1", expires_in: 3600, requires_password_change: true } },
        });

        const result = await authService.login("a@b.com", "pw", "device-1");

        expect(mockPost).toHaveBeenCalledWith(
            "/auth/login",
            { email: "a@b.com", password: "pw", deviceId: "device-1" },
            { _skipAuth: true },
        );
        expect(mockCommit).toHaveBeenCalled();
        expect(result.requiresPasswordChange).toBe(true);
    });

    it("reports isFirstDeviceLogin=true when the push-subscribed flag is absent", async () => {
        mockPost.mockResolvedValueOnce({ data: { data: { access_token: "at1", refresh_token: "rt1", expires_in: 3600 } } });

        const result = await authService.login("a@b.com", "pw", "device-1");

        expect(result.isFirstDeviceLogin).toBe(true);
    });

    it("reports isFirstDeviceLogin=false once this device has already subscribed to push", async () => {
        localStorage.setItem("push_subscribed_v1", "1");
        mockPost.mockResolvedValueOnce({ data: { data: { access_token: "at1", refresh_token: "rt1", expires_in: 3600 } } });

        const result = await authService.login("a@b.com", "pw", "device-1");

        expect(result.isFirstDeviceLogin).toBe(false);
    });

    it("throws on a malformed response with no access_token", async () => {
        mockPost.mockResolvedValueOnce({ data: { data: {} } });

        await expect(authService.login("a@b.com", "pw", "device-1")).rejects.toThrow("Malformed login response");
    });
});

describe("authService.logout", () => {
    it("clears the token store immediately when there is no access token", async () => {
        mockGet.mockReturnValue(null);

        await authService.logout();

        expect(mockPost).not.toHaveBeenCalled();
        expect(mockClear).toHaveBeenCalled();
    });

    it("notifies the backend and clears the token store when a session exists", async () => {
        mockGet.mockReturnValue({ accessToken: "at1", refreshToken: "rt1", expiresAt: 123 });
        mockPost.mockResolvedValueOnce({ data: {} });

        await authService.logout();

        expect(mockPost).toHaveBeenCalledWith(
            "/auth/logout",
            {},
            { _skipAuth: true, headers: { Authorization: "Bearer at1" } },
        );
        expect(mockClear).toHaveBeenCalled();
    });

    it("still clears the token store even if the logout request fails", async () => {
        mockGet.mockReturnValue({ accessToken: "at1", refreshToken: "rt1", expiresAt: 123 });
        mockPost.mockRejectedValueOnce(new Error("network down"));

        await authService.logout();

        expect(mockClear).toHaveBeenCalled();
    });
});

describe("authService.checkUserSession", () => {
    it("reports active immediately when the access token is still valid", () => {
        mockGet.mockReturnValue({ accessToken: "at1", refreshToken: "rt1", expiresAt: Date.now() + 60_000 });
        const callback = jest.fn();

        authService.checkUserSession(callback);

        expect(callback).toHaveBeenCalledWith(true);
        expect(mockRefresh).not.toHaveBeenCalled();
    });

    it("reports inactive when there is no refresh token to fall back on", () => {
        mockGet.mockReturnValue(null);
        const callback = jest.fn();

        authService.checkUserSession(callback);

        expect(callback).toHaveBeenCalledWith(false);
    });

    it("attempts a refresh when the access token is missing/expired but a refresh token exists", async () => {
        mockGet.mockReturnValue({ accessToken: "", refreshToken: "rt1", expiresAt: 0 });
        mockRefresh.mockResolvedValueOnce("new-access-token");
        const callback = jest.fn();

        authService.checkUserSession(callback);
        await Promise.resolve();
        await Promise.resolve();

        expect(callback).toHaveBeenCalledWith(true);
    });

    it("reports inactive when the refresh attempt fails", async () => {
        mockGet.mockReturnValue({ accessToken: "", refreshToken: "rt1", expiresAt: 0 });
        mockRefresh.mockRejectedValueOnce(new Error("refresh failed"));
        const callback = jest.fn();

        authService.checkUserSession(callback);
        await Promise.resolve();
        await Promise.resolve();

        expect(callback).toHaveBeenCalledWith(false);
    });
});
