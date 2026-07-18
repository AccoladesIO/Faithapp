"use client";

import React, { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { ArrowLeft, CheckCircle2, Loader2, UserCog, Mail, ChevronRight } from "lucide-react";
import { useProfile, UserProfile } from "@/hooks/use-profile";
import { useEditProfile } from "@/hooks/use-edit-profile";

const inputCls =
    "w-full bg-[#F4F1EA]/40 border border-[#121212]/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#121212]/30";
const selectCls = inputCls + " appearance-none";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
    return (
        <div>
            <label className="text-[10px] uppercase tracking-wider text-gray-500 font-bold block mb-1.5">
                {label}
            </label>
            {children}
        </div>
    );
}

const DAYS = Array.from({ length: 31 }, (_, i) => i + 1);
const MONTHS = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December",
];
const CURRENT_YEAR = new Date().getFullYear();
const YEARS = Array.from({ length: 100 }, (_, i) => CURRENT_YEAR - i);

type Status = "idle" | "processing" | "success" | "error";

function ProfileEditForm({
    profile,
    onSuccess,
    onCancel,
}: {
    profile: UserProfile;
    onSuccess: () => void;
    onCancel: () => void;
}) {
    const router = useRouter();
    const { isSubmitting, updateMyProfile } = useEditProfile();

    const [firstname, setFirstname] = useState(profile.firstname ?? "");
    const [lastname, setLastname] = useState(profile.lastname ?? "");
    const [phoneNumber, setPhoneNumber] = useState(profile.phoneNumber ?? "");
    const [gender, setGender] = useState(profile.gender ?? "");
    const [maritalStatus, setMaritalStatus] = useState(profile.maritalStatus ?? "");
    const [birthDay, setBirthDay] = useState(profile.birthDay ? String(profile.birthDay) : "");
    const [birthMonth, setBirthMonth] = useState(profile.birthMonth ? String(profile.birthMonth) : "");
    const [birthYear, setBirthYear] = useState(profile.birthYear ? String(profile.birthYear) : "");

    const [status, setStatus] = useState<Status>("idle");
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    const isProcessing = status === "processing" || isSubmitting;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setStatus("processing");
        setErrorMessage(null);
        try {
            await updateMyProfile({
                firstname: firstname || undefined,
                lastname: lastname || undefined,
                phoneNumber: phoneNumber || undefined,
                gender: gender || undefined,
                maritalStatus: maritalStatus || undefined,
                birthDay: birthDay ? Number(birthDay) : undefined,
                birthMonth: birthMonth ? Number(birthMonth) : undefined,
                birthYear: birthYear ? Number(birthYear) : undefined,
            });
            onSuccess();
        } catch (err: unknown) {
            setErrorMessage(err instanceof Error ? err.message : "Failed to update profile.");
            setStatus("error");
        }
    };

    return (
        <div className="max-w-md mx-auto px-6 mt-8">
            {/* Email — read-only here, changed via its own OTP-gated flow */}
            <button
                onClick={() => router.push("/change-email")}
                className="w-full flex items-center justify-between gap-3 p-4 mb-6 bg-[#F9F9F9] border border-[#121212]/5 rounded-xl hover:bg-[#F4F1EA] transition-colors text-left"
            >
                <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-full bg-[#F4F1EA] flex items-center justify-center flex-shrink-0">
                        <Mail size={15} className="text-[#756E69]" />
                    </div>
                    <div className="min-w-0">
                        <p className="text-xs font-medium text-[#121212]">Email Address</p>
                        <p className="text-[11px] text-gray-500 font-light truncate">{profile.email}</p>
                    </div>
                </div>
                <ChevronRight size={14} className="text-gray-500 flex-shrink-0" />
            </button>

            <form onSubmit={handleSubmit} className="space-y-5">
                <div className="grid grid-cols-2 gap-3">
                    <Field label="First Name">
                        <input
                            value={firstname}
                            onChange={(e) => setFirstname(e.target.value)}
                            className={inputCls}
                        />
                    </Field>
                    <Field label="Last Name">
                        <input
                            value={lastname}
                            onChange={(e) => setLastname(e.target.value)}
                            className={inputCls}
                        />
                    </Field>
                </div>

                <Field label="Phone Number">
                    <input
                        value={phoneNumber}
                        onChange={(e) => setPhoneNumber(e.target.value)}
                        placeholder="e.g. +2348012345678"
                        className={inputCls}
                    />
                </Field>

                <Field label="Gender">
                    <select
                        value={gender}
                        onChange={(e) => setGender(e.target.value)}
                        className={selectCls}
                    >
                        <option value="">Not specified</option>
                        <option value="MALE">Male</option>
                        <option value="FEMALE">Female</option>
                    </select>
                </Field>

                <Field label="Marital Status">
                    <select
                        value={maritalStatus}
                        onChange={(e) => setMaritalStatus(e.target.value)}
                        className={selectCls}
                    >
                        <option value="">Not specified</option>
                        <option value="SINGLE">Single</option>
                        <option value="MARRIED">Married</option>
                        <option value="WIDOWED">Widowed</option>
                        <option value="DIVORCED">Divorced</option>
                    </select>
                </Field>

                <div className="space-y-3">
                    <p className="text-[10px] uppercase tracking-wider text-gray-500 font-bold">
                        Date of Birth
                    </p>
                    <div className="grid grid-cols-2 gap-3">
                        <Field label="Day">
                            <select
                                value={birthDay}
                                onChange={(e) => setBirthDay(e.target.value)}
                                className={selectCls}
                            >
                                <option value="">Day</option>
                                {DAYS.map((d) => (
                                    <option key={d} value={d}>{d}</option>
                                ))}
                            </select>
                        </Field>
                        <Field label="Month">
                            <select
                                value={birthMonth}
                                onChange={(e) => setBirthMonth(e.target.value)}
                                className={selectCls}
                            >
                                <option value="">Month</option>
                                {MONTHS.map((m, i) => (
                                    <option key={m} value={i + 1}>{m}</option>
                                ))}
                            </select>
                        </Field>
                    </div>
                    <Field label="Year (Optional)">
                        <select
                            value={birthYear}
                            onChange={(e) => setBirthYear(e.target.value)}
                            className={selectCls}
                        >
                            <option value="">Year (optional)</option>
                            {YEARS.map((y) => (
                                <option key={y} value={y}>{y}</option>
                            ))}
                        </select>
                    </Field>
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
                        <><Loader2 size={14} className="animate-spin" /> Saving…</>
                    ) : (
                        "Save Changes"
                    )}
                </button>

                <button
                    type="button"
                    onClick={onCancel}
                    className="w-full text-xs uppercase tracking-widest font-semibold py-3 text-gray-500 hover:text-[#121212] transition-colors"
                >
                    Cancel
                </button>
            </form>
        </div>
    );
}

export default function EditProfilePage() {
    const router = useRouter();
    const { profile, isLoading: isProfileLoading, refetch } = useProfile();
    const [isSuccess, setIsSuccess] = useState(false);

    if (isSuccess) {
        return (
            <div className="min-h-screen bg-[#FFFFFF] flex items-center justify-center px-6 font-sans animate-fade-in-up">
                <div className="w-full max-w-sm text-center space-y-6">
                    <div className="w-16 h-16 rounded-full bg-green-50 text-green-600 flex items-center justify-center mx-auto">
                        <CheckCircle2 size={30} />
                    </div>
                    <div>
                        <h2 className="text-2xl font-light tracking-tight text-[#121212]">Profile Updated</h2>
                        <p className="text-sm text-gray-500 font-light mt-2 leading-relaxed">
                            Your details have been saved successfully.
                        </p>
                    </div>
                    <button
                        onClick={() => router.back()}
                        className="w-full bg-[#121212] text-white text-xs uppercase tracking-widest font-semibold py-4 rounded-xl hover:bg-gray-800 transition-colors"
                    >
                        Done
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
                    src="/images/profile-journal.jpg"
                    alt="Profile"
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
                        <UserCog size={12} /> Account
                    </span>
                    <h1 className="text-2xl font-light tracking-tight text-[#121212] mt-0.5">
                        Edit Profile
                    </h1>
                </div>
            </div>

            {isProfileLoading || !profile ? (
                <div className="max-w-md mx-auto px-6 mt-8 flex items-center justify-center py-16">
                    <Loader2 size={20} className="animate-spin text-gray-400" />
                </div>
            ) : (
                <ProfileEditForm
                    profile={profile}
                    onSuccess={() => { refetch(); setIsSuccess(true); }}
                    onCancel={() => router.back()}
                />
            )}
        </div>
    );
}
