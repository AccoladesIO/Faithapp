const DEVICE_ID_KEY = "device_id";

export function getOrCreateDeviceId(): string {
    const existing = localStorage.getItem(DEVICE_ID_KEY);
    if (existing) return existing;

    const bytes = new Uint8Array(32);
    crypto.getRandomValues(bytes);
    const id = Array.from(bytes)
        .map((b) => b.toString(16).padStart(2, "0"))
        .join("");

    localStorage.setItem(DEVICE_ID_KEY, id);
    return id;
}
