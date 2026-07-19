export type AttendanceRateTier = "good" | "fair" | "low";

export function getAttendanceRateTier(percentage: number): AttendanceRateTier {
    if (percentage >= 80) return "good";
    if (percentage >= 50) return "fair";
    return "low";
}

export interface AttendanceRateStyle {
    bg: string;
    border: string;
    icon: string;
    ring: string;
}

export const ATTENDANCE_RATE_STYLES: Record<AttendanceRateTier, AttendanceRateStyle> = {
    good: { bg: "bg-green-50/60", border: "border-green-100", icon: "text-green-600", ring: "text-green-600" },
    fair: { bg: "bg-amber-50/60", border: "border-amber-100", icon: "text-amber-600", ring: "text-amber-600" },
    low: { bg: "bg-red-50/60", border: "border-red-100", icon: "text-red-600", ring: "text-red-600" },
};

export const ATTENDANCE_RATE_NEUTRAL_STYLE: AttendanceRateStyle = {
    bg: "bg-gray-50", border: "border-gray-200", icon: "text-gray-400", ring: "text-gray-300",
};

export function getAttendanceRateStyle(percentage: number | null): AttendanceRateStyle {
    if (percentage === null) return ATTENDANCE_RATE_NEUTRAL_STYLE;
    return ATTENDANCE_RATE_STYLES[getAttendanceRateTier(percentage)];
}
