"use client";

import React, { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { ArrowLeft, CheckCircle2, Loader2, Mail } from "lucide-react";
import { useProfile } from "@/hooks/use-profile";
import { useEditProfile } from "@/hooks/use-edit-profile";

type Step = "enter-email" | "enter-otp" | "success";

export default function ChangeEmailPage() {
    const router = useRouter();
    const { profile, refetch } = useProfile();
    const { isSubmitting, requestEmailChange, confirmEmailChange } = useEditProfile();

    const [step, setStep] = useState<Step>("enter-email");
    const [newEmail, setNewEmail] = useState("");
    const [otp, setOtp] = useState("");
    const [infoMessage, setInfoMessage] = useState<string | null>(null);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    const handleRequestSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setErrorMessage(null);
        try {
            const message = await requestEmailChange(newEmail);
            setInfoMessage(message ?? `A verification code has been sent to ${newEmail}.`);
            setStep("enter-otp");
        } catch (err: unknown) {
            setErrorMessage(err instanceof Error ? err.message : "Failed to request email change.");
        }
    };

    const handleConfirmSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setErrorMessage(null);
        try {
            await confirmEmailChange(otp);
            refetch();
            setStep("success");
        } catch (err: unknown) {
            setErrorMessage(err instanceof Error ? err.message : "Failed to confirm email change.");
        }
    };

    if (step === "success") {
        return (
            <div className="min-h-screen bg-[#FFFFFF] flex items-center justify-center px-6 font-sans animate-fade-in-up">
                <div className="w-full max-w-sm text-center space-y-6">
                    <div className="w-16 h-16 rounded-full bg-green-50 text-green-600 flex items-center justify-center mx-auto">
                        <CheckCircle2 size={30} />
                    </div>
                    <div>
                        <h2 className="text-2xl font-light tracking-tight text-[#121212]">Email Updated</h2>
                        <p className="text-sm text-gray-500 font-light mt-2 leading-relaxed">
                            Your account email address has been changed to {newEmail}. Use it the next time you sign in.
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
        <div className="min-h-screen bg-[#FFFFFF] text-[#121212] pb-12 font-sans selection:bg-[#121212] selection:text-[#FFFFFF] animate-fade-in-up">

            {/* Hero */}
            <div className="relative w-full h-[25vh] overflow-hidden">
                <Image
                    src="/images/security-key.jpg"
                    alt="Account security"
                    fill
                    priority
                    sizes="100vw"
                    className="object-cover"
                />
                <div className="absolute inset-0 bg-black/50" />
                <div className="absolute inset-0 bg-gradient-to-t from-[#FFFFFF] via-[#FFFFFF]/10 to-transparent" />
                <button
                    onClick={() => router.back()}
                    aria-label="Go back"
                    className="absolute top-4 left-4 p-2 rounded-full bg-black/30 text-white hover:bg-black/50 transition-colors"
                >
                    <ArrowLeft size={18} />
                </button>
                <div className="absolute bottom-0 inset-x-0 p-6">
                    <span className="text-xs uppercase tracking-widest text-white/70 font-semibold flex items-center gap-1.5">
                        <Mail size={12} /> Account Security
                    </span>
                    <h1 className="text-2xl font-light tracking-tight text-[#121212] mt-0.5">
                        Change Email Address
                    </h1>
                </div>
            </div>

            <div className="max-w-md mx-auto px-6 mt-8">
                {step === "enter-email" && (
                    <form onSubmit={handleRequestSubmit} className="space-y-5">
                        <p className="text-xs text-gray-500 font-light leading-relaxed">
                            Your current email is <span className="font-medium text-[#121212]">{profile?.email}</span>.
                            Enter the new address below — we&apos;ll send a code there to confirm you own it.
                        </p>

                        <div>
                            <label className="text-[10px] uppercase tracking-wider text-gray-500 font-bold block mb-1.5">
                                New Email Address
                            </label>
                            <input
                                type="email"
                                required
                                value={newEmail}
                                onChange={(e) => setNewEmail(e.target.value)}
                                placeholder="you@example.com"
                                className="w-full bg-[#F4F1EA]/40 border border-[#121212]/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#121212]/30"
                            />
                        </div>

                        {errorMessage && (
                            <p className="text-xs text-red-600 font-light bg-red-50 px-3 py-2.5 rounded-xl border border-red-100">
                                {errorMessage}
                            </p>
                        )}

                        <button
                            type="submit"
                            disabled={isSubmitting || !newEmail}
                            className="w-full bg-[#121212] text-white text-xs uppercase tracking-widest font-semibold py-4 rounded-xl hover:bg-gray-800 transition-all shadow-md flex items-center justify-center gap-2 disabled:opacity-50"
                        >
                            {isSubmitting ? (
                                <><Loader2 size={14} className="animate-spin" /> Sending Code…</>
                            ) : (
                                "Send Verification Code"
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
                )}

                {step === "enter-otp" && (
                    <form onSubmit={handleConfirmSubmit} className="space-y-5">
                        {infoMessage && (
                            <p className="text-xs text-gray-500 font-light bg-[#F9F9F9] px-3 py-2.5 rounded-xl border border-[#121212]/5 leading-relaxed">
                                {infoMessage}
                            </p>
                        )}

                        <div>
                            <label className="text-[10px] uppercase tracking-wider text-gray-500 font-bold block mb-1.5">
                                6-Digit Code
                            </label>
                            <input
                                type="text"
                                inputMode="numeric"
                                required
                                maxLength={6}
                                value={otp}
                                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                                placeholder="000000"
                                className="w-full bg-[#F4F1EA]/40 border border-[#121212]/10 rounded-xl px-4 py-3 text-sm tracking-[0.5em] text-center focus:outline-none focus:border-[#121212]/30"
                            />
                        </div>

                        {errorMessage && (
                            <p className="text-xs text-red-600 font-light bg-red-50 px-3 py-2.5 rounded-xl border border-red-100">
                                {errorMessage}
                            </p>
                        )}

                        <button
                            type="submit"
                            disabled={isSubmitting || otp.length !== 6}
                            className="w-full bg-[#121212] text-white text-xs uppercase tracking-widest font-semibold py-4 rounded-xl hover:bg-gray-800 transition-all shadow-md flex items-center justify-center gap-2 disabled:opacity-50"
                        >
                            {isSubmitting ? (
                                <><Loader2 size={14} className="animate-spin" /> Confirming…</>
                            ) : (
                                "Confirm New Email"
                            )}
                        </button>

                        <button
                            type="button"
                            onClick={() => setStep("enter-email")}
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
