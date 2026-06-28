"use client";

import React, { useState } from "react";
import {
    User, BookOpen, Droplets, Briefcase,
    Info, CheckCircle2, Loader2, ChevronRight, ChevronLeft,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { api } from "@/utils/auth/axios-client";

// ─── Types ────────────────────────────────────────────────────────────────────

type OnboardingStep =
    | "STEP_1_DEMOGRAPHICS"
    | "STEP_2_SPIRITUAL"
    | "STEP_3_BAPTISM"
    | "STEP_4_WORKFORCE_INTENT"
    | "STEP_5_TRAINING_NOTICE"
    | "STEP_6_SUBMIT";

type SubmitStatus = "idle" | "processing" | "success" | "error";

interface OnboardingFormData {
    firstname: string;
    lastname: string;
    email: string;
    phoneNumber: string;
    gender: "MALE" | "FEMALE" | "";
    dateOfBirth: string;
    maritalStatus: "SINGLE" | "MARRIED" | "WIDOWED" | "DIVORCED" | "";
    dateJoinedChurch: string;
    yearBornAgain: string;
    baptizedWithHolyGhost: boolean;
    yearBaptized: string;
    joinWorkforce: boolean;
}

interface SignupPayload {
    firstname: string;
    lastname: string;
    email: string;
    phoneNumber: string;
    gender: string;
    birthDay: number;
    birthMonth: number;
    birthYear: number;
    maritalStatus: string;
    yearBornAgain: string;
    yearBaptized: string;
    baptizedWithHolyGhost: boolean;
    joinWorkforce: boolean;
    dateJoinedChurch: string;
}

function buildPayload(form: OnboardingFormData): SignupPayload {
    const [birthYear, birthMonth, birthDay] = form.dateOfBirth.split("-").map(Number);
    return {
        firstname: form.firstname,
        lastname: form.lastname,
        email: form.email,
        phoneNumber: form.phoneNumber,
        gender: form.gender,
        birthDay,
        birthMonth,
        birthYear,
        maritalStatus: form.maritalStatus,
        yearBornAgain: form.yearBornAgain,
        yearBaptized: form.yearBaptized,
        baptizedWithHolyGhost: form.baptizedWithHolyGhost,
        joinWorkforce: form.joinWorkforce,
        dateJoinedChurch: form.dateJoinedChurch,
    };
}

const INITIAL_FORM: OnboardingFormData = {
    firstname: "",
    lastname: "",
    email: "",
    phoneNumber: "",
    gender: "",
    dateOfBirth: "",
    maritalStatus: "",
    dateJoinedChurch: "",
    yearBornAgain: "",
    baptizedWithHolyGhost: false,
    yearBaptized: "",
    joinWorkforce: false,
};

// ─── Reusable components ──────────────────────────────────────────────────────

function Field({ label, children }: { label: string; children: React.ReactNode }) {
    return (
        <div>
            <label className="text-[10px] uppercase tracking-wider text-gray-400 font-bold block mb-1.5">
                {label}
            </label>
            {children}
        </div>
    );
}

const inputCls =
    "w-full bg-[#F4F1EA]/40 border border-[#121212]/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#121212]/30";

const selectCls = inputCls + " appearance-none";

function StepHeader({ icon: Icon, label }: { icon: React.ElementType; label: string }) {
    return (
        <div className="flex items-center gap-2 border-b border-[#121212]/5 pb-3">
            <Icon size={16} className="text-[#8A817C]" />
            <h3 className="text-sm font-semibold uppercase tracking-widest text-gray-400">{label}</h3>
        </div>
    );
}

// ─── Progress bar ─────────────────────────────────────────────────────────────

const ALL_STEPS: OnboardingStep[] = [
    "STEP_1_DEMOGRAPHICS",
    "STEP_2_SPIRITUAL",
    "STEP_3_BAPTISM",
    "STEP_4_WORKFORCE_INTENT",
    "STEP_5_TRAINING_NOTICE",
    "STEP_6_SUBMIT",
];

function ProgressBar({ current, showTrainingNotice }: {
    current: OnboardingStep;
    showTrainingNotice: boolean;
}) {
    const visible = showTrainingNotice
        ? ALL_STEPS
        : ALL_STEPS.filter((s) => s !== "STEP_5_TRAINING_NOTICE");
    const idx = visible.indexOf(current);
    const pct = Math.round(((idx + 1) / visible.length) * 100);
    return (
        <div className="w-full h-0.5 bg-[#121212]/5 rounded-full overflow-hidden">
            <div
                className="h-full bg-[#121212] transition-all duration-500"
                style={{ width: `${pct}%` }}
            />
        </div>
    );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export const OnboardingPage = () => {
    const router = useRouter();
    const [step, setStep] = useState<OnboardingStep>("STEP_1_DEMOGRAPHICS");
    const [form, setForm] = useState<OnboardingFormData>(INITIAL_FORM);
    const [submitStatus, setSubmitStatus] = useState<SubmitStatus>("idle");
    const [apiError, setApiError] = useState<string | null>(null);

    // Pre-compute booleans before return so TypeScript doesn't narrow
    // submitStatus across JSX siblings and raise false comparison errors
    const isProcessing = submitStatus === "processing";
    const isSuccess = submitStatus === "success";
    const isFormActive = submitStatus === "idle" || submitStatus === "error";

    const update = <K extends keyof OnboardingFormData>(
        field: K,
        value: OnboardingFormData[K]
    ) => setForm((prev) => ({ ...prev, [field]: value }));

    const showTrainingNotice =
        form.joinWorkforce && (!form.yearBaptized || !form.baptizedWithHolyGhost);

    // ── Navigation ────────────────────────────────────────────────────────────
    const handleNext = () => {
        const map: Partial<Record<OnboardingStep, OnboardingStep>> = {
            STEP_1_DEMOGRAPHICS: "STEP_2_SPIRITUAL",
            STEP_2_SPIRITUAL: "STEP_3_BAPTISM",
            STEP_3_BAPTISM: "STEP_4_WORKFORCE_INTENT",
            STEP_4_WORKFORCE_INTENT: showTrainingNotice
                ? "STEP_5_TRAINING_NOTICE"
                : "STEP_6_SUBMIT",
            STEP_5_TRAINING_NOTICE: "STEP_6_SUBMIT",
        };
        const next = map[step];
        if (next) setStep(next);
    };

    const handleBack = () => {
        const map: Partial<Record<OnboardingStep, OnboardingStep>> = {
            STEP_2_SPIRITUAL: "STEP_1_DEMOGRAPHICS",
            STEP_3_BAPTISM: "STEP_2_SPIRITUAL",
            STEP_4_WORKFORCE_INTENT: "STEP_3_BAPTISM",
            STEP_5_TRAINING_NOTICE: "STEP_4_WORKFORCE_INTENT",
            STEP_6_SUBMIT: showTrainingNotice
                ? "STEP_5_TRAINING_NOTICE"
                : "STEP_4_WORKFORCE_INTENT",
        };
        const prev = map[step];
        if (prev) setStep(prev);
    };

    // ── Submit ────────────────────────────────────────────────────────────────
    const handleSubmit = async () => {
        setSubmitStatus("processing");
        setApiError(null);
        try {
            await api.post("/auth/signup", buildPayload(form));
            setSubmitStatus("success");
        } catch (err: unknown) {
            setApiError(
                err instanceof Error ? err.message : "Signup failed. Please try again."
            );
            setSubmitStatus("error");
        }
    };

    return (
        <div className="min-h-screen bg-[#FFFFFF] text-[#121212] pb-32 font-sans selection:bg-[#121212] selection:text-[#FFFFFF]">

            {/* ── Hero ─────────────────────────────────────────────────── */}
            <div className="relative w-full h-[20vh] overflow-hidden">
                <img
                    src="https://images.unsplash.com/photo-1445108771252-d1cc31a02a3c?q=80&w=1200&auto=format&fit=crop"
                    alt="Sanctuary onboarding backdrop"
                    className="w-full h-full object-cover opacity-85"
                />
                <div className="absolute inset-0 bg-black/40" />
                <div className="absolute bottom-0 inset-x-0 p-6 bg-gradient-to-t from-[#FFFFFF] via-[#FFFFFF]/20 to-transparent">
                    <span className="text-xs uppercase tracking-widest text-white/80 font-semibold drop-shadow-sm">
                        RCCG DISCOVERY CENTER
                    </span>
                    <h1 className="text-2xl font-light tracking-tight text-white mt-1 drop-shadow-md">
                        Membership Onboarding
                    </h1>
                </div>
            </div>

            <div className="max-w-md mx-auto px-6 mt-6">

                {/* ── Progress bar ─────────────────────────────────────── */}
                {isFormActive && (
                    <div className="mb-8">
                        <ProgressBar current={step} showTrainingNotice={showTrainingNotice} />
                    </div>
                )}

                {/* ── API error banner ──────────────────────────────────── */}
                {submitStatus === "error" && apiError && (
                    <div className="mb-6 px-4 py-3 bg-red-50 border border-red-100 rounded-xl text-xs text-red-600 font-medium">
                        {apiError}
                    </div>
                )}

                {/* ── Form steps ───────────────────────────────────────── */}
                {isFormActive && (
                    <div className="space-y-6">

                        {/* Step 1 — Demographics */}
                        {step === "STEP_1_DEMOGRAPHICS" && (
                            <div className="space-y-4">
                                <StepHeader icon={User} label="Step 1: Demographics" />

                                <div className="grid grid-cols-2 gap-4">
                                    <Field label="First Name">
                                        <input
                                            type="text"
                                            required
                                            value={form.firstname}
                                            onChange={(e) => update("firstname", e.target.value)}
                                            className={inputCls}
                                        />
                                    </Field>
                                    <Field label="Last Name">
                                        <input
                                            type="text"
                                            required
                                            value={form.lastname}
                                            onChange={(e) => update("lastname", e.target.value)}
                                            className={inputCls}
                                        />
                                    </Field>
                                </div>

                                <Field label="Email Address">
                                    <input
                                        type="email"
                                        required
                                        value={form.email}
                                        onChange={(e) => update("email", e.target.value)}
                                        className={inputCls}
                                    />
                                </Field>

                                <Field label="Phone Number">
                                    <input
                                        type="tel"
                                        required
                                        placeholder="+2348012345678"
                                        value={form.phoneNumber}
                                        onChange={(e) => update("phoneNumber", e.target.value)}
                                        className={inputCls}
                                    />
                                </Field>

                                <div className="grid grid-cols-2 gap-4">
                                    <Field label="Gender">
                                        <select
                                            value={form.gender}
                                            onChange={(e) => update("gender", e.target.value as OnboardingFormData["gender"])}
                                            className={selectCls}
                                        >
                                            <option value="">Select…</option>
                                            <option value="MALE">Male</option>
                                            <option value="FEMALE">Female</option>
                                        </select>
                                    </Field>
                                    <Field label="Marital Status">
                                        <select
                                            value={form.maritalStatus}
                                            onChange={(e) => update("maritalStatus", e.target.value as OnboardingFormData["maritalStatus"])}
                                            className={selectCls}
                                        >
                                            <option value="">Select…</option>
                                            <option value="SINGLE">Single</option>
                                            <option value="MARRIED">Married</option>
                                            <option value="WIDOWED">Widowed</option>
                                            <option value="DIVORCED">Divorced</option>
                                        </select>
                                    </Field>
                                </div>

                                <Field label="Date of Birth">
                                    <input
                                        type="date"
                                        required
                                        value={form.dateOfBirth}
                                        onChange={(e) => update("dateOfBirth", e.target.value)}
                                        className={inputCls}
                                    />
                                </Field>
                            </div>
                        )}

                        {/* Step 2 — Spiritual */}
                        {step === "STEP_2_SPIRITUAL" && (
                            <div className="space-y-4">
                                <StepHeader icon={BookOpen} label="Step 2: Spiritual Foundation" />

                                <Field label="Date You Joined RCCG Discovery Centre">
                                    <input
                                        type="date"
                                        required
                                        value={form.dateJoinedChurch}
                                        onChange={(e) => update("dateJoinedChurch", e.target.value)}
                                        className={inputCls}
                                    />
                                </Field>

                                <Field label="Year You Got Born Again">
                                    <input
                                        type="number"
                                        placeholder="YYYY"
                                        min="1900"
                                        max={new Date().getFullYear()}
                                        value={form.yearBornAgain}
                                        onChange={(e) => update("yearBornAgain", e.target.value)}
                                        className={inputCls}
                                    />
                                </Field>
                            </div>
                        )}

                        {/* Step 3 — Baptism */}
                        {step === "STEP_3_BAPTISM" && (
                            <div className="space-y-4">
                                <StepHeader icon={Droplets} label="Step 3: Sacraments" />

                                <div className="bg-[#F4F1EA]/50 rounded-2xl p-4 border border-[#121212]/5">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <h4 className="text-sm font-medium text-[#121212]">Baptized with the Holy Ghost?</h4>
                                            <p className="text-xs text-gray-500 font-light mt-0.5">Evidence of speaking in unknown tongues</p>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => update("baptizedWithHolyGhost", !form.baptizedWithHolyGhost)}
                                            className={`w-10 h-6 flex items-center rounded-full p-0.5 transition-colors duration-200 focus:outline-none ${form.baptizedWithHolyGhost ? "bg-[#8A817C]" : "bg-gray-300"}`}
                                        >
                                            <div className={`bg-white w-5 h-5 rounded-full shadow-md transform transition-transform duration-200 ${form.baptizedWithHolyGhost ? "translate-x-4" : "translate-x-0"}`} />
                                        </button>
                                    </div>
                                </div>

                                <Field label="Year Baptized by Water (Optional)">
                                    <input
                                        type="number"
                                        placeholder="Leave empty if not water baptized"
                                        min="1900"
                                        max={new Date().getFullYear()}
                                        value={form.yearBaptized}
                                        onChange={(e) => update("yearBaptized", e.target.value)}
                                        className={inputCls}
                                    />
                                </Field>
                            </div>
                        )}

                        {/* Step 4 — Workforce Intent */}
                        {step === "STEP_4_WORKFORCE_INTENT" && (
                            <div className="space-y-4">
                                <StepHeader icon={Briefcase} label="Step 4: Workforce Intent" />

                                <p className="text-sm text-gray-600 font-light leading-relaxed">
                                    Would you like to express interest in joining a church workforce department (e.g., Media, Ushers, Choir, Protocols)?
                                </p>

                                <div className="grid grid-cols-2 gap-3 pt-2">
                                    <button
                                        type="button"
                                        onClick={() => update("joinWorkforce", true)}
                                        className={`py-4 rounded-xl border text-xs font-semibold uppercase tracking-wider transition-all ${form.joinWorkforce ? "bg-[#121212] text-white border-transparent shadow-md" : "bg-white text-gray-600 border-[#121212]/10 hover:border-[#121212]/20"}`}
                                    >
                                        Yes, I Want to Serve
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => update("joinWorkforce", false)}
                                        className={`py-4 rounded-xl border text-xs font-semibold uppercase tracking-wider transition-all ${!form.joinWorkforce ? "bg-[#121212] text-white border-transparent shadow-md" : "bg-white text-gray-600 border-[#121212]/10 hover:border-[#121212]/20"}`}
                                    >
                                        No, Just a Member
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* Step 5 — Training Notice */}
                        {step === "STEP_5_TRAINING_NOTICE" && (
                            <div className="space-y-4">
                                <StepHeader icon={Info} label="Step 5: Training Evaluation" />

                                <div className="bg-amber-50/60 rounded-2xl p-5 border border-amber-100 space-y-3">
                                    <h4 className="text-sm font-medium text-amber-900">Auto-Enrollment Tracks Triggered</h4>
                                    <p className="text-xs text-amber-800 font-light leading-relaxed">
                                        Because you indicated interest in joining the workforce but lack a verified baptism history or Holy Ghost foundation flag, your profile will automatically trigger enrollment into our foundational training programmes.
                                    </p>
                                </div>
                            </div>
                        )}

                        {/* Step 6 — Review & Submit */}
                        {step === "STEP_6_SUBMIT" && (
                            <div className="space-y-4">
                                <StepHeader icon={CheckCircle2} label="Step 6: Review & Submit" />

                                <p className="text-sm text-gray-600 font-light leading-relaxed">
                                    Please review your details before submitting.
                                </p>

                                <div className="bg-[#F9F9F9] border border-[#121212]/5 rounded-2xl p-4 space-y-2.5 text-xs font-light text-gray-600">
                                    {([
                                        ["Full Name", `${form.firstname} ${form.lastname}`],
                                        ["Email", form.email],
                                        ["Phone", form.phoneNumber],
                                        ["Gender", form.gender || "—"],
                                        ["Date of Birth", form.dateOfBirth || "—"],
                                        ["Marital Status", form.maritalStatus || "—"],
                                        ["Date Joined Church", form.dateJoinedChurch || "—"],
                                        ["Year Born Again", form.yearBornAgain || "—"],
                                        ["Holy Ghost Baptism", form.baptizedWithHolyGhost ? "Yes" : "No"],
                                        ["Year Water Baptized", form.yearBaptized || "—"],
                                        ["Workforce Intent", form.joinWorkforce ? "Yes — Serve" : "No — Member only"],
                                    ] as [string, string][]).map(([label, value]) => (
                                        <div key={label} className="flex justify-between gap-4">
                                            <span className="text-gray-400">{label}</span>
                                            <span className="font-normal text-[#121212] text-right">{value}</span>
                                        </div>
                                    ))}
                                </div>

                                <button
                                    type="button"
                                    onClick={handleSubmit}
                                    disabled={isProcessing}
                                    className="w-full bg-[#121212] text-white text-xs uppercase tracking-widest font-semibold py-4 rounded-xl hover:bg-gray-800 transition-colors shadow-md disabled:opacity-50 flex items-center justify-center gap-2"
                                >
                                    Complete Sign Up
                                </button>
                            </div>
                        )}

                        {/* ── Nav ──────────────────────────────────────── */}
                        <div className="flex items-center justify-between pt-6 border-t border-[#121212]/5">
                            {step !== "STEP_1_DEMOGRAPHICS" ? (
                                <button
                                    type="button"
                                    onClick={handleBack}
                                    className="text-xs font-semibold text-gray-500 flex items-center gap-1 hover:text-[#121212] transition-colors"
                                >
                                    <ChevronLeft size={14} /> Back
                                </button>
                            ) : <div />}

                            {step !== "STEP_6_SUBMIT" && (
                                <button
                                    type="button"
                                    onClick={handleNext}
                                    className="text-xs font-semibold text-[#121212] flex items-center gap-1 bg-[#121212]/5 px-4 py-2 rounded-lg hover:bg-[#121212]/10 transition-colors"
                                >
                                    Next <ChevronRight size={14} />
                                </button>
                            )}
                        </div>
                    </div>
                )}

                {/* ── Processing ───────────────────────────────────────── */}
                {isProcessing && (
                    <div className="text-center py-20">
                        <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-[#8A817C]" />
                        <h3 className="text-sm uppercase tracking-widest text-gray-400 font-semibold">
                            Creating Your Account
                        </h3>
                        <p className="text-xs text-gray-400 font-light mt-1">Setting up your profile…</p>
                    </div>
                )}

                {/* ── Success ──────────────────────────────────────────── */}
                {isSuccess && (
                    <div className="text-center py-12 border border-[#121212]/5 rounded-3xl p-6 bg-[#F9F9F9] shadow-sm">
                        <div className="w-12 h-12 rounded-full bg-green-50 text-green-600 flex items-center justify-center mx-auto mb-4">
                            <CheckCircle2 size={24} />
                        </div>
                        <h3 className="text-xl font-normal tracking-tight mb-2">Welcome to the Family</h3>
                        <p className="text-sm text-gray-500 font-light mb-6">
                            Your membership at RCCG Discovery Centre has been registered. You can now sign in to your account.
                        </p>
                        <button
                            onClick={() => router.push("/")}
                            className="w-full bg-[#121212] text-white text-xs uppercase tracking-widest font-semibold py-3.5 rounded-xl hover:bg-gray-800 transition-colors"
                        >
                            Proceed to Sign In
                        </button>
                    </div>
                )}

                {/* ── Sign in link ─────────────────────────────────────── */}
                {!isSuccess && (
                    <div className="text-center mt-8">
                        <p className="text-xs text-gray-400 font-light">
                            Already part of the family?{" "}
                            <button
                                className="text-[#121212] font-semibold hover:underline"
                                onClick={() => router.push("/")}
                            >
                                Sign In
                            </button>
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
};