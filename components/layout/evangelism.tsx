"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import {
    ArrowLeft, Flame, CheckCircle2, XCircle, Loader2, Inbox, Users, UserPlus,
    History, ChevronDown, ChevronUp,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useProfile } from "@/hooks/use-profile";
import { useEvangelism, ConvertStatus, FollowUpLogRecord } from "@/hooks/use-evangelism";

function formatDate(iso: string): string {
    return new Date(iso).toLocaleDateString("en-GB", {
        day: "numeric", month: "short", year: "numeric",
    });
}

const STATUS_LABELS: Record<ConvertStatus, string> = {
    UNSAVED: "Unsaved",
    SAVED: "Saved",
    UNDERGOING_DISCIPLESHIP: "Undergoing Discipleship",
};

const STATUS_STYLES: Record<ConvertStatus, string> = {
    UNSAVED: "bg-amber-50 text-amber-700 border-amber-100",
    SAVED: "bg-blue-50 text-blue-700 border-blue-100",
    UNDERGOING_DISCIPLESHIP: "bg-green-50 text-green-700 border-green-100",
};

function StatusBadge({ status }: { status: ConvertStatus }) {
    return (
        <span className={`inline-block px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider rounded border ${STATUS_STYLES[status]}`}>
            {STATUS_LABELS[status]}
        </span>
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

function FollowUpHistoryToggle({
    convertId,
    fetchFollowUpHistory,
}: Readonly<{
    convertId: string;
    fetchFollowUpHistory: (id: string, page?: number) => Promise<{ logs: FollowUpLogRecord[]; pagination: { page: number; totalPages: number } | null }>;
}>) {
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [logs, setLogs] = useState<FollowUpLogRecord[] | null>(null);

    const toggle = async () => {
        if (open) { setOpen(false); return; }
        setOpen(true);
        if (logs === null) {
            setLoading(true);
            const { logs: fetched } = await fetchFollowUpHistory(convertId, 1);
            setLogs(fetched);
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
                ) : logs && logs.length === 0 ? (
                    <p className="text-[10px] text-gray-400 mt-1.5">No follow-up logged yet.</p>
                ) : (
                    <div className="mt-1.5 space-y-1.5 border-l border-[#121212]/10 pl-2.5">
                        {logs?.map((l) => (
                            <div key={l.id} className="text-[10px]">
                                <span className="text-gray-500 font-light">{formatDate(l.contactedAt)} · {l.loggedByName}</span>
                                {l.note && <p className="text-[#121212] font-light">{l.note}</p>}
                            </div>
                        ))}
                    </div>
                )
            )}
        </div>
    );
}

type Tab = "upload" | "team";

export const EvangelismPage = () => {
    const router = useRouter();
    const { profile } = useProfile();
    const isWorker = profile?.role === "WORKER";
    const isEvangelism = isWorker && (
        profile?.workerProfile?.department?.key === "EVANGELISM" ||
        profile?.workerProfile?.secondaryDepartment?.key === "EVANGELISM"
    );

    const {
        converts, pagination, isLoading, error,
        isSubmitting, submitError,
        createConvert, fetchTeamConverts, logFollowUp, updateStatus,
        fetchFollowUpHistory,
    } = useEvangelism();

    const [tab, setTab] = useState<Tab>("upload");
    const [name, setName] = useState("");
    const [phone, setPhone] = useState("");
    const [notes, setNotes] = useState("");
    const [uploadSuccess, setUploadSuccess] = useState(false);
    const [followUpNoteDrafts, setFollowUpNoteDrafts] = useState<Record<string, string>>({});

    useEffect(() => {
        if (tab === "team" && isEvangelism) {
            fetchTeamConverts(1);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [tab]);

    const handleUpload = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim()) return;
        try {
            await createConvert({
                name: name.trim(),
                phone: phone.trim() || undefined,
                notes: notes.trim() || undefined,
            });
            setName("");
            setPhone("");
            setNotes("");
            setUploadSuccess(true);
            setTimeout(() => setUploadSuccess(false), 3000);
        } catch { /* submitError shown in UI */ }
    };

    const handleLogFollowUp = async (convertId: string) => {
        try {
            await logFollowUp(convertId, followUpNoteDrafts[convertId]?.trim() || undefined);
            setFollowUpNoteDrafts((prev) => ({ ...prev, [convertId]: "" }));
        } catch { /* submitError shown in UI */ }
    };

    const handleStatusChange = async (convertId: string, status: ConvertStatus) => {
        try {
            await updateStatus(convertId, status);
        } catch { /* submitError shown in UI */ }
    };

    return (
        <div className="min-h-screen bg-[#FFFFFF] text-[#121212] pb-32 font-sans selection:bg-[#121212] selection:text-[#FFFFFF]">

            <div className="relative w-full h-[40vh] overflow-hidden">
                <Image
                    src="/images/prayer-hands-bible.jpg"
                    alt="Evangelism outreach"
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
                        <Flame size={12} /> Evangelism
                    </span>
                    <h1 className="text-2xl font-light tracking-tight text-white mt-1 drop-shadow-md">Converts</h1>
                </div>
            </div>

            <div className="px-6 mt-6 space-y-6 max-w-md mx-auto">

                <div className="flex gap-2 flex-wrap">
                    <button
                        onClick={() => setTab("upload")}
                        className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-[11px] font-bold uppercase tracking-wider rounded-xl border transition-colors ${tab === "upload" ? "bg-[#121212] text-white border-[#121212]" : "bg-white text-[#756E69] border-[#121212]/10 hover:text-[#121212]"}`}
                    >
                        <UserPlus size={13} /> Upload
                    </button>
                    {isEvangelism && (
                        <button
                            onClick={() => setTab("team")}
                            className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-[11px] font-bold uppercase tracking-wider rounded-xl border transition-colors ${tab === "team" ? "bg-[#121212] text-white border-[#121212]" : "bg-white text-[#756E69] border-[#121212]/10 hover:text-[#121212]"}`}
                        >
                            <Users size={13} /> Team Inbox
                        </button>
                    )}
                </div>

                {tab === "upload" && (
                    <>
                        {uploadSuccess && (
                            <div className="flex items-center gap-2 bg-green-50 border border-green-100 text-green-700 px-4 py-3 rounded-xl text-xs font-medium">
                                <CheckCircle2 size={14} /> Convert uploaded.
                            </div>
                        )}
                        {submitError && (
                            <div className="flex items-center gap-2 bg-red-50 border border-red-100 text-red-600 px-4 py-3 rounded-xl text-xs font-medium">
                                <XCircle size={14} /> {submitError}
                            </div>
                        )}

                        <div className="bg-white border border-[#121212]/10 rounded-2xl p-5 shadow-sm">
                            <form onSubmit={handleUpload} className="space-y-3">
                                <input
                                    type="text"
                                    required
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    placeholder="Convert's name"
                                    className="w-full bg-[#F9F9F9] border border-[#121212]/10 rounded-xl px-3 py-2.5 text-xs font-sans outline-none focus:border-[#121212]/30"
                                />
                                <input
                                    type="tel"
                                    value={phone}
                                    onChange={(e) => setPhone(e.target.value)}
                                    placeholder="Phone (optional)"
                                    className="w-full bg-[#F9F9F9] border border-[#121212]/10 rounded-xl px-3 py-2.5 text-xs font-sans outline-none focus:border-[#121212]/30"
                                />
                                <textarea
                                    rows={3}
                                    value={notes}
                                    onChange={(e) => setNotes(e.target.value)}
                                    placeholder="Notes (optional)…"
                                    className="w-full bg-[#F9F9F9] border border-[#121212]/10 rounded-xl p-3 text-xs font-sans outline-none resize-none focus:border-[#121212]/30"
                                />
                                <button
                                    type="submit"
                                    disabled={isSubmitting || !name.trim()}
                                    className="w-full bg-[#121212] text-white text-xs uppercase tracking-widest font-semibold py-3 rounded-xl hover:bg-gray-800 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                                >
                                    {isSubmitting ? (<><Loader2 size={13} className="animate-spin" /> Uploading…</>) : "Upload Convert"}
                                </button>
                            </form>
                        </div>
                    </>
                )}

                {tab === "team" && isEvangelism && (
                    <div>
                        {submitError && (
                            <div className="flex items-center gap-2 bg-red-50 border border-red-100 text-red-600 px-4 py-3 rounded-xl text-xs font-medium mb-3">
                                <XCircle size={14} /> {submitError}
                            </div>
                        )}
                        {isLoading ? (
                            <ListSkeleton />
                        ) : error ? (
                            <p className="text-sm font-light text-gray-500">{error}</p>
                        ) : converts.length === 0 ? (
                            <div className="flex flex-col items-center gap-3 py-12 text-gray-500">
                                <Inbox size={28} />
                                <p className="text-sm font-light">No converts found.</p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {converts.map((c) => (
                                    <div key={c.id} className="bg-white border border-[#121212]/5 p-4 shadow-sm space-y-3">
                                        <div className="flex items-center justify-between gap-2">
                                            <span className="text-xs font-semibold text-[#121212]">{c.name}</span>
                                            <StatusBadge status={c.status} />
                                        </div>
                                        <p className="text-[10px] text-gray-500 font-light">
                                            Onboarded by {c.onboardedByName}
                                            {c.assignedTo && ` · Assigned to ${c.assignedTo.member.firstname} ${c.assignedTo.member.lastname}`}
                                        </p>
                                        <p className={`text-[10px] font-light ${c.isOverdue ? "text-red-600 font-semibold" : "text-gray-500"}`}>
                                            Last contacted: {c.lastContactedAt ? formatDate(c.lastContactedAt) : "Never"}
                                            {c.isOverdue && " · Needs follow-up"}
                                        </p>
                                        <div className="flex gap-1.5">
                                            {(["UNSAVED", "SAVED", "UNDERGOING_DISCIPLESHIP"] as const).map((s) => (
                                                <button
                                                    key={s}
                                                    onClick={() => handleStatusChange(c.id, s)}
                                                    disabled={isSubmitting || c.status === s}
                                                    className={`flex-1 py-2 text-[9px] font-bold uppercase tracking-wider rounded-lg border transition-colors disabled:opacity-50 ${
                                                        c.status === s
                                                            ? "bg-[#121212] text-white border-[#121212]"
                                                            : "border-[#121212]/10 text-[#756E69] hover:text-[#121212]"
                                                    }`}
                                                >
                                                    {STATUS_LABELS[s]}
                                                </button>
                                            ))}
                                        </div>
                                        <div className="flex gap-2">
                                            <input
                                                type="text"
                                                value={followUpNoteDrafts[c.id] ?? ""}
                                                onChange={(e) => setFollowUpNoteDrafts((prev) => ({ ...prev, [c.id]: e.target.value }))}
                                                placeholder="Follow-up note (optional)…"
                                                className="flex-1 bg-[#F9F9F9] border border-[#121212]/10 rounded-lg px-2.5 py-2 text-[11px] font-sans outline-none focus:border-[#121212]/30"
                                            />
                                            <button
                                                onClick={() => handleLogFollowUp(c.id)}
                                                disabled={isSubmitting}
                                                className="px-3 text-[9px] font-bold uppercase tracking-wider rounded-lg bg-[#121212] text-white disabled:opacity-50"
                                            >
                                                Log
                                            </button>
                                        </div>
                                        <FollowUpHistoryToggle convertId={c.id} fetchFollowUpHistory={fetchFollowUpHistory} />
                                    </div>
                                ))}
                            </div>
                        )}
                        {pagination && pagination.totalPages > 1 && (
                            <div className="flex items-center justify-between mt-3">
                                <button
                                    onClick={() => fetchTeamConverts(pagination.page - 1)}
                                    disabled={pagination.page <= 1}
                                    className="text-xs font-semibold text-[#756E69] hover:text-[#121212] disabled:opacity-40"
                                >
                                    Prev
                                </button>
                                <span className="text-[10px] text-gray-500 font-light">
                                    Page {pagination.page} of {pagination.totalPages}
                                </span>
                                <button
                                    onClick={() => fetchTeamConverts(pagination.page + 1)}
                                    disabled={pagination.page >= pagination.totalPages}
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
