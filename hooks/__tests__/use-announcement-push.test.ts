import { renderHook, act } from "@testing-library/react";
import "@testing-library/jest-dom";
import { useAnnouncementPush } from "../use-announcement-push";
import { api } from "@/utils/auth/axios-client";

jest.mock("@/utils/auth/axios-client", () => ({
    api: { get: jest.fn() },
}));

const mockGet = api.get as jest.MockedFunction<typeof api.get>;

const ann1 = { id: "a1", title: "First", body: "Body 1", audience: "ALL", createdAt: "2026-06-01" };
const ann2 = { id: "a2", title: "Second", body: "Body 2", audience: "ALL", createdAt: "2026-06-02" };

function mockPushApis(permission: NotificationPermission, showNotification = jest.fn().mockResolvedValue(undefined)) {
    Object.defineProperty(window.navigator, "serviceWorker", {
        value: { ready: Promise.resolve({ showNotification }) },
        configurable: true,
    });
    Object.defineProperty(window, "Notification", {
        value: { permission },
        configurable: true,
    });
    return showNotification;
}

beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
});

afterEach(() => {
    jest.useRealTimers();
});

describe("useAnnouncementPush", () => {
    it("does nothing when the browser has no service worker / Notification support", async () => {
        delete (window.navigator as { serviceWorker?: unknown }).serviceWorker;
        delete (window as { Notification?: unknown }).Notification;

        renderHook(() => useAnnouncementPush());
        await act(async () => { await Promise.resolve(); });

        expect(mockGet).not.toHaveBeenCalled();
    });

    it("seeds seen ids on the first fetch without notifying", async () => {
        const showNotification = mockPushApis("granted");
        mockGet.mockResolvedValueOnce({ data: { data: { data: [ann1] } } });

        renderHook(() => useAnnouncementPush());
        await act(async () => { await Promise.resolve(); await Promise.resolve(); });

        expect(showNotification).not.toHaveBeenCalled();
    });

    it("notifies for a genuinely new announcement on a later poll", async () => {
        const showNotification = mockPushApis("granted");
        mockGet.mockResolvedValueOnce({ data: { data: { data: [ann1] } } });
        renderHook(() => useAnnouncementPush({ intervalMs: 1000 }));
        await act(async () => { await Promise.resolve(); await Promise.resolve(); });

        mockGet.mockResolvedValueOnce({ data: { data: { data: [ann1, ann2] } } });
        await act(async () => {
            await jest.advanceTimersByTimeAsync(1000);
        });

        expect(showNotification).toHaveBeenCalledTimes(1);
        expect(showNotification).toHaveBeenCalledWith("Second", expect.objectContaining({ body: "Body 2", tag: "a2" }));
    });

    it("does not call showNotification when permission is not granted, but still marks it seen", async () => {
        const showNotification = mockPushApis("default");
        mockGet.mockResolvedValueOnce({ data: { data: { data: [ann1] } } });
        renderHook(() => useAnnouncementPush({ intervalMs: 1000 }));
        await act(async () => { await Promise.resolve(); await Promise.resolve(); });

        mockGet.mockResolvedValueOnce({ data: { data: { data: [ann1, ann2] } } });
        await act(async () => { await jest.advanceTimersByTimeAsync(1000); });

        expect(showNotification).not.toHaveBeenCalled();

        // A subsequent poll with the same two announcements should not re-notify either.
        mockGet.mockResolvedValueOnce({ data: { data: { data: [ann1, ann2] } } });
        await act(async () => { await jest.advanceTimersByTimeAsync(1000); });
        expect(showNotification).not.toHaveBeenCalled();
    });

    it("includes departmentId in the polled query when provided", async () => {
        mockPushApis("granted");
        mockGet.mockResolvedValueOnce({ data: { data: { data: [] } } });

        renderHook(() => useAnnouncementPush({ departmentId: "d1" }));
        await act(async () => { await Promise.resolve(); await Promise.resolve(); });

        expect(mockGet).toHaveBeenCalledWith(expect.stringContaining("departmentId=d1"));
    });

    it("silently swallows fetch errors without throwing", async () => {
        mockPushApis("granted");
        mockGet.mockRejectedValueOnce(new Error("Network down"));

        expect(() => renderHook(() => useAnnouncementPush())).not.toThrow();
        await act(async () => { await Promise.resolve(); await Promise.resolve(); });
    });

    it("stops polling once unmounted", async () => {
        mockPushApis("granted");
        mockGet.mockResolvedValue({ data: { data: { data: [] } } });
        const { unmount } = renderHook(() => useAnnouncementPush({ intervalMs: 1000 }));
        await act(async () => { await Promise.resolve(); await Promise.resolve(); });

        const callsBeforeUnmount = mockGet.mock.calls.length;
        unmount();

        await act(async () => { await jest.advanceTimersByTimeAsync(5000); });

        expect(mockGet.mock.calls.length).toBe(callsBeforeUnmount);
    });
});
