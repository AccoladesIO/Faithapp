"use client";

import React, { useState } from "react";
import Image from "next/image";
import {
    ArrowLeft, GraduationCap, AlertCircle, ChevronRight,
    ChevronLeft, CheckCircle2, XCircle, Clock, BookOpen,
} from "lucide-react";
import { useRouter } from "next/navigation";
import {
    useClasses, useClassDetail, useMyEnrollments, useClassTypes,
    EnrollmentStatus,
} from "@/hooks/use-classes";

function formatDate(iso: string | null): string {
    if (!iso) return "—";
    return new Date(iso + (iso.length === 10 ? "T00:00:00" : "")).toLocaleDateString("en-GB", {
        day: "numeric", month: "short", year: "numeric",
    });
}

function EnrollmentStatusBadge({ status }: { status: EnrollmentStatus }) {
    switch (status) {
        case "IN_PROGRESS":
            return <span className="flex items-center gap-1 text-[8px] uppercase tracking-wider font-bold bg-amber-50 text-amber-700 px-1.5 py-0.5 rounded"><Clock size={9} /> In Progress</span>;
        case "COMPLETED":
            return <span className="flex items-center gap-1 text-[8px] uppercase tracking-wider font-bold bg-green-50 text-green-700 px-1.5 py-0.5 rounded"><CheckCircle2 size={9} /> Completed</span>;
        case "CANCELLED":
            return <span className="flex items-center gap-1 text-[8px] uppercase tracking-wider font-bold bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded"><XCircle size={9} /> Cancelled</span>;
    }
}

// ─── List page (catalogue + my enrollments tabs) ──────────────────────────────

export const ClassesPage = () => {
    const router = useRouter();
    const [tab, setTab] = useState<"catalogue" | "mine">("catalogue");
    const {
        classes, isLoading, error, page, totalPages, goToPage, typeFilter, setTypeFilter,
    } = useClasses();
    const { enrollments, isLoading: enrollmentsLoading, error: enrollmentsError } = useMyEnrollments();
    const { classTypes } = useClassTypes();

    return (
        <div className="min-h-screen bg-[#FFFFFF] text-[#121212] pb-32 font-sans selection:bg-[#121212] selection:text-[#FFFFFF]">

            {/* ── Hero ─────────────────────────────────────────────────── */}
            <div className="relative w-full h-[40vh] overflow-hidden">
                <Image
                    src="/images/classes-backdrop.jpg"
                    alt="Classes backdrop"
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
                        <GraduationCap size={12} /> Discipleship
                    </span>
                    <h1 className="text-2xl font-light tracking-tight text-white mt-1 drop-shadow-md">
                        Classes
                    </h1>
                </div>
            </div>

            {/* ── Tab switch ─────────────────────────────────────────────── */}
            <div className="px-6 mt-6 max-w-md mx-auto">
                <div className="flex bg-[#F4F1EA] p-1 rounded-xl">
                    <button
                        onClick={() => setTab("catalogue")}
                        className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-semibold uppercase tracking-wider rounded-lg transition-colors ${tab === "catalogue" ? "bg-[#121212] text-white" : "text-[#756E69] hover:text-[#121212]"}`}
                    >
                        <BookOpen size={13} /> Catalogue
                    </button>
                    <button
                        onClick={() => setTab("mine")}
                        className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-semibold uppercase tracking-wider rounded-lg transition-colors ${tab === "mine" ? "bg-[#121212] text-white" : "text-[#756E69] hover:text-[#121212]"}`}
                    >
                        <GraduationCap size={13} /> My Enrollments {enrollments.length > 0 && `(${enrollments.length})`}
                    </button>
                </div>
            </div>

            {tab === "catalogue" && (
                <div className="px-6 mt-8 max-w-md mx-auto space-y-6">
                    <div className="flex gap-1.5 overflow-x-auto pb-1 -mx-6 px-6">
                        <button onClick={() => setTypeFilter(null)}
                            className={`shrink-0 text-[10px] uppercase tracking-wider font-bold px-3 py-1.5 rounded-full border transition-colors ${!typeFilter ? "bg-[#121212] text-white border-transparent" : "bg-white text-gray-500 border-[#121212]/10"}`}>
                            All
                        </button>
                        {classTypes.map((t) => (
                            <button key={t.id} onClick={() => setTypeFilter(t.id)}
                                className={`shrink-0 text-[10px] uppercase tracking-wider font-bold px-3 py-1.5 rounded-full border transition-colors whitespace-nowrap ${typeFilter === t.id ? "bg-[#121212] text-white border-transparent" : "bg-white text-gray-500 border-[#121212]/10"}`}>
                                {t.name}
                            </button>
                        ))}
                    </div>

                    {isLoading ? (
                        <div className="space-y-2.5">
                            {[1, 2].map((i) => (
                                <div key={i} className="bg-white border border-[#121212]/5 p-4 h-16 animate-pulse" />
                            ))}
                        </div>
                    ) : error ? (
                        <div className="flex items-center gap-2 bg-red-50 border border-red-100 text-red-600 px-4 py-3 rounded-xl text-xs font-medium">
                            <AlertCircle size={14} /> {error}
                        </div>
                    ) : classes.length === 0 ? (
                        <p className="text-sm text-gray-500 font-light py-6 text-center">No classes found.</p>
                    ) : (
                        <>
                            <div className="space-y-2.5">
                                {classes.map((c) => (
                                    <button
                                        key={c.id}
                                        onClick={() => router.push(`/classes/${c.id}`)}
                                        className="w-full text-left bg-white border border-[#121212]/5 p-4 shadow-sm flex items-center gap-3 hover:border-[#121212]/10 transition-colors"
                                    >
                                        <div className="w-10 h-10 bg-[#F4F1EA] flex items-center justify-center text-[#756E69] flex-shrink-0">
                                            <GraduationCap size={18} />
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <h4 className="text-sm font-medium text-[#121212] truncate">{c.name}</h4>
                                            <p className="text-[10px] text-gray-500 font-light mt-0.5">{c.classType.name}</p>
                                        </div>
                                        <ChevronRight size={14} className="text-gray-500 flex-shrink-0" />
                                    </button>
                                ))}
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
            )}

            {tab === "mine" && (
                <div className="px-6 mt-8 max-w-md mx-auto space-y-6">
                    {enrollmentsLoading ? (
                        <div className="space-y-2.5">
                            {[1, 2].map((i) => (
                                <div key={i} className="bg-white border border-[#121212]/5 p-4 h-20 animate-pulse" />
                            ))}
                        </div>
                    ) : enrollmentsError ? (
                        <div className="flex items-center gap-2 bg-red-50 border border-red-100 text-red-600 px-4 py-3 rounded-xl text-xs font-medium">
                            <AlertCircle size={14} /> {enrollmentsError}
                        </div>
                    ) : enrollments.length === 0 ? (
                        <p className="text-sm text-gray-500 font-light py-6 text-center">You&apos;re not enrolled in any classes yet.</p>
                    ) : (
                        <div className="space-y-2.5">
                            {enrollments.map((e) => (
                                <div key={e.id} className="bg-white border border-[#121212]/5 p-4 shadow-sm">
                                    <div className="flex items-center justify-between mb-1.5">
                                        <h4 className="text-sm font-medium text-[#121212] truncate pr-2">{e.churchClass.name}</h4>
                                        <EnrollmentStatusBadge status={e.status} />
                                    </div>
                                    <p className="text-[10px] text-gray-500 font-light">
                                        {e.churchClass.classType.name} · Enrolled {formatDate(e.enrolledAt)}
                                    </p>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

// ─── Detail page ──────────────────────────────────────────────────────────────

export const ClassDetailPage = ({ id }: { id: string }) => {
    const router = useRouter();
    const { churchClass, isLoading, error } = useClassDetail(id);

    return (
        <div className="min-h-screen bg-[#FFFFFF] text-[#121212] pb-32 font-sans selection:bg-[#121212] selection:text-[#FFFFFF]">

            {/* ── Hero ─────────────────────────────────────────────────── */}
            <div className="relative w-full h-[40vh] overflow-hidden">
                <Image
                    src="/images/classes-backdrop.jpg"
                    alt="Class backdrop"
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
                {!isLoading && churchClass && (
                    <div className="absolute bottom-0 inset-x-0 p-6">
                        <span className="text-xs uppercase tracking-widest text-white/80 font-semibold flex items-center gap-1 drop-shadow-sm">
                            <GraduationCap size={12} /> {churchClass.classType.name}
                        </span>
                        <h1 className="text-2xl font-light tracking-tight text-white mt-1 drop-shadow-md">
                            {churchClass.name}
                        </h1>
                    </div>
                )}
            </div>

            <div className="px-6 mt-8 max-w-md mx-auto space-y-6">
                {isLoading ? (
                    <div className="space-y-2.5">
                        <div className="bg-white border border-[#121212]/5 p-4 h-24 animate-pulse" />
                    </div>
                ) : error ? (
                    <div className="flex items-center gap-2 bg-red-50 border border-red-100 text-red-600 px-4 py-3 rounded-xl text-xs font-medium">
                        <AlertCircle size={14} /> {error}
                    </div>
                ) : churchClass ? (
                    <>
                        {churchClass.description && (
                            <p className="text-sm text-gray-600 font-light leading-relaxed">{churchClass.description}</p>
                        )}
                        <div className="bg-white border border-[#121212]/5 shadow-sm p-4 space-y-2.5 text-xs divide-y divide-[#121212]/5">
                            {churchClass.facilitator && (
                                <div className="flex justify-between pb-2.5">
                                    <span className="text-gray-500">Facilitator</span>
                                    <span className="text-[#121212] font-medium">{churchClass.facilitator.firstname} {churchClass.facilitator.lastname}</span>
                                </div>
                            )}
                            {churchClass.startDate && (
                                <div className="flex justify-between py-2.5">
                                    <span className="text-gray-500">Starts</span>
                                    <span className="text-[#121212] font-medium">{formatDate(churchClass.startDate)}</span>
                                </div>
                            )}
                            {churchClass.endDate && (
                                <div className="flex justify-between py-2.5">
                                    <span className="text-gray-500">Ends</span>
                                    <span className="text-[#121212] font-medium">{formatDate(churchClass.endDate)}</span>
                                </div>
                            )}
                            <div className="flex justify-between pt-2.5">
                                <span className="text-gray-500">Status</span>
                                <span className="text-[#121212] font-medium capitalize">{churchClass.status.toLowerCase()}</span>
                            </div>
                        </div>
                        <p className="text-xs text-gray-500 font-light text-center">
                            To enroll in this class, speak with your department head or the class facilitator.
                        </p>
                    </>
                ) : null}
            </div>
        </div>
    );
};
