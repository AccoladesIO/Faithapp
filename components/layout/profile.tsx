"use client";

import React, { useState, useRef } from "react";
import {
    User, Shield, Bell, CircleHelp, LogOut,
    ChevronRight, ChevronDown, HeartHandshake,
    Calendar, ClipboardList, AlertTriangle, Loader2,
    CheckCircle2, FileText, X, Image as ImageIcon,
    HandMetal, Clock, MapPin, Wifi, ChevronLeft,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/auth-context";
import { useProfile } from "@/hooks/use-profile";
import { useIncidents } from "@/hooks/use-incidents";
import { usePrayer, PrayerMeeting, RosterEntry } from "@/hooks/use-prayer";
import { PushNotificationToggle } from "../ui/push-notification-toggle";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatBirthday(
    day: number | null | undefined,
    month: number | null | undefined,
    year: number | null | undefined
): string {
    if (!day || !month || !year) return "—";
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    return `${months[month - 1]} ${day}, ${year}`;
}

function formatMeetingDate(iso?: string | null): string {
    if (!iso) return "—";
    return new Date(iso + "T00:00:00").toLocaleDateString("en-GB", {
        weekday: "short", day: "numeric", month: "short",
    });
}

const MONTH_NAMES = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December",
];

// ─── Avatar initials ──────────────────────────────────────────────────────────

function AvatarInitials({ name }: { name?: string }) {
    const parts = name?.trim()?.split(" ") ?? [];
    const initials =
        parts.length >= 2
            ? `${parts[0]?.[0] ?? ""}${parts[parts.length - 1]?.[0] ?? ""}`
            : parts[0]?.[0] ?? "?";
    return (
        <div className="w-24 h-24 rounded-full border-4 border-white bg-[#121212] flex items-center justify-center shadow-lg">
            <span className="text-2xl font-semibold text-white uppercase">{initials}</span>
        </div>
    );
}

// ─── Accordion ────────────────────────────────────────────────────────────────

function AccordionItem({
    id, active, onToggle, icon: Icon, label, badge, children,
}: {
    id: string;
    active: boolean;
    onToggle: (id: string) => void;
    icon: React.ElementType;
    label: string;
    badge?: React.ReactNode;
    children: React.ReactNode;
}) {
    return (
        <div>
            <button
                onClick={() => onToggle?.(id)}
                className="w-full flex items-center justify-between p-4 hover:bg-[#F9F9F9] transition-colors text-left"
            >
                <div className="flex items-center gap-3">
                    <Icon size={16} className="text-[#8A817C]" />
                    <span className="text-sm font-normal">{label}</span>
                    {badge}
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

// ─── Incident report form ─────────────────────────────────────────────────────

const MAX_IMAGES = 5;
const MAX_FILE_SIZE_MB = 5;
const defaultForm = { title: "", description: "", location: "", isAnonymous: false };

function IncidentReportForm({ onSuccess }: { onSuccess?: () => void }) {
    const { isSubmitting, submitError, submitIncident } = useIncidents();
    const [form, setForm] = useState(defaultForm);
    const [images, setImages] = useState<File[]>([]);
    const [sizeError, setSizeError] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selected = Array.from(e.target?.files ?? []);
        setSizeError(null);
        const oversized = selected.filter((f) => (f?.size ?? 0) > MAX_FILE_SIZE_MB * 1024 * 1024);
        if (oversized.length > 0) {
            setSizeError(
                `${oversized.map((f) => f?.name).join(", ")} exceed${oversized.length === 1 ? "s" : ""} the 5 MB limit.`
            );
            return;
        }
        setImages((prev) => [...(prev ?? []), ...selected].slice(0, MAX_IMAGES));
        if (fileInputRef?.current) fileInputRef.current.value = "";
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await submitIncident?.({ ...form, images });
            setForm(defaultForm);
            setImages([]);
            onSuccess?.();
        } catch { /* submitError shown in UI */ }
    };

    return (
        <form onSubmit={handleSubmit} className="pt-3 space-y-4">
            <div>
                <label className="text-[10px] uppercase tracking-wider text-gray-400 font-bold block mb-1.5">Incident Title</label>
                <input type="text" required placeholder="Broken equipment in hall B"
                    value={form?.title ?? ""} onChange={(e) => setForm((p) => ({ ...p, title: e.target?.value ?? "" }))}
                    className="w-full bg-white border border-[#121212]/10 rounded-xl px-3 py-2.5 text-xs font-sans outline-none focus:border-[#121212]/30" />
            </div>
            <div>
                <label className="text-[10px] uppercase tracking-wider text-gray-400 font-bold block mb-1.5">Description</label>
                <textarea required rows={3} placeholder="Describe what happened in detail…"
                    value={form?.description ?? ""} onChange={(e) => setForm((p) => ({ ...p, description: e.target?.value ?? "" }))}
                    className="w-full bg-white border border-[#121212]/10 rounded-xl p-3 text-xs font-sans outline-none resize-none focus:border-[#121212]/30" />
            </div>
            <div>
                <label className="text-[10px] uppercase tracking-wider text-gray-400 font-bold block mb-1.5">Location</label>
                <input type="text" required placeholder="Hall B, Main Auditorium…"
                    value={form?.location ?? ""} onChange={(e) => setForm((p) => ({ ...p, location: e.target?.value ?? "" }))}
                    className="w-full bg-white border border-[#121212]/10 rounded-xl px-3 py-2.5 text-xs font-sans outline-none focus:border-[#121212]/30" />
            </div>
            <div>
                <label className="text-[10px] uppercase tracking-wider text-gray-400 font-bold block mb-1.5">
                    Images (Optional — up to {MAX_IMAGES}, max 5 MB each)
                </label>
                {(images?.length ?? 0) < MAX_IMAGES && (
                    <label className="flex items-center gap-2 w-full bg-white border border-dashed border-[#121212]/15 rounded-xl px-3 py-3 text-xs cursor-pointer hover:border-[#121212]/30 transition-colors">
                        <ImageIcon size={14} className="text-[#8A817C] flex-shrink-0" />
                        <span className="text-gray-400">
                            {(images?.length ?? 0) === 0 ? "Add photos of the incident…" : `Add more (${images?.length ?? 0}/${MAX_IMAGES} selected)`}
                        </span>
                        <input ref={fileInputRef} type="file" accept="image/*" multiple onChange={handleImageChange} className="hidden" />
                    </label>
                )}
                {sizeError && <p className="text-xs text-red-500 mt-1">{sizeError}</p>}
                {(images?.length ?? 0) > 0 && (
                    <div className="mt-2 space-y-1.5">
                        {images?.map((img, i) => (
                            <div key={i} className="flex items-center justify-between bg-white border border-[#121212]/5 rounded-lg px-3 py-2">
                                <div className="flex items-center gap-2 min-w-0">
                                    <FileText size={12} className="text-[#8A817C] flex-shrink-0" />
                                    <span className="text-xs text-gray-600 truncate">{img?.name}</span>
                                    <span className="text-[10px] text-gray-400 flex-shrink-0">{((img?.size ?? 0) / 1024 / 1024).toFixed(1)} MB</span>
                                </div>
                                <button type="button" onClick={() => setImages((p) => p?.filter((_, j) => j !== i) ?? [])}
                                    className="p-1 text-gray-400 hover:text-red-500 transition-colors flex-shrink-0">
                                    <X size={12} />
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>
            <div className="bg-white rounded-xl p-3.5 border border-[#121212]/5 flex items-center justify-between">
                <div>
                    <h4 className="text-xs font-medium text-[#121212]">Submit Anonymously</h4>
                    <p className="text-[10px] text-gray-400 font-light mt-0.5">Your name will not be attached to this report.</p>
                </div>
                <button type="button"
                    onClick={() => setForm((p) => ({ ...p, isAnonymous: !p?.isAnonymous }))}
                    className={`w-10 h-6 flex items-center rounded-full p-0.5 transition-colors duration-200 focus:outline-none flex-shrink-0 ml-3 ${form?.isAnonymous ? "bg-[#8A817C]" : "bg-gray-300"}`}>
                    <div className={`bg-white w-5 h-5 rounded-full shadow-md transform transition-transform duration-200 ${form?.isAnonymous ? "translate-x-4" : "translate-x-0"}`} />
                </button>
            </div>
            {submitError && <p className="text-xs text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">{submitError}</p>}
            <button type="submit" disabled={isSubmitting}
                className="w-full bg-[#121212] text-white text-xs uppercase tracking-widest font-semibold py-3 rounded-xl hover:bg-gray-800 transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
                {isSubmitting ? <><Loader2 size={13} className="animate-spin" /> Submitting…</> : "Submit Report"}
            </button>
        </form>
    );
}

// ─── Prayer section ───────────────────────────────────────────────────────────

function MeetingCard({
    meeting, onSelect, isSelecting, isSelected,
}: {
    meeting?: PrayerMeeting;
    onSelect: (id: string) => void;
    isSelecting?: boolean;
    isSelected?: boolean;
}) {
    const dayConfig = meeting?.dayConfig;
    const isFull = (meeting?.currentCapacity ?? 0) >= (dayConfig?.maxCapacity ?? 0);
    return (
        <div className={`bg-white border rounded-xl p-3.5 transition-all ${isSelected ? "border-[#121212] bg-[#F4F1EA]/30" : "border-[#121212]/5"}`}>
            <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 mb-1 flex-wrap">
                        <span className="text-xs font-medium text-[#121212]">{formatMeetingDate(meeting?.date)}</span>
                        {isFull && <span className="text-[8px] uppercase tracking-wider font-bold bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded">Full</span>}
                        {meeting?.selectionStatus === "OPEN" && !isFull && <span className="text-[8px] uppercase tracking-wider font-bold bg-green-50 text-green-700 px-1.5 py-0.5 rounded">Open</span>}
                    </div>
                    <div className="flex items-center gap-3 text-[10px] text-gray-400 font-light">
                        <span className="flex items-center gap-1"><Clock size={10} /> {dayConfig?.startTime} – {dayConfig?.endTime}</span>
                        <span className="flex items-center gap-1">
                            {dayConfig?.mode === "PHYSICAL" ? <MapPin size={10} /> : <Wifi size={10} />}
                            {dayConfig?.mode === "PHYSICAL" ? "In-person" : "Online"}
                        </span>
                        <span>{meeting?.currentCapacity ?? 0}/{dayConfig?.maxCapacity ?? 0}</span>
                    </div>
                </div>
                {isSelected ? (
                    <div className="flex items-center gap-1 text-[10px] text-green-700 font-bold uppercase tracking-wider flex-shrink-0">
                        <CheckCircle2 size={13} /> Selected
                    </div>
                ) : (
                    <button type="button" onClick={() => meeting?.id && onSelect?.(meeting.id)}
                        disabled={isSelecting || isFull || meeting?.selectionStatus !== "OPEN"}
                        className="text-[10px] uppercase tracking-wider font-bold text-[#121212] border border-[#121212]/20 px-3 py-1.5 rounded-lg hover:bg-[#F4F1EA] transition-colors disabled:opacity-40 flex-shrink-0">
                        {isSelecting ? <Loader2 size={11} className="animate-spin" /> : "Select"}
                    </button>
                )}
            </div>
        </div>
    );
}

function RosterCard({ entry }: { entry?: RosterEntry }) {
    const meeting = entry?.meeting;
    return (
        <div className="bg-white border border-[#121212]/5 rounded-xl p-3.5">
            <div className="flex items-center justify-between">
                <div>
                    <p className="text-xs font-medium text-[#121212]">{formatMeetingDate(meeting?.date)}</p>
                    <p className="text-[10px] text-gray-400 font-light mt-0.5">
                        {meeting?.dayConfig?.startTime} – {meeting?.dayConfig?.endTime} · {meeting?.dayConfig?.mode === "PHYSICAL" ? "In-person" : "Online"}
                    </p>
                </div>
                <span className={`text-[8px] uppercase tracking-wider font-bold px-1.5 py-0.5 rounded ${entry?.status === "SCHEDULED" ? "bg-amber-50 text-amber-700" :
                    entry?.status === "COMPLETED" ? "bg-green-50 text-green-700" :
                        "bg-gray-100 text-gray-500"
                    }`}>{entry?.status}</span>
            </div>
        </div>
    );
}

function PrayerSection() {
    const {
        programs, selectedProgramId, setSelectedProgramId,
        availableMeetings, myRoster, prayerStatus,
        isLoadingPrograms, isLoadingMeetings, isSelecting,
        programsError, meetingsError, selectError,
        selectedMonth, selectedYear, setSelectedMonth, setSelectedYear,
        selectMeeting,
    } = usePrayer() ?? {};

    const [view, setView] = useState<"roster" | "select">("roster");
    const now = new Date();
    const canGoBack = !(selectedMonth === now.getMonth() + 1 && selectedYear === now.getFullYear());

    const handlePrevMonth = () => {
        if (selectedMonth === 1) { setSelectedMonth?.(12); setSelectedYear?.((selectedYear ?? now.getFullYear()) - 1); }
        else setSelectedMonth?.((selectedMonth ?? 1) - 1);
    };
    const handleNextMonth = () => {
        if (selectedMonth === 12) { setSelectedMonth?.(1); setSelectedYear?.((selectedYear ?? now.getFullYear()) + 1); }
        else setSelectedMonth?.((selectedMonth ?? 1) + 1);
    };

    const selectedMeetingIds = new Set((prayerStatus?.mySelections ?? []).map((m) => m?.id));

    if (isLoadingPrograms) return (
        <div className="pt-3 space-y-2 animate-pulse">
            <div className="h-8 bg-gray-100 rounded-xl" />
            <div className="h-16 bg-gray-100 rounded-xl" />
        </div>
    );

    if (programsError) return <p className="pt-3 text-xs text-red-500">{programsError}</p>;
    if ((programs?.length ?? 0) === 0) return <p className="pt-3 text-xs text-gray-400 font-light">No prayer programmes available.</p>;

    return (
        <div className="pt-3 space-y-4">
            <div>
                <label className="text-[10px] uppercase tracking-wider text-gray-400 font-bold block mb-1.5">Programme</label>
                <select value={selectedProgramId ?? ""} onChange={(e) => setSelectedProgramId?.(e.target?.value)}
                    className="w-full bg-white border border-[#121212]/10 rounded-xl px-3 py-2.5 text-xs font-sans outline-none focus:border-[#121212]/30 appearance-none">
                    {programs?.map((p) => <option key={p?.id} value={p?.id}>{p?.name}</option>)}
                </select>
            </div>
            <div className="flex items-center justify-between bg-white border border-[#121212]/5 rounded-xl px-4 py-2.5">
                <button type="button" onClick={handlePrevMonth} disabled={!canGoBack}
                    className="p-1 text-[#8A817C] hover:text-[#121212] transition-colors disabled:opacity-30">
                    <ChevronLeft size={14} />
                </button>
                <span className="text-xs font-semibold text-[#121212]">{MONTH_NAMES[(selectedMonth ?? 1) - 1]} {selectedYear}</span>
                <button type="button" onClick={handleNextMonth} className="p-1 text-[#8A817C] hover:text-[#121212] transition-colors">
                    <ChevronRight size={14} />
                </button>
            </div>
            {prayerStatus && (
                <div className={`text-xs px-3 py-2.5 rounded-xl border font-light ${prayerStatus?.windowOpen ? "bg-green-50 border-green-100 text-green-700" : "bg-gray-50 border-gray-100 text-gray-500"}`}>
                    {prayerStatus?.windowOpen
                        ? prayerStatus?.hasSelected
                            ? "✓ You've already selected your prayer slot this month."
                            : "Selection window is open — pick a meeting below."
                        : "Selection window is closed for this period."}
                </div>
            )}
            <div className="flex bg-[#F4F1EA] p-0.5 rounded-xl">
                <button onClick={() => setView("roster")}
                    className={`flex-1 py-2 text-[10px] font-bold uppercase tracking-wider rounded-lg transition-colors ${view === "roster" ? "bg-white text-[#121212] shadow-sm" : "text-[#8A817C]"}`}>
                    My Roster {(myRoster?.length ?? 0) > 0 && `(${myRoster?.length})`}
                </button>
                <button onClick={() => setView("select")}
                    className={`flex-1 py-2 text-[10px] font-bold uppercase tracking-wider rounded-lg transition-colors ${view === "select" ? "bg-white text-[#121212] shadow-sm" : "text-[#8A817C]"}`}>
                    Available {(availableMeetings?.length ?? 0) > 0 && `(${availableMeetings?.length})`}
                </button>
            </div>
            {selectError && <p className="text-xs text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">{selectError}</p>}
            {isLoadingMeetings ? (
                <div className="space-y-2 animate-pulse">{[1, 2].map((i) => <div key={i} className="h-16 bg-gray-100 rounded-xl" />)}</div>
            ) : meetingsError ? (
                <p className="text-xs text-red-500">{meetingsError}</p>
            ) : view === "roster" ? (
                (myRoster?.length ?? 0) === 0
                    ? <p className="text-xs text-gray-400 font-light text-center py-4">No roster entries for {MONTH_NAMES[(selectedMonth ?? 1) - 1]}.</p>
                    : <div className="space-y-2">{myRoster?.map((e) => <RosterCard key={e?.id} entry={e} />)}</div>
            ) : (
                (availableMeetings?.length ?? 0) === 0
                    ? <p className="text-xs text-gray-400 font-light text-center py-4">No available meetings for {MONTH_NAMES[(selectedMonth ?? 1) - 1]}.</p>
                    : <div className="space-y-2">{availableMeetings?.map((m) => (
                        <MeetingCard key={m?.id} meeting={m} onSelect={selectMeeting} isSelecting={isSelecting} isSelected={selectedMeetingIds?.has(m?.id)} />
                    ))}</div>
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
    const [incidentSuccess, setIncidentSuccess] = useState(false);
    const { logout } = useAuth() ?? {};
    const { profile, isLoading } = useProfile() ?? {};
    const router = useRouter();

    const toggleSection = (id: string) => {
        setActiveSection((prev) => (prev === id ? null : id));
        if (id === "report_incident") setIncidentSuccess(false);
    };

    const handleIncidentSuccess = () => {
        setIncidentSuccess(true);
        setActiveSection(null);
        setTimeout(() => setIncidentSuccess(false), 4000);
    };

    const fullName = profile ? `${profile?.firstname ?? ""} ${profile?.lastname ?? ""}` : "";
    const isWorker = profile?.role === "WORKER";

    return (
        <div className="min-h-screen bg-[#FFFFFF] text-[#121212] pb-32 font-sans selection:bg-[#121212] selection:text-[#FFFFFF]">
            <div className="relative w-full h-[40vh] md:h-[45vh] overflow-hidden">
                <img src="https://images.unsplash.com/photo-1445108771252-d1cc31a02a3c?q=80&w=1200&auto=format&fit=crop" alt="Sanctuary" className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-black/50" />
            </div>

            <div className="px-6 -mt-16 relative z-10 flex flex-col items-center text-center border-b border-[#121212]/5 pb-6 bg-gradient-to-b from-transparent to-[#F9F9F9]">
                {isLoading
                    ? <div className="w-24 h-24 rounded-full border-4 border-white bg-gray-200 animate-pulse shadow-lg" />
                    : <AvatarInitials name={fullName || "?"} />}
                <h2 className="text-2xl font-light tracking-tight mt-3 text-[#121212]">
                    {isLoading ? <span className="inline-block h-7 w-36 bg-gray-100 rounded animate-pulse" /> : fullName}
                </h2>
                <p className="text-xs text-gray-500 font-light mt-0.5">
                    {isLoading ? <span className="inline-block h-3 w-48 bg-gray-100 rounded animate-pulse" /> : profile?.email}
                </p>
                {!isLoading && profile && (
                    <div className="flex items-center gap-2 mt-3">
                        <span className="text-[9px] uppercase tracking-wider font-bold bg-[#121212] text-white px-2.5 py-0.5 rounded-full shadow-sm">{profile?.role}</span>
                        {profile?.workerProfile && <span className="text-[10px] text-gray-400 font-light">{profile?.workerProfile?.department?.name}</span>}
                    </div>
                )}
            </div>

            {isLoading ? <ProfileSkeleton /> : (
                <div className="px-6 mt-8 max-w-md mx-auto space-y-6">
                    {incidentSuccess && (
                        <div className="flex items-center gap-2 bg-green-50 border border-green-100 text-green-700 px-4 py-3 rounded-xl text-xs font-medium">
                            <CheckCircle2 size={14} /> Incident report submitted successfully.
                        </div>
                    )}

                    {isWorker && (
                        <div className="space-y-4">
                            <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-widest px-1">Worker Operations</h4>
                            <div className="bg-white border border-[#121212]/5 rounded-2xl divide-y divide-[#121212]/5 shadow-sm overflow-hidden">
                                <button onClick={() => router?.push("/leave")}
                                    className="w-full flex items-center justify-between p-4 hover:bg-[#F9F9F9] transition-colors text-left">
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
                    <div className="space-y-4">
                        <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-widest px-1">Member Operations</h4>
                        <div className="bg-white border border-[#121212]/5 rounded-2xl divide-y divide-[#121212]/5 shadow-sm overflow-hidden">
                            <button onClick={() => router?.push("/giving")}
                                className="w-full flex items-center justify-between p-4 hover:bg-[#F9F9F9] transition-colors text-left">
                                <div className="flex items-center gap-3">
                                    <ClipboardList size={16} className="text-[#8A817C]" />
                                    <div>
                                        <span className="text-sm font-normal block">Giving</span>
                                        <span className="text-[10px] text-gray-400 font-light">Manage your tithes and offerings</span>
                                    </div>
                                </div>
                                <ChevronRight size={14} className="text-gray-400" />
                            </button>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-widest px-1">Personal Hub</h4>
                        <div className="bg-white border border-[#121212]/5 rounded-2xl divide-y divide-[#121212]/5 shadow-sm overflow-hidden">

                            <AccordionItem id="account_details" active={activeSection === "account_details"} onToggle={toggleSection} icon={User} label="Account Details">
                                <div className="pt-3 text-xs text-gray-600 space-y-2 font-light">
                                    <div className="grid grid-cols-2 gap-y-2">
                                        <div><p className="text-[10px] uppercase tracking-wider font-semibold text-gray-400 mb-0.5">Full Name</p><p>{fullName}</p></div>
                                        <div><p className="text-[10px] uppercase tracking-wider font-semibold text-gray-400 mb-0.5">Phone</p><p>{profile?.phoneNumber ?? "—"}</p></div>
                                        <div><p className="text-[10px] uppercase tracking-wider font-semibold text-gray-400 mb-0.5">Gender</p><p className="capitalize">{profile?.gender?.toLowerCase() ?? "—"}</p></div>
                                        <div><p className="text-[10px] uppercase tracking-wider font-semibold text-gray-400 mb-0.5">Marital Status</p><p className="capitalize">{profile?.maritalStatus?.toLowerCase() ?? "—"}</p></div>
                                        <div><p className="text-[10px] uppercase tracking-wider font-semibold text-gray-400 mb-0.5">Birthday</p><p>{formatBirthday(profile?.birthDay ?? null, profile?.birthMonth ?? null, profile?.birthYear ?? null)}</p></div>
                                        {profile?.workerProfile && <div><p className="text-[10px] uppercase tracking-wider font-semibold text-gray-400 mb-0.5">Profession</p><p>{profile?.workerProfile?.profession}</p></div>}
                                    </div>
                                    {profile?.workerProfile && (
                                        <div className="pt-2 mt-2 border-t border-[#121212]/5 space-y-1">
                                            <p className="text-[10px] uppercase tracking-wider font-semibold text-gray-400 mb-1">Worker Info</p>
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
                            </AccordionItem>

                            {/* <AccordionItem id="serving_rota" active={activeSection === "serving_rota"} onToggle={toggleSection} icon={Calendar} label="My Serving Rota">
                                <div className="pt-3 text-xs text-gray-600 font-light"><p>No upcoming rota assignments found.</p></div>
                            </AccordionItem>

                            <AccordionItem id="tax_statements" active={activeSection === "tax_statements"} onToggle={toggleSection} icon={HeartHandshake} label="Tax Statements & Receipts">
                                <div className="pt-3 text-xs text-gray-600 font-light"><p>No financial records found for the active processing interval.</p></div>
                            </AccordionItem> */}

                            {isWorker && (
                                <AccordionItem id="prayer" active={activeSection === "prayer"} onToggle={toggleSection} icon={HandMetal} label="Prayer Roster"
                                    badge={<span className="text-[8px] uppercase tracking-wider font-bold bg-[#EADCC9] text-[#121212] px-1.5 py-0.5 rounded ml-1">Workers</span>}>
                                    <PrayerSection />
                                </AccordionItem>
                            )}

                            <AccordionItem id="report_incident" active={activeSection === "report_incident"} onToggle={toggleSection} icon={AlertTriangle} label="Report an Incident">
                                <IncidentReportForm onSuccess={handleIncidentSuccess} />
                            </AccordionItem>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-widest px-1">Preferences</h4>
                        <div className="bg-white border border-[#121212]/5 rounded-2xl divide-y divide-[#121212]/5 shadow-sm overflow-hidden">
                            <AccordionItem id="notifications" active={activeSection === "notifications"} onToggle={toggleSection} icon={Bell} label="Notifications">
                                <PushNotificationToggle />
                            </AccordionItem>
                            {/* <AccordionItem id="privacy" active={activeSection === "privacy"} onToggle={toggleSection} icon={Shield} label="Privacy & Visibility">
                                <div className="pt-3 text-xs text-gray-600 font-light"><p>Profile scope is bounded to organisation system members.</p></div>
                            </AccordionItem> */}
                            <AccordionItem id="support" active={activeSection === "support"} onToggle={toggleSection} icon={CircleHelp} label="Support & Pastoral Care">
                                <div className="pt-3 text-xs text-gray-600 font-light"><p>Need guidance? Open an inquiry to dispatch an internal message.</p></div>
                            </AccordionItem>
                        </div>
                    </div>

                    <div className="pt-2">
                        <button onClick={() => logout?.()}
                            className="w-full bg-red-50 text-red-600 border border-red-100/50 text-xs uppercase tracking-widest font-semibold py-3.5 rounded-xl hover:bg-red-100/70 transition-colors flex items-center justify-center gap-1.5 shadow-sm">
                            <LogOut size={14} /> Log Out Account
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};