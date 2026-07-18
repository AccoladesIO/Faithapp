"use client";

import React from "react";
import { getStrength } from "@/utils/password-strength";

export function PasswordStrengthMeter({ password }: { password: string }) {
    if (password.length === 0) return null;
    const strength = getStrength(password);
    return (
        <div className="space-y-1">
            <div className="flex gap-1">
                {[1, 2, 3, 4].map((bar) => (
                    <div
                        key={bar}
                        className={`h-1 flex-1 rounded-full transition-colors duration-300 ${bar <= strength.score ? strength.color : "bg-gray-200"
                            }`}
                    />
                ))}
            </div>
            <p className={`text-[10px] font-semibold uppercase tracking-wider ${strength.score <= 1 ? "text-red-500" :
                    strength.score === 2 ? "text-amber-500" :
                        strength.score === 3 ? "text-blue-500" :
                            "text-green-600"
                }`}>
                {strength.label}
            </p>
        </div>
    );
}

export function PasswordRequirements({ password }: { password: string }) {
    return (
        <div className="bg-[#F4F1EA]/50 rounded-xl p-4 space-y-1.5">
            <p className="text-[10px] uppercase tracking-wider text-gray-500 font-bold mb-2">
                Requirements
            </p>
            {[
                ["At least 8 characters", password.length >= 8],
                ["One uppercase letter", /[A-Z]/.test(password)],
                ["One number", /[0-9]/.test(password)],
                ["One special character", /[^A-Za-z0-9]/.test(password)],
            ].map(([label, met]) => (
                <div key={label as string} className="flex items-center gap-2">
                    <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${met ? "bg-green-500" : "bg-gray-300"}`} />
                    <span className={`text-xs font-light ${met ? "text-green-700" : "text-gray-500"}`}>
                        {label as string}
                    </span>
                </div>
            ))}
        </div>
    );
}
