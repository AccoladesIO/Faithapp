"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import {
    ArrowLeft, ClipboardList, Plus, Trash2,
    CheckCircle2, Clock, XCircle, Loader2,
    RefreshCw, CalendarX, ChevronLeft, ChevronRight, Users,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useLeave, LeaveStatus, LeaveRecord } from "@/hooks/use-leave";
import { useDepartmentLeave } from "@/hooks/use-department-leave";
import { useProfile } from "@/hooks/use-profile";

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
                        <span className="text-[10px] text-gray-500 font-light">
                            {formatCreatedAt(record.createdAt)}
                        </span>
                    </div>

                    <div className="flex items-center gap-1.5 text-xs font-medium text-[#121212] mb-1">
                        <span>{formatDate(record.dateFrom)}</span>
                        <span className="text-gray-500">→</span>
                        <span>{formatDate(record.dateTo)}</span>
                    </div>

                    <p className="text-xs text-gray-500 font-light line-clamp-2">{record.reason}</p>
                </div>

                {record.status === "PENDING" && (
                    <button
                        onClick={() => onDelete(record.id)}
                        disabled={isDeleting}
                        className="p-2 text-gray-500 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50 flex-shrink-0"
                        title="Cancel request"
                    >
                        <Trash2 size={14} />
                    </button>
                )}
            </div>
        </div>
    );
}

// Read-only — HOD/Deputy HOD can see who's requesting and the current status,
// not approve/decline (that stays an admin action).
function DepartmentLeaveCard({ record }: { record: LeaveRecord }) {
    return (
        <div className="bg-white border border-[#121212]/5 p-4 shadow-sm">
            <div className="flex items-center gap-2 mb-2 flex-wrap">
                <StatusBadge status={record.status} />
                <span className="text-[10px] text-gray-500 font-light">
                    {formatCreatedAt(record.createdAt)}
                </span>
            </div>
            <p className="text-xs font-semibold text-[#121212] mb-1">
                {record.worker.member.firstname} {record.worker.member.lastname}
            </p>
            <div className="flex items-center gap-1.5 text-xs font-medium text-[#121212] mb-1">
                <span>{formatDate(record.dateFrom)}</span>
                <span className="text-gray-500">→</span>
                <span>{formatDate(record.dateTo)}</span>
            </div>
            <p className="text-xs text-gray-500 font-light line-clamp-2">{record.reason}</p>
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

type Tab = "mine" | "department";

export const LeavePage = () => {
    const router = useRouter();
    const { profile } = useProfile();
    const {
        records, statusFilter, setStatusFilter,
        isLoading, isSubmitting, error, submitError,
        createLeave, deleteLeave,
    } = useLeave();
    const {
        records: deptRecords, pagination: deptPagination,
        isLoading: deptLoading, error: deptError, fetchDepartmentLeave,
    } = useDepartmentLeave();

    const [tab, setTab] = useState<Tab>("mine");
    const [deptStatusFilter, setDeptStatusFilter] = useState<LeaveStatus | undefined>(undefined);

    const [form, setForm] = useState(defaultForm);
    const [showForm, setShowForm] = useState(false);
    const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
    const [formSuccess, setFormSuccess] = useState(false);

    useEffect(() => {
        if (tab === "department") fetchDepartmentLeave(1, deptStatusFilter);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [tab, deptStatusFilter]);

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
                        <ClipboardList size={12} /> Worker Operations
                    </span>
                    <h1 className="text-2xl font-light tracking-tight text-white mt-1 drop-shadow-md">Leave Requests</h1>
                </div>
            </div>

            <div className="px-6 mt-6 space-y-6 max-w-md mx-auto">

                {/* ── Tab switcher (Department tab only for HOD/Deputy HOD) ── */}
                {profile?.isHod && (
                    <div className="flex gap-2">
                        <button
                            onClick={() => setTab("mine")}
                            className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-[11px] font-bold uppercase tracking-wider rounded-xl border transition-colors ${tab === "mine"
                                ? "bg-[#121212] text-white border-[#121212]"
                                : "bg-white text-[#756E69] border-[#121212]/10 hover:text-[#121212]"
                                }`}
                        >
                            <ClipboardList size={13} /> My Requests
                        </button>
                        <button
                            onClick={() => setTab("department")}
                            className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-[11px] font-bold uppercase tracking-wider rounded-xl border transition-colors ${tab === "department"
                                ? "bg-[#121212] text-white border-[#121212]"
                                : "bg-white text-[#756E69] border-[#121212]/10 hover:text-[#121212]"
                                }`}
                        >
                            <Users size={13} /> Department
                        </button>
                    </div>
                )}

                {tab === "mine" && (
                <>
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
                        className="w-full flex items-center justify-center gap-2 py-3 border-2 border-dashed border-[#121212]/10 rounded-xl text-xs font-semibold uppercase tracking-widest text-[#756E69] hover:border-[#121212]/20 hover:text-[#121212] transition-all"
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
                                className="text-xs text-gray-500 hover:text-[#121212] transition-colors"
                            >
                                Cancel
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-[11px] uppercase tracking-wider font-semibold text-gray-500 mb-1.5">
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
                                    <label className="block text-[11px] uppercase tracking-wider font-semibold text-gray-500 mb-1.5">
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
                                <label className="block text-[11px] uppercase tracking-wider font-semibold text-gray-500 mb-1.5">
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
                        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-widest">
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
                                    : "bg-white text-[#756E69] border-[#121212]/10 hover:text-[#121212]"
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
                        <div className="flex flex-col items-start gap-3 py-8 text-gray-500">
                            <p className="text-sm font-light">{error}</p>
                            <button className="flex items-center gap-1.5 text-xs font-semibold text-[#121212] hover:underline">
                                <RefreshCw size={12} /> Retry
                            </button>
                        </div>
                    ) : records?.length === 0 ? (
                        <div className="flex flex-col items-center gap-3 py-12 text-gray-500">
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
                </>
                )}

                {tab === "department" && (
                    <div>
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-widest">
                                Department Leave Requests
                            </h3>
                        </div>

                        <div className="flex gap-2 mb-4 flex-wrap">
                            {FILTER_OPTIONS.map((opt) => (
                                <button
                                    key={opt.label}
                                    onClick={() => setDeptStatusFilter(opt.value)}
                                    className={`px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider rounded-full border transition-colors ${deptStatusFilter === opt.value
                                        ? "bg-[#121212] text-white border-[#121212]"
                                        : "bg-white text-[#756E69] border-[#121212]/10 hover:text-[#121212]"
                                        }`}
                                >
                                    {opt.label}
                                </button>
                            ))}
                        </div>

                        {deptLoading ? (
                            <LeaveSkeleton />
                        ) : deptError ? (
                            <div className="flex flex-col items-start gap-3 py-8 text-gray-500">
                                <p className="text-sm font-light">{deptError}</p>
                                <button
                                    onClick={() => fetchDepartmentLeave(1, deptStatusFilter)}
                                    className="flex items-center gap-1.5 text-xs font-semibold text-[#121212] hover:underline"
                                >
                                    <RefreshCw size={12} /> Retry
                                </button>
                            </div>
                        ) : deptRecords.length === 0 ? (
                            <div className="flex flex-col items-center gap-3 py-12 text-gray-500">
                                <CalendarX size={28} />
                                <p className="text-sm font-light">No leave requests found.</p>
                            </div>
                        ) : (
                            <>
                                <div className="space-y-3">
                                    {deptRecords.map((record) => (
                                        <DepartmentLeaveCard key={record.id} record={record} />
                                    ))}
                                </div>

                                {deptPagination && deptPagination.totalPages > 1 && (
                                    <div className="flex items-center justify-between mt-4">
                                        <button
                                            onClick={() => fetchDepartmentLeave(deptPagination.page - 1, deptStatusFilter)}
                                            disabled={deptPagination.page <= 1}
                                            className="flex items-center gap-1 text-xs font-semibold text-[#756E69] hover:text-[#121212] disabled:opacity-40 disabled:hover:text-[#756E69] transition-colors"
                                        >
                                            <ChevronLeft size={14} /> Prev
                                        </button>
                                        <span className="text-[10px] text-gray-500 font-light">
                                            Page {deptPagination.page} of {deptPagination.totalPages}
                                        </span>
                                        <button
                                            onClick={() => fetchDepartmentLeave(deptPagination.page + 1, deptStatusFilter)}
                                            disabled={deptPagination.page >= deptPagination.totalPages}
                                            className="flex items-center gap-1 text-xs font-semibold text-[#756E69] hover:text-[#121212] disabled:opacity-40 disabled:hover:text-[#756E69] transition-colors"
                                        >
                                            Next <ChevronRight size={14} />
                                        </button>
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                )}
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