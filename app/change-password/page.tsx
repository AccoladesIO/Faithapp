"use client";

import React, { useState } from "react";
import Image from "next/image";
import { CheckCircle2, Loader2, ShieldCheck } from "lucide-react";
import { useRouter } from "next/navigation";
import { api } from "@/utils/auth/axios-client";
import { useAuth } from "@/context/auth-context";
import { PasswordField } from "@/components/ui/password-field";
import { PasswordStrengthMeter, PasswordRequirements } from "@/components/ui/password-requirements";

// ─── Page ─────────────────────────────────────────────────────────────────────

type Status = "idle" | "processing" | "success" | "error";

export default function ChangePasswordPage() {
    const router = useRouter();
    const { logout } = useAuth();

    const [oldPassword, setOld] = useState("");
    const [newPassword, setNew] = useState("");
    const [confirmPassword, setConfirm] = useState("");
    const [status, setStatus] = useState<Status>("idle");
    const [errorMessage, setError] = useState<string | null>(null);

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
                            Your password has been changed successfully. For your security, you&apos;ll need to sign in again with your new password.
                        </p>
                    </div>
                    <button
                        onClick={() => logout()}
                        className="w-full bg-[#121212] text-white text-xs uppercase tracking-widest font-semibold py-4 rounded-xl hover:bg-gray-800 transition-colors"
                    >
                        Sign In Again
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#FFFFFF] text-[#121212] pb-12 font-sans selection:bg-[#121212] selection:text-[#FFFFFF]">

            {/* ── Hero ─────────────────────────────────────────────────── */}
            <div className="relative w-full h-[25vh] overflow-hidden">
                <Image
                    src="/images/security-key.jpg"
                    alt="Sanctuary"
                    fill
                    priority
                    sizes="100vw"
                    className="object-cover"
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
                        <PasswordStrengthMeter password={newPassword} />
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

                    <PasswordRequirements password={newPassword} />

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
                        className="w-full text-xs uppercase tracking-widest font-semibold py-3 text-gray-500 hover:text-[#121212] transition-colors"
                    >
                        Cancel
                    </button>
                </form>
            </div>
        </div>
    );
};