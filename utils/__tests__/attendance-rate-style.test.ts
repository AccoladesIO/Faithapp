import {
    getAttendanceRateTier,
    getAttendanceRateStyle,
    ATTENDANCE_RATE_STYLES,
    ATTENDANCE_RATE_NEUTRAL_STYLE,
} from "../attendance-rate-style";

describe("getAttendanceRateTier", () => {
    it("returns 'good' at and above 80%", () => {
        expect(getAttendanceRateTier(80)).toBe("good");
        expect(getAttendanceRateTier(100)).toBe("good");
    });

    it("returns 'fair' between 50% and just under 80%", () => {
        expect(getAttendanceRateTier(50)).toBe("fair");
        expect(getAttendanceRateTier(79)).toBe("fair");
    });

    it("returns 'low' below 50%", () => {
        expect(getAttendanceRateTier(49)).toBe("low");
        expect(getAttendanceRateTier(0)).toBe("low");
    });
});

describe("getAttendanceRateStyle", () => {
    it("returns the neutral style when percentage is null", () => {
        expect(getAttendanceRateStyle(null)).toBe(ATTENDANCE_RATE_NEUTRAL_STYLE);
    });

    it("returns the matching tier style for a given percentage", () => {
        expect(getAttendanceRateStyle(90)).toBe(ATTENDANCE_RATE_STYLES.good);
        expect(getAttendanceRateStyle(60)).toBe(ATTENDANCE_RATE_STYLES.fair);
        expect(getAttendanceRateStyle(10)).toBe(ATTENDANCE_RATE_STYLES.low);
    });
});
