"use client";

import React, { useState } from "react";
import { ArrowLeft, AlertCircle, HandHelping, Users, Building2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useVolunteerOpportunities, VolunteerOpportunity } from "@/hooks/use-volunteer";

function formatDate(iso: string): string {
    return new Date(iso).toLocaleDateString("en-GB", {
        weekday: "short", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit",
    });
}

function OpportunitySkeleton() {
    return (
        <div className="bg-white border border-[#121212]/5 rounded-xl p-4 space-y-2 animate-pulse">
            <div className="h-4 w-2/3 bg-gray-100 rounded" />
            <div className="h-3 w-1/2 bg-gray-100 rounded" />
        </div>
    );
}

function OpportunityCard({ opportunity, onSignUp, onCancel, isPending }: Readonly<{
    opportunity: VolunteerOpportunity;
    onSignUp: (id: string) => void;
    onCancel: (id: string) => void;
    isPending: boolean;
}>) {
    const isFull = opportunity.capacity !== null && opportunity.confirmedCount >= opportunity.capacity;
    const isSignedUp = opportunity.mySignupStatus === "CONFIRMED";

    return (
        <div className="bg-white border border-[#121212]/5 rounded-xl p-4 space-y-2 shadow-sm">
            <div className="flex items-start justify-between gap-2">
                <h3 className="text-sm font-medium text-[#121212] leading-snug">{opportunity.title}</h3>
                {opportunity.department && (
                    <span className="flex items-center gap-1 text-[9px] uppercase tracking-wider font-bold text-gray-400 shrink-0">
                        <Building2 size={10} /> {opportunity.department.name}
                    </span>
                )}
            </div>
            {opportunity.description && (
                <p className="text-xs text-gray-500 font-light">{opportunity.description}</p>
            )}
            <div className="flex items-center justify-between text-[11px] text-gray-500">
                <span>{formatDate(opportunity.date)}</span>
                <span className="flex items-center gap-1">
                    <Users size={11} />
                    {opportunity.confirmedCount}{opportunity.capacity ? ` / ${opportunity.capacity}` : ""}
                </span>
            </div>

            {isSignedUp ? (
                <button
                    onClick={() => onCancel(opportunity.id)}
                    disabled={isPending}
                    className="w-full py-2.5 rounded-lg text-xs font-semibold uppercase tracking-wider border border-[#121212]/10 text-[#121212] hover:bg-[#F4F1EA] transition-colors disabled:opacity-40"
                >
                    Cancel My Spot
                </button>
            ) : (
                <button
                    onClick={() => onSignUp(opportunity.id)}
                    disabled={isFull || isPending}
                    className="w-full py-2.5 rounded-lg text-xs font-semibold uppercase tracking-wider bg-[#121212] text-white hover:bg-[#121212]/90 transition-colors disabled:opacity-40"
                >
                    {isFull ? "Full" : "Sign Up"}
                </button>
            )}
        </div>
    );
}

export const VolunteeringPage = () => {
    const router = useRouter();
    const { opportunities, isLoading, error, actionError, signUp, cancelSignUp } = useVolunteerOpportunities();
    const [pendingId, setPendingId] = useState<string | null>(null);

    const handleSignUp = async (id: string) => {
        setPendingId(id);
        await signUp(id);
        setPendingId(null);
    };
    const handleCancel = async (id: string) => {
        setPendingId(id);
        await cancelSignUp(id);
        setPendingId(null);
    };

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
                    <HandHelping size={12} /> Volunteering
                </span>
            </div>

            <div className="px-6 pt-4 max-w-lg mx-auto space-y-3">
                {actionError && (
                    <div className="bg-red-50 border border-red-100 text-red-700 rounded-lg p-3 text-xs">
                        {actionError}
                    </div>
                )}

                {isLoading ? (
                    Array.from({ length: 3 }).map((_, i) => <OpportunitySkeleton key={i} />)
                ) : error ? (
                    <div className="flex flex-col items-start gap-3 text-gray-500 py-10">
                        <AlertCircle size={24} />
                        <p className="text-sm font-light">{error}</p>
                    </div>
                ) : opportunities.length === 0 ? (
                    <div className="text-center py-16 text-gray-500 font-light text-sm">
                        No open opportunities right now — check back soon.
                    </div>
                ) : (
                    opportunities.map((o) => (
                        <OpportunityCard key={o.id} opportunity={o} onSignUp={handleSignUp} onCancel={handleCancel} isPending={pendingId === o.id} />
                    ))
                )}
            </div>
        </div>
    );
};
