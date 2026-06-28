"use client";

import React, { useState } from "react";
import {
    ArrowLeft, ClipboardList, Plus, Trash2,
    CheckCircle2, Clock, XCircle, Loader2,
    RefreshCw, CalendarX,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useLeave, LeaveStatus, LeaveRecord } from "@/hooks/use-leave";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(iso: string): string {
    return new Date(iso + "T00:00:00").toLocaleDateString("en-GB", {
        day: "numeric",
        month: "short",
        year: "numeric",
    });
}

function formatCreatedAt(iso: string): string {
    const diff = Date.now() - new Date(iso).getTime();
    const days = Math.floor(diff / 86_400_000);
    if (days === 0) return "Today";
    if (days === 1) return "Yesterday";
    return `${days} days ago`;
}

// ─── Status badge ─────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: LeaveStatus }) {
    switch (status) {
        case "APPROVED":
            return (
                <div className="flex items-center gap-1 text-green-600 bg-green-50 px-2 py-0.5 rounded-full">
                    <CheckCircle2 size={11} />
                    <span className="text-[10px] font-bold uppercase tracking-wider">Approved</span>
                </div>
            );
        case "PENDING":
            return (
                <div className="flex items-center gap-1 text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">
                    <Clock size={11} />
                    <span className="text-[10px] font-bold uppercase tracking-wider">Pending</span>
                </div>
            );
        case "REJECTED":
            return (
                <div className="flex items-center gap-1 text-red-600 bg-red-50 px-2 py-0.5 rounded-full">
                    <XCircle size={11} />
                    <span className="text-[10px] font-bold uppercase tracking-wider">Rejected</span>
                </div>
            );
    }
}

// ─── Leave card ───────────────────────────────────────────────────────────────

function LeaveCard({
    record,
    onDelete,
    isDeleting,
}: {
    record: LeaveRecord;
    onDelete: (id: string) => void;
    isDeleting: boolean;
}) {
    return (
        <div className="bg-white border border-[#121212]/5 p-4 shadow-sm transition-all hover:border-[#121212]/10">
            <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                        <StatusBadge status={record.status} />
                        <span className="text-[10px] text-gray-400 font-light">
                            {formatCreatedAt(record.createdAt)}
                        </span>
                    </div>

                    <div className="flex items-center gap-1.5 text-xs font-medium text-[#121212] mb-1">
                        <span>{formatDate(record.startDate)}</span>
                        <span className="text-gray-400">→</span>
                        <span>{formatDate(record.endDate)}</span>
                    </div>

                    <p className="text-xs text-gray-500 font-light line-clamp-2">{record.reason}</p>
                </div>

                {record.status === "PENDING" && (
                    <button
                        onClick={() => onDelete(record.id)}
                        disabled={isDeleting}
                        className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50 flex-shrink-0"
                        title="Cancel request"
                    >
                        <Trash2 size={14} />
                    </button>
                )}
            </div>
        </div>
    );
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function LeaveSkeleton() {
    return (
        <div className="space-y-3">
            {[1, 2, 3].map((i) => (
                <div key={i} className="bg-white border border-[#121212]/5 p-4 shadow-sm animate-pulse space-y-2">
                    <div className="h-5 w-20 bg-gray-100 rounded-full" />
                    <div className="h-4 w-48 bg-gray-100 rounded" />
                    <div className="h-3 w-2/3 bg-gray-100 rounded" />
                </div>
            ))}
        </div>
    );
}

// ─── Default form ─────────────────────────────────────────────────────────────

const defaultForm = { dateFrom: "", dateTo: "", reason: "" };

// ─── Page ─────────────────────────────────────────────────────────────────────

export const LeavePage = () => {
    const router = useRouter();
    const {
        records, statusFilter, setStatusFilter,
        isLoading, isSubmitting, error, submitError,
        createLeave, deleteLeave,
    } = useLeave();

    const [form, setForm] = useState(defaultForm);
    const [showForm, setShowForm] = useState(false);
    const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
    const [formSuccess, setFormSuccess] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await createLeave(form);
            setForm(defaultForm);
            setShowForm(false);
            setFormSuccess(true);
            setTimeout(() => setFormSuccess(false), 3000);
        } catch { /* submitError shown in UI */ }
    };

    const handleDelete = async (id: string) => {
        try {
            await deleteLeave(id);
            setDeleteConfirmId(null);
        } catch { /* submitError shown in UI */ }
    };

    const FILTER_OPTIONS: { label: string; value: LeaveStatus | undefined }[] = [
        { label: "All", value: undefined },
        { label: "Pending", value: "PENDING" },
        { label: "Approved", value: "APPROVED" },
        { label: "Rejected", value: "REJECTED" },
    ];

    return (
        <div className="min-h-screen bg-[#FFFFFF] text-[#121212] pb-32 font-sans selection:bg-[#121212] selection:text-[#FFFFFF]">

            {/* ── Header ───────────────────────────────────────────────── */}
            <div className="relative w-full h-[40vh] overflow-hidden">
                <img
                    src="https://images.unsplash.com/photo-1457139621581-298d1801c832?q=80&w=1703&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
                    alt="Church backdrop"
                    className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-black/50" />
                <div className="absolute inset-0 bg-gradient-to-t from-[#FFFFFF] via-[#FFFFFF]/20 to-transparent" />

                <div className="absolute top-0 inset-x-0 p-4 flex items-center gap-3">
                    <button
                        onClick={() => router.back()}
                        className="w-8 h-8 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center text-white hover:bg-white/20 transition-colors"
                    >
                        <ArrowLeft size={16} />
                    </button>
                    <span className="text-xs uppercase tracking-widest text-white/70 font-semibold">Profile</span>
                </div>

                <div className="absolute bottom-0 inset-x-0 p-6">
                    <span className="text-xs uppercase tracking-widest text-white/70 font-semibold flex items-center gap-1.5 mb-1">
                        <ClipboardList size={12} /> Worker Operations
                    </span>
                    <h1 className="text-2xl font-light tracking-tight text-[#121212]">Leave Requests</h1>
                </div>
            </div>

            <div className="px-6 mt-6 space-y-6 max-w-lg mx-auto">

                {/* ── Success toast ─────────────────────────────────────── */}
                {formSuccess && (
                    <div className="flex items-center gap-2 bg-green-50 border border-green-100 text-green-700 px-4 py-3 rounded-xl text-xs font-medium">
                        <CheckCircle2 size={14} />
                        Leave request submitted successfully.
                    </div>
                )}

                {submitError && (
                    <div className="flex items-center gap-2 bg-red-50 border border-red-100 text-red-600 px-4 py-3 rounded-xl text-xs font-medium">
                        <XCircle size={14} />
                        {submitError}
                    </div>
                )}

                {/* ── New request button / form ─────────────────────────── */}
                {!showForm ? (
                    <button
                        onClick={() => setShowForm(true)}
                        className="w-full flex items-center justify-center gap-2 py-3 border-2 border-dashed border-[#121212]/10 rounded-xl text-xs font-semibold uppercase tracking-widest text-[#8A817C] hover:border-[#121212]/20 hover:text-[#121212] transition-all"
                    >
                        <Plus size={14} /> New Leave Request
                    </button>
                ) : (
                    <div className="bg-white border border-[#121212]/10 rounded-2xl p-5 shadow-sm">
                        <div className="flex items-center justify-between mb-5">
                            <h2 className="text-sm font-semibold uppercase tracking-wider text-[#121212]">
                                New Leave Request
                            </h2>
                            <button
                                onClick={() => { setShowForm(false); setForm(defaultForm); }}
                                className="text-xs text-gray-400 hover:text-[#121212] transition-colors"
                            >
                                Cancel
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-[11px] uppercase tracking-wider font-semibold text-gray-400 mb-1.5">
                                        Date From
                                    </label>
                                    <input
                                        type="date"
                                        required
                                        value={form.dateFrom}
                                        onChange={(e) => setForm((p) => ({ ...p, dateFrom: e.target.value }))}
                                        className="w-full bg-[#F9F9F9] border border-[#121212]/10 rounded-xl px-3 py-2.5 text-xs font-sans outline-none focus:border-[#121212]/30"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[11px] uppercase tracking-wider font-semibold text-gray-400 mb-1.5">
                                        Date To
                                    </label>
                                    <input
                                        type="date"
                                        required
                                        value={form.dateTo}
                                        min={form.dateFrom}
                                        onChange={(e) => setForm((p) => ({ ...p, dateTo: e.target.value }))}
                                        className="w-full bg-[#F9F9F9] border border-[#121212]/10 rounded-xl px-3 py-2.5 text-xs font-sans outline-none focus:border-[#121212]/30"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-[11px] uppercase tracking-wider font-semibold text-gray-400 mb-1.5">
                                    Reason
                                </label>
                                <textarea
                                    rows={3}
                                    required
                                    value={form.reason}
                                    onChange={(e) => setForm((p) => ({ ...p, reason: e.target.value }))}
                                    placeholder="State your reason for leave..."
                                    className="w-full bg-[#F9F9F9] border border-[#121212]/10 rounded-xl p-3 text-xs font-sans outline-none resize-none focus:border-[#121212]/30"
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className="w-full bg-[#121212] text-white text-xs uppercase tracking-widest font-semibold py-3 rounded-xl hover:bg-gray-800 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                            >
                                {isSubmitting ? (
                                    <><Loader2 size={13} className="animate-spin" /> Submitting…</>
                                ) : (
                                    "Submit Leave Application"
                                )}
                            </button>
                        </form>
                    </div>
                )}

                {/* ── Filter tabs ───────────────────────────────────────── */}
                <div>
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-widest">
                            My Leave History
                        </h3>
                    </div>

                    <div className="flex gap-2 mb-4 flex-wrap">
                        {FILTER_OPTIONS.map((opt) => (
                            <button
                                key={opt.label}
                                onClick={() => setStatusFilter(opt.value)}
                                className={`px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider rounded-full border transition-colors ${statusFilter === opt.value
                                    ? "bg-[#121212] text-white border-[#121212]"
                                    : "bg-white text-[#8A817C] border-[#121212]/10 hover:text-[#121212]"
                                    }`}
                            >
                                {opt.label}
                            </button>
                        ))}
                    </div>

                    {/* ── List ──────────────────────────────────────────── */}
                    {isLoading ? (
                        <LeaveSkeleton />
                    ) : error ? (
                        <div className="flex flex-col items-start gap-3 py-8 text-gray-400">
                            <p className="text-sm font-light">{error}</p>
                            <button className="flex items-center gap-1.5 text-xs font-semibold text-[#121212] hover:underline">
                                <RefreshCw size={12} /> Retry
                            </button>
                        </div>
                    ) : records?.length === 0 ? (
                        <div className="flex flex-col items-center gap-3 py-12 text-gray-400">
                            <CalendarX size={28} />
                            <p className="text-sm font-light">No leave requests found.</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {records && records.map((record) => (
                                <div key={record.id}>
                                    <LeaveCard
                                        record={record}
                                        onDelete={(id) => setDeleteConfirmId(id)}
                                        isDeleting={isSubmitting && deleteConfirmId === record.id}
                                    />
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* ── Delete confirm modal ──────────────────────────────────── */}
            {deleteConfirmId && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div
                        className="absolute inset-0 bg-[#121212]/40 backdrop-blur-sm"
                        onClick={() => setDeleteConfirmId(null)}
                    />
                    <div className="relative bg-white w-full max-w-sm rounded-3xl p-6 shadow-xl border border-gray-100 text-center">
                        <div className="w-12 h-12 rounded-full bg-red-50 text-red-500 flex items-center justify-center mx-auto mb-4">
                            <Trash2 size={20} />
                        </div>
                        <h3 className="text-lg font-normal tracking-tight mb-2">Cancel Request?</h3>
                        <p className="text-sm text-gray-500 font-light mb-6">
                            This will permanently withdraw your leave application. This action cannot be undone.
                        </p>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setDeleteConfirmId(null)}
                                className="flex-1 bg-gray-100 text-[#121212] text-xs uppercase tracking-widest font-semibold py-3.5 rounded-xl hover:bg-gray-200 transition-colors"
                            >
                                Keep It
                            </button>
                            <button
                                onClick={() => handleDelete(deleteConfirmId)}
                                disabled={isSubmitting}
                                className="flex-1 bg-red-600 text-white text-xs uppercase tracking-widest font-semibold py-3.5 rounded-xl hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                            >
                                {isSubmitting ? <Loader2 size={13} className="animate-spin" /> : null}
                                Cancel Leave
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};