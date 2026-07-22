"use client";

import React from "react";
import { ArrowLeft, AlertCircle, BookOpen, Radio } from "lucide-react";
import { useRouter } from "next/navigation";
import { useSermon } from "@/hooks/use-sermons";

function formatFullDate(iso: string): string {
    return new Date(iso).toLocaleDateString("en-GB", {
        weekday: "long", day: "numeric", month: "long", year: "numeric",
    });
}

function toYoutubeEmbedUrl(url: string): string | null {
    try {
        const parsed = new URL(url);
        let videoId: string | null = null;
        if (parsed.hostname.includes("youtu.be")) {
            videoId = parsed.pathname.slice(1);
        } else if (parsed.pathname.startsWith("/live/")) {
            videoId = parsed.pathname.split("/live/")[1];
        } else {
            videoId = parsed.searchParams.get("v");
        }
        return videoId ? `https://www.youtube.com/embed/${videoId}` : null;
    } catch {
        return null;
    }
}

function DetailSkeleton() {
    return (
        <div className="px-6 pt-8 max-w-lg mx-auto space-y-4 animate-pulse">
            <div className="h-3 w-24 bg-gray-100 rounded" />
            <div className="h-8 w-2/3 bg-gray-100 rounded" />
            <div className="h-3 w-40 bg-gray-100 rounded" />
            <div className="h-52 w-full bg-gray-100 rounded mt-6" />
        </div>
    );
}

export const SermonDetailPage = ({ id }: { id: string }) => {
    const router = useRouter();
    const { sermon, isLoading, error } = useSermon(id);
    const embedUrl = sermon?.youtubeUrl ? toYoutubeEmbedUrl(sermon.youtubeUrl) : null;

    return (
        <div className="min-h-screen bg-[#FFFFFF] text-[#121212] pb-32 font-sans selection:bg-[#121212] selection:text-[#FFFFFF]">
            <div className="px-6 pt-6 pb-2 flex items-center gap-3 max-w-lg mx-auto">
                <button
                    onClick={() => router.back()}
                    className="w-8 h-8 rounded-full bg-[#F4F1EA] flex items-center justify-center text-[#121212] hover:bg-[#EADCC9] transition-colors"
                >
                    <ArrowLeft size={16} />
                </button>
                <span className="text-xs uppercase tracking-widest text-gray-500 font-semibold flex items-center gap-1.5">
                    <BookOpen size={12} /> Sermon
                </span>
            </div>

            {isLoading ? (
                <DetailSkeleton />
            ) : error ? (
                <div className="px-6 pt-10 max-w-lg mx-auto flex flex-col items-start gap-3 text-gray-500">
                    <AlertCircle size={24} />
                    <p className="text-sm font-light">{error}</p>
                </div>
            ) : sermon ? (
                <div className="px-6 pt-4 max-w-lg mx-auto">
                    <div className="flex items-center justify-between mb-3">
                        {sermon.series && (
                            <span className="text-[9px] uppercase tracking-wider px-2 py-0.5 rounded-full font-bold bg-[#121212]/10 text-[#121212]">
                                {sermon.series}
                            </span>
                        )}
                        <span className="text-[11px] text-gray-500 font-medium">
                            {formatFullDate(sermon.date)}
                        </span>
                    </div>

                    <h1 className="text-2xl font-light tracking-tight text-[#121212] mb-1 leading-snug">
                        {sermon.title}
                    </h1>
                    <p className="text-sm text-gray-500 font-light mb-5">{sermon.speakerName}</p>

                    {embedUrl && (
                        <div className="w-full aspect-video rounded-xl overflow-hidden bg-black mb-5">
                            <iframe
                                src={embedUrl}
                                title={sermon.title}
                                className="w-full h-full"
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                allowFullScreen
                            />
                        </div>
                    )}

                    {!embedUrl && sermon.mixlrUrl && (
                        <a
                            href={sermon.mixlrUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center justify-center gap-2 w-full bg-[#121212] text-white py-3 rounded-xl text-xs font-semibold uppercase tracking-wider mb-5 hover:bg-[#121212]/90 transition-colors"
                        >
                            <Radio size={14} />
                            Listen on Mixlr
                        </a>
                    )}

                    {embedUrl && sermon.mixlrUrl && (
                        <a
                            href={sermon.mixlrUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center justify-center gap-2 w-full border border-[#121212]/10 text-[#121212] py-3 rounded-xl text-xs font-semibold uppercase tracking-wider mb-5 hover:bg-[#F4F1EA]/50 transition-colors"
                        >
                            <Radio size={14} />
                            Also Available on Mixlr
                        </a>
                    )}

                    {sermon.description && (
                        <p className="text-sm text-gray-600 font-light leading-relaxed whitespace-pre-wrap">
                            {sermon.description}
                        </p>
                    )}
                </div>
            ) : null}
        </div>
    );
};
