"use client";

import React, { useState, useRef } from "react";
import Image from "next/image";
import {
    ArrowLeft, ChevronRight, ChevronDown, ChevronLeft, AlertTriangle, Loader2,
    CheckCircle2, FileText, X, Image as ImageIcon, MapPin,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useIncidents, useMyIncidentReports, IncidentReport } from "@/hooks/use-incidents";

// ─── Report form ──────────────────────────────────────────────────────────────

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
        <form onSubmit={handleSubmit} className="space-y-4">
            <div>
                <label className="text-[10px] uppercase tracking-wider text-gray-500 font-bold block mb-1.5">Incident Title</label>
                <input type="text" required placeholder="Broken equipment in hall B"
                    value={form?.title ?? ""} onChange={(e) => setForm((p) => ({ ...p, title: e.target?.value ?? "" }))}
                    className="w-full bg-white border border-[#121212]/10 rounded-xl px-3 py-2.5 text-xs font-sans outline-none focus:border-[#121212]/30" />
            </div>
            <div>
                <label className="text-[10px] uppercase tracking-wider text-gray-500 font-bold block mb-1.5">Description</label>
                <textarea required rows={3} placeholder="Describe what happened in detail…"
                    value={form?.description ?? ""} onChange={(e) => setForm((p) => ({ ...p, description: e.target?.value ?? "" }))}
                    className="w-full bg-white border border-[#121212]/10 rounded-xl p-3 text-xs font-sans outline-none resize-none focus:border-[#121212]/30" />
            </div>
            <div>
                <label className="text-[10px] uppercase tracking-wider text-gray-500 font-bold block mb-1.5">Location</label>
                <input type="text" required placeholder="Hall B, Main Auditorium…"
                    value={form?.location ?? ""} onChange={(e) => setForm((p) => ({ ...p, location: e.target?.value ?? "" }))}
                    className="w-full bg-white border border-[#121212]/10 rounded-xl px-3 py-2.5 text-xs font-sans outline-none focus:border-[#121212]/30" />
            </div>
            <div>
                <label className="text-[10px] uppercase tracking-wider text-gray-500 font-bold block mb-1.5">
                    Images (Optional — up to {MAX_IMAGES}, max 5 MB each)
                </label>
                {(images?.length ?? 0) < MAX_IMAGES && (
                    <label className="flex items-center gap-2 w-full bg-white border border-dashed border-[#121212]/15 rounded-xl px-3 py-3 text-xs cursor-pointer hover:border-[#121212]/30 transition-colors">
                        <ImageIcon size={14} className="text-[#756E69] flex-shrink-0" />
                        <span className="text-gray-500">
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
                                    <FileText size={12} className="text-[#756E69] flex-shrink-0" />
                                    <span className="text-xs text-gray-600 truncate">{img?.name}</span>
                                    <span className="text-[10px] text-gray-500 flex-shrink-0">{((img?.size ?? 0) / 1024 / 1024).toFixed(1)} MB</span>
                                </div>
                                <button type="button" onClick={() => setImages((p) => p?.filter((_, j) => j !== i) ?? [])}
                                    className="p-1 text-gray-500 hover:text-red-500 transition-colors flex-shrink-0">
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
                    <p className="text-[10px] text-gray-500 font-light mt-0.5">Your name will not be attached to this report.</p>
                </div>
                <button type="button"
                    role="switch"
                    aria-checked={form?.isAnonymous}
                    aria-label="Submit anonymously"
                    onClick={() => setForm((p) => ({ ...p, isAnonymous: !p?.isAnonymous }))}
                    className={`w-10 h-6 flex items-center rounded-full p-0.5 transition-colors duration-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#8A817C] flex-shrink-0 ml-3 ${form?.isAnonymous ? "bg-[#8A817C]" : "bg-gray-300"}`}>
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

// ─── My incident reports ──────────────────────────────────────────────────────

function IncidentStatusBadge({ status }: { status: IncidentReport["status"] }) {
    switch (status) {
        case "OPEN":
            return <span className="text-[9px] uppercase tracking-wider font-bold bg-amber-50 text-amber-700 px-1.5 py-0.5 rounded">Open</span>;
        case "IN_PROGRESS":
            return <span className="text-[9px] uppercase tracking-wider font-bold bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded">In Progress</span>;
        case "RESOLVED":
            return <span className="text-[9px] uppercase tracking-wider font-bold bg-green-50 text-green-700 px-1.5 py-0.5 rounded">Resolved</span>;
    }
}

function formatReportDate(iso: string): string {
    return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

function MyReportCard({ report }: { report: IncidentReport }) {
    const [expanded, setExpanded] = useState(false);
    return (
        <div className="bg-white border border-[#121212]/5 rounded-xl overflow-hidden">
            <button
                onClick={() => setExpanded((p) => !p)}
                aria-expanded={expanded}
                className="w-full flex items-center justify-between p-3.5 text-left hover:bg-[#F9F9F9] transition-colors"
            >
                <div className="min-w-0">
                    <div className="flex items-center gap-1.5 mb-1">
                        <IncidentStatusBadge status={report.status} />
                        <span className="text-[10px] text-gray-500 font-light">{formatReportDate(report.createdAt)}</span>
                    </div>
                    <p className="text-xs font-medium text-[#121212] truncate">{report.title}</p>
                </div>
                {expanded ? <ChevronDown size={14} className="text-gray-500 flex-shrink-0 ml-2" /> : <ChevronRight size={14} className="text-gray-500 flex-shrink-0 ml-2" />}
            </button>
            {expanded && (
                <div className="px-3.5 pb-3.5 space-y-2 border-t border-[#121212]/5 pt-3">
                    <p className="text-xs text-gray-600 font-light leading-relaxed">{report.description}</p>
                    {report.location && (
                        <p className="text-[10px] text-gray-500 font-light flex items-center gap-1">
                            <MapPin size={10} /> {report.location}
                        </p>
                    )}
                    {report.images && report.images.length > 0 && (
                        <div className="flex gap-1.5 flex-wrap pt-1">
                            {report.images.map((url) => (
                                <a key={url} href={url} target="_blank" rel="noreferrer">
                                    <Image src={url} alt="Incident evidence" width={56} height={56} className="w-14 h-14 object-cover rounded-lg border border-[#121212]/5" />
                                </a>
                            ))}
                        </div>
                    )}
                    {report.adminNotes && (
                        <div className="mt-2 pt-2 border-t border-[#121212]/5">
                            <p className="text-[10px] uppercase tracking-wider font-semibold text-gray-500 mb-0.5">Response</p>
                            <p className="text-xs text-gray-600 font-light">{report.adminNotes}</p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

function MyReportsSection({ active }: { active: boolean }) {
    const { reports, isLoading, error, page, totalPages, goToPage } = useMyIncidentReports(active);

    if (isLoading) return (
        <div className="space-y-2 animate-pulse">
            {[1, 2].map((i) => <div key={i} className="h-14 bg-gray-100 rounded-xl" />)}
        </div>
    );
    if (error) return <p className="text-xs text-red-500">{error}</p>;
    if (reports.length === 0) return <p className="text-xs text-gray-500 font-light">You haven&apos;t submitted any incident reports yet.</p>;

    return (
        <div className="space-y-2">
            {reports.map((r) => <MyReportCard key={r.id} report={r} />)}
            {totalPages > 1 && (
                <div className="flex items-center justify-between pt-2">
                    <button onClick={() => goToPage(page - 1)} disabled={page <= 1}
                        className="flex items-center gap-1 text-[10px] font-semibold text-[#756E69] hover:text-[#121212] disabled:opacity-40 transition-colors">
                        <ChevronLeft size={12} /> Prev
                    </button>
                    <span className="text-[10px] text-gray-500 font-light">Page {page} of {totalPages}</span>
                    <button onClick={() => goToPage(page + 1)} disabled={page >= totalPages}
                        className="flex items-center gap-1 text-[10px] font-semibold text-[#756E69] hover:text-[#121212] disabled:opacity-40 transition-colors">
                        Next <ChevronRight size={12} />
                    </button>
                </div>
            )}
        </div>
    );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export const IncidentsPage = () => {
    const router = useRouter();
    const [tab, setTab] = useState<"report" | "history">("report");
    const [reportSuccess, setReportSuccess] = useState(false);

    const handleReportSuccess = () => {
        setReportSuccess(true);
        setTab("history");
        setTimeout(() => setReportSuccess(false), 4000);
    };

    return (
        <div className="min-h-screen bg-[#FFFFFF] text-[#121212] pb-32 font-sans selection:bg-[#121212] selection:text-[#FFFFFF]">
            <div className="relative w-full h-[40vh] overflow-hidden">
                <Image src="/images/incident-notebook-blank.jpg" alt="Open notebook and pen" fill priority sizes="100vw" className="object-cover" />
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
                        <AlertTriangle size={12} /> Safety & Operations
                    </span>
                    <h1 className="text-2xl font-light tracking-tight text-white mt-1 drop-shadow-md">
                        Incident Reports
                    </h1>
                </div>
            </div>

            <div className="px-6 mt-6 max-w-lg mx-auto space-y-4">
                {reportSuccess && (
                    <div className="flex items-center gap-2 bg-green-50 border border-green-100 text-green-700 px-4 py-3 rounded-xl text-xs font-medium">
                        <CheckCircle2 size={14} /> Incident report submitted successfully.
                    </div>
                )}

                <div className="flex bg-[#F4F1EA] p-0.5 rounded-xl">
                    <button onClick={() => setTab("report")}
                        className={`flex-1 py-2 text-[10px] font-bold uppercase tracking-wider rounded-lg transition-colors ${tab === "report" ? "bg-white text-[#121212] shadow-sm" : "text-[#756E69]"}`}>
                        Report an Incident
                    </button>
                    <button onClick={() => setTab("history")}
                        className={`flex-1 py-2 text-[10px] font-bold uppercase tracking-wider rounded-lg transition-colors ${tab === "history" ? "bg-white text-[#121212] shadow-sm" : "text-[#756E69]"}`}>
                        My Reports
                    </button>
                </div>

                {tab === "report"
                    ? <IncidentReportForm onSuccess={handleReportSuccess} />
                    : <MyReportsSection active={tab === "history"} />}
            </div>
        </div>
    );
};
