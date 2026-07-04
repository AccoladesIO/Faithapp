"use client";

import React, { useState, useCallback, useEffect } from "react";
import {
    Baby, LogIn, LogOut, ChevronRight, ChevronLeft,
    Plus, Trash2, CheckCircle2, X, Loader2, AlertCircle,
    ShieldCheck, Pencil, ArrowLeft,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useProfile } from "@/hooks/use-profile";
import {
    useChildrenChurch,
    Child, Guardian, CheckinResult, VerifyResult, CheckinRecord,
} from "@/hooks/use-children-church";

function formatDate(iso: string): string {
    return new Date(iso + "T00:00:00").toLocaleDateString("en-GB", {
        day: "numeric", month: "short", year: "numeric",
    });
}

function formatTime(iso: string): string {
    return new Date(iso).toLocaleTimeString("en-GB", {
        hour: "numeric", minute: "2-digit", hour12: true,
    });
}

function calcAge(dob: string): string {
    const birth = new Date(dob + "T00:00:00");
    const now = new Date();
    const months =
        (now.getFullYear() - birth.getFullYear()) * 12 +
        (now.getMonth() - birth.getMonth()) +
        (now.getDate() < birth.getDate() ? -1 : 0);
    if (months < 12) return `${months}m`;
    const y = Math.floor(months / 12);
    const m = months % 12;
    return m === 0 ? `${y}y` : `${y}y ${m}m`;
}

function ChildAvatar({ name, size = "md" }: { name: string; size?: "sm" | "md" | "lg" }) {
    const initials = name.trim().split(" ").map((p) => p[0]).join("").slice(0, 2).toUpperCase();
    const sizes = { sm: "w-8 h-8 text-xs", md: "w-12 h-12 text-sm", lg: "w-16 h-16 text-xl" };
    return (
        <div className={`${sizes[size]} rounded-full bg-[#EADCC9] text-[#121212] flex items-center justify-center font-semibold flex-shrink-0`}>
            {initials}
        </div>
    );
}

function ErrorBanner({ message }: { message: string }) {
    return (
        <div className="flex items-start gap-2 bg-red-50 border border-red-100 text-red-600 px-4 py-3 rounded-xl text-xs font-medium">
            <AlertCircle size={13} className="flex-shrink-0 mt-0.5" />{message}
        </div>
    );
}

function SuccessBanner({ message }: { message: string }) {
    return (
        <div className="flex items-center gap-2 bg-green-50 border border-green-100 text-green-700 px-4 py-3 rounded-xl text-xs font-medium">
            <CheckCircle2 size={13} />{message}
        </div>
    );
}

const inputCls = "w-full bg-[#F9F9F9] border border-[#121212]/10 rounded-xl px-3 py-2.5 text-xs font-sans outline-none focus:border-[#121212]/30";
const selectCls = inputCls + " appearance-none";

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

function PickupCodeCard({ result, onDone }: { result: CheckinResult; onDone: () => void }) {
    const [copied, setCopied] = useState(false);

    return (
        <div className="space-y-5 text-center">
            <div className="w-14 h-14 rounded-full bg-green-50 text-green-600 flex items-center justify-center mx-auto">
                <CheckCircle2 size={28} />
            </div>
            <div>
                <h3 className="text-lg font-normal tracking-tight text-[#121212]">Child Checked In</h3>
                <p className="text-xs text-gray-400 font-light mt-1">
                    Show this code when collecting the child
                </p>
            </div>

            <div className="bg-[#F4F1EA] rounded-2xl p-6 mx-auto max-w-[220px]">
                <p className="text-[10px] uppercase tracking-widest text-gray-400 font-bold mb-2">Pickup Code</p>
                <p className="text-4xl font-bold tracking-[0.25em] text-[#121212]">{result.pickupCode}</p>
                <p className="text-[10px] text-gray-400 font-light mt-2">{formatTime(result.checkinTime)}</p>
            </div>

            <p className="text-xs text-amber-700 bg-amber-50 border border-amber-100 rounded-xl px-4 py-3 font-light">
                ⚠ This code is shown once only. Screenshot or memorise it before continuing.
            </p>

            <div className="flex gap-3">
                <button
                    onClick={() => {
                        navigator.clipboard.writeText(result.pickupCode);
                        setCopied(true);
                        setTimeout(() => setCopied(false), 2000);
                    }}
                    className="flex-1 border border-[#121212]/10 text-xs uppercase tracking-widest font-semibold py-3 rounded-xl hover:bg-[#F4F1EA] transition-colors"
                >
                    {copied ? "Copied!" : "Copy Code"}
                </button>
                <button
                    onClick={onDone}
                    className="flex-1 bg-[#121212] text-white text-xs uppercase tracking-widest font-semibold py-3 rounded-xl hover:bg-gray-800 transition-colors"
                >
                    Done
                </button>
            </div>
        </div>
    );
}

const RELATIONSHIPS = ["PARENT", "MOTHER", "FATHER", "GUARDIAN", "GRANDPARENT", "SIBLING", "AUNT", "UNCLE", "OTHER"];

function ChildDetailPanel({
    child,
    onClose,
    hook,
    memberId,
}: {
    child: Child;
    onClose: () => void;
    hook: ReturnType<typeof useChildrenChurch>;
    memberId: string;
}) {
    const [tab, setTab] = useState<"info" | "guardians" | "history">("info");
    const [guardians, setGuardians] = useState<Guardian[]>(child.guardians ?? []);
    const [history, setHistory] = useState<CheckinRecord[]>([]);
    const [historyLoading, setHLoading] = useState(false);
    const [showGForm, setShowGForm] = useState(false);
    const [gForm, setGForm] = useState({ fullName: "", relationship: "PARENT", phoneNumber: "", email: "", isAuthorizedPickup: true });
    const [gSuccess, setGSuccess] = useState(false);
    const [editingNotes, setEditNotes] = useState(false);
    const [notes, setNotes] = useState(child.specialNotes ?? "");

    const loadGuardians = useCallback(async () => {
        const list = await hook.getGuardians(child.id);
        setGuardians(list);
    }, [child.id, hook]);

    const loadHistory = useCallback(async () => {
        setHLoading(true);
        const list = await hook.getCheckinHistory(child.id);
        setHistory(list);
        setHLoading(false);
    }, [child.id, hook]);

    useEffect(() => { loadGuardians(); }, [loadGuardians]);
    useEffect(() => { if (tab === "history") loadHistory(); }, [tab, loadHistory]);

    const handleAddGuardian = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await hook.addGuardian(child.id, { ...gForm, memberId });
            setGForm({ fullName: "", relationship: "PARENT", phoneNumber: "", email: "", isAuthorizedPickup: true });
            setShowGForm(false);
            setGSuccess(true);
            setTimeout(() => setGSuccess(false), 3000);
            await loadGuardians();
        } catch { /* error in hook */ }
    };

    const handleDeleteGuardian = async (id: string) => {
        await hook.deleteGuardian(id);
        await loadGuardians();
    };

    return (
        <div className="space-y-4">
            <div className="flex items-center gap-3">
                <button onClick={onClose} className="p-1.5 text-[#8A817C] hover:text-[#121212] rounded-lg hover:bg-[#F4F1EA] transition-colors">
                    <ChevronLeft size={16} />
                </button>
                <ChildAvatar name={`${child.firstname} ${child.lastname}`} />
                <div>
                    <h2 className="text-base font-medium text-[#121212]">{child.firstname} {child.lastname}</h2>
                    <p className="text-xs text-gray-400 font-light">
                        {calcAge(child.dateOfBirth)} · {child.classGroup?.name ?? "Unassigned"}
                    </p>
                </div>
            </div>

            <div className="flex bg-[#F4F1EA] p-0.5 rounded-xl">
                {(["info", "guardians", "history"] as const).map((k) => (
                    <button key={k} onClick={() => setTab(k)}
                        className={`flex-1 py-2 text-[10px] font-bold uppercase tracking-wider rounded-lg transition-colors ${tab === k ? "bg-white text-[#121212] shadow-sm" : "text-[#8A817C]"}`}>
                        {k}
                    </button>
                ))}
            </div>

            {tab === "info" && (
                <div className="space-y-3">
                    <div className="bg-white border border-[#121212]/5 rounded-2xl p-4 space-y-3 text-xs">
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <p className="text-[10px] uppercase tracking-wider font-semibold text-gray-400 mb-0.5">Date of Birth</p>
                                <p>{formatDate(child.dateOfBirth)}</p>
                            </div>
                            <div>
                                <p className="text-[10px] uppercase tracking-wider font-semibold text-gray-400 mb-0.5">Age</p>
                                <p>{calcAge(child.dateOfBirth)}</p>
                            </div>
                            <div className="col-span-2">
                                <p className="text-[10px] uppercase tracking-wider font-semibold text-gray-400 mb-0.5">Class Group</p>
                                <p>{child.classGroup?.name ?? "—"}</p>
                            </div>
                            <div className="col-span-2">
                                <p className="text-[10px] uppercase tracking-wider font-semibold text-gray-400 mb-0.5">Child ID</p>
                                <p className="font-mono text-[10px] text-gray-500 break-all">{child.id}</p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white border border-[#121212]/5 rounded-2xl p-4">
                        <div className="flex items-center justify-between mb-2">
                            <p className="text-[10px] uppercase tracking-wider font-semibold text-gray-400">Special Notes</p>
                            {!editingNotes && (
                                <button onClick={() => setEditNotes(true)} className="p-1 text-[#8A817C] hover:text-[#121212]">
                                    <Pencil size={12} />
                                </button>
                            )}
                        </div>
                        {editingNotes ? (
                            <div className="space-y-2">
                                <textarea rows={3} value={notes}
                                    onChange={(e) => setNotes(e.target.value)}
                                    placeholder="Allergies, conditions, special requirements…"
                                    className={`${inputCls} resize-none`} />
                                <div className="flex gap-2">
                                    <button onClick={() => setEditNotes(false)}
                                        className="flex-1 text-xs uppercase tracking-widest font-semibold py-2 rounded-lg border border-[#121212]/10 text-gray-500 hover:text-[#121212] transition-colors">
                                        Cancel
                                    </button>
                                    <button onClick={async () => { await hook.updateChild(child.id, { specialNotes: notes }); setEditNotes(false); }}
                                        disabled={hook.isSubmitting}
                                        className="flex-1 bg-[#121212] text-white text-xs uppercase tracking-widest font-semibold py-2 rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50">
                                        {hook.isSubmitting ? <Loader2 size={12} className="animate-spin mx-auto" /> : "Save"}
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <p className="text-xs text-gray-600 font-light">{notes || "No special notes recorded."}</p>
                        )}
                    </div>
                </div>
            )}

            {tab === "guardians" && (
                <div className="space-y-3">
                    {gSuccess && <SuccessBanner message="Guardian added." />}
                    {hook.submitError && <ErrorBanner message={hook.submitError} />}

                    {guardians.length === 0
                        ? <p className="text-xs text-gray-400 font-light text-center py-4">No guardians registered yet.</p>
                        : (
                            <div className="space-y-2">
                                {guardians.map((g) => (
                                    <div key={g.id} className="bg-white border border-[#121212]/5 rounded-xl p-3.5 flex items-center justify-between">
                                        <div>
                                            <p className="text-sm font-medium text-[#121212]">
                                                {g.fullName ?? `${g.firstname ?? ""} ${g.lastname ?? ""}`.trim()}
                                            </p>
                                            <p className="text-[10px] text-gray-400 font-light capitalize mt-0.5">{g.relationship.toLowerCase()}</p>
                                        </div>
                                        <button onClick={() => handleDeleteGuardian(g.id)}
                                            className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}

                    {!showGForm ? (
                        <button onClick={() => setShowGForm(true)}
                            className="w-full flex items-center justify-center gap-2 py-3 border-2 border-dashed border-[#121212]/10 rounded-xl text-xs font-semibold uppercase tracking-widest text-[#8A817C] hover:border-[#121212]/20 hover:text-[#121212] transition-all">
                            <Plus size={13} /> Add Guardian
                        </button>
                    ) : (
                        <form onSubmit={handleAddGuardian} className="bg-white border border-[#121212]/10 rounded-2xl p-4 space-y-3">
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-semibold uppercase tracking-wider text-[#121212]">New Guardian</span>
                                <button type="button" onClick={() => setShowGForm(false)} className="text-gray-400 hover:text-[#121212]"><X size={15} /></button>
                            </div>
                            <Field label="Full Name">
                                <input required type="text" placeholder="Sarah Johnson" value={gForm.fullName}
                                    onChange={(e) => setGForm((p) => ({ ...p, fullName: e.target.value }))} className={inputCls} />
                            </Field>
                            <div className="grid grid-cols-2 gap-3">
                                <Field label="Relationship">
                                    <select value={gForm.relationship} onChange={(e) => setGForm((p) => ({ ...p, relationship: e.target.value }))} className={selectCls}>
                                        {RELATIONSHIPS.map((r) => <option key={r} value={r}>{r.charAt(0) + r.slice(1).toLowerCase()}</option>)}
                                    </select>
                                </Field>
                                <Field label="Phone">
                                    <input type="tel" placeholder="+234…" value={gForm.phoneNumber}
                                        onChange={(e) => setGForm((p) => ({ ...p, phoneNumber: e.target.value }))} className={inputCls} />
                                </Field>
                            </div>
                            <Field label="Email (Optional)">
                                <input type="email" placeholder="email@example.com" value={gForm.email}
                                    onChange={(e) => setGForm((p) => ({ ...p, email: e.target.value }))} className={inputCls} />
                            </Field>
                            <div className="flex items-center justify-between bg-[#F9F9F9] rounded-xl px-3 py-2.5">
                                <span className="text-xs text-[#121212]">Authorised for pickup</span>
                                <button type="button"
                                    onClick={() => setGForm((p) => ({ ...p, isAuthorizedPickup: !p.isAuthorizedPickup }))}
                                    className={`w-9 h-5 flex items-center rounded-full p-0.5 transition-colors ${gForm.isAuthorizedPickup ? "bg-[#8A817C]" : "bg-gray-300"}`}>
                                    <div className={`bg-white w-4 h-4 rounded-full shadow transition-transform ${gForm.isAuthorizedPickup ? "translate-x-4" : "translate-x-0"}`} />
                                </button>
                            </div>
                            <button type="submit" disabled={hook.isSubmitting}
                                className="w-full bg-[#121212] text-white text-xs uppercase tracking-widest font-semibold py-2.5 rounded-xl hover:bg-gray-800 transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
                                {hook.isSubmitting ? <Loader2 size={12} className="animate-spin" /> : null} Add Guardian
                            </button>
                        </form>
                    )}
                </div>
            )}

            {tab === "history" && (
                <div className="space-y-2">
                    {historyLoading
                        ? [1, 2, 3].map((i) => <div key={i} className="h-16 bg-gray-100 rounded-xl animate-pulse" />)
                        : history.length === 0
                            ? <p className="text-xs text-gray-400 font-light text-center py-6">No check-in history yet.</p>
                            : history.map((rec) => (
                                <div key={rec.id} className="bg-white border border-[#121212]/5 rounded-xl p-3.5 flex items-center justify-between">
                                    <div>
                                        <div className="flex items-center gap-1.5">
                                            <p className="text-xs font-medium text-[#121212]">{formatDate(rec.checkedInAt)}</p>
                                            {rec.flagged && <span className="text-[8px] uppercase tracking-wider font-bold bg-red-50 text-red-600 px-1.5 py-0.5 rounded">Flagged</span>}
                                        </div>
                                        <p className="text-[10px] text-gray-400 font-light mt-0.5">
                                            {formatTime(rec.checkedInAt)} · Code: {rec.pickupCode}
                                        </p>
                                    </div>
                                    <span className={`text-[8px] uppercase tracking-wider font-bold px-1.5 py-0.5 rounded ${rec.checkedOut ? "bg-green-50 text-green-700" : "bg-amber-50 text-amber-700"}`}>
                                        {rec.checkedOut ? "Checked Out" : "Active"}
                                    </span>
                                </div>
                            ))
                    }
                </div>
            )}
        </div>
    );
}

function MyChildrenTab({
    hook, memberId, children, setChildren, onChildSelect,
}: {
    hook: ReturnType<typeof useChildrenChurch>;
    memberId: string;
    children: Child[];
    setChildren: React.Dispatch<React.SetStateAction<Child[]>>;
    onChildSelect: (child: Child) => void;
}) {
    const [showForm, setShowForm] = useState(false);
    const [form, setForm] = useState({ firstname: "", lastname: "", dateOfBirth: "", specialNotes: "" });
    const [success, setSuccess] = useState(false);

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const child = await hook.createChild({ ...form, photoUrl: null, registeredByMemberId: memberId });
            setChildren((prev) => [child, ...prev]);
            setForm({ firstname: "", lastname: "", dateOfBirth: "", specialNotes: "" });
            setShowForm(false);
            setSuccess(true);
            setTimeout(() => setSuccess(false), 3000);
        } catch { /* error in hook */ }
    };

    return (
        <div className="space-y-5">
            {success && <SuccessBanner message="Child registered successfully." />}
            {hook.submitError && !showForm && <ErrorBanner message={hook.submitError} />}

            {!showForm ? (
                <button onClick={() => setShowForm(true)}
                    className="w-full flex items-center justify-center gap-2 py-3.5 border-2 border-dashed border-[#121212]/10 rounded-2xl text-xs font-semibold uppercase tracking-widest text-[#8A817C] hover:border-[#121212]/20 hover:text-[#121212] transition-all">
                    <Plus size={14} /> Register a Child
                </button>
            ) : (
                <div className="bg-white border border-[#121212]/10 rounded-2xl p-5 space-y-4">
                    <div className="flex items-center justify-between">
                        <h3 className="text-sm font-semibold uppercase tracking-wider text-[#121212]">Register Child</h3>
                        <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-[#121212]"><X size={16} /></button>
                    </div>
                    <form onSubmit={handleCreate} className="space-y-3">
                        <div className="grid grid-cols-2 gap-3">
                            <Field label="First Name"><input required type="text" value={form.firstname} onChange={(e) => setForm((p) => ({ ...p, firstname: e.target.value }))} className={inputCls} /></Field>
                            <Field label="Last Name"><input required type="text" value={form.lastname} onChange={(e) => setForm((p) => ({ ...p, lastname: e.target.value }))} className={inputCls} /></Field>
                        </div>
                        <Field label="Date of Birth"><input required type="date" value={form.dateOfBirth} onChange={(e) => setForm((p) => ({ ...p, dateOfBirth: e.target.value }))} className={inputCls} /></Field>
                        <Field label="Special Notes (Optional)">
                            <textarea rows={2} placeholder="Allergies, conditions…" value={form.specialNotes}
                                onChange={(e) => setForm((p) => ({ ...p, specialNotes: e.target.value }))} className={`${inputCls} resize-none`} />
                        </Field>
                        {hook.submitError && <ErrorBanner message={hook.submitError} />}
                        <button type="submit" disabled={hook.isSubmitting}
                            className="w-full bg-[#121212] text-white text-xs uppercase tracking-widest font-semibold py-3 rounded-xl hover:bg-gray-800 transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
                            {hook.isSubmitting ? <Loader2 size={13} className="animate-spin" /> : null} Register
                        </button>
                    </form>
                </div>
            )}

            {children.length === 0 && !showForm ? (
                <div className="text-center py-12 space-y-3">
                    <div className="w-14 h-14 rounded-full bg-[#F4F1EA] flex items-center justify-center mx-auto">
                        <Baby size={24} className="text-[#8A817C]" />
                    </div>
                    <p className="text-sm text-gray-400 font-light">No children registered yet.</p>
                    <p className="text-xs text-gray-300 font-light">Register a child to manage their church attendance.</p>
                </div>
            ) : (
                <div className="space-y-2.5">
                    {children.map((child) => (
                        <button key={child.id} onClick={() => onChildSelect(child)}
                            className="w-full bg-white border border-[#121212]/5 rounded-2xl p-4 flex items-center gap-3 shadow-sm hover:border-[#121212]/10 transition-colors text-left">
                            <ChildAvatar name={`${child.firstname} ${child.lastname}`} />
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-[#121212]">{child.firstname} {child.lastname}</p>
                                <p className="text-[10px] text-gray-400 font-light mt-0.5">
                                    {calcAge(child.dateOfBirth)} · {child.classGroup?.name ?? "Unassigned"}
                                </p>
                            </div>
                            <ChevronRight size={14} className="text-gray-400 flex-shrink-0" />
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}

function CheckInTab({
    hook,
    children,
}: {
    hook: ReturnType<typeof useChildrenChurch>;
    children: Child[];
}) {
    const [step, setStep] = useState<"form" | "code">("form");
    const [selectedChildId, setSelChild] = useState("");
    const [droppedOffByName, setName] = useState("");
    const [result, setResult] = useState<CheckinResult | null>(null);

    const selectedChild = children.find((c) => c.id === selectedChildId) ?? null;

    const handleCheckin = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedChildId) return;
        try {
            const res = await hook.checkin({ childId: selectedChildId, droppedOffByName });
            setResult(res);
            setStep("code");
        } catch { /* error in hook */ }
    };

    const handleDone = () => {
        setStep("form");
        setSelChild("");
        setName("");
        setResult(null);
    };

    if (step === "code" && result) {
        return <PickupCodeCard result={result} onDone={handleDone} />;
    }

    return (
        <div className="space-y-5">
            <div className="bg-[#F4F1EA]/50 border border-[#121212]/5 rounded-2xl p-4">
                <h4 className="text-xs font-semibold text-[#121212] mb-1">How check-in works</h4>
                <p className="text-xs text-gray-500 font-light leading-relaxed">
                    Select the child you're dropping off and enter your name. A unique pickup code is generated — keep it safe. It's shown once and is required to collect the child.
                </p>
            </div>

            {children.length === 0 ? (
                <div className="text-center py-10 space-y-2">
                    <Baby size={28} className="text-gray-300 mx-auto" />
                    <p className="text-sm text-gray-400 font-light">No children registered.</p>
                    <p className="text-xs text-gray-300 font-light">Register a child in the My Children tab first.</p>
                </div>
            ) : (
                <form onSubmit={handleCheckin} className="space-y-4">
                    <Field label="Select Child">
                        <div className="space-y-2">
                            {children.map((child) => (
                                <button
                                    key={child.id}
                                    type="button"
                                    onClick={() => setSelChild(child.id)}
                                    className={`w-full flex items-center gap-3 p-3.5 rounded-xl border transition-all text-left ${selectedChildId === child.id
                                        ? "bg-[#EADCC9] border-[#8A817C]/30 shadow-sm"
                                        : "bg-white border-[#121212]/5 hover:border-[#121212]/10"
                                        }`}
                                >
                                    <ChildAvatar name={`${child.firstname} ${child.lastname}`} size="sm" />
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium text-[#121212]">{child.firstname} {child.lastname}</p>
                                        <p className="text-[10px] text-gray-400 font-light">
                                            {calcAge(child.dateOfBirth)} · {child.classGroup?.name ?? "Unassigned"}
                                        </p>
                                    </div>
                                    {selectedChildId === child.id && (
                                        <CheckCircle2 size={16} className="text-[#8A817C] flex-shrink-0" />
                                    )}
                                </button>
                            ))}
                        </div>
                    </Field>

                    {selectedChild?.specialNotes && (
                        <div className="flex items-start gap-2 bg-amber-50 border border-amber-100 text-amber-800 px-3 py-3 rounded-xl text-xs">
                            <AlertCircle size={13} className="flex-shrink-0 mt-0.5" />
                            <span><strong>Note:</strong> {selectedChild.specialNotes}</span>
                        </div>
                    )}

                    <Field label="Dropped Off By">
                        <input
                            type="text"
                            required
                            placeholder="Full name of person dropping off"
                            value={droppedOffByName}
                            onChange={(e) => setName(e.target.value)}
                            className={inputCls}
                        />
                    </Field>

                    {hook.submitError && <ErrorBanner message={hook.submitError} />}

                    <button
                        type="submit"
                        disabled={hook.isSubmitting || !selectedChildId}
                        className="w-full bg-[#121212] text-white text-xs uppercase tracking-widest font-semibold py-4 rounded-xl hover:bg-gray-800 transition-colors shadow-md disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                        {hook.isSubmitting
                            ? <><Loader2 size={14} className="animate-spin" /> Checking In…</>
                            : <><LogIn size={14} /> Check In {selectedChild ? selectedChild.firstname : "Child"}</>}
                    </button>
                </form>
            )}
        </div>
    );
}

function CheckOutTab({ hook }: { hook: ReturnType<typeof useChildrenChurch> }) {
    const [codeInput, setCode] = useState("");
    const [verifying, setVerifying] = useState(false);
    const [verifyError, setVError] = useState<string | null>(null);
    const [verified, setVerified] = useState<VerifyResult | null>(null);
    const [pickedUpByName, setPickName] = useState("");
    const [checkoutSuccess, setDone] = useState(false);

    const handleVerify = async (e: React.FormEvent) => {
        e.preventDefault();
        setVerifying(true);
        setVError(null);
        try {
            const res = await hook.verifyPickupCode(codeInput.trim());
            setVerified(res);
        } catch (err: unknown) {
            setVError(err instanceof Error ? err.message : "Invalid or expired pickup code.");
        } finally {
            setVerifying(false);
        }
    };

    const handleCheckout = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await hook.checkout({ pickupCode: codeInput.trim().toUpperCase(), pickedUpByName });
            setDone(true);
            setVerified(null);
            setCode("");
            setPickName("");
        } catch { /* error in hook */ }
    };

    if (checkoutSuccess) {
        return (
            <div className="text-center space-y-5 py-8">
                <div className="w-14 h-14 rounded-full bg-green-50 text-green-600 flex items-center justify-center mx-auto">
                    <CheckCircle2 size={28} />
                </div>
                <div>
                    <h3 className="text-lg font-normal tracking-tight text-[#121212]">Child Checked Out</h3>
                    <p className="text-xs text-gray-400 font-light mt-1">The pickup has been logged successfully.</p>
                </div>
                <button onClick={() => setDone(false)}
                    className="bg-[#121212] text-white text-xs uppercase tracking-widest font-semibold px-6 py-3 rounded-xl hover:bg-gray-800 transition-colors">
                    Check Out Another
                </button>
            </div>
        );
    }

    return (
        <div className="space-y-5">
            {!verified ? (
                <form onSubmit={handleVerify} className="space-y-4">
                    <div className="bg-[#F4F1EA]/50 border border-[#121212]/5 rounded-2xl p-4">
                        <h4 className="text-xs font-semibold text-[#121212] mb-1">Enter Pickup Code</h4>
                        <p className="text-xs text-gray-500 font-light">The code given to the parent at drop-off.</p>
                    </div>

                    <Field label="Pickup Code">
                        <input
                            type="text"
                            required
                            maxLength={6}
                            placeholder="A7K3"
                            value={codeInput}
                            onChange={(e) => setCode(e.target.value.toUpperCase())}
                            className={inputCls + " text-center text-2xl tracking-[0.4em] font-bold uppercase"}
                        />
                    </Field>

                    {verifyError && <ErrorBanner message={verifyError} />}

                    <button type="submit" disabled={verifying || codeInput.length < 3}
                        className="w-full bg-[#121212] text-white text-xs uppercase tracking-widest font-semibold py-4 rounded-xl hover:bg-gray-800 transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
                        {verifying
                            ? <><Loader2 size={14} className="animate-spin" /> Verifying…</>
                            : <><ShieldCheck size={14} /> Verify Code</>}
                    </button>
                </form>
            ) : (
                <div className="space-y-4">
                    <div className="bg-green-50 border border-green-100 rounded-2xl p-4 flex items-center gap-3">
                        <CheckCircle2 size={20} className="text-green-600 flex-shrink-0" />
                        <div>
                            <p className="text-xs font-semibold text-green-800">Code Verified</p>
                            <p className="text-sm font-medium text-green-900 mt-0.5">
                                {verified.child.firstname} {verified.child.lastname}
                            </p>
                        </div>
                    </div>

                    {verified.authorizedGuardians?.length > 0 && (
                        <div className="bg-white border border-[#121212]/5 rounded-2xl p-4">
                            <p className="text-[10px] uppercase tracking-wider font-semibold text-gray-400 mb-2">Authorised Guardians</p>
                            <div className="space-y-1.5">
                                {verified.authorizedGuardians.map((g) => (
                                    <div key={g.id} className="flex items-center gap-2 text-xs text-[#121212]">
                                        <ShieldCheck size={11} className="text-green-600" />
                                        <span>{g.fullName ?? `${g.firstname ?? ""} ${g.lastname ?? ""}`.trim()}</span>
                                        <span className="text-gray-400 capitalize">· {g.relationship?.toLowerCase()}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    <form onSubmit={handleCheckout} className="space-y-4">
                        <Field label="Picked Up By">
                            <input type="text" required placeholder="Full name of person collecting"
                                value={pickedUpByName} onChange={(e) => setPickName(e.target.value)} className={inputCls} />
                        </Field>

                        {hook.submitError && <ErrorBanner message={hook.submitError} />}

                        <div className="flex gap-3">
                            <button type="button" onClick={() => { setVerified(null); setCode(""); }}
                                className="flex-1 border border-[#121212]/10 text-xs uppercase tracking-widest font-semibold py-3 rounded-xl text-gray-500 hover:text-[#121212] transition-colors">
                                Back
                            </button>
                            <button type="submit" disabled={hook.isSubmitting}
                                className="flex-1 bg-[#121212] text-white text-xs uppercase tracking-widest font-semibold py-3 rounded-xl hover:bg-gray-800 transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
                                {hook.isSubmitting ? <Loader2 size={13} className="animate-spin" /> : <LogOut size={13} />}
                                Check Out
                            </button>
                        </div>
                    </form>
                </div>
            )}
        </div>
    );
}

type Tab = "children" | "checkin" | "checkout";

export const ChildrenChurchPage = () => {
    const router = useRouter();
    const { profile } = useProfile();
    const memberId = profile?.id ?? "";
    const hook = useChildrenChurch(memberId);

    const [children, setChildren] = useState<Child[]>([]);
    const [activeTab, setActiveTab] = useState<Tab>("children");
    const [selectedChild, setSelected] = useState<Child | null>(null);

    const tabs: { key: Tab; label: string; icon: React.ElementType }[] = [
        { key: "children", label: "My Children", icon: Baby },
        { key: "checkin", label: "Check In", icon: LogIn },
        { key: "checkout", label: "Check Out", icon: LogOut },
    ];

    return (
        <div className="min-h-screen bg-[#FFFFFF] text-[#121212] pb-32 font-sans selection:bg-[#121212] selection:text-[#FFFFFF]">

            <div className="relative w-full h-[40vh] overflow-hidden">
                <img
                    src="https://images.unsplash.com/flagged/photo-1567116681178-c326fa4e2c8b?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
                    alt="Children church"
                    className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-black/50" />



                <div className="absolute bottom-0 inset-x-0 p-5">
                    <span className="text-xs uppercase tracking-widest text-white/70 font-semibold flex items-center gap-1.5">
                        <Baby size={12} /> RCCG Discovery Centre
                    </span>
                    <h1 className="text-2xl font-light tracking-tight text-[#fff] mt-0.5">
                        Children's Church
                    </h1>
                </div>
            </div>

            <div className="px-5 mt-5">
                <div className="flex bg-[#F4F1EA] p-1 rounded-2xl gap-1">
                    {tabs.map(({ key, label, icon: Icon }) => (
                        <button
                            key={key}
                            onClick={() => { setActiveTab(key); setSelected(null); }}
                            className={`flex-1 flex flex-col items-center gap-1 py-2.5 rounded-xl transition-colors ${activeTab === key
                                ? "bg-white text-[#121212] shadow-sm"
                                : "text-[#8A817C] hover:text-[#121212]"
                                }`}
                        >
                            <Icon size={15} />
                            <span className="text-[9px] font-bold uppercase tracking-wider">{label}</span>
                        </button>
                    ))}
                </div>
            </div>

            <div className="px-5 mt-6">
                {activeTab === "children" && (
                    selectedChild ? (
                        <ChildDetailPanel
                            child={selectedChild}
                            onClose={() => setSelected(null)}
                            hook={hook}
                            memberId={memberId}
                        />
                    ) : (
                        <MyChildrenTab
                            hook={hook}
                            memberId={memberId}
                            children={children}
                            setChildren={setChildren}
                            onChildSelect={setSelected}
                        />
                    )
                )}

                {activeTab === "checkin" && (
                    <CheckInTab hook={hook} children={children} />
                )}

                {activeTab === "checkout" && (
                    <CheckOutTab hook={hook} />
                )}
            </div>
        </div>
    );
};