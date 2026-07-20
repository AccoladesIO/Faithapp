"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import {
    ArrowLeft, MessageSquareText, Plus, CheckCircle2, XCircle,
    Loader2, RefreshCw, Inbox, ChevronLeft, ChevronRight, Users,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { api } from "@/utils/auth/axios-client";
import { useProfile } from "@/hooks/use-profile";
import {
    useDepartmentFeedback,
    DepartmentFeedbackRecord,
} from "@/hooks/use-department-feedback";
import { usePastorFeedback } from "@/hooks/use-pastor-feedback";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(iso: string): string {
    return new Date(iso + "T00:00:00").toLocaleDateString("en-GB", {
        day: "numeric", month: "short", year: "numeric",
    });
}

// Defaults the form to the Monday of the most recently completed week.
function lastMonday(): string {
    const d = new Date();
    const day = d.getDay();
    const diff = (day + 6) % 7 + 7;
    d.setDate(d.getDate() - diff);
    return d.toISOString().slice(0, 10);
}

// ─── Feedback card ────────────────────────────────────────────────────────────

function FeedbackCard({ record }: { record: DepartmentFeedbackRecord }) {
    return (
        <div className="bg-white border border-[#121212]/5 p-4 shadow-sm space-y-2">
            <div className="flex items-center justify-between gap-2 flex-wrap">
                <span className="text-xs font-semibold text-[#121212]">
                    Week of {formatDate(record.weekOf)}
                </span>
                <span className="text-[10px] text-gray-500 font-light">
                    by {record.submittedByName}
                </span>
            </div>
            <div className="space-y-1.5 text-xs text-gray-600 font-light">
                <p><span className="font-semibold text-[#121212]">Attendance:</span> {record.attendanceNotes}</p>
                <p><span className="font-semibold text-[#121212]">Highlights:</span> {record.highlights}</p>
                <p><span className="font-semibold text-[#121212]">Challenges:</span> {record.challenges}</p>
                {record.prayerRequests && (
                    <p><span className="font-semibold text-[#121212]">Prayer Requests:</span> {record.prayerRequests}</p>
                )}
            </div>
            {record.pastorResponse ? (
                <div className="mt-2 bg-[#F9F9F9] border-l-2 border-[#121212] p-3 rounded-r-lg">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-1">
                        Response from {record.respondedByPastorName}
                    </p>
                    <p className="text-xs text-[#121212] font-light italic">{record.pastorResponse}</p>
                </div>
            ) : (
                <p className="text-[10px] text-gray-400 font-light">Awaiting pastor response</p>
            )}
        </div>
    );
}

function FeedbackSkeleton() {
    return (
        <div className="space-y-3">
            {[1, 2].map((i) => (
                <div key={i} className="bg-white border border-[#121212]/5 p-4 shadow-sm animate-pulse space-y-2">
                    <div className="h-4 w-40 bg-gray-100 rounded" />
                    <div className="h-3 w-full bg-gray-100 rounded" />
                    <div className="h-3 w-2/3 bg-gray-100 rounded" />
                </div>
            ))}
        </div>
    );
}

const defaultForm = {
    weekOf: lastMonday(),
    attendanceNotes: "",
    highlights: "",
    challenges: "",
    prayerRequests: "",
    additionalNotes: "",
};

type Tab = "mine" | "pastor";

export const DepartmentFeedbackPage = () => {
    const router = useRouter();
    const { profile } = useProfile();
    const isHod = !!profile?.isHod;
    const isPastor = !!profile?.pastorType;

    const {
        records, isLoading, isSubmitting, error, submitError, submitFeedback,
    } = useDepartmentFeedback();
    const {
        records: pastorRecords, pagination: pastorPagination, isLoading: pastorLoading,
        error: pastorError, isResponding, respondError, fetchFeedback, respond,
    } = usePastorFeedback();

    const [tab, setTab] = useState<Tab>(isHod ? "mine" : "pastor");
    const [showForm, setShowForm] = useState(false);
    const [form, setForm] = useState(defaultForm);
    const [formSuccess, setFormSuccess] = useState(false);

    const [departments, setDepartments] = useState<{ id: string; name: string }[]>([]);
    const [deptFilter, setDeptFilter] = useState("");
    const [respondingId, setRespondingId] = useState<string | null>(null);
    const [responseDraft, setResponseDraft] = useState("");

    useEffect(() => {
        if (tab === "pastor") {
            fetchFeedback(1, deptFilter || undefined);
            if (departments.length === 0) {
                api.get<{ data: { id: string; name: string }[] }>("/departments")
                    .then((res) => setDepartments(res.data.data ?? []))
                    .catch(() => setDepartments([]));
            }
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [tab, deptFilter]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!profile?.workerProfile?.department) return;
        try {
            await submitFeedback({
                departmentId: profile.workerProfile.department.id,
                weekOf: form.weekOf,
                attendanceNotes: form.attendanceNotes,
                highlights: form.highlights,
                challenges: form.challenges,
                prayerRequests: form.prayerRequests || undefined,
                additionalNotes: form.additionalNotes || undefined,
            });
            setForm(defaultForm);
            setShowForm(false);
            setFormSuccess(true);
            setTimeout(() => setFormSuccess(false), 3000);
        } catch { /* submitError shown in UI */ }
    };

    const handleRespond = async (id: string) => {
        if (!responseDraft.trim()) return;
        try {
            await respond(id, responseDraft);
            setRespondingId(null);
            setResponseDraft("");
        } catch { /* respondError shown in UI */ }
    };

    return (
        <div className="min-h-screen bg-[#FFFFFF] text-[#121212] pb-32 font-sans selection:bg-[#121212] selection:text-[#FFFFFF]">

            <div className="relative w-full h-[40vh] overflow-hidden">
                <Image
                    src="/images/leave-request-backdrop.jpg"
                    alt="Church backdrop"
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
                        <MessageSquareText size={12} /> Department Operations
                    </span>
                    <h1 className="text-2xl font-light tracking-tight text-white mt-1 drop-shadow-md">Weekly Feedback</h1>
                </div>
            </div>

            <div className="px-6 mt-6 space-y-6 max-w-md mx-auto">

                {isHod && isPastor && (
                    <div className="flex gap-2">
                        <button
                            onClick={() => setTab("mine")}
                            className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-[11px] font-bold uppercase tracking-wider rounded-xl border transition-colors ${tab === "mine" ? "bg-[#121212] text-white border-[#121212]" : "bg-white text-[#756E69] border-[#121212]/10 hover:text-[#121212]"}`}
                        >
                            <MessageSquareText size={13} /> My Department
                        </button>
                        <button
                            onClick={() => setTab("pastor")}
                            className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-[11px] font-bold uppercase tracking-wider rounded-xl border transition-colors ${tab === "pastor" ? "bg-[#121212] text-white border-[#121212]" : "bg-white text-[#756E69] border-[#121212]/10 hover:text-[#121212]"}`}
                        >
                            <Users size={13} /> Pastor Review
                        </button>
                    </div>
                )}

                {tab === "mine" && isHod && (
                    <>
                        {formSuccess && (
                            <div className="flex items-center gap-2 bg-green-50 border border-green-100 text-green-700 px-4 py-3 rounded-xl text-xs font-medium">
                                <CheckCircle2 size={14} /> Feedback submitted successfully.
                            </div>
                        )}
                        {submitError && (
                            <div className="flex items-center gap-2 bg-red-50 border border-red-100 text-red-600 px-4 py-3 rounded-xl text-xs font-medium">
                                <XCircle size={14} /> {submitError}
                            </div>
                        )}

                        {!showForm ? (
                            <button
                                onClick={() => setShowForm(true)}
                                className="w-full flex items-center justify-center gap-2 py-3 border-2 border-dashed border-[#121212]/10 rounded-xl text-xs font-semibold uppercase tracking-widest text-[#756E69] hover:border-[#121212]/20 hover:text-[#121212] transition-all"
                            >
                                <Plus size={14} /> Submit Weekly Feedback
                            </button>
                        ) : (
                            <div className="bg-white border border-[#121212]/10 rounded-2xl p-5 shadow-sm">
                                <div className="flex items-center justify-between mb-5">
                                    <h2 className="text-sm font-semibold uppercase tracking-wider text-[#121212]">New Feedback</h2>
                                    <button
                                        onClick={() => { setShowForm(false); setForm(defaultForm); }}
                                        className="text-xs text-gray-500 hover:text-[#121212] transition-colors"
                                    >
                                        Cancel
                                    </button>
                                </div>

                                <form onSubmit={handleSubmit} className="space-y-4">
                                    <div>
                                        <label className="block text-[11px] uppercase tracking-wider font-semibold text-gray-500 mb-1.5">
                                            Week Of
                                        </label>
                                        <input
                                            type="date"
                                            required
                                            value={form.weekOf}
                                            onChange={(e) => setForm((p) => ({ ...p, weekOf: e.target.value }))}
                                            className="w-full bg-[#F9F9F9] border border-[#121212]/10 rounded-xl px-3 py-2.5 text-xs font-sans outline-none focus:border-[#121212]/30"
                                        />
                                    </div>
                                    {([
                                        ["attendanceNotes", "Attendance / Turnout"],
                                        ["highlights", "Highlights / Wins"],
                                        ["challenges", "Challenges / Concerns"],
                                    ] as const).map(([key, label]) => (
                                        <div key={key}>
                                            <label className="block text-[11px] uppercase tracking-wider font-semibold text-gray-500 mb-1.5">
                                                {label}
                                            </label>
                                            <textarea
                                                rows={2}
                                                required
                                                value={form[key]}
                                                onChange={(e) => setForm((p) => ({ ...p, [key]: e.target.value }))}
                                                className="w-full bg-[#F9F9F9] border border-[#121212]/10 rounded-xl p-3 text-xs font-sans outline-none resize-none focus:border-[#121212]/30"
                                            />
                                        </div>
                                    ))}
                                    <div>
                                        <label className="block text-[11px] uppercase tracking-wider font-semibold text-gray-500 mb-1.5">
                                            Prayer Requests <span className="normal-case font-normal text-gray-400">(optional)</span>
                                        </label>
                                        <textarea
                                            rows={2}
                                            value={form.prayerRequests}
                                            onChange={(e) => setForm((p) => ({ ...p, prayerRequests: e.target.value }))}
                                            className="w-full bg-[#F9F9F9] border border-[#121212]/10 rounded-xl p-3 text-xs font-sans outline-none resize-none focus:border-[#121212]/30"
                                        />
                                    </div>

                                    <button
                                        type="submit"
                                        disabled={isSubmitting}
                                        className="w-full bg-[#121212] text-white text-xs uppercase tracking-widest font-semibold py-3 rounded-xl hover:bg-gray-800 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                                    >
                                        {isSubmitting ? (<><Loader2 size={13} className="animate-spin" /> Submitting…</>) : "Submit Feedback"}
                                    </button>
                                </form>
                            </div>
                        )}

                        <div>
                            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-4">
                                Submission History
                            </h3>
                            {isLoading ? (
                                <FeedbackSkeleton />
                            ) : error ? (
                                <p className="text-sm font-light text-gray-500">{error}</p>
                            ) : records.length === 0 ? (
                                <div className="flex flex-col items-center gap-3 py-12 text-gray-500">
                                    <Inbox size={28} />
                                    <p className="text-sm font-light">No feedback submitted yet.</p>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {records.map((r) => <FeedbackCard key={r.id} record={r} />)}
                                </div>
                            )}
                        </div>
                    </>
                )}

                {tab === "pastor" && isPastor && (
                    <div>
                        <div className="flex gap-2 mb-4 flex-wrap">
                            <button
                                onClick={() => setDeptFilter("")}
                                className={`px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider rounded-full border transition-colors ${deptFilter === "" ? "bg-[#121212] text-white border-[#121212]" : "bg-white text-[#756E69] border-[#121212]/10 hover:text-[#121212]"}`}
                            >
                                All Departments
                            </button>
                            {departments.map((d) => (
                                <button
                                    key={d.id}
                                    onClick={() => setDeptFilter(d.id)}
                                    className={`px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider rounded-full border transition-colors ${deptFilter === d.id ? "bg-[#121212] text-white border-[#121212]" : "bg-white text-[#756E69] border-[#121212]/10 hover:text-[#121212]"}`}
                                >
                                    {d.name}
                                </button>
                            ))}
                        </div>

                        {respondError && (
                            <div className="flex items-center gap-2 bg-red-50 border border-red-100 text-red-600 px-4 py-3 rounded-xl text-xs font-medium mb-3">
                                <XCircle size={14} /> {respondError}
                            </div>
                        )}

                        {pastorLoading ? (
                            <FeedbackSkeleton />
                        ) : pastorError ? (
                            <div className="flex flex-col items-start gap-3 py-8 text-gray-500">
                                <p className="text-sm font-light">{pastorError}</p>
                                <button
                                    onClick={() => fetchFeedback(1, deptFilter || undefined)}
                                    className="flex items-center gap-1.5 text-xs font-semibold text-[#121212] hover:underline"
                                >
                                    <RefreshCw size={12} /> Retry
                                </button>
                            </div>
                        ) : pastorRecords.length === 0 ? (
                            <div className="flex flex-col items-center gap-3 py-12 text-gray-500">
                                <Inbox size={28} />
                                <p className="text-sm font-light">No feedback submissions found.</p>
                            </div>
                        ) : (
                            <>
                                <div className="space-y-3">
                                    {pastorRecords.map((r) => (
                                        <div key={r.id} className="space-y-2">
                                            <FeedbackCard record={r} />
                                            {!r.pastorResponse && (
                                                respondingId === r.id ? (
                                                    <div className="bg-white border border-[#121212]/10 rounded-xl p-3 space-y-2">
                                                        <textarea
                                                            rows={2}
                                                            autoFocus
                                                            value={responseDraft}
                                                            onChange={(e) => setResponseDraft(e.target.value)}
                                                            placeholder="Write your response…"
                                                            className="w-full bg-[#F9F9F9] border border-[#121212]/10 rounded-lg p-2.5 text-xs font-sans outline-none resize-none focus:border-[#121212]/30"
                                                        />
                                                        <div className="flex gap-2">
                                                            <button
                                                                onClick={() => handleRespond(r.id)}
                                                                disabled={isResponding || !responseDraft.trim()}
                                                                className="flex-1 bg-[#121212] text-white text-[10px] uppercase tracking-widest font-semibold py-2 rounded-lg disabled:opacity-50 flex items-center justify-center gap-1.5"
                                                            >
                                                                {isResponding && <Loader2 size={12} className="animate-spin" />}
                                                                Send
                                                            </button>
                                                            <button
                                                                onClick={() => { setRespondingId(null); setResponseDraft(""); }}
                                                                className="px-4 text-[10px] uppercase tracking-widest font-semibold text-gray-500 hover:text-[#121212]"
                                                            >
                                                                Cancel
                                                            </button>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <button
                                                        onClick={() => { setRespondingId(r.id); setResponseDraft(""); }}
                                                        className="text-[10px] font-bold uppercase tracking-wider text-[#121212] hover:underline"
                                                    >
                                                        Respond
                                                    </button>
                                                )
                                            )}
                                        </div>
                                    ))}
                                </div>

                                {pastorPagination && pastorPagination.totalPages > 1 && (
                                    <div className="flex items-center justify-between mt-4">
                                        <button
                                            onClick={() => fetchFeedback(pastorPagination.page - 1, deptFilter || undefined)}
                                            disabled={pastorPagination.page <= 1}
                                            className="flex items-center gap-1 text-xs font-semibold text-[#756E69] hover:text-[#121212] disabled:opacity-40 transition-colors"
                                        >
                                            <ChevronLeft size={14} /> Prev
                                        </button>
                                        <span className="text-[10px] text-gray-500 font-light">
                                            Page {pastorPagination.page} of {pastorPagination.totalPages}
                                        </span>
                                        <button
                                            onClick={() => fetchFeedback(pastorPagination.page + 1, deptFilter || undefined)}
                                            disabled={pastorPagination.page >= pastorPagination.totalPages}
                                            className="flex items-center gap-1 text-xs font-semibold text-[#756E69] hover:text-[#121212] disabled:opacity-40 transition-colors"
                                        >
                                            Next <ChevronRight size={14} />
                                        </button>
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                )}

                {!isHod && !isPastor && (
                    <div className="flex flex-col items-center gap-3 py-16 text-gray-500">
                        <Inbox size={28} />
                        <p className="text-sm font-light text-center">
                            This section is for department leads and pastors.
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
};
