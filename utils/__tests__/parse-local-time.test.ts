import {
    parseSlotMs,
    formatLocalTime,
    formatLocalSlotTime,
    toPayloadDateTime,
    toInputDateTime,
} from "../parse-local-time";

// jest.setup.ts pins TZ=UTC, so device-local formatting below is deterministic.

describe("parseSlotMs", () => {
    it("returns the real UTC epoch ms for an ISO string", () => {
        expect(parseSlotMs("2026-06-10T06:00:00.000Z")).toBe(Date.parse("2026-06-10T06:00:00.000Z"));
    });
});

describe("formatLocalTime", () => {
    it("formats a UTC ISO time in device-local (here: UTC) 12-hour time", () => {
        expect(formatLocalTime("2026-06-10T06:00:00.000Z")).toBe("6:00 am");
    });

    it("formats a PM time correctly", () => {
        expect(formatLocalTime("2026-06-10T15:30:00.000Z")).toBe("3:30 pm");
    });
});

describe("formatLocalSlotTime", () => {
    it("joins start and end times with an en dash", () => {
        expect(formatLocalSlotTime("2026-06-10T06:00:00.000Z", "2026-06-10T08:00:00.000Z"))
            .toBe("6:00 am – 8:00 am");
    });
});

describe("toPayloadDateTime", () => {
    it("converts a datetime-local value to a UTC ISO string", () => {
        expect(toPayloadDateTime("2026-06-10T07:00")).toBe("2026-06-10T07:00:00.000Z");
    });
});

describe("toInputDateTime", () => {
    it("converts a UTC ISO string back to a datetime-local value", () => {
        expect(toInputDateTime("2026-06-10T07:00:00.000Z")).toBe("2026-06-10T07:00");
    });

    it("returns an empty string for a falsy input", () => {
        expect(toInputDateTime("")).toBe("");
    });

    it("round-trips with toPayloadDateTime", () => {
        const iso = toPayloadDateTime("2026-01-15T09:45");
        expect(toInputDateTime(iso)).toBe("2026-01-15T09:45");
    });
});
