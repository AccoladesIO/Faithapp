"use client";

import React from "react";
import Image from "next/image";
import { ArrowLeft, Users2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useDepartmentSummary } from "@/hooks/use-departments";

function formatLeaveRange(from: string, to: string): string {
    const opts: Intl.DateTimeFormatOptions = { day: "numeric", month: "short" };
    return `${new Date(from + "T00:00:00").toLocaleDateString("en-GB", opts)} – ${new Date(to + "T00:00:00").toLocaleDateString("en-GB", opts)}`;
}

export const DepartmentSummaryPage = () => {
    const router = useRouter();
    const { summary, isLoading, error } = useDepartmentSummary(true);

    return (
        <div className="min-h-screen bg-[#FFFFFF] text-[#121212] pb-32 font-sans selection:bg-[#121212] selection:text-[#FFFFFF]">
            <div className="relative w-full h-[40vh] overflow-hidden">
                <Image src="/images/teamwork-hands-unity.jpg" alt="Hands stacked in unity" fill priority sizes="100vw" className="object-cover" />
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
                        <Users2 size={12} /> HOD
                    </span>
                    <h1 className="text-2xl font-light tracking-tight text-white mt-1 drop-shadow-md">
                        Department Summary
                    </h1>
                </div>
            </div>

            <div className="px-6 mt-6 max-w-lg mx-auto space-y-3">
                {isLoading ? (
                    <div className="space-y-2 animate-pulse">
                        <div className="h-16 bg-gray-100 rounded-xl" />
                        <div className="h-10 bg-gray-100 rounded-xl" />
                    </div>
                ) : error ? (
                    <p className="text-xs text-red-500">{error}</p>
                ) : !summary ? null : (
                    <>
                        <div className="bg-[#F4F1EA]/60 border border-[#121212]/10 rounded-xl p-4">
                            <p className="text-[10px] uppercase tracking-wider text-gray-500 font-semibold mb-3 flex items-center gap-1.5">
                                <Users2 size={12} /> Department Overview
                            </p>
                            <div className="grid grid-cols-3 gap-3">
                                <div>
                                    <p className="text-xl font-medium text-[#121212]">{summary.activeWorkers}</p>
                                    <p className="text-[10px] text-gray-500 font-light">Active</p>
                                </div>
                                <div>
                                    <p className="text-xl font-medium text-[#121212]">{summary.inactiveWorkers}</p>
                                    <p className="text-[10px] text-gray-500 font-light">Inactive</p>
                                </div>
                                <div>
                                    <p className="text-xl font-medium text-[#121212]">{summary.attendancePercentage}%</p>
                                    <p className="text-[10px] text-gray-500 font-light">Attendance</p>
                                </div>
                            </div>
                        </div>
                        <div>
                            <p className="text-[10px] uppercase tracking-wider text-gray-500 font-semibold mb-1.5 px-0.5">
                                On Leave ({summary.workersOnLeave.length})
                            </p>
                            {summary.workersOnLeave.length === 0 ? (
                                <p className="text-xs text-gray-500 font-light py-2">No one on leave right now.</p>
                            ) : (
                                <div className="space-y-1.5">
                                    {summary.workersOnLeave.map((w) => (
                                        <div key={w.workerProfileId} className="bg-white border border-[#121212]/5 px-3 py-2 flex items-center justify-between">
                                            <span className="text-xs text-[#121212] font-medium">{w.name}</span>
                                            <span className="text-[10px] text-gray-500 font-light">{formatLeaveRange(w.dateFrom, w.dateTo)}</span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};
