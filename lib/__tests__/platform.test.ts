import { detectPlatform } from "../platform";

function setUserAgent(ua: string) {
    Object.defineProperty(window.navigator, "userAgent", { value: ua, configurable: true });
}

describe("detectPlatform", () => {
    it("detects iOS from an iPhone user agent", () => {
        setUserAgent("Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)");
        expect(detectPlatform()).toBe("ios");
    });

    it("detects iOS from an iPad user agent", () => {
        setUserAgent("Mozilla/5.0 (iPad; CPU OS 17_0 like Mac OS X)");
        expect(detectPlatform()).toBe("ios");
    });

    it("detects android-chrome from an Android user agent", () => {
        setUserAgent("Mozilla/5.0 (Linux; Android 14; Pixel 8)");
        expect(detectPlatform()).toBe("android-chrome");
    });

    it("detects desktop from a Windows user agent", () => {
        setUserAgent("Mozilla/5.0 (Windows NT 10.0; Win64; x64)");
        expect(detectPlatform()).toBe("desktop");
    });

    it("detects desktop from a Mac user agent", () => {
        setUserAgent("Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15)");
        expect(detectPlatform()).toBe("desktop");
    });

    it("falls back to 'other' for an unrecognized user agent", () => {
        setUserAgent("SomeUnknownBot/1.0");
        expect(detectPlatform()).toBe("other");
    });
});
