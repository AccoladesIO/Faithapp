"use client";

import React, { useState } from "react";
import Image from "next/image";
import { CheckCircle2, KeyRound, Loader2, Mail, Smartphone } from "lucide-react";
import { useRouter } from "next/navigation";
import { api, extractErrorMessage } from "@/utils/auth/axios-client";
import { getOrCreateDeviceId } from "@/utils/auth/device-id";

type Step = "email" | "verify";
type Status = "idle" | "processing" | "error";

export default function DeviceResetPage() {
    const router = useRouter();

    const [step, setStep] = useState<Step>("email");
    const [email, setEmail] = useState("");
    const [otp, setOtp] = useState("");
    const [status, setStatus] = useState<Status>("idle");
    const [errorMessage, setError] = useState<string | null>(null);
    const [isSuccess, setIsSuccess] = useState(false);

    const isProcessing = status === "processing";
    const otpValid = /^\d{6}$/.test(otp);

    const handleRequestReset = async (e: React.FormEvent) => {
        e.preventDefault();
        setStatus("processing");
        setError(null);
        try {
            const newDeviceId = getOrCreateDeviceId();
            await api.post(
                "/auth/device-reset/request",
                { email, newDeviceId },
                { _skipAuth: true }
            );
            setStatus("idle");
            setStep("verify");
        } catch (err: unknown) {
            setError(extractErrorMessage(err));
            setStatus("error");
        }
    };

    const handleVerify = async (e: React.FormEvent) => {
        e.preventDefault();
        setStatus("processing");
        setError(null);
        try {
            await api.post(
                "/auth/device-reset/verify",
                { email, otp },
                { _skipAuth: true }
            );
            setIsSuccess(true);
        } catch (err: unknown) {
            setError(extractErrorMessage(err));
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
                        <h2 className="text-2xl font-light tracking-tight text-[#121212]">Device Reset Complete</h2>
                        <p className="text-sm text-gray-500 font-light mt-2 leading-relaxed">
                            This device is now your registered device. Your old device has been signed out — sign in here to continue.
                        </p>
                    </div>
                    <button
                        onClick={() => router.push("/")}
                        className="w-full bg-[#121212] text-white text-xs uppercase tracking-widest font-semibold py-4 rounded-xl hover:bg-gray-800 transition-colors"
                    >
                        Continue to Sign In
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
                        <Smartphone size={12} /> Account Recovery
                    </span>
                    <h1 className="text-2xl font-light tracking-tight text-[#121212] mt-0.5">
                        Reset Device Access
                    </h1>
                </div>
            </div>

            {/* ── Form ─────────────────────────────────────────────────── */}
            <div className="max-w-md mx-auto px-6 mt-8">
                {step === "email" ? (
                    <form onSubmit={handleRequestReset} className="space-y-5">
                        <p className="text-sm text-gray-500 font-light leading-relaxed">
                            Your account is locked to your previous device. Enter your email and we&apos;ll send a code to switch your account to <span className="text-[#121212] font-medium">this device</span>.
                        </p>

                        <div>
                            <label className="text-[10px] uppercase tracking-wider text-gray-500 font-bold block mb-1.5">
                                Email Address
                            </label>
                            <div className="relative rounded-xl border border-[#121212]/10 focus-within:border-[#121212]/30 transition-colors bg-[#F4F1EA]/20">
                                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
                                <input
                                    type="email"
                                    required
                                    placeholder="your.name@example.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="w-full bg-transparent pl-11 pr-4 py-3.5 text-sm focus:outline-none"
                                />
                            </div>
                        </div>

                        {status === "error" && errorMessage && (
                            <p className="text-xs text-red-600 font-light bg-red-50 px-3 py-2.5 rounded-xl border border-red-100">
                                {errorMessage}
                            </p>
                        )}

                        <button
                            type="submit"
                            disabled={isProcessing}
                            className="w-full bg-[#121212] text-white text-xs uppercase tracking-widest font-semibold py-4 rounded-xl hover:bg-gray-800 transition-all shadow-md flex items-center justify-center gap-2 disabled:opacity-50"
                        >
                            {isProcessing ? (
                                <><Loader2 size={14} className="animate-spin" /> Sending…</>
                            ) : (
                                "Send Reset Code"
                            )}
                        </button>

                        <button
                            type="button"
                            onClick={() => router.push("/")}
                            className="w-full text-xs uppercase tracking-widest font-semibold py-3 text-gray-500 hover:text-[#121212] transition-colors"
                        >
                            Back to Sign In
                        </button>
                    </form>
                ) : (
                    <form onSubmit={handleVerify} className="space-y-5">
                        <p className="text-sm text-gray-500 font-light leading-relaxed">
                            If an account exists for <span className="text-[#121212] font-medium">{email}</span>, a 6-digit code has been sent. Enter it below to finish switching your account to this device.
                        </p>

                        <div>
                            <label className="text-[10px] uppercase tracking-wider text-gray-500 font-bold block mb-1.5">
                                Verification Code
                            </label>
                            <div className="relative rounded-xl border border-[#121212]/10 focus-within:border-[#121212]/30 transition-colors bg-[#F4F1EA]/20">
                                <KeyRound className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={15} />
                                <input
                                    type="text"
                                    required
                                    inputMode="numeric"
                                    maxLength={6}
                                    placeholder="6-digit code"
                                    value={otp}
                                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                                    className="w-full bg-transparent pl-11 pr-4 py-3.5 text-sm tracking-[0.3em] focus:outline-none"
                                />
                            </div>
                        </div>

                        {status === "error" && errorMessage && (
                            <p className="text-xs text-red-600 font-light bg-red-50 px-3 py-2.5 rounded-xl border border-red-100">
                                {errorMessage}
                            </p>
                        )}

                        <button
                            type="submit"
                            disabled={isProcessing || !otpValid}
                            className="w-full bg-[#121212] text-white text-xs uppercase tracking-widest font-semibold py-4 rounded-xl hover:bg-gray-800 transition-all shadow-md flex items-center justify-center gap-2 disabled:opacity-50"
                        >
                            {isProcessing ? (
                                <><Loader2 size={14} className="animate-spin" /> Verifying…</>
                            ) : (
                                "Confirm This Device"
                            )}
                        </button>

                        <button
                            type="button"
                            onClick={() => { setStep("email"); setOtp(""); setError(null); setStatus("idle"); }}
                            className="w-full text-xs uppercase tracking-widest font-semibold py-3 text-gray-500 hover:text-[#121212] transition-colors"
                        >
                            Use a Different Email
                        </button>
                    </form>
                )}
            </div>
        </div>
    );
}
