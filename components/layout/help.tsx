"use client";

import React, { useMemo, useState } from "react";
import Image from "next/image";
import {
    ArrowLeft, Search, ChevronDown, ChevronRight, CircleHelp,
    LayoutDashboard, Calendar, CheckSquare, HeartHandshake, Target,
    GraduationCap, Baby, User, Briefcase, Users2, UserPlus, ShieldCheck,
    Building2, BookOpenCheck, HandHeart, UserCheck, Flame,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useProfile } from "@/hooks/use-profile";

// ─── Types ────────────────────────────────────────────────────────────────────

interface FaqItem {
    id: string;
    question: string;
    answer: string;
}

interface FaqCategory {
    id: string;
    label: string;
    icon: React.ElementType;
    badge?: string;
    items: FaqItem[];
}

// ─── FAQ row ──────────────────────────────────────────────────────────────────

function FaqRow({
    item, active, onToggle,
}: { item: FaqItem; active: boolean; onToggle: (id: string) => void }) {
    return (
        <div>
            <button
                onClick={() => onToggle(item.id)}
                className="w-full flex items-center justify-between gap-3 p-4 hover:bg-[#F9F9F9] transition-colors text-left"
            >
                <span className="text-sm font-normal text-[#121212]">{item.question}</span>
                {active
                    ? <ChevronDown size={14} className="text-gray-500 flex-shrink-0" />
                    : <ChevronRight size={14} className="text-gray-500 flex-shrink-0" />}
            </button>
            {active && (
                <div className="px-4 pb-4 bg-[#F9F9F9] border-t border-[#121212]/5">
                    <p className="pt-3 text-xs text-gray-600 font-light leading-relaxed">{item.answer}</p>
                </div>
            )}
        </div>
    );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export const HelpPage = () => {
    const router = useRouter();
    const { profile, isLoading } = useProfile();
    const [query, setQuery] = useState("");
    const [activeId, setActiveId] = useState<string | null>(null);

    const isWorker = profile?.role === "WORKER";
    const isHod = !!profile?.isHod;
    const isFollowUp =
        profile?.workerProfile?.department?.key === "FOLLOW_UP" ||
        profile?.workerProfile?.secondaryDepartment?.key === "FOLLOW_UP";
    const isChildrenChurchWorker =
        isWorker && (
            profile?.workerProfile?.department?.key === "CHILDREN_CHURCH" ||
            profile?.workerProfile?.secondaryDepartment?.key === "CHILDREN_CHURCH"
        );
    const isSundaySchoolWorker =
        isWorker && (
            profile?.workerProfile?.department?.key === "SUNDAY_SCHOOL" ||
            profile?.workerProfile?.secondaryDepartment?.key === "SUNDAY_SCHOOL"
        );
    const isAdminDept =
        isWorker && (
            profile?.workerProfile?.department?.key === "ADMIN" ||
            profile?.workerProfile?.secondaryDepartment?.key === "ADMIN"
        );

    const toggle = (id: string) => setActiveId((prev) => (prev === id ? null : id));

    const categories = useMemo<FaqCategory[]>(() => {
        const all: (FaqCategory & { visible: boolean })[] = [
            {
                id: "getting-started",
                label: "Getting Started",
                icon: LayoutDashboard,
                visible: true,
                items: [
                    {
                        id: "gs-1",
                        question: "What do the numbers on my Home dashboard mean?",
                        answer: "Your dashboard shows your current attendance streak, total services attended, and where you rank among other members — all calculated from your check-in history.",
                    },
                    {
                        id: "gs-2",
                        question: "How is my attendance streak calculated?",
                        answer: "It counts consecutive services you've checked into without a gap. Missing a scheduled service resets the streak back to zero.",
                    },
                    {
                        id: "gs-3",
                        question: "Where did the Profile tab go?",
                        answer: "It's now called More, and it's a grid of tiles grouped by Explore, Ministry, and Leadership instead of a long list.",
                    },
                    {
                        id: "gs-4",
                        question: "How do I get to my account details or log out?",
                        answer: "Tap the round icon at the top of any screen — it opens Account Details, Notifications, Support & Pastoral Care, and Log Out, no matter which page you're on.",
                    },
                ],
            },
            {
                id: "events",
                label: "Events & Check-In",
                icon: Calendar,
                visible: true,
                items: [
                    {
                        id: "ev-1",
                        question: "How do I check in for a service?",
                        answer: "On-site check-in is recorded by a worker when you arrive at the venue. Once it's logged, you'll see a confirmation on that service's detail page.",
                    },
                    {
                        id: "ev-2",
                        question: "What does the pulsing “Live” tag mean?",
                        answer: "It means that slot's check-in window is open right now — the service is actively happening.",
                    },
                    {
                        id: "ev-3",
                        question: "I'm watching online — how do I get marked present?",
                        answer: "Open the service's detail page and tap “Confirm Online Attendance.” This only appears for services with online attendance enabled.",
                    },
                    {
                        id: "ev-4",
                        question: "Why did a service move from Upcoming to Recent Services?",
                        answer: "Once a service's end date has passed, it moves into Recent Services and gets an “Ended” tag, so Upcoming Services only ever shows what's actually ahead.",
                    },
                ],
            },
            {
                id: "attendance",
                label: "Attendance",
                icon: CheckSquare,
                visible: true,
                items: [
                    {
                        id: "at-1",
                        question: "Where can I see my full check-in history?",
                        answer: "The Attendance tab lists every service you've checked into, along with the date and time you were logged.",
                    },
                    {
                        id: "at-2",
                        question: "What if a check-in is missing or wrong?",
                        answer: "Go to More > Incidents and describe what happened under Report an Incident — the admin team will review and correct it.",
                    },
                ],
            },
            {
                id: "giving",
                label: "Giving",
                icon: HeartHandshake,
                visible: true,
                items: [
                    {
                        id: "gi-1",
                        question: "How do I give my tithe or offering?",
                        answer: "Transfer to the dedicated giving account shown at the top of the Give tab, or if you've already paid another way, submit proof of payment below it.",
                    },
                    {
                        id: "gi-2",
                        question: "Why don't I have a dedicated account number yet?",
                        answer: "Personal virtual accounts are coming soon. Until then, use “Submit Proof” for any payment made directly to one of the church's accounts.",
                    },
                    {
                        id: "gi-3",
                        question: "What happens after I submit proof of payment?",
                        answer: "It's marked Pending until the finance team reviews it. You'll see it move to Approved or Rejected under Submitted Proofs.",
                    },
                    {
                        id: "gi-4",
                        question: "How do I get a tithe statement emailed to me?",
                        answer: "In the Give tab, use “Email My Tithe Statement,” pick a from/to month range, and tap Send — you'll receive a statement covering just that period.",
                    },
                ],
            },
            {
                id: "pledges",
                label: "Pledges",
                icon: Target,
                visible: true,
                items: [
                    {
                        id: "pl-1",
                        question: "What's the difference between Give and Pledges?",
                        answer: "Give records your regular tithes and offerings. Pledges track a specific commitment — like a building fund — over time, separate from your day-to-day giving.",
                    },
                    {
                        id: "pl-2",
                        question: "What is “Day to Redeem”?",
                        answer: "For one-off pledges, it's the date you intend to fulfil the pledge in a single payment, rather than on a recurring schedule.",
                    },
                    {
                        id: "pl-3",
                        question: "How do I record a pledge payment I've made?",
                        answer: "Open the pledge and tap “Log Payment” with the amount, date, and reference. This is submitted for review, not counted immediately.",
                    },
                    {
                        id: "pl-4",
                        question: "Why hasn't my logged payment updated the amount paid?",
                        answer: "A logged payment stays Pending until the finance team confirms it. Only confirmed contributions count toward the pledge's paid total.",
                    },
                    {
                        id: "pl-5",
                        question: "How do I get my full giving statement across both tithes and pledges?",
                        answer: "Use “Email My Giving Statement” on the Pledges tab for a combined yearly total of your tithes and confirmed pledge contributions.",
                    },
                ],
            },
            {
                id: "prayer-requests",
                label: "Prayer Requests",
                icon: HandHeart,
                visible: true,
                items: [
                    {
                        id: "prq-1",
                        question: "How do I submit a prayer request?",
                        answer: "Go to More > Prayer Requests and submit it under the Mine tab. It's private — seen only by the Prayer team and pastors, never posted anywhere public.",
                    },
                    {
                        id: "prq-2",
                        question: "How do I share a testimony?",
                        answer: "Under More > Prayer Requests > Mine, tap Share next to My Testimonies. You choose whether it's shared on the public Testimonies feed — nothing is made public without your say.",
                    },
                    {
                        id: "prq-3",
                        question: "Can I link my testimony to a specific prayer request?",
                        answer: "Yes — when sharing a testimony you can pick one of your own prayer requests from the list, or leave it as a general testimony not tied to any request.",
                    },
                    {
                        id: "prq-4",
                        question: "Who can see the Prayer Team tab?",
                        answer: "Only workers in the Prayer department and pastors see it — it lists every member's prayer request and lets you update its status as Open, Prayed For, or Answered.",
                    },
                    {
                        id: "prq-5",
                        question: "How does the Pregnancy Prayer tab work?",
                        answer: "It's only visible to Prayer department workers and pastors. Add a pregnant woman's name, EDD and details, then log each time she comes for prayer — the last-prayed date updates automatically, and her status can be moved to Delivered or Discontinued.",
                    },
                    {
                        id: "prq-6",
                        question: "Can I see every past visit, not just the last one?",
                        answer: "Yes — tap History on a pregnancy case to see every logged visit, with the note and who prayed with her, newest first.",
                    },
                ],
            },
            {
                id: "classes",
                label: "Training Classes",
                icon: GraduationCap,
                visible: true,
                items: [
                    {
                        id: "cl-1",
                        question: "How do I enroll in a class?",
                        answer: "Browse the catalogue in the Training Classes tab, then speak with your department head or the class facilitator to be enrolled — it isn't self-service yet.",
                    },
                    {
                        id: "cl-2",
                        question: "Where can I see my enrollment status?",
                        answer: "Check “My Enrollments” within the Training Classes tab for the status of every class you've joined.",
                    },
                    {
                        id: "cl-3",
                        question: "How do I get my certificate?",
                        answer: "Once your enrollment is marked Completed, an admin or facilitator issues your certificate — it then shows on your enrollment card in “My Enrollments”, with the certificate number if one was given.",
                    },
                ],
            },
            {
                id: "children-church",
                label: "Children's Church",
                icon: Baby,
                visible: true,
                items: [
                    {
                        id: "cc-1",
                        question: "How do I register my child?",
                        answer: "From More > Children's Church, add your child's details once — they'll then be available for check-in at every service.",
                    },
                    {
                        id: "cc-2",
                        question: "Can I check my child in myself?",
                        answer: "No — check-in and check-out are handled by Children's Church workers at the venue for safety and verification. You just need to register your child ahead of time.",
                    },
                ],
            },
            {
                id: "facility-rental",
                label: "Facility Rental",
                icon: Building2,
                visible: true,
                items: [
                    {
                        id: "fr-1",
                        question: "How do I book a facility?",
                        answer: "From More > Facility Rental, pick a facility, choose a date and time, add any extras you need, and submit — availability is checked for that facility before you can send the request.",
                    },
                    {
                        id: "fr-2",
                        question: "Why doesn't the app show my final price before I book?",
                        answer: "Your price depends on a membership-tier discount that's applied when the request is created. The estimate you see beforehand is before that discount — your real total appears right after booking and in My Bookings.",
                    },
                    {
                        id: "fr-3",
                        question: "Can I cancel a facility booking?",
                        answer: "Yes, as long as it's still Pending or Confirmed. Open it under My Bookings and tap Cancel Booking.",
                    },
                ],
            },
            {
                id: "sunday-school",
                label: "Sunday School",
                icon: BookOpenCheck,
                visible: true,
                items: [
                    {
                        id: "ss-1",
                        question: "How do I check in to Sunday School?",
                        answer: "When your teacher opens self-mark for a session, it appears under More > Sunday School > Open Check-Ins — tap Check In before the window closes.",
                    },
                    {
                        id: "ss-2",
                        question: "Where can I see my Sunday School attendance?",
                        answer: "More > Sunday School > My Attendance History lists every session you've been marked for, and how.",
                    },
                ],
            },
            {
                id: "profile-account",
                label: "Account & Preferences",
                icon: User,
                visible: true,
                items: [
                    {
                        id: "pr-1",
                        question: "How do I update my personal details?",
                        answer: "Tap the account icon at the top of any screen, then Edit next to Account Details. You can update your name, phone number, gender, date of birth, and marital status directly — changes save immediately.",
                    },
                    {
                        id: "pr-1b",
                        question: "How do I change the email address on my account?",
                        answer: "From the Edit Profile screen (account icon > Edit), tap Email Address. Enter your new email, and we'll send a 6-digit code to that new address to confirm you own it before the change takes effect — your old email stays active until you confirm.",
                    },
                    {
                        id: "pr-2",
                        question: "How do I turn notifications on or off?",
                        answer: "Tap the account icon at the top of any screen, then use the toggle under Notifications. If it's blocked at the device level, the same screen explains how to re-enable it for your specific phone.",
                    },
                    {
                        id: "pr-3",
                        question: "What are Birthday Wishes?",
                        answer: "Messages sent to you by other members and workers on your birthday — you'll find them under More > Birthday Wishes.",
                    },
                    {
                        id: "pr-4",
                        question: "How do I report an incident?",
                        answer: "Go to More > Incidents, describe what happened under Report an Incident, and optionally attach photos or submit anonymously. Track its status under the My Reports tab on the same page.",
                    },
                    {
                        id: "pr-5",
                        question: "How do I contact Support or Pastoral Care?",
                        answer: "Tap the account icon at the top of any screen, then Support & Pastoral Care — it opens your email app with our address and subject already filled in, ready for you to add your message.",
                    },
                    {
                        id: "pr-6",
                        question: "I see a Lead/Parish/Associate Pastor badge on my account — what does it mean?",
                        answer: "It's an informational designation set by an admin, shown alongside your role and department. It doesn't change how you log in or check in, and is separate from any Worker or Head of Department status you may also hold.",
                    },
                ],
            },
            {
                id: "worker-tools",
                label: "Worker Tools",
                icon: Briefcase,
                badge: "Workers",
                visible: isWorker,
                items: [
                    {
                        id: "wt-1",
                        question: "How do I request leave?",
                        answer: "Under More > Leave Request, apply for time off and track its approval status.",
                    },
                    {
                        id: "wt-2",
                        question: "Where's my service history?",
                        answer: "More > Service History logs every service you've served and the time you've contributed.",
                    },
                    {
                        id: "wt-3",
                        question: "How does the Prayer Roster work?",
                        answer: "Pick a programme and month, then select an open prayer meeting slot under More > Prayer Roster. Your choices appear under My Roster.",
                    },
                ],
            },
            {
                id: "leadership",
                label: "Department Leadership",
                icon: Users2,
                badge: "HOD",
                visible: isHod,
                items: [
                    {
                        id: "ld-1",
                        question: "What can I see as a Department Head?",
                        answer: "More > Dept. Summary shows active/inactive worker counts, attendance percentage, and who's on leave. More > Dept. Attendance gives you the check-in log for your whole team, service by service.",
                    },
                    {
                        id: "ld-2",
                        question: "How do Finance Requests work?",
                        answer: "From the Give tab's Finance Requests section, submit a category, reason, amount, and recipient bank details, then track each request's status.",
                    },
                ],
            },
            {
                id: "evangelism",
                label: "Evangelism",
                icon: Flame,
                visible: true,
                items: [
                    {
                        id: "evg-1",
                        question: "How do I upload a convert I met on outreach?",
                        answer: "Go to More > Evangelism > Upload, and add their name — phone and notes are optional. Any worker can do this, not just Evangelism department members.",
                    },
                    {
                        id: "evg-2",
                        question: "Who can see the Team Inbox tab?",
                        answer: "Only workers in the Evangelism department. It lists every convert with who onboarded them, who's currently assigned to follow up, and flags anyone who hasn't been contacted in over 7 days.",
                    },
                    {
                        id: "evg-3",
                        question: "What do the convert statuses mean?",
                        answer: "Unsaved → Saved → Undergoing Discipleship tracks their spiritual journey. Log a note every time you reach out.",
                    },
                    {
                        id: "evg-4",
                        question: "Can I see the full follow-up history for a convert, not just the last contact?",
                        answer: "Yes — tap History on a convert in the Team Inbox to see every logged note, newest first, with who logged it and when.",
                    },
                ],
            },
            {
                id: "follow-up",
                label: "Follow-Up",
                icon: UserPlus,
                badge: "Follow-Up",
                visible: isFollowUp,
                items: [
                    {
                        id: "fu-1",
                        question: "What is the Follow-Up tool for?",
                        answer: "More > Follow-Up tracks first-timers and the follow-up tasks assigned to you, so no one who visits gets missed. It's only visible to workers in the Follow-Up department.",
                    },
                ],
            },
            {
                id: "admin-department",
                label: "Admin Department",
                icon: UserCheck,
                badge: "Admin",
                visible: isAdminDept,
                items: [
                    {
                        id: "ad-1",
                        question: "How do I check someone in who doesn't have a phone?",
                        answer: "Go to More > Check Someone In, search for the member by name, pick the event and slot, and mark their status — only visible to workers in the Admin department.",
                    },
                    {
                        id: "ad-2",
                        question: "Can I use this to fix someone's missed attendance or restore a streak?",
                        answer: "Yes — a streak is calculated live from check-in history, so using Check Someone In to mark a missed service present restores the streak automatically. There's no separate streak-repair tool.",
                    },
                ],
            },
            {
                id: "children-church-team",
                label: "Children's Church Team",
                icon: ShieldCheck,
                badge: "CC Team",
                visible: isChildrenChurchWorker,
                items: [
                    {
                        id: "cct-1",
                        question: "How do I check a child in or out?",
                        answer: "Use the Check-In and Check-Out tabs in Children's Church to verify a guardian and log the time — these tabs only appear for Children's Church department workers.",
                    },
                    {
                        id: "cct-2",
                        question: "What is the Active Board?",
                        answer: "A live view of every child currently checked in during the service, so your team can see who's present at a glance.",
                    },
                ],
            },
            {
                id: "sunday-school-team",
                label: "Sunday School Teachers",
                icon: ShieldCheck,
                badge: "SS Team",
                visible: isSundaySchoolWorker,
                items: [
                    {
                        id: "sst-1",
                        question: "How do I run a Sunday School class?",
                        answer: "Under More > Sunday School > Teach, open a class to create sessions, open self-mark so members can check themselves in, and mark attendance yourself for anyone who couldn't.",
                    },
                    {
                        id: "sst-2",
                        question: "How do I add a member to my class?",
                        answer: "New member assignments are still handled from the admin portal. The mobile app can show and manage attendance for members already assigned to your class, but can't assign new ones yet.",
                    },
                ],
            },
        ];
        return all.filter((c) => c.visible);
    }, [isWorker, isHod, isFollowUp, isChildrenChurchWorker, isSundaySchoolWorker, isAdminDept]);

    const flatMatches = useMemo(() => {
        if (!query.trim()) return null;
        const q = query.trim().toLowerCase();
        return categories.flatMap((c) =>
            c.items
                .filter((i) => i.question.toLowerCase().includes(q) || i.answer.toLowerCase().includes(q))
                .map((i) => ({ ...i, categoryLabel: c.label }))
        );
    }, [categories, query]);

    const totalGuides = categories.reduce((sum, c) => sum + c.items.length, 0);

    return (
        <div className="min-h-screen bg-[#FFFFFF] text-[#121212] pb-32 font-sans selection:bg-[#121212] selection:text-[#FFFFFF]">

            {/* ── Hero ─────────────────────────────────────────────────── */}
            <div className="relative w-full h-[40vh] overflow-hidden">
                <Image
                    src="/images/help-backdrop.jpg"
                    alt="Guidance backdrop"
                    fill
                    priority
                    sizes="100vw"
                    className="object-cover"
                />
                <div className="absolute inset-0 bg-black/50" />
                <div className="absolute top-4 left-4 z-10">
                    <button
                        onClick={() => router.back()}
                        className="p-2.5 bg-black/25 backdrop-blur-md hover:bg-black/40 text-white rounded-full transition-colors border border-white/10"
                        aria-label="Back"
                    >
                        <ArrowLeft size={16} />
                    </button>
                </div>
                <div className="absolute bottom-0 inset-x-0 p-6">
                    <span className="text-xs uppercase tracking-widest text-white/80 font-semibold flex items-center gap-1 drop-shadow-sm">
                        <CircleHelp size={12} /> Guidance
                    </span>
                    <h1 className="text-2xl font-light tracking-tight text-white mt-1 drop-shadow-md">
                        Help &amp; Guide
                    </h1>
                    {!isLoading && (
                        <p className="text-xs text-white/70 font-light mt-1">
                            {totalGuides} guides tailored to your account
                        </p>
                    )}
                </div>
            </div>

            <div className="px-6 mt-6 max-w-md mx-auto space-y-6">

                {/* Search */}
                <div className="relative">
                    <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500" />
                    <input
                        type="text"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="Search for a topic…"
                        className="w-full bg-[#F4F1EA] border border-[#121212]/5 rounded-xl pl-9 pr-3 py-3 text-xs font-sans outline-none focus:border-[#121212]/20"
                    />
                </div>

                {isLoading ? (
                    <div className="space-y-3 animate-pulse">
                        {[1, 2, 3].map((i) => <div key={i} className="h-14 bg-gray-100 rounded-2xl" />)}
                    </div>
                ) : flatMatches ? (
                    flatMatches.length === 0 ? (
                        <p className="text-sm text-gray-500 font-light py-10 text-center">
                            No guides found for &quot;{query}&quot;.
                        </p>
                    ) : (
                        <div className="bg-white border border-[#121212]/5 rounded-2xl divide-y divide-[#121212]/5 shadow-sm overflow-hidden">
                            {flatMatches.map((item) => (
                                <div key={item.id}>
                                    <div className="px-4 pt-3">
                                        <span className="text-[9px] uppercase tracking-wider font-bold text-[#756E69]">
                                            {item.categoryLabel}
                                        </span>
                                    </div>
                                    <FaqRow item={item} active={activeId === item.id} onToggle={toggle} />
                                </div>
                            ))}
                        </div>
                    )
                ) : (
                    categories.map((cat) => (
                        <div key={cat.id} className="space-y-3">
                            <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-widest px-1 flex items-center gap-1.5">
                                <cat.icon size={12} className="text-[#756E69]" /> {cat.label}
                                {cat.badge && (
                                    <span className="text-[8px] uppercase tracking-wider font-bold bg-[#EADCC9] text-[#121212] px-1.5 py-0.5 rounded ml-1">
                                        {cat.badge}
                                    </span>
                                )}
                            </h4>
                            <div className="bg-white border border-[#121212]/5 rounded-2xl divide-y divide-[#121212]/5 shadow-sm overflow-hidden">
                                {cat.items.map((item) => (
                                    <FaqRow key={item.id} item={item} active={activeId === item.id} onToggle={toggle} />
                                ))}
                            </div>
                        </div>
                    ))
                )}

                {/* Still need help */}
                <div className="bg-[#F4F1EA]/60 border border-[#121212]/10 rounded-2xl p-5 text-center">
                    <CircleHelp size={20} className="text-[#756E69] mx-auto mb-2" />
                    <h4 className="text-sm font-medium text-[#121212] mb-1">Still need help?</h4>
                    <p className="text-xs text-gray-500 font-light">
                        Tap the account icon at the top of any screen, then Support &amp; Pastoral Care, and we&apos;ll get back to you by email.
                    </p>
                </div>
            </div>
        </div>
    );
};
