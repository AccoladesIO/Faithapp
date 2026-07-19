"use client";

import React, { useState } from "react";
import Image from "next/image";
import { Eye, EyeOff, Lock, Mail, Loader2, ArrowRight } from "lucide-react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/auth-context";
import { usePush } from "@/hooks/use-push";
import { getOrCreateDeviceId } from "@/utils/auth/device-id";

const CHURCH_NAME = process.env.NEXT_PUBLIC_CHURCH_NAME ?? "RCCG Discovery Centre";
const CHURCH_TAGLINE = process.env.NEXT_PUBLIC_CHURCH_TAGLINE ?? "Destinies discovered, Champions raised";
const CHURCH_ADDRESS = process.env.NEXT_PUBLIC_CHURCH_ADDRESS ?? "62 Igi Olugbin Street, Bariga. Lagos, Nigeria";

export const LoginPage = () => {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPw] = useState(false);
    const [loginStatus, setStatus] = useState<"idle" | "processing" | "success" | "error">("idle");
    const [errorMessage, setError] = useState<string | null>(null);

    const { login } = useAuth();
    const { subscribeOnFirstLogin } = usePush();
    const router = useRouter();

    const isProcessing = loginStatus === "processing";
    const isSuccess = loginStatus === "success";

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setStatus("processing");

        try {
            const deviceId = getOrCreateDeviceId();
            const result = await login(email, password, deviceId);

            setStatus("success");

            // Subscribe to push notifications on first device login.
            // Runs silently — we don't surface errors to the user here.
            if (result.isFirstDeviceLogin) {
                subscribeOnFirstLogin().catch(() => {
                    // Best-effort: if push setup fails it doesn't block login
                });
            }

            if (result.requiresPasswordChange) {
                router.push("/change-password");
            } else {
                router.push("/home");
            }
        } catch (err: unknown) {
            setStatus("error");
            setError(err instanceof Error ? err.message : "Something went wrong.");
        }
    };

    return (
        <div className="h-screen bg-[#FFFFFF] text-[#121212] flex flex-col justify-between pb-12 font-sans selection:bg-[#121212] selection:text-[#FFFFFF]">
            <div className="relative w-full h-[50vh] md:h-[40vh] overflow-hidden">
                <Image
                    src="/images/login-backdrop.jpg"
                    alt="Church sanctuary entrance"
                    fill
                    priority
                    sizes="100vw"
                    className="object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-black/10" />
                <div className="absolute bottom-0 inset-x-0 p-6">
                    <span className="text-xs uppercase tracking-widest text-white/70 font-semibold drop-shadow-sm">
                        Welcome Back
                    </span>
                    <h1 className="text-2xl font-semibold tracking-tight text-white mt-1 drop-shadow-md text-balance">
                        {CHURCH_NAME}
                    </h1>
                    <p className="text-xs font-light italic text-white/75 mt-1.5 drop-shadow-sm line-clamp-2">
                        {CHURCH_TAGLINE}
                    </p>
                </div>
            </div>

            <div className="flex-1 max-w-md w-full mx-auto px-6 mt-8 flex flex-col justify-center">
                <form onSubmit={handleLogin} className="space-y-5">
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

                    <div>
                        <div className="flex justify-between items-center mb-1.5">
                            <label className="text-[10px] uppercase tracking-wider text-gray-500 font-bold">Password</label>
                            <button
                                type="button"
                                onClick={() => router.push("/forgot-password")}
                                className="text-[11px] text-[#756E69] font-light hover:underline"
                            >
                                Forgot?
                            </button>
                        </div>
                        <div className="relative rounded-xl border border-[#121212]/10 focus-within:border-[#121212]/30 transition-colors bg-[#F4F1EA]/20">
                            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
                            <input
                                type={showPassword ? "text" : "password"}
                                required
                                placeholder="••••••••"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full bg-transparent pl-11 pr-12 py-3.5 text-sm focus:outline-none"
                            />
                            <button
                                type="button"
                                onClick={() => setShowPw(!showPassword)}
                                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-600 focus:outline-none"
                            >
                                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                            </button>
                        </div>
                    </div>

                    {loginStatus === "error" && (
                        <div className="text-xs text-red-600 font-light bg-red-50 px-3 py-2 rounded-lg border border-red-100 space-y-1.5">
                            <p>{errorMessage ?? "Invalid credentials. Please verify and retry."}</p>
                            {errorMessage?.includes("already registered on another device") && (
                                <button
                                    type="button"
                                    onClick={() => router.push("/device-reset")}
                                    className="font-semibold hover:underline"
                                >
                                    Reset Device Access →
                                </button>
                            )}
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={isProcessing}
                        className="w-full bg-[#121212] text-white text-xs uppercase tracking-widest font-semibold py-4 rounded-xl hover:bg-gray-800 transition-all shadow-md flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                        {isProcessing ? (
                            <><Loader2 size={14} className="animate-spin" /> Authenticating…</>
                        ) : (
                            <>Sign In <ArrowRight size={14} /></>
                        )}
                    </button>
                </form>
            </div>

            {!isSuccess && (
                <div className="text-center mt-8 px-6 space-y-4">
                    <p className="text-xs text-gray-500 font-light">
                        New to the family?{" "}
                        <button
                            className="text-[#121212] font-semibold hover:underline"
                            onClick={() => router.push("/signup")}
                        >
                            Create an Account
                        </button>
                    </p>
                    <p className="text-[10px] text-gray-400 font-light tracking-wide">
                        {CHURCH_NAME}<br />{CHURCH_ADDRESS}
                    </p>
                </div>
            )}
        </div>
    );
};