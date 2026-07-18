export type Platform = "ios" | "android-chrome" | "desktop" | "other";

export function detectPlatform(): Platform {
    const ua = navigator.userAgent;
    const ios = /iPad|iPhone|iPod/.test(ua) && !(window as unknown as { MSStream?: unknown }).MSStream;
    if (ios) return "ios";
    if (/Android/.test(ua)) return "android-chrome";
    if (/Win|Mac|Linux/.test(ua)) return "desktop";
    return "other";
}
