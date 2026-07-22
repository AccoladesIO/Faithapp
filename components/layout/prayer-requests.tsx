"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import {
    ArrowLeft, HeartHandshake, Plus, CheckCircle2, XCircle,
    Loader2, Inbox, Megaphone, Users, Lock, Baby, History, ChevronDown, ChevronUp,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useProfile } from "@/hooks/use-profile";
import {
    usePrayerRequests,
    PrayerRequestRecord,
    TestimonyRecord,
    PrayerRequestStatus,
} from "@/hooks/use-prayer-requests";
import { usePrayerTeam } from "@/hooks/use-prayer-team";
import { usePregnancyPrayer, PregnancyCaseStatus, PregnancyVisitRecord } from "@/hooks/use-pregnancy-prayer";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(iso: string): string {
    return new Date(iso).toLocaleDateString("en-GB", {
        day: "numeric", month: "short", year: "numeric",
    });
}

const STATUS_LABELS: Record<PrayerRequestStatus, string> = {
    OPEN: "Open",
    PRAYED_FOR: "Prayed For",
    ANSWERED: "Answered",
};

const STATUS_STYLES: Record<PrayerRequestStatus, string> = {
    OPEN: "bg-amber-50 text-amber-700 border-amber-100",
    PRAYED_FOR: "bg-blue-50 text-blue-700 border-blue-100",
    ANSWERED: "bg-green-50 text-green-700 border-green-100",
};

function StatusBadge({ status }: { status: PrayerRequestStatus }) {
    return (
        <span className={`inline-block px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider rounded border ${STATUS_STYLES[status]}`}>
            {STATUS_LABELS[status]}
        </span>
    );
}

function RequestCard({ record }: { record: PrayerRequestRecord }) {
    return (
        <div className="bg-white border border-[#121212]/5 p-4 shadow-sm space-y-2">
            <div className="flex items-center justify-between gap-2">
                <span className="text-[10px] text-gray-500 font-light">{formatDate(record.createdAt)}</span>
                <StatusBadge status={record.status} />
            </div>
            <p className="text-xs text-[#121212] font-light whitespace-pre-wrap">{record.content}</p>
        </div>
    );
}

function TestimonyCard({ record, showAuthor }: { record: TestimonyRecord; showAuthor?: boolean }) {
    return (
        <div className="bg-white border border-[#121212]/5 p-4 shadow-sm space-y-2">
            <div className="flex items-center justify-between gap-2">
                {showAuthor ? (
                    <span className="text-xs font-semibold text-[#121212]">{record.submittedByName}</span>
                ) : <span />}
                <span className="text-[10px] text-gray-500 font-light">{formatDate(record.createdAt)}</span>
            </div>
            <p className="text-xs text-[#121212] font-light whitespace-pre-wrap">{record.content}</p>
        </div>
    );
}

function ListSkeleton() {
    return (
        <div className="space-y-3">
            {[1, 2].map((i) => (
                <div key={i} className="bg-white border border-[#121212]/5 p-4 shadow-sm animate-pulse space-y-2">
                    <div className="h-3 w-24 bg-gray-100 rounded" />
                    <div className="h-3 w-full bg-gray-100 rounded" />
                </div>
            ))}
        </div>
    );
}

function PregnancyVisitHistoryToggle({
    caseId,
    fetchVisitHistory,
}: Readonly<{
    caseId: string;
    fetchVisitHistory: (id: string, page?: number) => Promise<{ visits: PregnancyVisitRecord[]; pagination: { page: number; totalPages: number } | null }>;
}>) {
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [visits, setVisits] = useState<PregnancyVisitRecord[] | null>(null);

    const toggle = async () => {
        if (open) { setOpen(false); return; }
        setOpen(true);
        if (visits === null) {
            setLoading(true);
            const { visits: fetched } = await fetchVisitHistory(caseId, 1);
            setVisits(fetched);
            setLoading(false);
        }
    };

    return (
        <div>
            <button
                type="button"
                onClick={toggle}
                className="flex items-center gap-1 text-[9px] font-bold uppercase tracking-wider text-[#756E69] hover:text-[#121212]"
            >
                <History size={11} /> History {open ? <ChevronUp size={11} /> : <ChevronDown size={11} />}
            </button>
            {open && (
                loading ? (
                    <p className="text-[10px] text-gray-400 mt-1.5">Loading…</p>
                ) : visits && visits.length === 0 ? (
                    <p className="text-[10px] text-gray-400 mt-1.5">No visits logged yet.</p>
                ) : (
                    <div className="mt-1.5 space-y-1.5 border-l border-[#121212]/10 pl-2.5">
                        {visits?.map((v) => (
                            <div key={v.id} className="text-[10px]">
                                <span className="text-gray-500 font-light">{formatDate(v.visitedAt)} · {v.loggedByName}</span>
                                {v.note && <p className="text-[#121212] font-light">{v.note}</p>}
                            </div>
                        ))}
                    </div>
                )
            )}
        </div>
    );
}

type Tab = "mine" | "public" | "team" | "pregnancy";

const PREGNANCY_STATUS_LABELS: Record<PregnancyCaseStatus, string> = {
    ACTIVE: "Active",
    DELIVERED: "Delivered",
    DISCONTINUED: "Discontinued",
};

function formatDateOnly(iso: string): string {
    return new Date(iso.length === 10 ? `${iso}T00:00:00` : iso).toLocaleDateString("en-GB", {
        day: "numeric", month: "short", year: "numeric",
    });
}

export const PrayerRequestsPage = () => {
    const router = useRouter();
    const { profile } = useProfile();
    const isWorker = profile?.role === "WORKER";
    const isPrayerTeam = isWorker && (
        profile?.workerProfile?.department?.key === "PRAYER" ||
        profile?.workerProfile?.secondaryDepartment?.key === "PRAYER"
    );
    const isPastor = !!profile?.pastorType;
    const isTeamEligible = isPrayerTeam || isPastor;

    const {
        myRequests, myRequestsPagination, myTestimonies,
        isLoading, isSubmitting, error,
        fetchMyRequests, fetchMyTestimonies,
        submitRequest, submitTestimony,
    } = usePrayerRequests();
    const {
        records: teamRecords, pagination: teamPagination, isLoading: teamLoading, error: teamError,
        isUpdating, updateError, fetchTeamRequests, updateStatus,
    } = usePrayerTeam();
    const {
        cases: pregnancyCases, pagination: pregnancyPagination, isLoading: pregnancyLoading, error: pregnancyError,
        isSubmitting: pregnancySubmitting, submitError: pregnancySubmitError,
        fetchCases: fetchPregnancyCases, createCase: createPregnancyCase,
        logVisit: logPregnancyVisit, updateStatus: updatePregnancyStatus,
        fetchVisitHistory,
    } = usePregnancyPrayer();

    const [tab, setTab] = useState<Tab>("mine");
    const [requestDraft, setRequestDraft] = useState("");
    const [requestSuccess, setRequestSuccess] = useState(false);

    const [showPregnancyForm, setShowPregnancyForm] = useState(false);
    const [pregnancyName, setPregnancyName] = useState("");
    const [pregnancyEdd, setPregnancyEdd] = useState("");
    const [pregnancyDetails, setPregnancyDetails] = useState("");
    const [visitNoteDrafts, setVisitNoteDrafts] = useState<Record<string, string>>({});

    const [showTestimonyForm, setShowTestimonyForm] = useState(false);
    const [testimonyDraft, setTestimonyDraft] = useState("");
    const [testimonyPrayerRequestId, setTestimonyPrayerRequestId] = useState("");
    const [testimonyIsPublic, setTestimonyIsPublic] = useState(false);
    const [testimonySuccess, setTestimonySuccess] = useState(false);

    useEffect(() => {
        if (tab === "mine") {
            fetchMyRequests(1);
            fetchMyTestimonies(1);
        } else if (tab === "team" && isTeamEligible) {
            fetchTeamRequests(1);
        } else if (tab === "pregnancy" && isTeamEligible) {
            fetchPregnancyCases(1);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [tab]);

    const handleSubmitRequest = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!requestDraft.trim()) return;
        try {
            await submitRequest(requestDraft.trim());
            setRequestDraft("");
            setRequestSuccess(true);
            setTimeout(() => setRequestSuccess(false), 3000);
        } catch { /* error shown in UI */ }
    };

    const handleSubmitTestimony = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!testimonyDraft.trim()) return;
        try {
            await submitTestimony({
                content: testimonyDraft.trim(),
                prayerRequestId: testimonyPrayerRequestId || undefined,
                isPublic: testimonyIsPublic,
            });
            setTestimonyDraft("");
            setTestimonyPrayerRequestId("");
            setTestimonyIsPublic(false);
            setShowTestimonyForm(false);
            setTestimonySuccess(true);
            setTimeout(() => setTestimonySuccess(false), 3000);
        } catch { /* error shown in UI */ }
    };

    const handleStatusChange = async (id: string, status: PrayerRequestStatus) => {
        try {
            await updateStatus(id, status);
        } catch { /* updateError shown in UI */ }
    };

    const handleCreatePregnancyCase = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!pregnancyName.trim() || !pregnancyEdd) return;
        try {
            await createPregnancyCase({
                name: pregnancyName.trim(),
                edd: pregnancyEdd,
                details: pregnancyDetails.trim() || undefined,
            });
            setPregnancyName("");
            setPregnancyEdd("");
            setPregnancyDetails("");
            setShowPregnancyForm(false);
        } catch { /* pregnancySubmitError shown in UI */ }
    };

    const handleLogVisit = async (caseId: string) => {
        try {
            await logPregnancyVisit(caseId, visitNoteDrafts[caseId]?.trim() || undefined);
            setVisitNoteDrafts((prev) => ({ ...prev, [caseId]: "" }));
        } catch { /* pregnancySubmitError shown in UI */ }
    };

    const handlePregnancyStatusChange = async (caseId: string, status: PregnancyCaseStatus) => {
        try {
            await updatePregnancyStatus(caseId, status);
        } catch { /* pregnancySubmitError shown in UI */ }
    };

    return (
        <div className="min-h-screen bg-[#FFFFFF] text-[#121212] pb-32 font-sans selection:bg-[#121212] selection:text-[#FFFFFF]">

            <div className="relative w-full h-[40vh] overflow-hidden">
                <Image
                    src="/images/prayer-hands-bible.jpg"
                    alt="Hands clasped in prayer"
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
                        <HeartHandshake size={12} /> Prayer & Testimonies
                    </span>
                    <h1 className="text-2xl font-light tracking-tight text-white mt-1 drop-shadow-md">Prayer Requests</h1>
                </div>
            </div>

            <div className="px-6 mt-6 space-y-6 max-w-md mx-auto">

                <div className="flex gap-2 flex-wrap">
                    <button
                        onClick={() => setTab("mine")}
                        className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-[11px] font-bold uppercase tracking-wider rounded-xl border transition-colors ${tab === "mine" ? "bg-[#121212] text-white border-[#121212]" : "bg-white text-[#756E69] border-[#121212]/10 hover:text-[#121212]"}`}
                    >
                        <HeartHandshake size={13} /> Mine
                    </button>
                    <button
                        onClick={() => setTab("public")}
                        className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-[11px] font-bold uppercase tracking-wider rounded-xl border transition-colors ${tab === "public" ? "bg-[#121212] text-white border-[#121212]" : "bg-white text-[#756E69] border-[#121212]/10 hover:text-[#121212]"}`}
                    >
                        <Megaphone size={13} /> Testimonies
                    </button>
                    {isTeamEligible && (
                        <button
                            onClick={() => setTab("team")}
                            className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-[11px] font-bold uppercase tracking-wider rounded-xl border transition-colors ${tab === "team" ? "bg-[#121212] text-white border-[#121212]" : "bg-white text-[#756E69] border-[#121212]/10 hover:text-[#121212]"}`}
                        >
                            <Users size={13} /> Prayer Team
                        </button>
                    )}
                    {isTeamEligible && (
                        <button
                            onClick={() => setTab("pregnancy")}
                            className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-[11px] font-bold uppercase tracking-wider rounded-xl border transition-colors ${tab === "pregnancy" ? "bg-[#121212] text-white border-[#121212]" : "bg-white text-[#756E69] border-[#121212]/10 hover:text-[#121212]"}`}
                        >
                            <Baby size={13} /> Pregnancy
                        </button>
                    )}
                </div>

                {tab === "mine" && (
                    <>
                        {requestSuccess && (
                            <div className="flex items-center gap-2 bg-green-50 border border-green-100 text-green-700 px-4 py-3 rounded-xl text-xs font-medium">
                                <CheckCircle2 size={14} /> Prayer request submitted.
                            </div>
                        )}
                        {testimonySuccess && (
                            <div className="flex items-center gap-2 bg-green-50 border border-green-100 text-green-700 px-4 py-3 rounded-xl text-xs font-medium">
                                <CheckCircle2 size={14} /> Testimony submitted.
                            </div>
                        )}
                        {error && (
                            <div className="flex items-center gap-2 bg-red-50 border border-red-100 text-red-600 px-4 py-3 rounded-xl text-xs font-medium">
                                <XCircle size={14} /> {error}
                            </div>
                        )}

                        <div className="bg-white border border-[#121212]/10 rounded-2xl p-5 shadow-sm">
                            <div className="flex items-center gap-1.5 mb-3 text-[10px] uppercase tracking-widest font-semibold text-gray-500">
                                <Lock size={11} /> Private — seen only by the Prayer team and pastors
                            </div>
                            <form onSubmit={handleSubmitRequest} className="space-y-3">
                                <textarea
                                    rows={3}
                                    required
                                    value={requestDraft}
                                    onChange={(e) => setRequestDraft(e.target.value)}
                                    placeholder="Share what's on your heart…"
                                    className="w-full bg-[#F9F9F9] border border-[#121212]/10 rounded-xl p-3 text-xs font-sans outline-none resize-none focus:border-[#121212]/30"
                                />
                                <button
                                    type="submit"
                                    disabled={isSubmitting || !requestDraft.trim()}
                                    className="w-full bg-[#121212] text-white text-xs uppercase tracking-widest font-semibold py-3 rounded-xl hover:bg-gray-800 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                                >
                                    {isSubmitting ? (<><Loader2 size={13} className="animate-spin" /> Submitting…</>) : "Submit Prayer Request"}
                                </button>
                            </form>
                        </div>

                        <div>
                            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-4">
                                My Requests
                            </h3>
                            {isLoading ? (
                                <ListSkeleton />
                            ) : myRequests.length === 0 ? (
                                <div className="flex flex-col items-center gap-3 py-8 text-gray-500">
                                    <Inbox size={24} />
                                    <p className="text-sm font-light">No prayer requests yet.</p>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {myRequests.map((r) => <RequestCard key={r.id} record={r} />)}
                                </div>
                            )}
                            {myRequestsPagination && myRequestsPagination.totalPages > 1 && (
                                <div className="flex items-center justify-between mt-3">
                                    <button
                                        onClick={() => fetchMyRequests(myRequestsPagination.page - 1)}
                                        disabled={myRequestsPagination.page <= 1}
                                        className="text-xs font-semibold text-[#756E69] hover:text-[#121212] disabled:opacity-40"
                                    >
                                        Prev
                                    </button>
                                    <span className="text-[10px] text-gray-500 font-light">
                                        Page {myRequestsPagination.page} of {myRequestsPagination.totalPages}
                                    </span>
                                    <button
                                        onClick={() => fetchMyRequests(myRequestsPagination.page + 1)}
                                        disabled={myRequestsPagination.page >= myRequestsPagination.totalPages}
                                        className="text-xs font-semibold text-[#756E69] hover:text-[#121212] disabled:opacity-40"
                                    >
                                        Next
                                    </button>
                                </div>
                            )}
                        </div>

                        <div className="border-t border-[#121212]/5 pt-5">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-widest">
                                    My Testimonies
                                </h3>
                                {!showTestimonyForm && (
                                    <button
                                        onClick={() => setShowTestimonyForm(true)}
                                        className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-[#121212] hover:underline"
                                    >
                                        <Plus size={12} /> Share
                                    </button>
                                )}
                            </div>

                            {showTestimonyForm && (
                                <form onSubmit={handleSubmitTestimony} className="bg-white border border-[#121212]/10 rounded-2xl p-4 space-y-3 mb-4">
                                    <textarea
                                        rows={3}
                                        required
                                        value={testimonyDraft}
                                        onChange={(e) => setTestimonyDraft(e.target.value)}
                                        placeholder="Share your testimony…"
                                        className="w-full bg-[#F9F9F9] border border-[#121212]/10 rounded-xl p-3 text-xs font-sans outline-none resize-none focus:border-[#121212]/30"
                                    />
                                    {myRequests.length > 0 && (
                                        <select
                                            value={testimonyPrayerRequestId}
                                            onChange={(e) => setTestimonyPrayerRequestId(e.target.value)}
                                            className="w-full bg-[#F9F9F9] border border-[#121212]/10 rounded-xl px-3 py-2.5 text-xs font-sans outline-none focus:border-[#121212]/30"
                                        >
                                            <option value="">General testimony (not linked)</option>
                                            {myRequests.map((r) => (
                                                <option key={r.id} value={r.id}>
                                                    {r.content.slice(0, 40)}{r.content.length > 40 ? "…" : ""}
                                                </option>
                                            ))}
                                        </select>
                                    )}
                                    <label className="flex items-center gap-2 text-xs text-[#121212] font-light">
                                        <input
                                            type="checkbox"
                                            checked={testimonyIsPublic}
                                            onChange={(e) => setTestimonyIsPublic(e.target.checked)}
                                            className="rounded border-[#121212]/20"
                                        />
                                        Share this on the public testimony feed
                                    </label>
                                    <div className="flex gap-2">
                                        <button
                                            type="submit"
                                            disabled={isSubmitting || !testimonyDraft.trim()}
                                            className="flex-1 bg-[#121212] text-white text-[10px] uppercase tracking-widest font-semibold py-2.5 rounded-lg disabled:opacity-50 flex items-center justify-center gap-1.5"
                                        >
                                            {isSubmitting && <Loader2 size={12} className="animate-spin" />}
                                            Submit
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setShowTestimonyForm(false)}
                                            className="px-4 text-[10px] uppercase tracking-widest font-semibold text-gray-500 hover:text-[#121212]"
                                        >
                                            Cancel
                                        </button>
                                    </div>
                                </form>
                            )}

                            {myTestimonies.length === 0 ? (
                                <p className="text-sm font-light text-gray-500 text-center py-4">No testimonies shared yet.</p>
                            ) : (
                                <div className="space-y-3">
                                    {myTestimonies.map((t) => <TestimonyCard key={t.id} record={t} />)}
                                </div>
                            )}
                        </div>
                    </>
                )}

                {tab === "public" && (
                    <PublicTestimoniesTab />
                )}

                {tab === "team" && isTeamEligible && (
                    <div>
                        {updateError && (
                            <div className="flex items-center gap-2 bg-red-50 border border-red-100 text-red-600 px-4 py-3 rounded-xl text-xs font-medium mb-3">
                                <XCircle size={14} /> {updateError}
                            </div>
                        )}
                        {teamLoading ? (
                            <ListSkeleton />
                        ) : teamError ? (
                            <p className="text-sm font-light text-gray-500">{teamError}</p>
                        ) : teamRecords.length === 0 ? (
                            <div className="flex flex-col items-center gap-3 py-12 text-gray-500">
                                <Inbox size={28} />
                                <p className="text-sm font-light">No prayer requests found.</p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {teamRecords.map((r) => (
                                    <div key={r.id} className="bg-white border border-[#121212]/5 p-4 shadow-sm space-y-3">
                                        <div className="flex items-center justify-between gap-2">
                                            <span className="text-xs font-semibold text-[#121212]">{r.submittedByName}</span>
                                            <span className="text-[10px] text-gray-500 font-light">{formatDate(r.createdAt)}</span>
                                        </div>
                                        <p className="text-xs text-[#121212] font-light whitespace-pre-wrap">{r.content}</p>
                                        <div className="flex gap-1.5">
                                            {(["OPEN", "PRAYED_FOR", "ANSWERED"] as const).map((s) => (
                                                <button
                                                    key={s}
                                                    onClick={() => handleStatusChange(r.id, s)}
                                                    disabled={isUpdating || r.status === s}
                                                    className={`flex-1 py-2 text-[9px] font-bold uppercase tracking-wider rounded-lg border transition-colors disabled:opacity-50 ${
                                                        r.status === s
                                                            ? "bg-[#121212] text-white border-[#121212]"
                                                            : "border-[#121212]/10 text-[#756E69] hover:text-[#121212]"
                                                    }`}
                                                >
                                                    {STATUS_LABELS[s]}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                        {teamPagination && teamPagination.totalPages > 1 && (
                            <div className="flex items-center justify-between mt-3">
                                <button
                                    onClick={() => fetchTeamRequests(teamPagination.page - 1)}
                                    disabled={teamPagination.page <= 1}
                                    className="text-xs font-semibold text-[#756E69] hover:text-[#121212] disabled:opacity-40"
                                >
                                    Prev
                                </button>
                                <span className="text-[10px] text-gray-500 font-light">
                                    Page {teamPagination.page} of {teamPagination.totalPages}
                                </span>
                                <button
                                    onClick={() => fetchTeamRequests(teamPagination.page + 1)}
                                    disabled={teamPagination.page >= teamPagination.totalPages}
                                    className="text-xs font-semibold text-[#756E69] hover:text-[#121212] disabled:opacity-40"
                                >
                                    Next
                                </button>
                            </div>
                        )}
                    </div>
                )}

                {tab === "pregnancy" && isTeamEligible && (
                    <div>
                        {pregnancySubmitError && (
                            <div className="flex items-center gap-2 bg-red-50 border border-red-100 text-red-600 px-4 py-3 rounded-xl text-xs font-medium mb-3">
                                <XCircle size={14} /> {pregnancySubmitError}
                            </div>
                        )}

                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-widest">
                                Pregnancy Prayer Cases
                            </h3>
                            {!showPregnancyForm && (
                                <button
                                    onClick={() => setShowPregnancyForm(true)}
                                    className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-[#121212] hover:underline"
                                >
                                    <Plus size={12} /> Add
                                </button>
                            )}
                        </div>

                        {showPregnancyForm && (
                            <form onSubmit={handleCreatePregnancyCase} className="bg-white border border-[#121212]/10 rounded-2xl p-4 space-y-3 mb-4">
                                <input
                                    type="text"
                                    required
                                    value={pregnancyName}
                                    onChange={(e) => setPregnancyName(e.target.value)}
                                    placeholder="Name"
                                    className="w-full bg-[#F9F9F9] border border-[#121212]/10 rounded-xl px-3 py-2.5 text-xs font-sans outline-none focus:border-[#121212]/30"
                                />
                                <input
                                    type="date"
                                    required
                                    value={pregnancyEdd}
                                    onChange={(e) => setPregnancyEdd(e.target.value)}
                                    className="w-full bg-[#F9F9F9] border border-[#121212]/10 rounded-xl px-3 py-2.5 text-xs font-sans outline-none focus:border-[#121212]/30"
                                />
                                <textarea
                                    rows={2}
                                    value={pregnancyDetails}
                                    onChange={(e) => setPregnancyDetails(e.target.value)}
                                    placeholder="Details (optional)…"
                                    className="w-full bg-[#F9F9F9] border border-[#121212]/10 rounded-xl p-3 text-xs font-sans outline-none resize-none focus:border-[#121212]/30"
                                />
                                <div className="flex gap-2">
                                    <button
                                        type="submit"
                                        disabled={pregnancySubmitting || !pregnancyName.trim() || !pregnancyEdd}
                                        className="flex-1 bg-[#121212] text-white text-[10px] uppercase tracking-widest font-semibold py-2.5 rounded-lg disabled:opacity-50 flex items-center justify-center gap-1.5"
                                    >
                                        {pregnancySubmitting && <Loader2 size={12} className="animate-spin" />}
                                        Save
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setShowPregnancyForm(false)}
                                        className="px-4 text-[10px] uppercase tracking-widest font-semibold text-gray-500 hover:text-[#121212]"
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </form>
                        )}

                        {pregnancyLoading ? (
                            <ListSkeleton />
                        ) : pregnancyError ? (
                            <p className="text-sm font-light text-gray-500">{pregnancyError}</p>
                        ) : pregnancyCases.length === 0 ? (
                            <div className="flex flex-col items-center gap-3 py-12 text-gray-500">
                                <Baby size={28} />
                                <p className="text-sm font-light">No pregnancy prayer cases yet.</p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {pregnancyCases.map((c) => (
                                    <div key={c.id} className="bg-white border border-[#121212]/5 p-4 shadow-sm space-y-3">
                                        <div className="flex items-center justify-between gap-2">
                                            <span className="text-xs font-semibold text-[#121212]">{c.name}</span>
                                            <span className="text-[10px] text-gray-500 font-light">EDD {formatDateOnly(c.edd)}</span>
                                        </div>
                                        {c.details && (
                                            <p className="text-xs text-[#121212] font-light whitespace-pre-wrap">{c.details}</p>
                                        )}
                                        <p className="text-[10px] text-gray-500 font-light">
                                            Last prayed: {c.lastPrayedAt ? formatDate(c.lastPrayedAt) : "Never"} · Added by {c.createdByName}
                                        </p>
                                        <div className="flex gap-1.5">
                                            {(["ACTIVE", "DELIVERED", "DISCONTINUED"] as const).map((s) => (
                                                <button
                                                    key={s}
                                                    onClick={() => handlePregnancyStatusChange(c.id, s)}
                                                    disabled={pregnancySubmitting || c.status === s}
                                                    className={`flex-1 py-2 text-[9px] font-bold uppercase tracking-wider rounded-lg border transition-colors disabled:opacity-50 ${
                                                        c.status === s
                                                            ? "bg-[#121212] text-white border-[#121212]"
                                                            : "border-[#121212]/10 text-[#756E69] hover:text-[#121212]"
                                                    }`}
                                                >
                                                    {PREGNANCY_STATUS_LABELS[s]}
                                                </button>
                                            ))}
                                        </div>
                                        <div className="flex gap-2">
                                            <input
                                                type="text"
                                                value={visitNoteDrafts[c.id] ?? ""}
                                                onChange={(e) => setVisitNoteDrafts((prev) => ({ ...prev, [c.id]: e.target.value }))}
                                                placeholder="Visit note (optional)…"
                                                className="flex-1 bg-[#F9F9F9] border border-[#121212]/10 rounded-lg px-2.5 py-2 text-[11px] font-sans outline-none focus:border-[#121212]/30"
                                            />
                                            <button
                                                onClick={() => handleLogVisit(c.id)}
                                                disabled={pregnancySubmitting}
                                                className="px-3 text-[9px] font-bold uppercase tracking-wider rounded-lg bg-[#121212] text-white disabled:opacity-50"
                                            >
                                                Log Visit
                                            </button>
                                        </div>
                                        <PregnancyVisitHistoryToggle caseId={c.id} fetchVisitHistory={fetchVisitHistory} />
                                    </div>
                                ))}
                            </div>
                        )}
                        {pregnancyPagination && pregnancyPagination.totalPages > 1 && (
                            <div className="flex items-center justify-between mt-3">
                                <button
                                    onClick={() => fetchPregnancyCases(pregnancyPagination.page - 1)}
                                    disabled={pregnancyPagination.page <= 1}
                                    className="text-xs font-semibold text-[#756E69] hover:text-[#121212] disabled:opacity-40"
                                >
                                    Prev
                                </button>
                                <span className="text-[10px] text-gray-500 font-light">
                                    Page {pregnancyPagination.page} of {pregnancyPagination.totalPages}
                                </span>
                                <button
                                    onClick={() => fetchPregnancyCases(pregnancyPagination.page + 1)}
                                    disabled={pregnancyPagination.page >= pregnancyPagination.totalPages}
                                    className="text-xs font-semibold text-[#756E69] hover:text-[#121212] disabled:opacity-40"
                                >
                                    Next
                                </button>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

// ─── Public testimonies feed (separate so its own fetch is scoped to the tab) ─

function PublicTestimoniesTab() {
    const { publicTestimonies, publicTestimoniesPagination, isLoading, error, fetchPublicTestimonies } = usePrayerRequests();

    useEffect(() => {
        fetchPublicTestimonies(1);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return (
        <div>
            {isLoading ? (
                <ListSkeleton />
            ) : error ? (
                <p className="text-sm font-light text-gray-500">{error}</p>
            ) : publicTestimonies.length === 0 ? (
                <div className="flex flex-col items-center gap-3 py-12 text-gray-500">
                    <Megaphone size={28} />
                    <p className="text-sm font-light">No public testimonies yet.</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {publicTestimonies.map((t) => <TestimonyCard key={t.id} record={t} showAuthor />)}
                </div>
            )}
            {publicTestimoniesPagination && publicTestimoniesPagination.totalPages > 1 && (
                <div className="flex items-center justify-between mt-3">
                    <button
                        onClick={() => fetchPublicTestimonies(publicTestimoniesPagination.page - 1)}
                        disabled={publicTestimoniesPagination.page <= 1}
                        className="text-xs font-semibold text-[#756E69] hover:text-[#121212] disabled:opacity-40"
                    >
                        Prev
                    </button>
                    <span className="text-[10px] text-gray-500 font-light">
                        Page {publicTestimoniesPagination.page} of {publicTestimoniesPagination.totalPages}
                    </span>
                    <button
                        onClick={() => fetchPublicTestimonies(publicTestimoniesPagination.page + 1)}
                        disabled={publicTestimoniesPagination.page >= publicTestimoniesPagination.totalPages}
                        className="text-xs font-semibold text-[#756E69] hover:text-[#121212] disabled:opacity-40"
                    >
                        Next
                    </button>
                </div>
            )}
        </div>
    );
}
