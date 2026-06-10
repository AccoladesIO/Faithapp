import React from 'react';
import { Calendar as CalendarIcon, Clock, XCircle, AlertCircle, CheckCircle2, Flame, Award } from 'lucide-react';

type AttendanceStatus = 'EARLY' | 'LATE' | 'ABSENT';

interface PersonalStats {
    attendanceStreak: number;
    totalServicesCount: number;
    lastCheckedInDate: string;
    attendanceRatePercentage: number;
}

interface HistoricalLog {
    id: string;
    title: string;
    scripture: string;
    date: string;
    timeCheckedIn: string;
    type: 'SUNDAY_SERVICE' | 'MIDWEEK_SERVICE' | 'SPECIAL_EVENT';
    status: AttendanceStatus;
}

const PERSONAL_STATS: PersonalStats = {
    attendanceStreak: 4,
    totalServicesCount: 28,
    lastCheckedInDate: 'June 7, 2026',
    attendanceRatePercentage: 92,
};

const ATTENDANCE_HISTORY_LOGS: HistoricalLog[] = [
    {
        id: 'log-1',
        title: 'Who Is Your King?',
        scripture: 'Esther 3-7',
        date: 'Sun, Jun 7',
        timeCheckedIn: '7:22 am',
        type: 'SUNDAY_SERVICE',
        status: 'EARLY',
    },
    {
        id: 'log-2',
        title: 'Finding Relief From Your Spiritual Enemies',
        scripture: 'Nehemiah 4',
        date: 'Wed, Jun 3',
        timeCheckedIn: '6:35 pm',
        type: 'MIDWEEK_SERVICE',
        status: 'LATE',
    },
    {
        id: 'log-3',
        title: 'Justice For The Poor',
        scripture: 'Nehemiah 5',
        date: 'Sun, May 31',
        timeCheckedIn: '7:15 am',
        type: 'SUNDAY_SERVICE',
        status: 'EARLY',
    },
    {
        id: 'log-4',
        title: 'Rebuilding Broken Boundaries',
        scripture: 'Nehemiah 1-3',
        date: 'Sun, May 24',
        timeCheckedIn: '--:--',
        type: 'SUNDAY_SERVICE',
        status: 'ABSENT',
    }
];

const StatusBadge = ({ status }: { status: AttendanceStatus }) => {
    switch (status) {
        case 'EARLY':
            return (
                <div className="flex items-center gap-1 text-green-600 bg-green-50 px-2 py-0.5 rounded-full">
                    <CheckCircle2 size={11} />
                    <span className="text-[10px] font-bold uppercase tracking-wider">Early</span>
                </div>
            );
        case 'LATE':
            return (
                <div className="flex items-center gap-1 text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">
                    <AlertCircle size={11} />
                    <span className="text-[10px] font-bold uppercase tracking-wider">Late</span>
                </div>
            );
        case 'ABSENT':
            return (
                <div className="flex items-center gap-1 text-red-600 bg-red-50 px-2 py-0.5 rounded-full">
                    <XCircle size={11} />
                    <span className="text-[10px] font-bold uppercase tracking-wider">Absent</span>
                </div>
            );
    }
};

export const PersonalAttendancePage = () => {
    return (
        <div className="min-h-screen bg-[#FFFFFF] text-[#121212] pb-32 font-sans selection:bg-[#121212] selection:text-[#FFFFFF]">

            <div className="relative w-full h-[24vh] md:h-[28vh] overflow-hidden">
                <img
                    src="https://images.unsplash.com/photo-1507692049790-de58290a4334?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
                    alt="Sanctuary atmosphere"
                    className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-black/40" />

                <div className="absolute bottom-0 inset-x-0 p-6 bg-gradient-to-t from-[#F9F9F9] via-[#F9F9F9]/40 to-transparent">
                    <span className="text-xs uppercase tracking-widest text-white/80 font-semibold flex items-center gap-1 drop-shadow-sm">
                        <CalendarIcon size={12} /> My Profile
                    </span>
                    <h1 className="text-2xl font-light tracking-tight text-white mt-1 drop-shadow-md">
                        Attendance History
                    </h1>
                </div>
            </div>

            <div className="px-6 pb-6 border-b border-[#121212]/5 bg-[#F9F9F9]">
                <div className="grid grid-cols-3 gap-3">
                    <div className="bg-white p-4 border border-[#121212]/5 shadow-sm flex flex-col justify-between">
                        <span className="text-[10px] uppercase tracking-wider text-gray-400 font-semibold flex items-center gap-1">
                            <Flame size={10} className="text-orange-500" /> Streak
                        </span>
                        <span className="text-2xl font-semibold tracking-tight mt-1">
                            {PERSONAL_STATS.attendanceStreak} <span className="text-xs text-gray-400 font-light font-sans">wks</span>
                        </span>
                    </div>
                    <div className="bg-white p-4 border border-[#121212]/5 shadow-sm flex flex-col justify-between">
                        <span className="text-[10px] uppercase tracking-wider text-gray-400 font-semibold flex items-center gap-1">
                            <Award size={10} className="text-[#8A817C]" /> Total
                        </span>
                        <span className="text-2xl font-semibold tracking-tight mt-1">
                            {PERSONAL_STATS.totalServicesCount} <span className="text-xs text-gray-400 font-light font-sans">logs</span>
                        </span>
                    </div>
                    <div className="bg-white p-4 border border-[#121212]/5 shadow-sm flex flex-col justify-between">
                        <span className="text-[10px] uppercase tracking-wider text-gray-400 font-semibold">Consistency</span>
                        <span className="text-2xl font-semibold tracking-tight text-[#8A817C] mt-1">
                            {PERSONAL_STATS.attendanceRatePercentage}%
                        </span>
                    </div>
                </div>
            </div>

            <div className="px-6 mt-8 space-y-4">
                <div className="flex justify-between items-center px-1">
                    <span className="text-xs font-semibold text-gray-400 uppercase tracking-widest">
                        Checked-In Services
                    </span>
                    <span className="text-xs text-gray-400 font-light">
                        Last log: {PERSONAL_STATS.lastCheckedInDate}
                    </span>
                </div>

                <div className="space-y-3">
                    {ATTENDANCE_HISTORY_LOGS.map((log) => (
                        <div
                            key={log.id}
                            className={`bg-white border border-[#121212]/5 p-4 shadow-sm flex items-center justify-between transition-all hover:border-[#121212]/10 ${log.status === 'ABSENT' ? 'opacity-65' : ''
                                }`}
                        >
                            <div className="flex items-start gap-4 flex-grow pr-2">
                                <div className="bg-[#F4F1EA] text-[#121212] px-3 py-2 h-[100px] flex flex-col items-center justify-center min-w-[68px] border border-[#121212]/5">
                                    <span className="text-xs font-bold leading-none text-center">
                                        {log.date.split(',')[1].trim().split(' ')[0]}
                                    </span>
                                    <span className="text-lg font-bold tracking-tighter leading-none mt-1">
                                        {log.date.split(',')[1].trim().split(' ')[1]}
                                    </span>
                                </div>

                                <div className="space-y-0.5">
                                    <span className="text-[9px] uppercase tracking-wider font-bold text-gray-400">
                                        {log.type.replace('_', ' ')}
                                    </span>
                                    <h3 className="text-sm font-medium text-[#121212] leading-snug">
                                        {log.title}
                                    </h3>
                                    <p className="text-xs text-gray-500 font-light">
                                        {log.scripture}
                                    </p>
                                </div>
                            </div>

                            <div className="flex flex-col items-end justify-between self-stretch min-w-[85px] text-right">
                                <StatusBadge status={log.status} />

                                {log.status !== 'ABSENT' && (
                                    <span className="text-[10px] text-gray-400 font-light flex items-center justify-end gap-0.5">
                                        <Clock size={10} /> {log.timeCheckedIn}
                                    </span>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* <div className="px-6 mt-6">
                <button className="w-full bg-[#121212]/5 text-[#121212] text-xs uppercase tracking-widest font-semibold py-3.5 rounded-xl hover:bg-[#121212]/10 transition-colors flex items-center justify-center gap-1.5">
                    File Absence Excuse Card
                </button>
            </div> */}

        </div>
    );
};