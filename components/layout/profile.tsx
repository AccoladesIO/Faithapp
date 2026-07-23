"use client";

import React from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useProfile } from "@/hooks/use-profile";
import { useModuleState } from "@/hooks/use-module-state";
import {
    ClipboardList, GraduationCap, HandMetal, Cake,
    AlertTriangle, Calendar, History, ClipboardCheck, Users2, UserPlus, Baby,
    Building2, BookOpenCheck, MessageSquareText, UserCheck, HeartHandshake, Flame, BookOpen, Gamepad2,
} from "lucide-react";

type Tint = "cream" | "tan" | "dark";

interface GridTile {
    icon: React.ElementType;
    label: string;
    href: string;
    badge?: string;
    tint?: Tint;
    moduleKey?: string;
}

const TINT_STYLES: Record<Tint, { circle: string; icon: string }> = {
    cream: { circle: "bg-[#F4F1EA]", icon: "text-[#756E69]" },
    tan: { circle: "bg-[#EADCC9]", icon: "text-[#121212]" },
    dark: { circle: "bg-[#121212]", icon: "text-white" },
};

function Tile({ tile, onClick }: { tile: GridTile; onClick: () => void }) {
    const Icon = tile.icon;
    const { circle, icon } = TINT_STYLES[tile.tint ?? "cream"];
    return (
        <button
            onClick={onClick}
            className="flex flex-col items-center text-center gap-2 bg-white border border-[#121212]/5 rounded-2xl p-4 shadow-sm hover:border-[#121212]/15 hover:shadow-md transition-all focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#8A817C]"
        >
            <div className={`w-11 h-11 rounded-full flex items-center justify-center ${circle}`}>
                <Icon size={18} className={icon} />
            </div>
            <span className="text-xs font-medium text-[#121212] leading-tight">{tile.label}</span>
            {tile.badge && (
                <span className="text-[8px] uppercase tracking-wider font-bold bg-[#EADCC9] text-[#121212] px-1.5 py-0.5 rounded -mt-1">{tile.badge}</span>
            )}
        </button>
    );
}

function TileSection({ label, tiles, onNavigate }: { label: string; tiles: GridTile[]; onNavigate: (href: string) => void }) {
    if (tiles.length === 0) return null;
    return (
        <div className="space-y-3">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-widest px-1">{label}</h3>
            <div className="grid grid-cols-3 gap-3">
                {tiles.map((tile) => (
                    <Tile key={tile.href} tile={tile} onClick={() => onNavigate(tile.href)} />
                ))}
            </div>
        </div>
    );
}

function MoreSkeleton() {
    return (
        <div className="px-6 mt-6 max-w-md mx-auto grid grid-cols-3 gap-3 animate-pulse">
            {Array.from({ length: 6 }).map((_, i) => <div key={i} className="h-24 bg-gray-100 rounded-2xl" />)}
        </div>
    );
}

export const ProfilePage = () => {
    const router = useRouter();
    const { profile, isLoading } = useProfile() ?? {};

    const isWorker = profile?.role === "WORKER";
    const isHod = isWorker && !!profile?.isHod;
    const isPastor = !!profile?.pastorType;
    const isTrainee = isWorker && !!profile?.isTrainee;
    const isFollowUp = isWorker && (
        profile?.workerProfile?.department?.key === "FOLLOW_UP" ||
        profile?.workerProfile?.secondaryDepartment?.key === "FOLLOW_UP"
    );
    const isAdminDept = isWorker && (
        profile?.workerProfile?.department?.key === "ADMIN" ||
        profile?.workerProfile?.secondaryDepartment?.key === "ADMIN"
    );
    const { isModuleEnabled } = useModuleState();

    const exploreTiles: GridTile[] = [
        { icon: ClipboardList, label: "My Stats", href: "/dashboard" },
        { icon: GraduationCap, label: "Training Classes", href: "/classes", moduleKey: "classes" },
        { icon: Baby, label: "Children's Church", href: "/children-church", moduleKey: "children_church" },
        { icon: Cake, label: "Birthday Wishes", href: "/birthdays" },
        { icon: AlertTriangle, label: "Incidents", href: "/incidents", moduleKey: "incident_report" },
        { icon: Building2, label: "Facility Rental", href: "/facility-rental", moduleKey: "facility_rental" },
        { icon: BookOpenCheck, label: "Sunday School", href: "/sunday-school", moduleKey: "sunday_school" },
        { icon: HeartHandshake, label: "Prayer Requests", href: "/prayer-requests", moduleKey: "prayer" },
        { icon: BookOpen, label: "Sermons", href: "/sermons", moduleKey: "sermons" },
        { icon: Gamepad2, label: "Games", href: "/games", moduleKey: "games" },
    ].filter((t) => isModuleEnabled(t.moduleKey));

    const ministryTiles: GridTile[] = (isWorker ? [
        { icon: HandMetal, label: "Prayer Roster", href: "/prayer", tint: "tan" as Tint, badge: "Workers", moduleKey: "prayer" },
        { icon: Calendar, label: "Leave Request", href: "/leave", tint: "tan" as Tint },
        { icon: History, label: "Service History", href: "/service-history", tint: "tan" as Tint },
        { icon: Flame, label: "Evangelism", href: "/evangelism", tint: "tan" as Tint, moduleKey: "evangelism" },
        ...(isFollowUp ? [{ icon: UserPlus, label: "Follow-Up", href: "/follow-up", tint: "tan" as Tint, moduleKey: "follow_up" }] : []),
    ] : []).filter((t) => isModuleEnabled(t.moduleKey));

    const leadershipTiles: GridTile[] = [
        ...(isHod ? [
            { icon: ClipboardCheck, label: "Dept. Attendance", href: "/attendance/department", tint: "dark" as Tint, badge: "HOD" },
            { icon: Users2, label: "Dept. Summary", href: "/department-summary", tint: "dark" as Tint, badge: "HOD" },
            { icon: MessageSquareText, label: "Weekly Feedback", href: "/pastor-feedback", tint: "dark" as Tint, badge: "HOD", moduleKey: "pastor_feedback" },
        ] : []),
        ...(isPastor && !isHod ? [
            { icon: MessageSquareText, label: "Pastor Feedback", href: "/pastor-feedback", tint: "dark" as Tint, badge: "Pastor", moduleKey: "pastor_feedback" },
        ] : []),
        ...(isAdminDept ? [
            { icon: UserCheck, label: "Check Someone In", href: "/admin-checkin", tint: "dark" as Tint, badge: "Admin" },
        ] : []),
    ].filter((t) => isModuleEnabled(t.moduleKey));

    const fullName = profile ? `${profile?.firstname ?? ""}`.trim() : "";

    let subtitle = "Your giving, classes, and everything else you need";
    if (isHod) subtitle = "Your leadership tools, giving, and everything else you need";
    else if (isWorker) subtitle = "Your ministry tools, giving, and everything else you need";

    return (
        <div className="min-h-screen bg-[#FFFFFF] text-[#121212] pb-32 font-sans selection:bg-[#121212] selection:text-[#FFFFFF]">
            <div className="relative w-full h-[32vh] overflow-hidden">
                <Image src="/images/profile-journal.jpg" alt="Open journal" fill priority sizes="100vw" className="object-cover" />
                <div className="absolute inset-0 bg-black/50" />
                <div className="absolute bottom-0 inset-x-0 p-6">
                    <span className="text-xs uppercase tracking-widest text-white/80 font-semibold drop-shadow-sm">More</span>
                    <div className="flex items-center gap-2 flex-wrap">
                        <h1 className="text-2xl font-light tracking-tight text-white drop-shadow-md">
                            {isLoading
                                ? <span className="inline-block h-7 w-40 bg-white/20 rounded animate-pulse" />
                                : fullName ? `Hi, ${fullName}` : "Everything Else"}
                        </h1>
                        {!isLoading && isTrainee && (
                            <span className="inline-block px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider rounded-full bg-amber-400 text-[#121212]">
                                Training
                            </span>
                        )}
                    </div>
                    {!isLoading && (
                        <p className="text-xs text-white/70 font-light mt-1 drop-shadow-sm">{subtitle}</p>
                    )}
                </div>
            </div>

            {isLoading ? <MoreSkeleton /> : (
                <div className="px-6 mt-6 max-w-md mx-auto space-y-6">
                    <TileSection label="Explore" tiles={exploreTiles} onNavigate={router.push} />
                    <TileSection label="Ministry" tiles={ministryTiles} onNavigate={router.push} />
                    <TileSection label="Leadership" tiles={leadershipTiles} onNavigate={router.push} />
                </div>
            )}
        </div>
    );
};
