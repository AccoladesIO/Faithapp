"use client";

import React from "react";
import Image from "next/image";
import { ArrowLeft, Cake } from "lucide-react";
import { useRouter } from "next/navigation";
import { useMyBirthdayWishes } from "@/hooks/use-birthdays";

function formatWishDate(iso: string): string {
    return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

export const BirthdayWishesPage = () => {
    const router = useRouter();
    const { wishes, isLoading, error } = useMyBirthdayWishes(true);

    return (
        <div className="min-h-screen bg-[#FFFFFF] text-[#121212] pb-32 font-sans selection:bg-[#121212] selection:text-[#FFFFFF]">
            <div className="relative w-full h-[40vh] overflow-hidden">
                <Image src="/images/birthday-cake-candles.jpg" alt="Birthday cake with lit candles" fill priority sizes="100vw" className="object-cover" />
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
                        <Cake size={12} /> Personal Hub
                    </span>
                    <h1 className="text-2xl font-light tracking-tight text-white mt-1 drop-shadow-md">
                        Birthday Wishes
                    </h1>
                </div>
            </div>

            <div className="px-6 mt-6 max-w-lg mx-auto space-y-2">
                {isLoading ? (
                    <div className="space-y-2 animate-pulse">
                        {[1, 2].map((i) => <div key={i} className="h-14 bg-gray-100 rounded-xl" />)}
                    </div>
                ) : error ? (
                    <p className="text-xs text-red-500">{error}</p>
                ) : wishes.length === 0 ? (
                    <p className="text-xs text-gray-500 font-light">No birthday wishes received this year yet.</p>
                ) : (
                    wishes.map((w) => (
                        <div key={w.id} className="bg-white border border-[#121212]/5 rounded-xl p-3.5">
                            <div className="flex items-center justify-between gap-2 flex-wrap mb-1.5">
                                <p className="text-xs text-[#121212] font-medium min-w-0 break-words">
                                    {w.sender ? `${w.sender.firstname} ${w.sender.lastname}` : "A church member"}
                                </p>
                                <span className="text-[10px] text-gray-500 font-light flex-shrink-0 whitespace-nowrap">
                                    {formatWishDate(w.createdAt)}
                                </span>
                            </div>
                            <p className="text-xs text-gray-600 font-light leading-relaxed whitespace-pre-wrap break-words">{w.message}</p>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};
