"use client";

import React, { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { ArrowLeft, BookOpen, Search, ChevronRight, ChevronLeft, PlayCircle, Radio } from "lucide-react";
import { useSermons } from "@/hooks/use-sermons";

function fmtDate(iso: string): string {
    return new Date(iso).toLocaleDateString("en-GB", {
        day: "2-digit", month: "short", year: "numeric",
    });
}

export const SermonsPage = () => {
    const router = useRouter();
    const { sermons, isLoading, error, page, totalPages, series, setSeries, goToPage } = useSermons(10);
    const [seriesDraft, setSeriesDraft] = useState("");

    return (
        <div className="min-h-screen bg-[#FFFFFF] text-[#121212] pb-32 font-sans selection:bg-[#121212] selection:text-[#FFFFFF]">
            <div className="relative w-full h-[32vh] overflow-hidden">
                <Image src="/images/dashboard-bible.jpg" alt="Open Bible" fill priority sizes="100vw" className="object-cover" />
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
                        <BookOpen size={12} /> Word & Teaching
                    </span>
                    <h1 className="text-2xl font-light tracking-tight text-white mt-1 drop-shadow-md">
                        Sermon Archive
                    </h1>
                </div>
            </div>

            <div className="px-6 mt-6 max-w-lg mx-auto space-y-4">
                <div className="relative">
                    <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8A817C]" />
                    <input
                        type="text"
                        value={seriesDraft}
                        onChange={(e) => setSeriesDraft(e.target.value)}
                        onKeyDown={(e) => { if (e.key === "Enter") setSeries(seriesDraft.trim() || null); }}
                        onBlur={() => setSeries(seriesDraft.trim() || null)}
                        placeholder="Filter by series…"
                        className="w-full bg-[#F4F1EA]/60 border border-[#121212]/10 rounded-xl pl-9 pr-3 py-2.5 text-xs font-sans outline-none focus:border-[#121212]/30"
                    />
                    {series && (
                        <button
                            onClick={() => { setSeriesDraft(""); setSeries(null); }}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold uppercase tracking-wider text-[#8A817C] hover:text-[#121212]"
                        >
                            Clear
                        </button>
                    )}
                </div>

                {error && (
                    <div className="bg-red-50 border border-red-100 text-red-700 px-4 py-3 rounded-xl text-xs font-medium">
                        {error}
                    </div>
                )}

                {isLoading && (
                    <div className="space-y-3">
                        {["a", "b", "c"].map((k) => (
                            <div key={k} className="h-20 bg-[#F4F1EA] rounded-xl animate-pulse" />
                        ))}
                    </div>
                )}

                {!isLoading && sermons.length === 0 && (
                    <div className="text-center py-16 text-[#8A817C] font-light">
                        <BookOpen className="w-8 h-8 mx-auto mb-3 text-[#8A817C]/30" />
                        No sermons found.
                    </div>
                )}

                {!isLoading && sermons.map((sermon) => (
                    <button
                        key={sermon.id}
                        onClick={() => router.push(`/sermons/${sermon.id}`)}
                        className="w-full flex items-center justify-between gap-3 bg-white border border-[#121212]/5 rounded-xl p-4 text-left shadow-sm hover:border-[#121212]/15 hover:shadow-md transition-all"
                    >
                        <div className="min-w-0">
                            <div className="flex items-center gap-1.5 mb-1">
                                {sermon.youtubeUrl ? <PlayCircle size={11} className="text-[#8A817C]" /> : <Radio size={11} className="text-[#8A817C]" />}
                                <span className="text-[10px] uppercase tracking-wider text-[#8A817C] font-semibold">{fmtDate(sermon.date)}</span>
                            </div>
                            <p className="text-sm font-medium text-[#121212] truncate">{sermon.title}</p>
                            <p className="text-xs text-[#8A817C] font-light truncate">{sermon.speakerName}{sermon.series ? ` — ${sermon.series}` : ""}</p>
                        </div>
                        <ChevronRight size={16} className="text-[#8A817C] shrink-0" />
                    </button>
                ))}

                {totalPages > 1 && (
                    <div className="flex items-center justify-center gap-4 pt-2">
                        <button
                            onClick={() => goToPage(Math.max(1, page - 1))}
                            disabled={page <= 1}
                            className="p-2 rounded-full border border-[#121212]/10 text-[#8A817C] disabled:opacity-30"
                            aria-label="Previous page"
                        >
                            <ChevronLeft size={14} />
                        </button>
                        <span className="text-xs text-[#8A817C] font-light">Page {page} of {totalPages}</span>
                        <button
                            onClick={() => goToPage(Math.min(totalPages, page + 1))}
                            disabled={page >= totalPages}
                            className="p-2 rounded-full border border-[#121212]/10 text-[#8A817C] disabled:opacity-30"
                            aria-label="Next page"
                        >
                            <ChevronRight size={14} />
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};
