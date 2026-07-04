"use client";

import React, { useState } from "react";
import { Eye, EyeOff, Lock, CheckCircle2, Loader2, ShieldCheck } from "lucide-react";
import { useRouter } from "next/navigation";
import { api } from "@/utils/auth/axios-client";

// ─── Password strength ────────────────────────────────────────────────────────

interface StrengthResult {
    score: number;    // 0–4
    label: string;
    color: string;
}

function getStrength(password: string): StrengthResult {
    let score = 0;
    if (password.length >= 8) score++;
    if (password.length >= 12) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;

    const capped = Math.min(score, 4) as 0 | 1 | 2 | 3 | 4;
    const map: Record<0 | 1 | 2 | 3 | 4, { label: string; color: string }> = {
        0: { label: "Too weak", color: "bg-red-400" },
        1: { label: "Weak", color: "bg-red-400" },
        2: { label: "Fair", color: "bg-amber-400" },
        3: { label: "Good", color: "bg-blue-400" },
        4: { label: "Strong", color: "bg-green-500" },
    };
    return { score: capped, ...map[capped] };
}

// ─── Field ────────────────────────────────────────────────────────────────────

function PasswordField({
    label,
    value,
    onChange,
    placeholder,
}: {
    label: string;
    value: string;
    onChange: (v: string) => void;
    placeholder?: string;
}) {
    const [show, setShow] = useState(false);
    return (
        <div>
            <label className="text-[10px] uppercase tracking-wider text-gray-400 font-bold block mb-1.5">
                {label}
            </label>
            <div className="relative rounded-xl border border-[#121212]/10 focus-within:border-[#121212]/30 transition-colors bg-[#F4F1EA]/20">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={15} />
                <input
                    type={show ? "text" : "password"}
                    required
                    placeholder={placeholder ?? "••••••••"}
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    className="w-full bg-transparent pl-11 pr-12 py-3.5 text-sm focus:outline-none"
                />
                <button
                    type="button"
                    onClick={() => setShow((s) => !s)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none"
                >
                    {show ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
            </div>
        </div>
    );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

type Status = "idle" | "processing" | "success" | "error";

export default function ChangePasswordPage() {
    const router = useRouter();

    const [oldPassword, setOld] = useState("");
    const [newPassword, setNew] = useState("");
    const [confirmPassword, setConfirm] = useState("");
    const [status, setStatus] = useState<Status>("idle");
    const [errorMessage, setError] = useState<string | null>(null);

    const strength = getStrength(newPassword);
    const mismatch = confirmPassword.length > 0 && confirmPassword !== newPassword;
    const isProcessing = status === "processing";
    const isSuccess = status === "success";

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (newPassword !== confirmPassword) {
            setError("Passwords do not match.");
            setStatus("error");
            return;
        }
        setStatus("processing");
        setError(null);
        try {
            await api.post("/auth/change-password", {
                oldPassword,
                newPassword,
                confirmPassword,
            });
            setStatus("success");
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : "Failed to change password.");
            setStatus("error");
        }
    };

    // ── Success screen ────────────────────────────────────────────────────────
    if (isSuccess) {
        return (
            <div className="min-h-screen bg-[#FFFFFF] flex items-center justify-center px-6 font-sans">
                <div className="w-full max-w-sm text-center space-y-6">
                    <div className="w-16 h-16 rounded-full bg-green-50 text-green-600 flex items-center justify-center mx-auto">
                        <CheckCircle2 size={30} />
                    </div>
                    <div>
                        <h2 className="text-2xl font-light tracking-tight text-[#121212]">Password Updated</h2>
                        <p className="text-sm text-gray-500 font-light mt-2 leading-relaxed">
                            Your password has been changed successfully. Use your new password the next time you sign in.
                        </p>
                    </div>
                    <button
                        onClick={() => router.push("/home")}
                        className="w-full bg-[#121212] text-white text-xs uppercase tracking-widest font-semibold py-4 rounded-xl hover:bg-gray-800 transition-colors"
                    >
                        Continue to Home
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#FFFFFF] text-[#121212] pb-12 font-sans selection:bg-[#121212] selection:text-[#FFFFFF]">

            {/* ── Hero ─────────────────────────────────────────────────── */}
            <div className="relative w-full h-[25vh] overflow-hidden">
                <img
                    src="https://images.unsplash.com/photo-1445108771252-d1cc31a02a3c?q=80&w=1200&auto=format&fit=crop"
                    alt="Sanctuary"
                    className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-black/50" />
                <div className="absolute inset-0 bg-gradient-to-t from-[#FFFFFF] via-[#FFFFFF]/10 to-transparent" />
                <div className="absolute bottom-0 inset-x-0 p-6">
                    <span className="text-xs uppercase tracking-widest text-white/70 font-semibold flex items-center gap-1.5">
                        <ShieldCheck size={12} /> Account Security
                    </span>
                    <h1 className="text-2xl font-light tracking-tight text-[#121212] mt-0.5">
                        Change Password
                    </h1>
                </div>
            </div>

            {/* ── Form ─────────────────────────────────────────────────── */}
            <div className="max-w-md mx-auto px-6 mt-8">
                <form onSubmit={handleSubmit} className="space-y-5">

                    <PasswordField
                        label="Current Password"
                        value={oldPassword}
                        onChange={setOld}
                        placeholder="Your current password"
                    />

                    <div className="space-y-2">
                        <PasswordField
                            label="New Password"
                            value={newPassword}
                            onChange={setNew}
                            placeholder="At least 8 characters"
                        />

                        {/* Strength meter */}
                        {newPassword.length > 0 && (
                            <div className="space-y-1">
                                <div className="flex gap-1">
                                    {[1, 2, 3, 4].map((bar) => (
                                        <div
                                            key={bar}
                                            className={`h-1 flex-1 rounded-full transition-colors duration-300 ${bar <= strength.score
                                                    ? strength.color
                                                    : "bg-gray-200"
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
                        )}
                    </div>

                    <div className="space-y-1">
                        <PasswordField
                            label="Confirm New Password"
                            value={confirmPassword}
                            onChange={setConfirm}
                            placeholder="Repeat your new password"
                        />
                        {mismatch && (
                            <p className="text-[10px] text-red-500 font-medium">
                                Passwords do not match.
                            </p>
                        )}
                    </div>

                    {/* Requirements */}
                    <div className="bg-[#F4F1EA]/50 rounded-xl p-4 space-y-1.5">
                        <p className="text-[10px] uppercase tracking-wider text-gray-400 font-bold mb-2">
                            Requirements
                        </p>
                        {[
                            ["At least 8 characters", newPassword.length >= 8],
                            ["One uppercase letter", /[A-Z]/.test(newPassword)],
                            ["One number", /[0-9]/.test(newPassword)],
                            ["One special character", /[^A-Za-z0-9]/.test(newPassword)],
                        ].map(([label, met]) => (
                            <div key={label as string} className="flex items-center gap-2">
                                <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${met ? "bg-green-500" : "bg-gray-300"}`} />
                                <span className={`text-xs font-light ${met ? "text-green-700" : "text-gray-400"}`}>
                                    {label as string}
                                </span>
                            </div>
                        ))}
                    </div>

                    {status === "error" && errorMessage && (
                        <p className="text-xs text-red-600 font-light bg-red-50 px-3 py-2.5 rounded-xl border border-red-100">
                            {errorMessage}
                        </p>
                    )}

                    <button
                        type="submit"
                        disabled={isProcessing || mismatch || newPassword.length < 8}
                        className="w-full bg-[#121212] text-white text-xs uppercase tracking-widest font-semibold py-4 rounded-xl hover:bg-gray-800 transition-all shadow-md flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                        {isProcessing ? (
                            <><Loader2 size={14} className="animate-spin" /> Updating…</>
                        ) : (
                            "Update Password"
                        )}
                    </button>

                    <button
                        type="button"
                        onClick={() => router.back()}
                        className="w-full text-xs uppercase tracking-widest font-semibold py-3 text-gray-400 hover:text-[#121212] transition-colors"
                    >
                        Cancel
                    </button>
                </form>
            </div>
        </div>
    );
};