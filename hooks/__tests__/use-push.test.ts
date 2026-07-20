import { renderHook, waitFor, act } from "@testing-library/react";
import "@testing-library/jest-dom";
import { usePush } from "../use-push";
import { api } from "@/utils/auth/axios-client";

jest.mock("@/utils/auth/axios-client", () => ({
    api: { post: jest.fn(), delete: jest.fn() },
}));

const mockPost = api.post as jest.MockedFunction<typeof api.post>;
const mockDelete = api.delete as jest.MockedFunction<typeof api.delete>;

function mockServiceWorker(ready: Promise<ServiceWorkerRegistration>) {
    Object.defineProperty(window.navigator, "serviceWorker", {
        value: { ready },
        configurable: true,
    });
    Object.defineProperty(window, "PushManager", {
        value: function PushManager() {},
        configurable: true,
    });
}

function mockNotification(permission: NotificationPermission, requestPermission?: jest.Mock) {
    Object.defineProperty(window, "Notification", {
        value: { permission, requestPermission: requestPermission ?? jest.fn() },
        configurable: true,
    });
}

beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
});

describe("usePush", () => {
    it("reports unsupported and resolves isLoading when the browser has no push APIs", async () => {
        delete (window.navigator as { serviceWorker?: unknown }).serviceWorker;
        delete (window as { PushManager?: unknown }).PushManager;

        const { result } = renderHook(() => usePush());
        await waitFor(() => expect(result.current.isLoading).toBe(false));

        expect(result.current.permission).toBe("unsupported");
    });

    it("resolves isSubscribed=true when permission is granted and a subscription already exists", async () => {
        mockNotification("granted");
        const registration = {
            pushManager: { getSubscription: jest.fn().mockResolvedValue({ endpoint: "https://push.example/1" }) },
        } as unknown as ServiceWorkerRegistration;
        mockServiceWorker(Promise.resolve(registration));

        const { result } = renderHook(() => usePush());
        await waitFor(() => expect(result.current.isLoading).toBe(false));

        expect(result.current.isSubscribed).toBe(true);
    });

    it("falls back to isSubscribed=false instead of hanging forever when serviceWorker.ready never settles", async () => {
        // Regression test: navigator.serviceWorker.ready doesn't reject when no
        // service worker ever activates for the page (e.g. dev builds, or a
        // device where registration silently stalls) — it just hangs forever.
        // A plain try/catch can't recover from a promise that never settles;
        // this only resolves because of the timeout race in withTimeout().
        jest.useFakeTimers();
        mockNotification("granted");
        mockServiceWorker(new Promise(() => { /* never resolves */ }));

        const { result } = renderHook(() => usePush());

        expect(result.current.isLoading).toBe(true);

        await act(async () => {
            await jest.advanceTimersByTimeAsync(8000);
        });

        expect(result.current.isLoading).toBe(false);
        expect(result.current.isSubscribed).toBe(false);

        jest.useRealTimers();
    });

    it("subscribe() sends the subscription to the backend and marks isSubscribed=true", async () => {
        process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY = "dGVzdC1rZXk"; // base64url, no padding needed
        mockNotification("default", jest.fn().mockResolvedValue("granted"));
        const subscription = {
            endpoint: "https://push.example/1",
            getKey: () => new ArrayBuffer(8),
        };
        const registration = {
            pushManager: { subscribe: jest.fn().mockResolvedValue(subscription) },
        } as unknown as ServiceWorkerRegistration;
        mockServiceWorker(Promise.resolve(registration));
        mockPost.mockResolvedValueOnce({ data: {} });

        const { result } = renderHook(() => usePush());
        await waitFor(() => expect(result.current.isLoading).toBe(false));

        await act(async () => { await result.current.subscribe(); });

        expect(mockPost).toHaveBeenCalledWith(
            "/notifications/subscribe",
            expect.objectContaining({ endpoint: "https://push.example/1" }),
        );
        expect(result.current.isSubscribed).toBe(true);
        expect(localStorage.getItem("push_subscribed_v1")).toBe("1");
    });

    it("unsubscribe() removes the subscription from the backend and clears isSubscribed", async () => {
        mockNotification("granted");
        const subscription = { unsubscribe: jest.fn().mockResolvedValue(true) };
        const registration = {
            pushManager: { getSubscription: jest.fn().mockResolvedValue(subscription) },
        } as unknown as ServiceWorkerRegistration;
        mockServiceWorker(Promise.resolve(registration));
        localStorage.setItem("push_subscribed_v1", "1");
        mockDelete.mockResolvedValueOnce({ data: {} });

        const { result } = renderHook(() => usePush());
        await waitFor(() => expect(result.current.isLoading).toBe(false));

        await act(async () => { await result.current.unsubscribe(); });

        expect(mockDelete).toHaveBeenCalledWith("/notifications/subscribe");
        expect(result.current.isSubscribed).toBe(false);
        expect(localStorage.getItem("push_subscribed_v1")).toBeNull();
    });
});
