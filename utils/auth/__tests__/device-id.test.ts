import { getOrCreateDeviceId } from "../device-id";

beforeEach(() => localStorage.clear());

describe("getOrCreateDeviceId", () => {
    it("generates a 64-char hex id and persists it to localStorage", () => {
        const id = getOrCreateDeviceId();
        expect(id).toMatch(/^[0-9a-f]{64}$/);
        expect(localStorage.getItem("device_id")).toBe(id);
    });

    it("returns the same id on subsequent calls instead of regenerating", () => {
        const first = getOrCreateDeviceId();
        const second = getOrCreateDeviceId();
        expect(second).toBe(first);
    });

    it("reuses a device id already present in localStorage", () => {
        localStorage.setItem("device_id", "existing-device-id");
        expect(getOrCreateDeviceId()).toBe("existing-device-id");
    });
});
