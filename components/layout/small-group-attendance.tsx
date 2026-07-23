"use client";

import React, { useEffect, useState } from "react";
import { ArrowLeft, AlertCircle, CheckCircle2, XCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { useSmallGroupActions, SmallGroupMemberRow } from "@/hooks/use-small-groups";
import { useProfile } from "@/hooks/use-profile";
import { api } from "@/utils/auth/axios-client";

function todayISO(): string {
    return new Date().toISOString().slice(0, 10);
}

export const SmallGroupAttendancePage = ({ groupId }: Readonly<{ groupId: string }>) => {
    const router = useRouter();
    const { profile } = useProfile() ?? {};
    const { isSubmitting, error, fetchMembers, recordAttendance } = useSmallGroupActions();

    const [isLeader, setIsLeader] = useState<boolean | null>(null);

    useEffect(() => {
        if (!profile?.id) return;
        let cancelled = false;
        api.get(`/small-groups/${groupId}`)
            .then((res) => {
                if (!cancelled) setIsLeader(res.data?.data?.leader?.id === profile.id);
            })
            .catch(() => { if (!cancelled) setIsLeader(false); });
        return () => { cancelled = true; };
    }, [groupId, profile?.id]);

    const [members, setMembers] = useState<SmallGroupMemberRow[] | null>(null);
    const [loadError, setLoadError] = useState<string | null>(null);
    const [meetingDate, setMeetingDate] = useState(todayISO());
    const [statuses, setStatuses] = useState<Record<string, "PRESENT" | "ABSENT">>({});
    const [saved, setSaved] = useState(false);

    useEffect(() => {
        let cancelled = false;
        fetchMembers(groupId)
            .then((rows) => {
                if (cancelled) return;
                setMembers(rows);
                setStatuses(Object.fromEntries(rows.map((r) => [r.member.id, "PRESENT" as const])));
            })
            .catch(() => { if (!cancelled) setLoadError("Could not load this fellowship's members."); });
        return () => { cancelled = true; };
    }, [groupId, fetchMembers]);

    const toggle = (memberId: string, status: "PRESENT" | "ABSENT") => {
        setStatuses((prev) => ({ ...prev, [memberId]: status }));
    };

    const handleSubmit = async () => {
        if (!members) return;
        const records = members.map((m) => ({ memberId: m.member.id, status: statuses[m.member.id] ?? "PRESENT" }));
        const ok = await recordAttendance(groupId, meetingDate, records);
        if (ok) setSaved(true);
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
                <span className="text-xs uppercase tracking-widest text-gray-500 font-semibold">Take Attendance</span>
            </div>

            <div className="px-6 pt-4 max-w-lg mx-auto space-y-4">
                {isLeader === false ? (
                    <div className="flex flex-col items-start gap-3 text-gray-500 py-10">
                        <AlertCircle size={24} />
                        <p className="text-sm font-light">Only this fellowship&rsquo;s leader can record attendance.</p>
                    </div>
                ) : loadError ? (
                    <div className="flex flex-col items-start gap-3 text-gray-500 py-10">
                        <AlertCircle size={24} />
                        <p className="text-sm font-light">{loadError}</p>
                    </div>
                ) : !members || isLeader === null ? (
                    <div className="space-y-2 animate-pulse">
                        {Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-12 bg-gray-100 rounded-xl" />)}
                    </div>
                ) : saved ? (
                    <div className="text-center py-16 space-y-2">
                        <CheckCircle2 className="w-10 h-10 mx-auto text-green-600" />
                        <p className="text-sm text-[#121212] font-light">Attendance saved for {meetingDate}.</p>
                    </div>
                ) : (
                    <>
                        <div>
                            <label className="block text-[10px] uppercase tracking-widest text-gray-500 font-semibold mb-1.5">
                                Meeting Date
                            </label>
                            <input
                                type="date"
                                value={meetingDate}
                                onChange={(e) => setMeetingDate(e.target.value)}
                                className="w-full h-10 px-3 bg-[#F4F1EA]/40 border border-[#121212]/10 text-sm text-[#121212] font-light focus:outline-none focus:border-[#121212] rounded-lg"
                            />
                        </div>

                        {error && (
                            <div className="bg-red-50 border border-red-100 text-red-700 rounded-lg p-3 text-xs">{error}</div>
                        )}

                        <div className="space-y-1.5">
                            {members.length === 0 ? (
                                <p className="text-xs text-gray-500 text-center py-6">No members in this fellowship yet.</p>
                            ) : (
                                members.map((m) => {
                                    const status = statuses[m.member.id] ?? "PRESENT";
                                    return (
                                        <div key={m.id} className="flex items-center justify-between bg-[#F4F1EA]/50 rounded-lg px-3 py-2.5">
                                            <span className="text-sm text-[#121212] font-medium">{m.member.firstname} {m.member.lastname}</span>
                                            <div className="flex gap-1.5">
                                                <button
                                                    onClick={() => toggle(m.member.id, "PRESENT")}
                                                    className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[10px] font-semibold uppercase tracking-wider transition-colors ${status === "PRESENT" ? "bg-green-600 text-white" : "bg-white text-gray-400 border border-[#121212]/10"}`}
                                                >
                                                    <CheckCircle2 size={12} /> Present
                                                </button>
                                                <button
                                                    onClick={() => toggle(m.member.id, "ABSENT")}
                                                    className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[10px] font-semibold uppercase tracking-wider transition-colors ${status === "ABSENT" ? "bg-red-600 text-white" : "bg-white text-gray-400 border border-[#121212]/10"}`}
                                                >
                                                    <XCircle size={12} /> Absent
                                                </button>
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                        </div>

                        {members.length > 0 && (
                            <button
                                onClick={handleSubmit}
                                disabled={isSubmitting}
                                className="w-full py-3 rounded-lg text-xs font-semibold uppercase tracking-wider bg-[#121212] text-white hover:bg-[#121212]/90 transition-colors disabled:opacity-50"
                            >
                                {isSubmitting ? "Saving…" : "Save Attendance"}
                            </button>
                        )}
                    </>
                )}
            </div>
        </div>
    );
};
