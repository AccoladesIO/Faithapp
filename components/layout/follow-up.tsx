"use client";

import React, { useState } from "react";
import Image from "next/image";
import {
    ArrowLeft, UserPlus, ClipboardList, ChevronLeft, ChevronRight,
    Loader2, CheckCircle2, Lock, MessageSquare, Clock,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useProfile } from "@/hooks/use-profile";
import {
    useFollowUpTasks, useFollowUpActions,
    FollowUpTask, FollowUpTaskStatus, FollowUpOutcome, ContactMethod,
} from "@/hooks/use-follow-up";

const STATUS_OPTIONS: FollowUpTaskStatus[] = ["PENDING", "IN_PROGRESS", "COMPLETED", "UNREACHABLE"];
const OUTCOME_OPTIONS: FollowUpOutcome[] = ["JOINED", "DECLINED", "NO_ANSWER", "PRAYED_WITH"];
const CONTACT_METHODS: ContactMethod[] = ["PHONE_CALL", "WHATSAPP", "IN_PERSON", "SMS", "EMAIL"];
const SOURCE_OPTIONS = ["WALK_IN", "ONLINE", "REFERRAL"] as const;

const inputCls = "w-full bg-[#F9F9F9] border border-[#121212]/10 rounded-xl px-3 py-2.5 text-xs font-sans outline-none focus:border-[#121212]/30";
const selectCls = inputCls + " appearance-none";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
    return (
        <div>
            <label className="text-[10px] uppercase tracking-wider text-gray-500 font-bold block mb-1.5">{label}</label>
            {children}
        </div>
    );
}

function formatDateTime(iso: string): string {
    return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit", hour12: true });
}

function TaskStatusBadge({ status }: { status: FollowUpTaskStatus }) {
    const styles: Record<FollowUpTaskStatus, string> = {
        PENDING: "bg-amber-50 text-amber-700",
        IN_PROGRESS: "bg-blue-50 text-blue-700",
        COMPLETED: "bg-green-50 text-green-700",
        UNREACHABLE: "bg-gray-100 text-gray-500",
    };
    return <span className={`text-[9px] uppercase tracking-wider font-bold px-1.5 py-0.5 rounded ${styles[status]}`}>{status.replace("_", " ")}</span>;
}

function WorkerOnlyMessage() {
    return (
        <div className="flex flex-col items-center gap-4 py-14 text-center">
            <div className="w-14 h-14 rounded-full bg-[#F4F1EA] flex items-center justify-center">
                <Lock size={22} className="text-[#756E69]" />
            </div>
            <div>
                <h3 className="text-sm font-medium text-[#121212]">Follow-Up — Department Workers Only</h3>
                <p className="text-xs text-gray-500 font-light mt-1 max-w-xs">
                    Only workers in the Follow-Up department can access first-timer tasks.
                </p>
            </div>
        </div>
    );
}

// ─── Task detail panel ────────────────────────────────────────────────────────

function TaskDetailPanel({ task, onClose, onUpdated }: { task: FollowUpTask; onClose: () => void; onUpdated: () => void }) {
    const { isSubmitting, submitError, updateTask, addNote } = useFollowUpActions();
    const [status, setStatus] = useState<FollowUpTaskStatus>(task.status);
    const [outcome, setOutcome] = useState<FollowUpOutcome | "">(task.outcome ?? "");
    const [outcomeNotes, setOutcomeNotes] = useState(task.outcomeNotes ?? "");
    const [noteContent, setNoteContent] = useState("");
    const [contactMethod, setContactMethod] = useState<ContactMethod>("PHONE_CALL");
    const [saved, setSaved] = useState(false);
    const [noteAdded, setNoteAdded] = useState(false);

    const name = task.firstTimer
        ? `${task.firstTimer.firstname} ${task.firstTimer.lastname}`
        : task.member
            ? `${task.member.firstname} ${task.member.lastname}`
            : "Unknown";

    const handleSaveStatus = async () => {
        try {
            await updateTask(task.id, {
                status,
                ...(outcome ? { outcome } : {}),
                ...(outcomeNotes ? { outcomeNotes } : {}),
            });
            setSaved(true);
            setTimeout(() => setSaved(false), 2500);
            onUpdated();
        } catch { /* submitError shown in UI */ }
    };

    const handleAddNote = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!noteContent.trim()) return;
        try {
            await addNote(task.id, noteContent.trim(), contactMethod);
            setNoteContent("");
            setNoteAdded(true);
            setTimeout(() => setNoteAdded(false), 2500);
            onUpdated();
        } catch { /* submitError shown in UI */ }
    };

    return (
        <div className="space-y-4">
            <div className="flex items-center gap-3">
                <button onClick={onClose} className="p-1.5 text-[#756E69] hover:text-[#121212] rounded-lg hover:bg-[#F4F1EA] transition-colors">
                    <ChevronLeft size={16} />
                </button>
                <div>
                    <h2 className="text-base font-medium text-[#121212]">{name}</h2>
                    {task.firstTimer && <p className="text-xs text-gray-500 font-light">{task.firstTimer.phone}</p>}
                </div>
            </div>

            {task.firstTimer && (
                <div className="bg-white border border-[#121212]/5 rounded-2xl p-4 text-xs space-y-1.5">
                    {task.firstTimer.email && <p><span className="text-gray-500">Email:</span> {task.firstTimer.email}</p>}
                    <p><span className="text-gray-500">Source:</span> {task.firstTimer.source.replace("_", " ")}</p>
                    <p><span className="text-gray-500">Wants to join church:</span> {task.firstTimer.wantsToJoinChurch ? "Yes" : "No"}</p>
                    <p><span className="text-gray-500">Wants to join workforce:</span> {task.firstTimer.wantsToJoinWorkforce ? "Yes" : "No"}</p>
                    {task.firstTimer.notes && <p className="pt-1 border-t border-[#121212]/5 mt-1 text-gray-600 font-light">{task.firstTimer.notes}</p>}
                </div>
            )}

            <div className="bg-white border border-[#121212]/10 rounded-2xl p-4 space-y-3">
                <span className="text-xs font-semibold uppercase tracking-wider text-[#121212]">Update Status</span>
                <div className="grid grid-cols-2 gap-3">
                    <Field label="Status">
                        <select value={status} onChange={(e) => setStatus(e.target.value as FollowUpTaskStatus)} className={selectCls}>
                            {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s.replace("_", " ")}</option>)}
                        </select>
                    </Field>
                    <Field label="Outcome">
                        <select value={outcome} onChange={(e) => setOutcome(e.target.value as FollowUpOutcome)} className={selectCls}>
                            <option value="">— None —</option>
                            {OUTCOME_OPTIONS.map((o) => <option key={o} value={o}>{o.replace("_", " ")}</option>)}
                        </select>
                    </Field>
                </div>
                <Field label="Outcome Notes">
                    <textarea rows={2} value={outcomeNotes} onChange={(e) => setOutcomeNotes(e.target.value)} className={`${inputCls} resize-none`} />
                </Field>
                {submitError && <p className="text-xs text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">{submitError}</p>}
                {saved && <p className="text-xs text-green-700 bg-green-50 border border-green-100 rounded-lg px-3 py-2 flex items-center gap-1.5"><CheckCircle2 size={12} /> Saved.</p>}
                <button onClick={handleSaveStatus} disabled={isSubmitting}
                    className="w-full bg-[#121212] text-white text-xs uppercase tracking-widest font-semibold py-2.5 rounded-xl hover:bg-gray-800 transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
                    {isSubmitting ? <Loader2 size={12} className="animate-spin" /> : null} Save
                </button>
            </div>

            <div className="bg-white border border-[#121212]/5 rounded-2xl p-4 space-y-3">
                <span className="text-xs font-semibold uppercase tracking-wider text-[#121212] flex items-center gap-1.5">
                    <MessageSquare size={13} className="text-[#756E69]" /> Notes ({task.notes.length})
                </span>
                {task.notes.length === 0 ? (
                    <p className="text-xs text-gray-500 font-light">No notes yet.</p>
                ) : (
                    <div className="space-y-2">
                        {task.notes.map((n) => (
                            <div key={n.id} className="bg-[#F9F9F9] rounded-xl p-3">
                                <p className="text-xs text-gray-700 font-light">{n.content}</p>
                                <p className="text-[10px] text-gray-500 font-light mt-1 flex items-center gap-1">
                                    <Clock size={9} /> {formatDateTime(n.createdAt)}
                                    {n.contactMethod && ` · ${n.contactMethod.replace("_", " ")}`}
                                </p>
                            </div>
                        ))}
                    </div>
                )}
                <form onSubmit={handleAddNote} className="space-y-2 pt-2 border-t border-[#121212]/5">
                    <textarea rows={2} placeholder="Add a note about this contact…" value={noteContent}
                        onChange={(e) => setNoteContent(e.target.value)} className={`${inputCls} resize-none`} />
                    <div className="flex gap-2">
                        <select value={contactMethod} onChange={(e) => setContactMethod(e.target.value as ContactMethod)} className={selectCls + " flex-1"}>
                            {CONTACT_METHODS.map((c) => <option key={c} value={c}>{c.replace("_", " ")}</option>)}
                        </select>
                        <button type="submit" disabled={isSubmitting || !noteContent.trim()}
                            className="bg-[#121212] text-white text-xs uppercase tracking-widest font-semibold px-4 rounded-xl hover:bg-gray-800 transition-colors disabled:opacity-50">
                            Add
                        </button>
                    </div>
                    {noteAdded && <p className="text-[10px] text-green-700 flex items-center gap-1"><CheckCircle2 size={10} /> Note added.</p>}
                </form>
            </div>
        </div>
    );
}

// ─── My Tasks tab ─────────────────────────────────────────────────────────────

function MyTasksTab({ isWorker }: { isWorker: boolean }) {
    const {
        tasks, isLoading, error, page, totalPages, goToPage, statusFilter, setStatusFilter, refetch,
    } = useFollowUpTasks();
    const [selected, setSelected] = useState<FollowUpTask | null>(null);

    if (!isWorker) return <WorkerOnlyMessage />;

    if (selected) {
        const latest = tasks.find((t) => t.id === selected.id) ?? selected;
        return <TaskDetailPanel task={latest} onClose={() => setSelected(null)} onUpdated={refetch} />;
    }

    return (
        <div className="space-y-4">
            <div className="flex gap-1.5 overflow-x-auto pb-1">
                <button onClick={() => setStatusFilter(null)}
                    className={`shrink-0 text-[10px] uppercase tracking-wider font-bold px-3 py-1.5 rounded-full border transition-colors ${!statusFilter ? "bg-[#121212] text-white border-transparent" : "bg-white text-gray-500 border-[#121212]/10"}`}>
                    All
                </button>
                {STATUS_OPTIONS.map((s) => (
                    <button key={s} onClick={() => setStatusFilter(s)}
                        className={`shrink-0 text-[10px] uppercase tracking-wider font-bold px-3 py-1.5 rounded-full border transition-colors whitespace-nowrap ${statusFilter === s ? "bg-[#121212] text-white border-transparent" : "bg-white text-gray-500 border-[#121212]/10"}`}>
                        {s.replace("_", " ")}
                    </button>
                ))}
            </div>

            {isLoading ? (
                <div className="space-y-2">{[1, 2, 3].map((i) => <div key={i} className="h-16 bg-gray-100 rounded-xl animate-pulse" />)}</div>
            ) : error ? (
                <p className="text-xs text-red-500">{error}</p>
            ) : tasks.length === 0 ? (
                <p className="text-sm text-gray-500 font-light text-center py-12">No follow-up tasks assigned to you.</p>
            ) : (
                <>
                    <div className="space-y-2.5">
                        {tasks.map((task) => {
                            const name = task.firstTimer
                                ? `${task.firstTimer.firstname} ${task.firstTimer.lastname}`
                                : task.member
                                    ? `${task.member.firstname} ${task.member.lastname}`
                                    : "Unknown";
                            return (
                                <button key={task.id} onClick={() => setSelected(task)}
                                    className="w-full text-left bg-white border border-[#121212]/5 rounded-2xl p-4 hover:border-[#121212]/10 transition-colors">
                                    <div className="flex items-center justify-between mb-1">
                                        <span className="text-sm font-medium text-[#121212]">{name}</span>
                                        <TaskStatusBadge status={task.status} />
                                    </div>
                                    <p className="text-[10px] text-gray-500 font-light">
                                        {task.firstTimer?.phone ?? task.event?.name ?? ""} · Last activity {formatDateTime(task.lastActivityAt)}
                                    </p>
                                </button>
                            );
                        })}
                    </div>
                    {totalPages > 1 && (
                        <div className="flex items-center justify-between pt-2">
                            <button onClick={() => goToPage(page - 1)} disabled={page <= 1}
                                className="flex items-center gap-1 text-xs font-semibold text-[#756E69] hover:text-[#121212] disabled:opacity-40 transition-colors">
                                <ChevronLeft size={14} /> Prev
                            </button>
                            <span className="text-[10px] text-gray-500 font-light">Page {page} of {totalPages}</span>
                            <button onClick={() => goToPage(page + 1)} disabled={page >= totalPages}
                                className="flex items-center gap-1 text-xs font-semibold text-[#756E69] hover:text-[#121212] disabled:opacity-40 transition-colors">
                                Next <ChevronRight size={14} />
                            </button>
                        </div>
                    )}
                </>
            )}
        </div>
    );
}

// ─── New First-Timer tab ──────────────────────────────────────────────────────

const defaultForm = {
    firstname: "", lastname: "", phone: "", email: "",
    source: "WALK_IN" as (typeof SOURCE_OPTIONS)[number],
    wantsToJoinChurch: false, wantsToJoinWorkforce: false, notes: "",
};

function NewFirstTimerTab({ isWorker }: { isWorker: boolean }) {
    const { isSubmitting, submitError, createFirstTimer } = useFollowUpActions();
    const [form, setForm] = useState(defaultForm);
    const [success, setSuccess] = useState(false);

    if (!isWorker) return <WorkerOnlyMessage />;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await createFirstTimer({ ...form, email: form.email || undefined, notes: form.notes || undefined });
            setForm(defaultForm);
            setSuccess(true);
            setTimeout(() => setSuccess(false), 3000);
        } catch { /* submitError shown in UI */ }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            {success && (
                <div className="flex items-center gap-2 bg-green-50 border border-green-100 text-green-700 px-4 py-3 rounded-xl text-xs font-medium">
                    <CheckCircle2 size={13} /> First-timer recorded — a follow-up task has been created for you.
                </div>
            )}
            <div className="grid grid-cols-2 gap-3">
                <Field label="First Name"><input required type="text" value={form.firstname} onChange={(e) => setForm((p) => ({ ...p, firstname: e.target.value }))} className={inputCls} /></Field>
                <Field label="Last Name"><input required type="text" value={form.lastname} onChange={(e) => setForm((p) => ({ ...p, lastname: e.target.value }))} className={inputCls} /></Field>
            </div>
            <Field label="Phone"><input required type="tel" placeholder="+234…" value={form.phone} onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))} className={inputCls} /></Field>
            <Field label="Email (Optional)"><input type="email" value={form.email} onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))} className={inputCls} /></Field>
            <Field label="How did they hear about us?">
                <select value={form.source} onChange={(e) => setForm((p) => ({ ...p, source: e.target.value as (typeof SOURCE_OPTIONS)[number] }))} className={selectCls}>
                    {SOURCE_OPTIONS.map((s) => <option key={s} value={s}>{s.replace("_", " ")}</option>)}
                </select>
            </Field>
            <div className="space-y-2">
                <div className="flex items-center justify-between bg-[#F9F9F9] rounded-xl px-3 py-2.5">
                    <span className="text-xs text-[#121212]">Wants to join the church</span>
                    <button type="button" onClick={() => setForm((p) => ({ ...p, wantsToJoinChurch: !p.wantsToJoinChurch }))}
                        className={`w-9 h-5 flex items-center rounded-full p-0.5 transition-colors ${form.wantsToJoinChurch ? "bg-[#8A817C]" : "bg-gray-300"}`}>
                        <div className={`bg-white w-4 h-4 rounded-full shadow transition-transform ${form.wantsToJoinChurch ? "translate-x-4" : "translate-x-0"}`} />
                    </button>
                </div>
                <div className="flex items-center justify-between bg-[#F9F9F9] rounded-xl px-3 py-2.5">
                    <span className="text-xs text-[#121212]">Wants to join the workforce</span>
                    <button type="button" onClick={() => setForm((p) => ({ ...p, wantsToJoinWorkforce: !p.wantsToJoinWorkforce }))}
                        className={`w-9 h-5 flex items-center rounded-full p-0.5 transition-colors ${form.wantsToJoinWorkforce ? "bg-[#8A817C]" : "bg-gray-300"}`}>
                        <div className={`bg-white w-4 h-4 rounded-full shadow transition-transform ${form.wantsToJoinWorkforce ? "translate-x-4" : "translate-x-0"}`} />
                    </button>
                </div>
            </div>
            <Field label="Notes (Optional)">
                <textarea rows={2} value={form.notes} onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))} className={`${inputCls} resize-none`} />
            </Field>
            {submitError && <p className="text-xs text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">{submitError}</p>}
            <button type="submit" disabled={isSubmitting}
                className="w-full bg-[#121212] text-white text-xs uppercase tracking-widest font-semibold py-3 rounded-xl hover:bg-gray-800 transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
                {isSubmitting ? <><Loader2 size={13} className="animate-spin" /> Saving…</> : "Record First-Timer"}
            </button>
        </form>
    );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export const FollowUpPage = () => {
    const router = useRouter();
    const { profile } = useProfile();
    const [tab, setTab] = useState<"tasks" | "new">("tasks");

    const isFollowUpWorker =
        profile?.role === "WORKER" &&
        (profile?.workerProfile?.department?.key === "FOLLOW_UP" ||
            profile?.workerProfile?.secondaryDepartment?.key === "FOLLOW_UP");

    return (
        <div className="min-h-screen bg-[#FFFFFF] text-[#121212] pb-32 font-sans selection:bg-[#121212] selection:text-[#FFFFFF]">

            {/* ── Hero ─────────────────────────────────────────────────── */}
            <div className="relative w-full h-[40vh] overflow-hidden">
                <Image
                    src="/images/follow-up-backdrop.jpg"
                    alt="Follow-up backdrop"
                    fill
                    priority
                    sizes="100vw"
                    className="object-cover"
                />
                <div className="absolute inset-0 bg-black/50" />
                <div className="absolute top-4 left-4 z-10">
                    <button
                        onClick={() => router.back()}
                        className="p-2.5 bg-black/25 backdrop-blur-md hover:bg-black/40 text-white rounded-full transition-colors border border-white/10"
                        aria-label="Go back"
                    >
                        <ArrowLeft size={16} />
                    </button>
                </div>
                <div className="absolute bottom-0 inset-x-0 p-6">
                    <span className="text-xs uppercase tracking-widest text-white/80 font-semibold flex items-center gap-1 drop-shadow-sm">
                        <UserPlus size={12} /> Discipleship
                    </span>
                    <h1 className="text-2xl font-light tracking-tight text-white mt-1 drop-shadow-md">
                        Follow-Up
                    </h1>
                </div>
            </div>

            <div className="px-6 mt-6 max-w-md mx-auto space-y-6">
                <div className="flex bg-[#F4F1EA] p-1 rounded-xl">
                    <button onClick={() => setTab("tasks")}
                        className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-semibold uppercase tracking-wider rounded-lg transition-colors ${tab === "tasks" ? "bg-[#121212] text-white" : "text-[#756E69] hover:text-[#121212]"}`}>
                        <ClipboardList size={13} /> My Tasks
                    </button>
                    <button onClick={() => setTab("new")}
                        className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-semibold uppercase tracking-wider rounded-lg transition-colors ${tab === "new" ? "bg-[#121212] text-white" : "text-[#756E69] hover:text-[#121212]"}`}>
                        <UserPlus size={13} /> New First-Timer
                    </button>
                </div>

                {tab === "tasks" && <MyTasksTab isWorker={isFollowUpWorker} />}
                {tab === "new" && <NewFirstTimerTab isWorker={isFollowUpWorker} />}
            </div>
        </div>
    );
};
