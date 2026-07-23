"use client";

import React from "react";
import { ArrowLeft, Volume2, AlertCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { useAnnouncementDetail } from "@/hooks/use-announcement-detail";
import { ReactionBar } from "./reaction-bar";

function formatFullDate(iso: string): string {
    return new Date(iso).toLocaleDateString("en-GB", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
    });
}

function DetailSkeleton() {
    return (
        <div className="px-6 pt-8 max-w-lg mx-auto space-y-4 animate-pulse">
            <div className="h-3 w-24 bg-gray-100 rounded" />
            <div className="h-8 w-2/3 bg-gray-100 rounded" />
            <div className="h-3 w-40 bg-gray-100 rounded" />
            <div className="h-32 w-full bg-gray-100 rounded mt-6" />
        </div>
    );
}

export const AnnouncementDetailPage = ({ id }: { id: string }) => {
    const router = useRouter();
    const { announcement, isLoading, error } = useAnnouncementDetail(id);

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
                    <Volume2 size={12} /> Notice
                </span>
            </div>

            {isLoading ? (
                <DetailSkeleton />
            ) : error ? (
                <div className="px-6 pt-10 max-w-lg mx-auto flex flex-col items-start gap-3 text-gray-500">
                    <AlertCircle size={24} />
                    <p className="text-sm font-light">{error}</p>
                </div>
            ) : announcement ? (
                <div className="px-6 pt-4 max-w-lg mx-auto">
                    <div className="flex items-center justify-between mb-3">
                        <span className="text-[9px] uppercase tracking-wider px-2 py-0.5 rounded-full font-bold bg-[#121212]/10 text-[#121212]">
                            {announcement.audience === "ALL" ? "General Notice" : announcement.audience}
                        </span>
                        <span className="text-[11px] text-gray-500 font-medium">
                            {formatFullDate(announcement.createdAt)}
                        </span>
                    </div>

                    <h1 className="text-2xl font-light tracking-tight text-[#121212] mb-4 leading-snug">
                        {announcement.title}
                    </h1>

                    <div
                        className="text-sm text-gray-600 font-light leading-relaxed [&_a]:underline [&_a]:text-[#121212]"
                        dangerouslySetInnerHTML={{ __html: announcement.body }}
                    />

                    <div className="mt-5">
                        <ReactionBar announcementId={announcement.id} />
                    </div>

                    <div className="mt-8 pt-4 border-t border-[#121212]/5 space-y-1">
                        {announcement.department && (
                            <p className="text-xs text-gray-500 font-light">
                                Department: <span className="text-[#121212]">{announcement.department.name}</span>
                            </p>
                        )}
                        {announcement.author && (
                            <p className="text-xs text-gray-500 font-light">
                                Posted by{" "}
                                <span className="text-[#121212]">
                                    {announcement.author.firstname} {announcement.author.lastname}
                                </span>
                            </p>
                        )}
                    </div>
                </div>
            ) : null}
        </div>
    );
};
