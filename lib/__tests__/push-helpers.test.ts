import { urlBase64ToUint8Array, arrayBufferToBase64 } from "../push-helpers";

describe("urlBase64ToUint8Array", () => {
    it("decodes a base64url string (VAPID key style) into bytes", () => {
        // "hello" in base64 is "aGVsbG8=" — url-safe form drops padding
        const result = urlBase64ToUint8Array("aGVsbG8");
        expect(Array.from(result)).toEqual([104, 101, 108, 108, 111]); // 'h','e','l','l','o'
    });

    it("handles base64url characters (- and _) correctly", () => {
        // bytes [0xfb, 0xff] -> base64 "+/8=" -> url-safe "-_8"
        const result = urlBase64ToUint8Array("-_8");
        expect(Array.from(result)).toEqual([0xfb, 0xff]);
    });
});

describe("arrayBufferToBase64", () => {
    it("encodes an ArrayBuffer to a standard base64 string", () => {
        const bytes = new Uint8Array([104, 101, 108, 108, 111]); // 'hello'
        expect(arrayBufferToBase64(bytes.buffer)).toBe("aGVsbG8=");
    });
});

describe("round trip", () => {
    it("urlBase64ToUint8Array and arrayBufferToBase64 are inverses (module differences aside)", () => {
        const original = new Uint8Array([1, 2, 3, 250, 255, 0]);
        const encoded = arrayBufferToBase64(original.buffer);
        const urlSafe = encoded.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
        const decoded = urlBase64ToUint8Array(urlSafe);
        expect(Array.from(decoded)).toEqual(Array.from(original));
    });
});
