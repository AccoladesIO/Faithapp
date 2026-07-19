"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import {
    ArrowLeft, BookOpen, ChevronRight, ChevronLeft, Loader2,
    Clock, Plus, Users2, Trash2,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useProfile } from "@/hooks/use-profile";
import {
    useSundaySchool, SSClass, SSSession, SSAttendanceStatus,
} from "@/hooks/use-sunday-school";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(iso: string): string {
    return new Date(iso + "T00:00:00").toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

function formatDateTime(iso: string): string {
    return new Date(iso).toLocaleString("en-GB", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit", hour12: true });
}

function AttendanceStatusBadge({ status }: { status: SSAttendanceStatus | null }) {
    if (!status) return <span className="text-[9px] uppercase tracking-wider font-bold bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded">Unmarked</span>;
    const cls: Record<SSAttendanceStatus, string> = {
        PRESENT: "bg-green-50 text-green-700",
        ABSENT: "bg-red-50 text-red-600",
        EXCUSED: "bg-amber-50 text-amber-700",
    };
    const label: Record<SSAttendanceStatus, string> = { PRESENT: "Present", ABSENT: "Absent", EXCUSED: "Excused" };
    return <span className={`text-[9px] uppercase tracking-wider font-bold px-1.5 py-0.5 rounded ${cls[status]}`}>{label[status]}</span>;
}

// ─── Member: My Attendance tab ────────────────────────────────────────────────

function MyAttendanceTab() {
    const ss = useSundaySchool();

    useEffect(() => {
        ss.fetchOpenSessions();
        ss.fetchMyAttendance(1);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return (
        <div className="space-y-5">
            <div className="space-y-2.5">
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-widest px-1">Open Check-Ins</h3>
                {ss.openSessions.length === 0 ? (
                    <p className="text-xs text-gray-500 font-light">No self-mark windows are open for your classes right now.</p>
                ) : (
                    <div className="space-y-2">
                        {ss.openSessions.map((s) => (
                            <div key={s.id} className="bg-white border border-[#121212]/5 rounded-xl p-3.5 flex items-center justify-between gap-3">
                                <div className="min-w-0">
                                    <p className="text-xs font-medium text-[#121212] truncate">{s.sundaySchoolClass.name}</p>
                                    <p className="text-[10px] text-gray-500 font-light mt-0.5 flex items-center gap-1"><Clock size={10} /> Closes {s.selfMarkClosesAt && formatDateTime(s.selfMarkClosesAt)}</p>
                                </div>
                                <button onClick={() => ss.checkIn(s.id)} disabled={ss.isSubmitting}
                                    className="text-[10px] uppercase tracking-wider font-bold text-white bg-[#121212] px-3 py-2 rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50 flex-shrink-0">
                                    {ss.isSubmitting ? <Loader2 size={12} className="animate-spin" /> : "Check In"}
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <div className="space-y-2.5">
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-widest px-1">My Attendance History</h3>
                {ss.isLoading ? (
                    <div className="space-y-2 animate-pulse">{[1, 2].map((i) => <div key={i} className="h-14 bg-gray-100 rounded-xl" />)}</div>
                ) : ss.error ? (
                    <p className="text-xs text-red-500">{ss.error}</p>
                ) : ss.myAttendance.length === 0 ? (
                    <p className="text-xs text-gray-500 font-light">No Sunday School attendance recorded yet.</p>
                ) : (
                    <div className="space-y-2">
                        {ss.myAttendance.map((a) => (
                            <div key={a.id} className="bg-white border border-[#121212]/5 rounded-xl p-3.5">
                                <div className="flex items-center justify-between gap-2">
                                    <p className="text-xs font-medium text-[#121212]">{a.session.sundaySchoolClass.name}</p>
                                    <AttendanceStatusBadge status={a.status} />
                                </div>
                                <p className="text-[10px] text-gray-500 font-light mt-1">{formatDate(a.session.sessionDate)}</p>
                            </div>
                        ))}
                        {ss.myAttendanceTotalPages > 1 && (
                            <div className="flex items-center justify-between pt-1">
                                <button onClick={() => ss.fetchMyAttendance(ss.myAttendancePage - 1)} disabled={ss.myAttendancePage <= 1}
                                    className="flex items-center gap-1 text-[10px] font-semibold text-[#756E69] hover:text-[#121212] disabled:opacity-40 transition-colors">
                                    <ChevronLeft size={12} /> Prev
                                </button>
                                <span className="text-[10px] text-gray-500 font-light">Page {ss.myAttendancePage} of {ss.myAttendanceTotalPages}</span>
                                <button onClick={() => ss.fetchMyAttendance(ss.myAttendancePage + 1)} disabled={ss.myAttendancePage >= ss.myAttendanceTotalPages}
                                    className="flex items-center gap-1 text-[10px] font-semibold text-[#756E69] hover:text-[#121212] disabled:opacity-40 transition-colors">
                                    Next <ChevronRight size={12} />
                                </button>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}

// ─── Teacher: Roster / attendance marking ─────────────────────────────────────

function SessionRosterPanel({ session, onBack }: { session: SSSession; onBack: () => void }) {
    const ss = useSundaySchool();
    const [draft, setDraft] = useState<Record<string, SSAttendanceStatus>>({});
    const [closesInMinutes, setClosesInMinutes] = useState(30);

    useEffect(() => {
        ss.fetchRoster(session.id);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [session.id]);

    useEffect(() => {
        if (ss.roster) {
            const init: Record<string, SSAttendanceStatus> = {};
            ss.roster.members.forEach((m) => { if (m.status) init[m.memberId] = m.status; });
            setDraft(init);
        }
    }, [ss.roster]);

    const setStatus = (memberId: string, status: SSAttendanceStatus) => {
        setDraft((p) => ({ ...p, [memberId]: status }));
    };

    const handleSave = async () => {
        const attendances = Object.entries(draft).map(([memberId, status]) => ({ memberId, status }));
        if (attendances.length === 0) return;
        try {
            await ss.bulkMarkAttendance(session.id, attendances);
        } catch { /* error shown below */ }
    };

    return (
        <div className="space-y-4">
            <button onClick={onBack} className="flex items-center gap-1.5 text-xs font-semibold text-[#756E69] hover:text-[#121212] transition-colors">
                <ArrowLeft size={14} /> Back to sessions
            </button>
            <div>
                <h2 className="text-lg font-normal text-[#121212] tracking-tight">{formatDate(session.sessionDate)}</h2>
                {ss.roster && (
                    <p className="text-xs text-gray-500 font-light mt-1">
                        {ss.roster.selfMarkOpen
                            ? `Self-mark open — closes ${ss.roster.selfMarkClosesAt ? formatDateTime(ss.roster.selfMarkClosesAt) : ""}`
                            : "Self-mark is closed"}
                    </p>
                )}
            </div>

            <div className="flex items-center gap-2">
                {ss.roster?.selfMarkOpen ? (
                    <button onClick={() => ss.closeSelfMark(session.id)} disabled={ss.isSubmitting}
                        className="flex-1 border border-[#121212]/10 text-xs uppercase tracking-widest font-semibold py-2.5 rounded-xl text-gray-600 hover:bg-[#F4F1EA] transition-colors disabled:opacity-50">
                        Close Self-Mark
                    </button>
                ) : (
                    <>
                        <input type="number" min={5} max={480} value={closesInMinutes} onChange={(e) => setClosesInMinutes(+e.target.value)}
                            className="w-20 bg-white border border-[#121212]/10 rounded-xl px-2 py-2.5 text-xs text-center outline-none focus:border-[#121212]/30" />
                        <button onClick={() => ss.openSelfMark(session.id, closesInMinutes)} disabled={ss.isSubmitting}
                            className="flex-1 bg-[#121212] text-white text-xs uppercase tracking-widest font-semibold py-2.5 rounded-xl hover:bg-gray-800 transition-colors disabled:opacity-50">
                            Open Self-Mark ({closesInMinutes}m)
                        </button>
                    </>
                )}
            </div>

            {ss.isLoading ? (
                <div className="space-y-2 animate-pulse">{[1, 2, 3].map((i) => <div key={i} className="h-14 bg-gray-100 rounded-xl" />)}</div>
            ) : ss.roster && ss.roster.members.length === 0 ? (
                <p className="text-xs text-gray-500 font-light">No members are assigned to this class yet.</p>
            ) : (
                <div className="space-y-2">
                    {ss.roster?.members.map((m) => {
                        const current = draft[m.memberId];
                        return (
                            <div key={m.memberId} className="bg-white border border-[#121212]/5 rounded-xl p-3.5">
                                <div className="flex items-center justify-between gap-2 mb-2">
                                    <p className="text-xs font-medium text-[#121212] truncate">{m.name}</p>
                                    {m.markedByTeacher && current && <span className="text-[9px] text-gray-500 font-light flex-shrink-0">by teacher</span>}
                                </div>
                                <div className="flex gap-1.5">
                                    {(["PRESENT", "ABSENT", "EXCUSED"] as SSAttendanceStatus[]).map((s) => (
                                        <button key={s} onClick={() => setStatus(m.memberId, s)}
                                            className={`flex-1 py-1.5 text-[9px] uppercase tracking-wider font-bold rounded-lg transition-colors ${current === s
                                                ? s === "PRESENT" ? "bg-green-600 text-white" : s === "ABSENT" ? "bg-red-500 text-white" : "bg-amber-500 text-white"
                                                : "bg-[#F4F1EA] text-gray-500 hover:text-[#121212]"
                                                }`}>
                                            {s === "PRESENT" ? "Present" : s === "ABSENT" ? "Absent" : "Excused"}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {ss.error && <p className="text-xs text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">{ss.error}</p>}

            <button onClick={handleSave} disabled={ss.isSubmitting || Object.keys(draft).length === 0}
                className="w-full bg-[#121212] text-white text-xs uppercase tracking-widest font-semibold py-3 rounded-xl hover:bg-gray-800 transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
                {ss.isSubmitting ? <><Loader2 size={13} className="animate-spin" /> Saving…</> : "Save Attendance"}
            </button>
        </div>
    );
}

// ─── Teacher: Class detail (sessions + members) ───────────────────────────────

function ClassDetailPanel({ cls, onBack }: { cls: SSClass; onBack: () => void }) {
    const ss = useSundaySchool();
    const [classTab, setClassTab] = useState<"sessions" | "members">("sessions");
    const [selectedSession, setSelectedSession] = useState<SSSession | null>(null);
    const [showNewSession, setShowNewSession] = useState(false);
    const [sessionDate, setSessionDate] = useState("");
    const [sessionNotes, setSessionNotes] = useState("");

    useEffect(() => {
        if (classTab === "sessions") ss.fetchSessions(cls.id, 1);
        else ss.fetchClassMembers(cls.id, 1);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [classTab, cls.id]);

    if (selectedSession) {
        return <SessionRosterPanel session={selectedSession} onBack={() => setSelectedSession(null)} />;
    }

    const handleCreateSession = async () => {
        if (!sessionDate) return;
        try {
            await ss.createSession({ classId: cls.id, sessionDate, notes: sessionNotes || undefined });
            setShowNewSession(false);
            setSessionDate("");
            setSessionNotes("");
        } catch { /* error shown below */ }
    };

    return (
        <div className="space-y-4">
            <button onClick={onBack} className="flex items-center gap-1.5 text-xs font-semibold text-[#756E69] hover:text-[#121212] transition-colors">
                <ArrowLeft size={14} /> Back to classes
            </button>
            <div>
                <h2 className="text-lg font-normal text-[#121212] tracking-tight">{cls.name}</h2>
                {cls.description && <p className="text-xs text-gray-500 font-light mt-1">{cls.description}</p>}
                {cls.teacher && <p className="text-[10px] text-gray-500 font-light mt-1">Teacher: {cls.teacher.firstname} {cls.teacher.lastname}</p>}
            </div>

            <div className="flex bg-[#F4F1EA] p-0.5 rounded-xl">
                <button onClick={() => setClassTab("sessions")} className={`flex-1 py-2 text-[10px] font-bold uppercase tracking-wider rounded-lg transition-colors ${classTab === "sessions" ? "bg-white text-[#121212] shadow-sm" : "text-[#756E69]"}`}>Sessions</button>
                <button onClick={() => setClassTab("members")} className={`flex-1 py-2 text-[10px] font-bold uppercase tracking-wider rounded-lg transition-colors ${classTab === "members" ? "bg-white text-[#121212] shadow-sm" : "text-[#756E69]"}`}>Members</button>
            </div>

            {classTab === "sessions" ? (
                <div className="space-y-2.5">
                    {!showNewSession ? (
                        <button onClick={() => setShowNewSession(true)} className="w-full flex items-center justify-center gap-2 py-2.5 border-2 border-dashed border-[#121212]/10 rounded-xl text-xs font-semibold uppercase tracking-widest text-[#756E69] hover:border-[#121212]/20 hover:text-[#121212] transition-all">
                            <Plus size={14} /> New Session
                        </button>
                    ) : (
                        <div className="bg-white border border-[#121212]/5 rounded-xl p-3.5 space-y-2.5">
                            <input type="date" value={sessionDate} onChange={(e) => setSessionDate(e.target.value)}
                                className="w-full bg-white border border-[#121212]/10 rounded-xl px-3 py-2.5 text-xs outline-none focus:border-[#121212]/30" />
                            <input type="text" value={sessionNotes} onChange={(e) => setSessionNotes(e.target.value)} placeholder="Notes (optional)"
                                className="w-full bg-white border border-[#121212]/10 rounded-xl px-3 py-2.5 text-xs outline-none focus:border-[#121212]/30" />
                            <div className="flex gap-2">
                                <button onClick={() => setShowNewSession(false)} className="flex-1 border border-[#121212]/10 text-xs uppercase tracking-widest font-semibold py-2 rounded-xl text-gray-600">Cancel</button>
                                <button onClick={handleCreateSession} disabled={ss.isSubmitting || !sessionDate} className="flex-1 bg-[#121212] text-white text-xs uppercase tracking-widest font-semibold py-2 rounded-xl disabled:opacity-50">
                                    {ss.isSubmitting ? "Saving…" : "Create"}
                                </button>
                            </div>
                        </div>
                    )}
                    {ss.error && <p className="text-xs text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">{ss.error}</p>}
                    {ss.isLoading ? (
                        <div className="space-y-2 animate-pulse">{[1, 2].map((i) => <div key={i} className="h-14 bg-gray-100 rounded-xl" />)}</div>
                    ) : ss.sessions.length === 0 ? (
                        <p className="text-xs text-gray-500 font-light">No sessions recorded for this class yet.</p>
                    ) : (
                        ss.sessions.map((s) => (
                            <button key={s.id} onClick={() => setSelectedSession(s)} className="w-full bg-white border border-[#121212]/5 rounded-xl p-3.5 flex items-center justify-between hover:border-[#121212]/15 transition-colors text-left">
                                <div>
                                    <p className="text-xs font-medium text-[#121212]">{formatDate(s.sessionDate)}</p>
                                    {s.notes && <p className="text-[10px] text-gray-500 font-light mt-0.5">{s.notes}</p>}
                                </div>
                                <ChevronRight size={14} className="text-gray-500" />
                            </button>
                        ))
                    )}
                </div>
            ) : (
                <div className="space-y-2.5">
                    <p className="text-[10px] text-gray-500 font-light px-1">
                        Adding members requires picking from the full member directory, which isn&apos;t available on mobile yet — add members from the admin portal, then manage attendance here.
                    </p>
                    {ss.isLoading ? (
                        <div className="space-y-2 animate-pulse">{[1, 2].map((i) => <div key={i} className="h-12 bg-gray-100 rounded-xl" />)}</div>
                    ) : ss.classMembers.length === 0 ? (
                        <p className="text-xs text-gray-500 font-light">No members assigned to this class yet.</p>
                    ) : (
                        ss.classMembers.map((m) => (
                            <div key={m.id} className="bg-white border border-[#121212]/5 rounded-xl p-3 flex items-center justify-between">
                                <span className="text-xs text-[#121212] font-medium">{m.member.firstname} {m.member.lastname}</span>
                                <button onClick={() => ss.removeMember(cls.id, m.member.id)} disabled={ss.isSubmitting} className="p-1.5 text-gray-500 hover:text-red-500 transition-colors">
                                    <Trash2 size={13} />
                                </button>
                            </div>
                        ))
                    )}
                </div>
            )}
        </div>
    );
}

// ─── Teacher: Classes list ─────────────────────────────────────────────────────

function TeachTab() {
    const ss = useSundaySchool();
    const [selectedClass, setSelectedClass] = useState<SSClass | null>(null);
    const [showNewClass, setShowNewClass] = useState(false);
    const [name, setName] = useState("");
    const [description, setDescription] = useState("");

    useEffect(() => {
        ss.fetchClasses(1);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    if (selectedClass) {
        return <ClassDetailPanel cls={selectedClass} onBack={() => setSelectedClass(null)} />;
    }

    const handleCreate = async () => {
        if (!name.trim()) return;
        try {
            await ss.createClass({ name: name.trim(), description: description.trim() || undefined });
            setShowNewClass(false);
            setName("");
            setDescription("");
        } catch { /* error shown below */ }
    };

    return (
        <div className="space-y-2.5">
            {!showNewClass ? (
                <button onClick={() => setShowNewClass(true)} className="w-full flex items-center justify-center gap-2 py-2.5 border-2 border-dashed border-[#121212]/10 rounded-xl text-xs font-semibold uppercase tracking-widest text-[#756E69] hover:border-[#121212]/20 hover:text-[#121212] transition-all">
                    <Plus size={14} /> New Class
                </button>
            ) : (
                <div className="bg-white border border-[#121212]/5 rounded-xl p-3.5 space-y-2.5">
                    <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Class name"
                        className="w-full bg-white border border-[#121212]/10 rounded-xl px-3 py-2.5 text-xs outline-none focus:border-[#121212]/30" />
                    <input type="text" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Description (optional)"
                        className="w-full bg-white border border-[#121212]/10 rounded-xl px-3 py-2.5 text-xs outline-none focus:border-[#121212]/30" />
                    <div className="flex gap-2">
                        <button onClick={() => setShowNewClass(false)} className="flex-1 border border-[#121212]/10 text-xs uppercase tracking-widest font-semibold py-2 rounded-xl text-gray-600">Cancel</button>
                        <button onClick={handleCreate} disabled={ss.isSubmitting || !name.trim()} className="flex-1 bg-[#121212] text-white text-xs uppercase tracking-widest font-semibold py-2 rounded-xl disabled:opacity-50">
                            {ss.isSubmitting ? "Saving…" : "Create"}
                        </button>
                    </div>
                </div>
            )}
            {ss.error && <p className="text-xs text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">{ss.error}</p>}
            {ss.isLoading ? (
                <div className="space-y-2 animate-pulse">{[1, 2].map((i) => <div key={i} className="h-16 bg-gray-100 rounded-xl" />)}</div>
            ) : ss.classes.length === 0 ? (
                <p className="text-xs text-gray-500 font-light">No Sunday School classes yet.</p>
            ) : (
                ss.classes.map((c) => (
                    <button key={c.id} onClick={() => setSelectedClass(c)} className="w-full bg-white border border-[#121212]/5 rounded-2xl p-4 shadow-sm hover:border-[#121212]/15 transition-all text-left flex items-center justify-between">
                        <div className="min-w-0">
                            <p className="text-sm font-medium text-[#121212]">{c.name}</p>
                            {c.description && <p className="text-xs text-gray-500 font-light mt-1 line-clamp-1">{c.description}</p>}
                            {c.teacher && <p className="text-[10px] text-gray-500 font-light mt-1">Teacher: {c.teacher.firstname} {c.teacher.lastname}</p>}
                        </div>
                        <ChevronRight size={16} className="text-gray-500 flex-shrink-0" />
                    </button>
                ))
            )}
        </div>
    );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export const SundaySchoolPage = () => {
    const router = useRouter();
    const { profile } = useProfile() ?? {};
    const [tab, setTab] = useState<"attendance" | "teach">("attendance");

    const isTeacher = profile?.role === "WORKER" && (
        profile?.workerProfile?.department?.key === "SUNDAY_SCHOOL" ||
        profile?.workerProfile?.secondaryDepartment?.key === "SUNDAY_SCHOOL"
    );

    return (
        <div className="min-h-screen bg-[#FFFFFF] text-[#121212] pb-32 font-sans selection:bg-[#121212] selection:text-[#FFFFFF]">
            <div className="relative w-full h-[40vh] overflow-hidden">
                <Image src="/images/sunday-school-classroom.jpg" alt="Empty classroom" fill priority sizes="100vw" className="object-cover" />
                <div className="absolute inset-0 bg-black/50" />
                <div className="absolute top-4 left-4 z-10">
                    <button onClick={() => router.back()} className="p-2.5 bg-black/25 backdrop-blur-md hover:bg-black/40 text-white rounded-full transition-colors border border-white/10" aria-label="Go back">
                        <ArrowLeft size={16} />
                    </button>
                </div>
                <div className="absolute bottom-0 inset-x-0 p-6">
                    <span className="text-xs uppercase tracking-widest text-white/80 font-semibold flex items-center gap-1 drop-shadow-sm">
                        <BookOpen size={12} /> Ministry
                    </span>
                    <h1 className="text-2xl font-light tracking-tight text-white mt-1 drop-shadow-md">Sunday School</h1>
                </div>
            </div>

            <div className="px-6 mt-6 max-w-lg mx-auto space-y-4">
                {isTeacher && (
                    <div className="flex bg-[#F4F1EA] p-0.5 rounded-xl">
                        <button onClick={() => setTab("attendance")} className={`flex-1 py-2 text-[10px] font-bold uppercase tracking-wider rounded-lg transition-colors ${tab === "attendance" ? "bg-white text-[#121212] shadow-sm" : "text-[#756E69]"}`}>
                            My Attendance
                        </button>
                        <button onClick={() => setTab("teach")} className={`flex-1 py-2 text-[10px] font-bold uppercase tracking-wider rounded-lg transition-colors ${tab === "teach" ? "bg-white text-[#121212] shadow-sm" : "text-[#756E69]"} flex items-center justify-center gap-1`}>
                            <Users2 size={11} /> Teach
                        </button>
                    </div>
                )}

                {tab === "attendance" || !isTeacher ? <MyAttendanceTab /> : <TeachTab />}
            </div>
        </div>
    );
};
