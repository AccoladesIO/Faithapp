"use client";

import React, { useState } from "react";
import {
    User, Shield, Bell, CircleHelp, LogOut,
    ChevronRight, ChevronDown, Sparkles, HeartHandshake,
    Calendar, ClipboardList, Loader2,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/auth-context";
import { useProfile } from "@/hooks/use-profile";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatBirthday(day: number | null, month: number | null, year: number | null): string {
    if (!day || !month || !year) return "—";
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    return `${months[month - 1]} ${day}, ${year}`;
}

// ─── Avatar initials fallback ─────────────────────────────────────────────────

function AvatarInitials({ name }: { name: string }) {
    const parts = name.trim().split(" ");
    const initials = parts.length >= 2
        ? `${parts[0][0]}${parts[parts.length - 1][0]}`
        : parts[0]?.[0] ?? "?";
    return (
        <div className="w-24 h-24 rounded-full border-4 border-white bg-[#121212] flex items-center justify-center shadow-lg">
            <span className="text-2xl font-semibold text-white uppercase">{initials}</span>
        </div>
    );
}

// ─── Accordion item ───────────────────────────────────────────────────────────

function AccordionItem({
    id, active, onToggle, icon: Icon, label, children,
}: {
    id: string;
    active: boolean;
    onToggle: (id: string) => void;
    icon: React.ElementType;
    label: string;
    children: React.ReactNode;
}) {
    return (
        <div>
            <button
                onClick={() => onToggle(id)}
                className="w-full flex items-center justify-between p-4 hover:bg-[#F9F9F9] transition-colors text-left"
            >
                <div className="flex items-center gap-3">
                    <Icon size={16} className="text-[#8A817C]" />
                    <span className="text-sm font-normal">{label}</span>
                </div>
                {active
                    ? <ChevronDown size={14} className="text-gray-400" />
                    : <ChevronRight size={14} className="text-gray-400" />}
            </button>
            {active && (
                <div className="px-4 pb-4 bg-[#F9F9F9] border-t border-[#121212]/5">
                    {children}
                </div>
            )}
        </div>
    );
}

// ─── Profile skeleton ─────────────────────────────────────────────────────────

function ProfileSkeleton() {
    return (
        <div className="px-6 mt-8 max-w-md mx-auto space-y-4 animate-pulse">
            <div className="h-4 w-32 bg-gray-100 rounded mx-auto" />
            <div className="h-3 w-48 bg-gray-100 rounded mx-auto" />
            <div className="h-24 bg-gray-100 rounded-2xl" />
            <div className="h-24 bg-gray-100 rounded-2xl" />
        </div>
    );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export const ProfilePage = () => {
    const [activeSection, setActiveSection] = useState<string | null>(null);
    const { logout } = useAuth();
    const { profile, isLoading } = useProfile();
    const router = useRouter();

    const toggleSection = (id: string) =>
        setActiveSection((prev) => (prev === id ? null : id));

    const fullName = profile
        ? `${profile.firstname} ${profile.lastname}`
        : "";

    const isWorker = profile?.role === "WORKER";

    return (
        <div className="min-h-screen bg-[#FFFFFF] text-[#121212] pb-32 font-sans selection:bg-[#121212] selection:text-[#FFFFFF]">

            {/* ── Hero banner ────────────────────────────────────────────── */}
            <div className="relative w-full h-[40vh] md:h-[45vh] overflow-hidden">
                <img
                    src="https://images.unsplash.com/photo-1445108771252-d1cc31a02a3c?q=80&w=1200&auto=format&fit=crop"
                    alt="Church sanctuary backdrop"
                    className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-black/50" />
                {/* <div className="absolute inset-0 bg-gradient-to-t from-[#F9F9F9] via-[#F9F9F9]/40 to-transparent" /> */}
            </div>

            {/* ── Avatar + name ─────────────────────────────────────────── */}
            <div className="px-6 -mt-16 relative z-10 flex flex-col items-center text-center border-b border-[#121212]/5 pb-6 bg-gradient-to-b from-transparent to-[#F9F9F9]">
                {isLoading ? (
                    <div className="w-24 h-24 rounded-full border-4 border-white bg-gray-200 animate-pulse shadow-lg" />
                ) : (
                    <AvatarInitials name={fullName || "?"} />
                )}

                <h2 className="text-2xl font-light tracking-tight mt-3 text-[#121212]">
                    {isLoading ? (
                        <span className="inline-block h-7 w-36 bg-gray-100 rounded animate-pulse" />
                    ) : fullName}
                </h2>
                <p className="text-xs text-gray-500 font-light mt-0.5">
                    {isLoading ? (
                        <span className="inline-block h-3 w-48 bg-gray-100 rounded animate-pulse" />
                    ) : profile?.email}
                </p>

                {!isLoading && profile && (
                    <div className="flex items-center gap-2 mt-3">
                        <span className="text-[9px] uppercase tracking-wider font-bold bg-[#121212] text-white px-2.5 py-0.5 rounded-full shadow-sm">
                            {profile.role}
                        </span>
                        {profile.workerProfile && (
                            <span className="text-[10px] text-gray-400 font-light">
                                {profile.workerProfile.department.name}
                            </span>
                        )}
                    </div>
                )}
            </div>

            {isLoading ? (
                <ProfileSkeleton />
            ) : (
                <div className="px-6 mt-8 max-w-md mx-auto space-y-6">

                    {/* ── Spiritual giftings ─────────────────────────────── */}
                    <div
                        onClick={() => toggleSection("spiritual_giftings")}
                        className="bg-[#F4F1EA]/50 border border-[#121212]/5 rounded-2xl p-4 flex flex-col cursor-pointer transition-all hover:bg-[#EADCC9]/30"
                    >
                        <div className="flex items-center justify-between w-full">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-[#EADCC9] flex items-center justify-center text-[#121212]">
                                    <Sparkles size={18} />
                                </div>
                                <div>
                                    <h3 className="text-sm font-medium text-[#121212]">Spiritual Giftings</h3>
                                    <p className="text-xs text-gray-500 font-light mt-0.5">View your assessed domains & callings</p>
                                </div>
                            </div>
                            {activeSection === "spiritual_giftings"
                                ? <ChevronDown size={16} className="text-gray-400" />
                                : <ChevronRight size={16} className="text-gray-400" />}
                        </div>

                        {activeSection === "spiritual_giftings" && (
                            <div className="mt-4 pt-4 border-t border-[#121212]/5 text-xs text-gray-600 space-y-2 font-light">
                                <p>No gifting assessments recorded yet.</p>
                            </div>
                        )}
                    </div>

                    {/* ── Worker operations — only for WORKER role ──────── */}
                    {isWorker && (
                        <div className="space-y-4">
                            <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-widest px-1">
                                Worker Operations
                            </h4>

                            <div className="bg-white border border-[#121212]/5 rounded-2xl divide-y divide-[#121212]/5 shadow-sm overflow-hidden">
                                {/* Leave request — navigates to dedicated page */}
                                <button
                                    onClick={() => router.push("/leave")}
                                    className="w-full flex items-center justify-between p-4 hover:bg-[#F9F9F9] transition-colors text-left"
                                >
                                    <div className="flex items-center gap-3">
                                        <ClipboardList size={16} className="text-[#8A817C]" />
                                        <div>
                                            <span className="text-sm font-normal block">Leave Request</span>
                                            <span className="text-[10px] text-gray-400 font-light">Apply for and manage your leave</span>
                                        </div>
                                    </div>
                                    <ChevronRight size={14} className="text-gray-400" />
                                </button>
                            </div>
                        </div>
                    )}

                    {/* ── Personal hub ───────────────────────────────────── */}
                    <div className="space-y-4">
                        <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-widest px-1">
                            Personal Hub
                        </h4>

                        <div className="bg-white border border-[#121212]/5 rounded-2xl divide-y divide-[#121212]/5 shadow-sm overflow-hidden">
                            <AccordionItem id="account_details" active={activeSection === "account_details"} onToggle={toggleSection} icon={User} label="Account Details">
                                <div className="pt-3 text-xs text-gray-600 space-y-2 font-light">
                                    <div className="grid grid-cols-2 gap-y-2">
                                        <div>
                                            <p className="text-[10px] uppercase tracking-wider font-semibold text-gray-400 mb-0.5">Full Name</p>
                                            <p>{fullName}</p>
                                        </div>
                                        <div>
                                            <p className="text-[10px] uppercase tracking-wider font-semibold text-gray-400 mb-0.5">Phone</p>
                                            <p>{profile?.phoneNumber ?? "—"}</p>
                                        </div>
                                        <div>
                                            <p className="text-[10px] uppercase tracking-wider font-semibold text-gray-400 mb-0.5">Gender</p>
                                            <p className="capitalize">{profile?.gender?.toLowerCase() ?? "—"}</p>
                                        </div>
                                        <div>
                                            <p className="text-[10px] uppercase tracking-wider font-semibold text-gray-400 mb-0.5">Marital Status</p>
                                            <p className="capitalize">{profile?.maritalStatus?.toLowerCase() ?? "—"}</p>
                                        </div>
                                        <div>
                                            <p className="text-[10px] uppercase tracking-wider font-semibold text-gray-400 mb-0.5">Birthday</p>
                                            <p>{formatBirthday(profile?.birthDay ?? null, profile?.birthMonth ?? null, profile?.birthYear ?? null)}</p>
                                        </div>
                                        {profile?.workerProfile && (
                                            <div>
                                                <p className="text-[10px] uppercase tracking-wider font-semibold text-gray-400 mb-0.5">Profession</p>
                                                <p>{profile.workerProfile.profession}</p>
                                            </div>
                                        )}
                                    </div>
                                    {profile?.workerProfile && (
                                        <div className="pt-2 mt-2 border-t border-[#121212]/5 space-y-1">
                                            <p className="text-[10px] uppercase tracking-wider font-semibold text-gray-400 mb-1">Worker Info</p>
                                            <p><span className="font-semibold text-[#121212]">Department:</span> {profile.workerProfile.department.name}</p>
                                            {profile.workerProfile.secondaryDepartment && (
                                                <p><span className="font-semibold text-[#121212]">Secondary Dept:</span> {profile.workerProfile.secondaryDepartment.name}</p>
                                            )}
                                            <p><span className="font-semibold text-[#121212]">Joined Workforce:</span> {profile.workerProfile.yearJoinedWorkforce}</p>
                                            <div className="flex gap-2 mt-1.5 flex-wrap">
                                                {profile.workerProfile.completedSOD && (
                                                    <span className="px-2 py-0.5 bg-green-50 border border-green-100 text-green-700 text-[9px] font-bold uppercase tracking-wider rounded-full">SOD ✓</span>
                                                )}
                                                {profile.workerProfile.completedBibleCollege && (
                                                    <span className="px-2 py-0.5 bg-blue-50 border border-blue-100 text-blue-700 text-[9px] font-bold uppercase tracking-wider rounded-full">Bible College ✓</span>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </AccordionItem>

                            <AccordionItem id="serving_rota" active={activeSection === "serving_rota"} onToggle={toggleSection} icon={Calendar} label="My Serving Rota">
                                <div className="pt-3 text-xs text-gray-600 font-light">
                                    <p>No upcoming rota assignments found.</p>
                                </div>
                            </AccordionItem>

                            <AccordionItem id="tax_statements" active={activeSection === "tax_statements"} onToggle={toggleSection} icon={HeartHandshake} label="Tax Statements & Receipts">
                                <div className="pt-3 text-xs text-gray-600 font-light">
                                    <p>No financial records found for the active processing interval.</p>
                                </div>
                            </AccordionItem>
                        </div>
                    </div>

                    {/* ── Preferences ────────────────────────────────────── */}
                    <div className="space-y-4">
                        <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-widest px-1">
                            Preferences
                        </h4>

                        <div className="bg-white border border-[#121212]/5 rounded-2xl divide-y divide-[#121212]/5 shadow-sm overflow-hidden">
                            <AccordionItem id="notifications" active={activeSection === "notifications"} onToggle={toggleSection} icon={Bell} label="Notifications">
                                <div className="pt-3 text-xs text-gray-600 font-light">
                                    <p>Push and email channel dispatch configurations are active.</p>
                                </div>
                            </AccordionItem>

                            <AccordionItem id="privacy" active={activeSection === "privacy"} onToggle={toggleSection} icon={Shield} label="Privacy & Visibility">
                                <div className="pt-3 text-xs text-gray-600 font-light">
                                    <p>Profile scope is bounded to organisation system members.</p>
                                </div>
                            </AccordionItem>

                            <AccordionItem id="support" active={activeSection === "support"} onToggle={toggleSection} icon={CircleHelp} label="Support & Pastoral Care">
                                <div className="pt-3 text-xs text-gray-600 font-light">
                                    <p>Need guidance? Open an inquiry to dispatch an internal message.</p>
                                </div>
                            </AccordionItem>
                        </div>
                    </div>

                    {/* ── Logout ─────────────────────────────────────────── */}
                    <div className="pt-2">
                        <button
                            onClick={logout}
                            className="w-full bg-red-50 text-red-600 border border-red-100/50 text-xs uppercase tracking-widest font-semibold py-3.5 rounded-xl hover:bg-red-100/70 transition-colors flex items-center justify-center gap-1.5 shadow-sm"
                        >
                            <LogOut size={14} /> Log Out Account
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};