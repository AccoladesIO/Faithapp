"use client";

import React, { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
    ArrowLeft, LogOut, Bell, CircleHelp, Mail, BookOpen, ChevronRight, Pencil, UserCircle2,
    Camera, X, Loader2,
} from "lucide-react";
import { useAuth } from "@/context/auth-context";
import { useProfile, PASTOR_TYPE_LABELS } from "@/hooks/use-profile";
import { useEditProfile } from "@/hooks/use-edit-profile";
import { PushNotificationToggle } from "@/components/ui/push-notification-toggle";
import { Avatar } from "@/components/ui/avatar";

const MAX_PHOTO_SIZE_MB = 3;

const SUPPORT_EMAIL = process.env.NEXT_PUBLIC_SUPPORT_EMAIL ?? "editorial.discovery@gmail.com";
const CHURCH_NAME = process.env.NEXT_PUBLIC_CHURCH_NAME ?? "RCCG Discovery Centre";

function formatBirthday(
    day: number | null | undefined,
    month: number | null | undefined,
    year: number | null | undefined
): string {
    if (!day || !month) return "—";
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    return year ? `${months[month - 1]} ${day}, ${year}` : `${months[month - 1]} ${day}`;
}

export default function AccountPage() {
    const router = useRouter();
    const { logout } = useAuth() ?? {};
    const { profile, isLoading, refetch } = useProfile() ?? {};
    const { isSubmitting: isPhotoSubmitting, updateMyPhoto, removeMyPhoto } = useEditProfile();
    const [photoError, setPhotoError] = useState<string | null>(null);

    const fullName = profile ? `${profile?.firstname ?? ""} ${profile?.lastname ?? ""}` : "";

    const senderLine = profile?.email ? `— ${fullName.trim() || "Name"} (${profile.email})` : `— ${fullName.trim() || "Name"}`;
    const supportMailtoBody = [`Hi, ${CHURCH_NAME}`, "", "", "", senderLine].join("\n");
    const supportMailto = `mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent("Support & Pastoral Care Request")}&body=${encodeURIComponent(supportMailtoBody)}`;

    const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        e.target.value = "";
        if (!file) return;
        setPhotoError(null);
        if (!file.type.startsWith("image/")) {
            setPhotoError("Please choose an image file.");
            return;
        }
        if (file.size > MAX_PHOTO_SIZE_MB * 1024 * 1024) {
            setPhotoError(`Image must be under ${MAX_PHOTO_SIZE_MB}MB.`);
            return;
        }
        try {
            await updateMyPhoto(file);
            refetch?.();
        } catch (err: unknown) {
            setPhotoError(err instanceof Error ? err.message : "Failed to upload photo.");
        }
    };

    const handleRemovePhoto = async () => {
        setPhotoError(null);
        try {
            await removeMyPhoto();
            refetch?.();
        } catch (err: unknown) {
            setPhotoError(err instanceof Error ? err.message : "Failed to remove photo.");
        }
    };

    return (
        <div className="min-h-screen bg-[#FFFFFF] text-[#121212] pb-12 font-sans selection:bg-[#121212] selection:text-[#FFFFFF] animate-fade-in-up">

            {/* Hero */}
            <div className="relative w-full h-[30vh] overflow-hidden">
                <Image
                    src="/images/profile-journal.jpg"
                    alt="Account"
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
                        <UserCircle2 size={12} /> Account
                    </span>
                    <h1 className="text-2xl font-light tracking-tight text-[#121212] mt-0.5">
                        My Account
                    </h1>
                </div>
            </div>

            <div className="max-w-md mx-auto px-6 mt-8 space-y-5">
                <div className="flex items-center gap-3">
                    {isLoading ? (
                        <div className="w-14 h-14 rounded-full bg-gray-200 animate-pulse flex-shrink-0" />
                    ) : (
                        <div className="relative flex-shrink-0">
                            <Avatar photoUrl={profile?.photoUrl} name={fullName} size={56} textSize="text-lg" />
                            <label
                                aria-label={profile?.photoUrl ? "Change photo" : "Add photo"}
                                className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-[#121212] border-2 border-white flex items-center justify-center cursor-pointer hover:bg-gray-800 transition-colors"
                            >
                                {isPhotoSubmitting ? (
                                    <Loader2 size={11} className="text-white animate-spin" />
                                ) : (
                                    <Camera size={11} className="text-white" />
                                )}
                                <input
                                    type="file"
                                    accept="image/*"
                                    disabled={isPhotoSubmitting}
                                    onChange={handlePhotoChange}
                                    className="hidden"
                                />
                            </label>
                        </div>
                    )}
                    <div className="min-w-0">
                        <p className="text-sm font-medium text-[#121212] truncate">{isLoading ? "…" : fullName}</p>
                        <p className="text-xs text-gray-500 font-light truncate">{isLoading ? "" : profile?.email}</p>
                        {!isLoading && profile && (
                            <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                                <span className="text-[8px] uppercase tracking-wider font-bold bg-[#121212] text-white px-2 py-0.5 rounded-full">{profile?.role}</span>
                                {profile?.workerProfile && <span className="text-[10px] text-gray-500 font-light">{profile?.workerProfile?.department?.name}</span>}
                                {profile?.pastorType && (
                                    <span className="text-[8px] uppercase tracking-wider font-bold bg-[#EADCC9] text-[#121212] px-2 py-0.5 rounded-full">
                                        {PASTOR_TYPE_LABELS[profile.pastorType]}
                                    </span>
                                )}
                            </div>
                        )}
                        {!isLoading && profile?.photoUrl && (
                            <button
                                type="button"
                                onClick={handleRemovePhoto}
                                disabled={isPhotoSubmitting}
                                className="flex items-center gap-1 text-[10px] uppercase tracking-wider font-semibold text-gray-500 hover:text-red-600 transition-colors mt-1.5 disabled:opacity-50"
                            >
                                <X size={10} /> Remove Photo
                            </button>
                        )}
                    </div>
                </div>
                {photoError && (
                    <p className="text-xs text-red-600 font-light bg-red-50 px-3 py-2.5 rounded-xl border border-red-100">
                        {photoError}
                    </p>
                )}

                {!isLoading && profile && (
                    <div className="bg-[#F9F9F9] rounded-2xl p-4 text-xs text-gray-600 font-light space-y-2">
                        <div className="flex items-center justify-between mb-1">
                            <p className="text-[10px] uppercase tracking-wider font-semibold text-gray-500">Account Details</p>
                            <button
                                onClick={() => router.push("/edit-profile")}
                                className="flex items-center gap-1 text-[10px] uppercase tracking-wider font-semibold text-[#756E69] hover:text-[#121212] transition-colors"
                            >
                                <Pencil size={11} /> Edit
                            </button>
                        </div>
                        <div className="grid grid-cols-2 gap-y-2">
                            <div><p className="text-[10px] uppercase tracking-wider font-semibold text-gray-500 mb-0.5">Phone</p><p>{profile?.phoneNumber ?? "—"}</p></div>
                            <div><p className="text-[10px] uppercase tracking-wider font-semibold text-gray-500 mb-0.5">Gender</p><p className="capitalize">{profile?.gender?.toLowerCase() ?? "—"}</p></div>
                            <div><p className="text-[10px] uppercase tracking-wider font-semibold text-gray-500 mb-0.5">Marital Status</p><p className="capitalize">{profile?.maritalStatus?.toLowerCase() ?? "—"}</p></div>
                            <div><p className="text-[10px] uppercase tracking-wider font-semibold text-gray-500 mb-0.5">Birthday</p><p>{formatBirthday(profile?.birthDay ?? null, profile?.birthMonth ?? null, profile?.birthYear ?? null)}</p></div>
                            {profile?.workerProfile && <div><p className="text-[10px] uppercase tracking-wider font-semibold text-gray-500 mb-0.5">Profession</p><p>{profile?.workerProfile?.profession}</p></div>}
                        </div>
                        {profile?.workerProfile && (
                            <div className="pt-2 mt-2 border-t border-[#121212]/10 space-y-1">
                                <p className="text-[10px] uppercase tracking-wider font-semibold text-gray-500 mb-1">Worker Info</p>
                                <p><span className="font-semibold text-[#121212]">Department:</span> {profile?.workerProfile?.department?.name}</p>
                                {profile?.workerProfile?.secondaryDepartment && <p><span className="font-semibold text-[#121212]">Secondary:</span> {profile?.workerProfile?.secondaryDepartment?.name}</p>}
                                <p><span className="font-semibold text-[#121212]">Joined:</span> {profile?.workerProfile?.yearJoinedWorkforce}</p>
                                <div className="flex gap-2 mt-1.5 flex-wrap">
                                    {profile?.workerProfile?.completedSOD && <span className="px-2 py-0.5 bg-green-50 border border-green-100 text-green-700 text-[9px] font-bold uppercase tracking-wider rounded-full">SOD ✓</span>}
                                    {profile?.workerProfile?.completedBibleCollege && <span className="px-2 py-0.5 bg-blue-50 border border-blue-100 text-blue-700 text-[9px] font-bold uppercase tracking-wider rounded-full">Bible College ✓</span>}
                                </div>
                            </div>
                        )}
                    </div>
                )}

                <div className="bg-white border border-[#121212]/5 rounded-2xl p-4">
                    <div className="flex items-center gap-2 mb-1">
                        <Bell size={14} className="text-[#756E69]" />
                        <h4 className="text-xs font-medium text-[#121212]">Notifications</h4>
                    </div>
                    <PushNotificationToggle />
                </div>

                <div className="space-y-2">
                    <p className="text-[10px] uppercase tracking-wider text-gray-500 font-semibold px-1">Need Help?</p>
                    <div className="bg-white border border-[#121212]/5 rounded-2xl divide-y divide-[#121212]/5 overflow-hidden">
                        <button
                            onClick={() => router.push("/help")}
                            className="w-full flex items-center justify-between gap-3 p-4 hover:bg-[#F9F9F9] transition-colors text-left"
                        >
                            <div className="flex items-center gap-3 min-w-0">
                                <div className="w-9 h-9 rounded-full bg-[#F4F1EA] flex items-center justify-center flex-shrink-0">
                                    <BookOpen size={15} className="text-[#756E69]" />
                                </div>
                                <div className="min-w-0">
                                    <p className="text-xs font-medium text-[#121212]">Help & Guide</p>
                                    <p className="text-[10px] text-gray-500 font-light">FAQs and guides for using the app</p>
                                </div>
                            </div>
                            <ChevronRight size={14} className="text-gray-500 flex-shrink-0" />
                        </button>
                        <a
                            href={supportMailto}
                            className="flex items-center justify-between gap-3 p-4 hover:bg-[#F9F9F9] transition-colors"
                        >
                            <div className="flex items-center gap-3 min-w-0">
                                <div className="w-9 h-9 rounded-full bg-[#F4F1EA] flex items-center justify-center flex-shrink-0">
                                    <CircleHelp size={15} className="text-[#756E69]" />
                                </div>
                                <div className="min-w-0">
                                    <p className="text-xs font-medium text-[#121212]">Support & Pastoral Care</p>
                                    <p className="text-[10px] text-gray-500 font-light flex items-center gap-1">
                                        <Mail size={10} /> {SUPPORT_EMAIL}
                                    </p>
                                </div>
                            </div>
                            <ChevronRight size={14} className="text-gray-500 flex-shrink-0" />
                        </a>
                    </div>
                </div>

                <button onClick={() => logout?.()}
                    className="w-full bg-red-50 text-red-600 border border-red-100/50 text-xs uppercase tracking-widest font-semibold py-3.5 rounded-xl hover:bg-red-100/70 transition-colors flex items-center justify-center gap-1.5 shadow-sm">
                    <LogOut size={14} /> Log Out Account
                </button>
            </div>
        </div>
    );
}
