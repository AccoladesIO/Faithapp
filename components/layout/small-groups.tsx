"use client";

import React, { useState } from "react";
import { ArrowLeft, AlertCircle, Users2, CalendarClock, MapPin, ClipboardCheck } from "lucide-react";
import { useRouter } from "next/navigation";
import { useSmallGroups, useMyGroups, useSmallGroupActions, SmallGroup } from "@/hooks/use-small-groups";
import { useProfile } from "@/hooks/use-profile";

function GroupSkeleton() {
    return (
        <div className="bg-white border border-[#121212]/5 rounded-xl p-4 space-y-2 animate-pulse">
            <div className="h-4 w-2/3 bg-gray-100 rounded" />
            <div className="h-3 w-1/2 bg-gray-100 rounded" />
        </div>
    );
}

function MyGroupCard({ group, myMemberId, onLeave, isSubmitting }: Readonly<{
    group: SmallGroup;
    myMemberId?: string;
    onLeave: (id: string) => void;
    isSubmitting: boolean;
}>) {
    const router = useRouter();
    const isLeader = !!myMemberId && group.leader?.id === myMemberId;

    return (
        <div className="bg-white border border-[#121212]/5 rounded-xl p-4 space-y-2 shadow-sm">
            <div className="flex items-start justify-between gap-2">
                <h3 className="text-sm font-medium text-[#121212]">{group.name}</h3>
                {isLeader && (
                    <span className="text-[9px] uppercase tracking-wider font-bold bg-[#EADCC9] text-[#121212] px-1.5 py-0.5 rounded">
                        Leader
                    </span>
                )}
            </div>
            {group.leader && !isLeader && (
                <p className="text-xs text-gray-500">Led by {group.leader.firstname} {group.leader.lastname}</p>
            )}
            {group.meetingDay && (
                <p className="text-xs text-gray-500 flex items-center gap-1">
                    <CalendarClock size={11} /> {group.meetingDay}
                    {group.meetingLocation && <> · <MapPin size={11} /> {group.meetingLocation}</>}
                </p>
            )}
            <div className="flex gap-2 pt-1">
                {isLeader && (
                    <button
                        onClick={() => router.push(`/small-groups/${group.id}/attendance`)}
                        className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-lg text-xs font-semibold uppercase tracking-wider bg-[#121212] text-white hover:bg-[#121212]/90 transition-colors"
                    >
                        <ClipboardCheck size={13} /> Take Attendance
                    </button>
                )}
                <button
                    onClick={() => onLeave(group.id)}
                    disabled={isSubmitting}
                    className="flex-1 py-2.5 rounded-lg text-xs font-semibold uppercase tracking-wider border border-[#121212]/10 text-[#121212] hover:bg-[#F4F1EA] transition-colors disabled:opacity-40"
                >
                    Leave Fellowship
                </button>
            </div>
        </div>
    );
}

function BrowseGroupCard({ group, isMember, onJoin, isSubmitting }: Readonly<{
    group: SmallGroup;
    isMember: boolean;
    onJoin: (id: string) => void;
    isSubmitting: boolean;
}>) {
    return (
        <div className="bg-white border border-[#121212]/5 rounded-xl p-4 space-y-2 shadow-sm">
            <div className="flex items-start justify-between gap-2">
                <h3 className="text-sm font-medium text-[#121212]">{group.name}</h3>
                <span className="flex items-center gap-1 text-[10px] text-gray-400">
                    <Users2 size={11} /> {group.memberCount ?? 0}
                </span>
            </div>
            {group.description && <p className="text-xs text-gray-500 font-light">{group.description}</p>}
            {group.meetingDay && (
                <p className="text-xs text-gray-500 flex items-center gap-1">
                    <CalendarClock size={11} /> {group.meetingDay}
                    {group.meetingLocation && <> · <MapPin size={11} /> {group.meetingLocation}</>}
                </p>
            )}
            {!isMember && (
                <button
                    onClick={() => onJoin(group.id)}
                    disabled={isSubmitting}
                    className="w-full py-2.5 rounded-lg text-xs font-semibold uppercase tracking-wider bg-[#121212] text-white hover:bg-[#121212]/90 transition-colors disabled:opacity-40"
                >
                    Join Fellowship
                </button>
            )}
        </div>
    );
}

export const SmallGroupsPage = () => {
    const router = useRouter();
    const { profile } = useProfile() ?? {};
    const myMemberId = profile?.id;
    const { groups: myGroups, isLoading: myLoading, error: myError, refetch: refetchMine } = useMyGroups();
    const { groups: allGroups, isLoading: allLoading, error: allError, refetch: refetchAll } = useSmallGroups();
    const { isSubmitting, error: actionError, join, leave } = useSmallGroupActions();

    const [tab, setTab] = useState<"mine" | "browse">("mine");
    const myGroupIds = new Set(myGroups.map((g) => g.id));

    const handleJoin = async (id: string) => {
        if (await join(id)) { refetchMine(); refetchAll(); }
    };
    const handleLeave = async (id: string) => {
        if (await leave(id)) { refetchMine(); refetchAll(); }
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
                    <Users2 size={12} /> Fellowships
                </span>
            </div>

            <div className="px-6 pt-4 max-w-lg mx-auto">
                <div className="flex gap-1 mb-4">
                    <button
                        onClick={() => setTab("mine")}
                        className={`px-4 py-2 text-[11px] font-semibold uppercase tracking-widest rounded-lg transition-colors ${tab === "mine" ? "bg-[#121212] text-white" : "text-gray-500 hover:text-[#121212]"}`}
                    >
                        My Fellowships
                    </button>
                    <button
                        onClick={() => setTab("browse")}
                        className={`px-4 py-2 text-[11px] font-semibold uppercase tracking-widest rounded-lg transition-colors ${tab === "browse" ? "bg-[#121212] text-white" : "text-gray-500 hover:text-[#121212]"}`}
                    >
                        Browse
                    </button>
                </div>

                {actionError && (
                    <div className="bg-red-50 border border-red-100 text-red-700 rounded-lg p-3 text-xs mb-3">
                        {actionError}
                    </div>
                )}

                <div className="space-y-3">
                    {tab === "mine" ? (
                        myLoading ? (
                            Array.from({ length: 2 }).map((_, i) => <GroupSkeleton key={i} />)
                        ) : myError ? (
                            <div className="flex flex-col items-start gap-3 text-gray-500 py-10">
                                <AlertCircle size={24} />
                                <p className="text-sm font-light">{myError}</p>
                            </div>
                        ) : myGroups.length === 0 ? (
                            <div className="text-center py-16 text-gray-500 font-light text-sm">
                                You haven&rsquo;t joined a fellowship yet — tap Browse to find one.
                            </div>
                        ) : (
                            myGroups.map((g) => (
                                <MyGroupCard key={g.id} group={g} myMemberId={myMemberId} onLeave={handleLeave} isSubmitting={isSubmitting} />
                            ))
                        )
                    ) : allLoading ? (
                        Array.from({ length: 3 }).map((_, i) => <GroupSkeleton key={i} />)
                    ) : allError ? (
                        <div className="flex flex-col items-start gap-3 text-gray-500 py-10">
                            <AlertCircle size={24} />
                            <p className="text-sm font-light">{allError}</p>
                        </div>
                    ) : allGroups.length === 0 ? (
                        <div className="text-center py-16 text-gray-500 font-light text-sm">
                            No fellowships yet — check back soon.
                        </div>
                    ) : (
                        allGroups.map((g) => (
                            <BrowseGroupCard key={g.id} group={g} isMember={myGroupIds.has(g.id)} onJoin={handleJoin} isSubmitting={isSubmitting} />
                        ))
                    )}
                </div>
            </div>
        </div>
    );
};
