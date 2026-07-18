"use client";

import React, { useState } from "react";
import {
    Target, Loader2, AlertCircle, CheckCircle2, X, Mail, Clock, XCircle,
    ChevronDown, Banknote,
} from "lucide-react";
import {
    usePledges, usePledgeContributions, PledgeFrequency, PledgeStatus,
    PledgeContributionStatus, PledgeCampaign, GivingSummary, MyPledge,
} from "@/hooks/use-pledges";
import { formatCurrency } from "@/utils/currency";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(iso: string): string {
    return new Date(iso + "T00:00:00").toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

const FREQUENCY_LABELS: Record<PledgeFrequency, string> = {
    ONE_OFF: "One-Off",
    MONTHLY: "Monthly",
    QUARTERLY: "Quarterly",
};

// ─── Pledge status badge ──────────────────────────────────────────────────────

function PledgeStatusBadge({ status }: { status: PledgeStatus }) {
    switch (status) {
        case "ACTIVE":
            return <span className="flex items-center gap-1 text-[8px] uppercase tracking-wider font-bold bg-amber-50 text-amber-700 px-1.5 py-0.5 rounded"><Clock size={9} /> Active</span>;
        case "COMPLETED":
            return <span className="flex items-center gap-1 text-[8px] uppercase tracking-wider font-bold bg-green-50 text-green-700 px-1.5 py-0.5 rounded"><CheckCircle2 size={9} /> Completed</span>;
        case "CANCELLED":
            return <span className="flex items-center gap-1 text-[8px] uppercase tracking-wider font-bold bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded"><XCircle size={9} /> Cancelled</span>;
    }
}

function ContributionStatusBadge({ status }: { status: PledgeContributionStatus }) {
    switch (status) {
        case "PENDING":
            return <span className="flex items-center gap-1 text-[8px] uppercase tracking-wider font-bold bg-amber-50 text-amber-700 px-1.5 py-0.5 rounded"><Clock size={9} /> Pending Review</span>;
        case "CONFIRMED":
            return <span className="flex items-center gap-1 text-[8px] uppercase tracking-wider font-bold bg-green-50 text-green-700 px-1.5 py-0.5 rounded"><CheckCircle2 size={9} /> Confirmed</span>;
        case "DECLINED":
            return <span className="flex items-center gap-1 text-[8px] uppercase tracking-wider font-bold bg-red-50 text-red-600 px-1.5 py-0.5 rounded"><XCircle size={9} /> Declined</span>;
    }
}

// ─── Giving summary card ──────────────────────────────────────────────────────

function GivingSummaryCard({ summary }: { summary: GivingSummary }) {
    return (
        <div className="bg-white border border-[#121212]/5 shadow-sm p-4 space-y-2.5 text-xs divide-y divide-[#121212]/5">
            <div className="flex justify-between py-2.5 first:pt-0">
                <span className="text-gray-500 font-light">YTD Tithes ({summary.year})</span>
                <span className="font-medium text-[#121212]">{formatCurrency(summary.ytdTithes)} · {summary.ytdTitheCount}x</span>
            </div>
            <div className="flex justify-between py-2.5">
                <span className="text-gray-500 font-light">Last Gift</span>
                <span className="font-medium text-[#121212]">
                    {summary.lastTithe ? `${formatCurrency(summary.lastTithe.amount)} · ${formatDate(summary.lastTithe.date)}` : "—"}
                </span>
            </div>
            <div className="flex justify-between py-2.5 last:pb-0">
                <span className="text-gray-500 font-light">Total Pledged (Active)</span>
                <span className="font-medium text-[#121212]">{formatCurrency(summary.totalPledged)}</span>
            </div>
        </div>
    );
}

// ─── Make pledge form ─────────────────────────────────────────────────────────

function MakePledgeForm({ campaign, onClose, onMade }: { campaign: PledgeCampaign; onClose: () => void; onMade: () => void }) {
    const { isMakingPledge, pledgeError, makePledge } = usePledges();
    const [totalAmount, setTotalAmount] = useState("");
    const [frequency, setFrequency] = useState<PledgeFrequency>("MONTHLY");
    const [startDate, setStartDate] = useState("");
    const [notes, setNotes] = useState("");

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await makePledge({
                campaignId: campaign.id,
                totalAmount: Number(totalAmount),
                frequency,
                startDate,
                notes: notes || undefined,
            });
            onMade();
            onClose();
        } catch { /* pledgeError shown in UI */ }
    };

    return (
        <form onSubmit={handleSubmit} className="bg-white border border-[#121212]/10 rounded-2xl p-5 space-y-4 mt-3">
            <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold uppercase tracking-wider text-[#121212]">
                    Pledge to {campaign.name}
                </h3>
                <button type="button" onClick={onClose} className="text-gray-500 hover:text-[#121212]">
                    <X size={16} />
                </button>
            </div>

            <div>
                <label className="text-[10px] uppercase tracking-wider text-gray-500 font-bold block mb-1.5">Total Amount</label>
                <input
                    type="number"
                    required
                    min="1"
                    step="0.01"
                    placeholder="100000"
                    value={totalAmount}
                    onChange={(e) => setTotalAmount(e.target.value)}
                    className="w-full bg-[#F9F9F9] border border-[#121212]/10 rounded-xl px-3 py-2.5 text-xs font-sans outline-none focus:border-[#121212]/30"
                />
            </div>

            <div>
                <label className="text-[10px] uppercase tracking-wider text-gray-500 font-bold block mb-1.5">Frequency</label>
                <div className="flex bg-[#F4F1EA] p-1 rounded-xl">
                    {(Object.keys(FREQUENCY_LABELS) as PledgeFrequency[]).map((f) => (
                        <button
                            key={f}
                            type="button"
                            onClick={() => setFrequency(f)}
                            className={`flex-1 py-2 text-[10px] font-semibold uppercase tracking-wider rounded-lg transition-colors ${frequency === f ? "bg-[#121212] text-white" : "text-[#756E69] hover:text-[#121212]"}`}
                        >
                            {FREQUENCY_LABELS[f]}
                        </button>
                    ))}
                </div>
            </div>

            <div>
                <label className="text-[10px] uppercase tracking-wider text-gray-500 font-bold block mb-1.5">{frequency === "ONE_OFF" ? "Day to Redeem" : "Start Date"}</label>
                <input
                    type="date"
                    required
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full bg-[#F9F9F9] border border-[#121212]/10 rounded-xl px-3 py-2.5 text-xs font-sans outline-none focus:border-[#121212]/30"
                />
            </div>

            <div>
                <label className="text-[10px] uppercase tracking-wider text-gray-500 font-bold block mb-1.5">Notes (Optional)</label>
                <textarea
                    rows={2}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="I commit to this campaign"
                    className="w-full bg-[#F9F9F9] border border-[#121212]/10 rounded-xl p-3 text-xs font-sans outline-none resize-none focus:border-[#121212]/30"
                />
            </div>

            {pledgeError && <p className="text-xs text-red-600">{pledgeError}</p>}

            <button
                type="submit"
                disabled={isMakingPledge}
                className="w-full bg-[#121212] text-white text-xs uppercase tracking-widest font-semibold py-3 rounded-xl hover:bg-gray-800 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
                {isMakingPledge ? <Loader2 size={13} className="animate-spin" /> : null}
                Make Pledge
            </button>
        </form>
    );
}

// ─── Campaign row ─────────────────────────────────────────────────────────────

function CampaignRow({ campaign, onPledgeMade }: { campaign: PledgeCampaign; onPledgeMade: () => void }) {
    const [open, setOpen] = useState(false);
    const pct = campaign.targetAmount > 0
        ? Math.min(100, Math.round((campaign.totalPledged / campaign.targetAmount) * 100))
        : 0;

    return (
        <div className="bg-white border border-[#121212]/5 p-4 shadow-sm">
            <div className="flex items-center justify-between mb-1">
                <h4 className="text-sm font-medium text-[#121212]">{campaign.name}</h4>
                <span className="text-[10px] text-gray-500 font-light">{formatDate(campaign.endDate)}</span>
            </div>
            {campaign.fundName && (
                <p className="text-[10px] text-gray-500 font-light mb-2">{campaign.fundName}</p>
            )}
            <div className="h-1.5 bg-[#F4F1EA] rounded-full overflow-hidden mb-1.5">
                <div className="h-full bg-[#121212] rounded-full" style={{ width: `${pct}%` }} />
            </div>
            <div className="flex justify-between text-[10px] text-gray-500 font-light mb-1">
                <span>{formatCurrency(campaign.totalPledged)} pledged</span>
                <span>{formatCurrency(campaign.targetAmount)} goal</span>
            </div>
            <div className="flex justify-between text-[10px] text-green-700 font-light mb-3">
                <span>{formatCurrency(campaign.totalPaid)} actually given</span>
            </div>

            {!open ? (
                <button
                    type="button"
                    onClick={() => setOpen(true)}
                    className="w-full flex items-center justify-center gap-2 py-2.5 border-2 border-dashed border-[#121212]/10 rounded-xl text-xs font-semibold uppercase tracking-widest text-[#756E69] hover:border-[#121212]/20 hover:text-[#121212] transition-all"
                >
                    <Target size={13} /> Make a Pledge
                </button>
            ) : (
                <MakePledgeForm campaign={campaign} onClose={() => setOpen(false)} onMade={onPledgeMade} />
            )}
        </div>
    );
}

// ─── Log a payment form ───────────────────────────────────────────────────────

function LogPaymentForm({ pledgeId, onClose, onLogged }: { pledgeId: string; onClose: () => void; onLogged: () => void }) {
    const { isMakingPledge, pledgeError, submitContribution } = usePledges();
    const [amount, setAmount] = useState("");
    const [paymentDate, setPaymentDate] = useState("");
    const [reference, setReference] = useState("");

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await submitContribution(pledgeId, {
                amount: Number(amount),
                paymentDate,
                reference: reference || undefined,
            });
            onLogged();
            onClose();
        } catch { /* pledgeError shown in UI */ }
    };

    return (
        <form onSubmit={handleSubmit} className="bg-[#F9F9F9] border border-[#121212]/10 rounded-xl p-4 space-y-3 mt-3">
            <div className="flex items-center justify-between">
                <h5 className="text-xs font-semibold uppercase tracking-wider text-[#121212]">Log a Payment</h5>
                <button type="button" onClick={onClose} className="text-gray-500 hover:text-[#121212]">
                    <X size={14} />
                </button>
            </div>

            <div className="grid grid-cols-2 gap-3">
                <div>
                    <label className="text-[10px] uppercase tracking-wider text-gray-500 font-bold block mb-1.5">Amount</label>
                    <input
                        type="number"
                        required
                        min="1"
                        step="0.01"
                        placeholder="41667"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        className="w-full bg-white border border-[#121212]/10 rounded-xl px-3 py-2.5 text-xs font-sans outline-none focus:border-[#121212]/30"
                    />
                </div>
                <div>
                    <label className="text-[10px] uppercase tracking-wider text-gray-500 font-bold block mb-1.5">Payment Date</label>
                    <input
                        type="date"
                        required
                        value={paymentDate}
                        onChange={(e) => setPaymentDate(e.target.value)}
                        className="w-full bg-white border border-[#121212]/10 rounded-xl px-3 py-2.5 text-xs font-sans outline-none focus:border-[#121212]/30"
                    />
                </div>
            </div>

            <div>
                <label className="text-[10px] uppercase tracking-wider text-gray-500 font-bold block mb-1.5">Reference (Optional)</label>
                <input
                    type="text"
                    placeholder="TXN123456"
                    value={reference}
                    onChange={(e) => setReference(e.target.value)}
                    className="w-full bg-white border border-[#121212]/10 rounded-xl px-3 py-2.5 text-xs font-sans outline-none focus:border-[#121212]/30"
                />
            </div>

            {pledgeError && <p className="text-xs text-red-600">{pledgeError}</p>}

            <button
                type="submit"
                disabled={isMakingPledge}
                className="w-full bg-[#121212] text-white text-xs uppercase tracking-widest font-semibold py-2.5 rounded-xl hover:bg-gray-800 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
                {isMakingPledge ? <Loader2 size={12} className="animate-spin" /> : null}
                Submit
            </button>
        </form>
    );
}

// ─── Contribution history (lazy-fetched on expand) ─────────────────────────────

function ContributionHistory({ pledgeId }: { pledgeId: string }) {
    const { contributions, isLoading, error } = usePledgeContributions(pledgeId);

    if (isLoading) {
        return <div className="h-10 bg-[#F4F1EA] rounded-lg animate-pulse mt-3" />;
    }
    if (error) {
        return <p className="text-xs text-red-600 mt-3">{error}</p>;
    }
    if (contributions.length === 0) {
        return <p className="text-[10px] text-gray-500 font-light mt-3">No payments logged yet.</p>;
    }

    return (
        <div className="space-y-2 mt-3">
            {contributions.map((c) => (
                <div key={c.id} className="flex items-center justify-between bg-[#F9F9F9] rounded-lg px-3 py-2">
                    <div>
                        <div className="flex items-center gap-1.5">
                            <span className="text-xs font-medium text-[#121212]">{formatCurrency(c.amount)}</span>
                            <ContributionStatusBadge status={c.status} />
                        </div>
                        <p className="text-[10px] text-gray-500 font-light mt-0.5">{formatDate(c.paymentDate)}</p>
                        {c.status === "DECLINED" && c.financeNote && (
                            <p className="text-[10px] text-red-600 font-light mt-0.5">{c.financeNote}</p>
                        )}
                    </div>
                </div>
            ))}
        </div>
    );
}

// ─── My pledge row ────────────────────────────────────────────────────────────

function MyPledgeRow({ pledge, onPaymentLogged }: { pledge: MyPledge; onPaymentLogged: () => void }) {
    const [expanded, setExpanded] = useState(false);
    const [showLogForm, setShowLogForm] = useState(false);
    const totalAmount = parseFloat(pledge.totalAmount);
    const pct = totalAmount > 0
        ? Math.min(100, Math.round((pledge.amountPaid / totalAmount) * 100))
        : 0;

    return (
        <div className="bg-white border border-[#121212]/5 p-4 shadow-sm">
            <button
                type="button"
                onClick={() => setExpanded((v) => !v)}
                className="w-full text-left"
            >
                <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-1.5">
                        <h4 className="text-sm font-medium text-[#121212]">{pledge.campaign?.name ?? "Pledge"}</h4>
                        <PledgeStatusBadge status={pledge.status} />
                    </div>
                    <div className="flex items-center gap-1.5">
                        <span className="text-sm font-bold text-[#121212]">{formatCurrency(pledge.totalAmount)}</span>
                        <ChevronDown size={14} className={`text-gray-500 transition-transform ${expanded ? "rotate-180" : ""}`} />
                    </div>
                </div>
                <p className="text-[10px] text-gray-500 font-light mb-2">
                    {FREQUENCY_LABELS[pledge.frequency]} · {pledge.frequency === "ONE_OFF" ? "Redeem by" : "Since"} {formatDate(pledge.startDate)}
                </p>
                <div className="h-1.5 bg-[#F4F1EA] rounded-full overflow-hidden mb-1">
                    <div className="h-full bg-green-600 rounded-full" style={{ width: `${pct}%` }} />
                </div>
                <p className="text-[10px] text-green-700 font-light">{formatCurrency(pledge.amountPaid)} paid of {formatCurrency(pledge.totalAmount)}</p>
            </button>

            {expanded && (
                <div className="mt-3 pt-3 border-t border-[#121212]/5">
                    {pledge.status === "ACTIVE" && (
                        !showLogForm ? (
                            <button
                                type="button"
                                onClick={() => setShowLogForm(true)}
                                className="w-full flex items-center justify-center gap-2 py-2.5 border-2 border-dashed border-[#121212]/10 rounded-xl text-xs font-semibold uppercase tracking-widest text-[#756E69] hover:border-[#121212]/20 hover:text-[#121212] transition-all"
                            >
                                <Banknote size={13} /> Log a Payment
                            </button>
                        ) : (
                            <LogPaymentForm
                                pledgeId={pledge.id}
                                onClose={() => setShowLogForm(false)}
                                onLogged={onPaymentLogged}
                            />
                        )
                    )}
                    <ContributionHistory pledgeId={pledge.id} />
                </div>
            )}
        </div>
    );
}

// ─── Section ──────────────────────────────────────────────────────────────────

export function PledgesSection() {
    const {
        campaigns, myPledges, summary, isLoading, error,
        isRequestingStatement, requestGivingStatement, refetch,
    } = usePledges();
    const [statementMessage, setStatementMessage] = useState<string | null>(null);

    const handleStatement = async () => {
        try {
            const msg = await requestGivingStatement();
            setStatementMessage(msg);
            setTimeout(() => setStatementMessage(null), 4000);
        } catch {
            setStatementMessage("Could not send statement. Please try again.");
        }
    };

    return (
        <div className="space-y-6">
            {error && (
                <div className="flex items-center gap-2 bg-red-50 border border-red-100 text-red-600 px-4 py-3 rounded-xl text-xs font-medium">
                    <AlertCircle size={14} /> {error}
                </div>
            )}

            {summary && <GivingSummaryCard summary={summary} />}

            <div className="space-y-3">
                <span className="text-xs font-semibold text-gray-500 uppercase tracking-widest px-1">
                    Active Campaigns
                </span>
                {isLoading ? (
                    <div className="space-y-2.5">
                        {[1, 2].map((i) => (
                            <div key={i} className="bg-white border border-[#121212]/5 p-4 h-28 animate-pulse" />
                        ))}
                    </div>
                ) : campaigns.length === 0 ? (
                    <p className="text-sm text-gray-500 font-light py-6 text-center">No active pledge campaigns right now.</p>
                ) : (
                    <div className="space-y-2.5">
                        {campaigns.map((c) => (
                            <CampaignRow key={c.id} campaign={c} onPledgeMade={refetch} />
                        ))}
                    </div>
                )}
            </div>

            <div className="space-y-3">
                <span className="text-xs font-semibold text-gray-500 uppercase tracking-widest px-1">
                    My Pledges
                </span>
                {isLoading ? (
                    <div className="space-y-2.5">
                        {[1, 2].map((i) => (
                            <div key={i} className="bg-white border border-[#121212]/5 p-4 h-16 animate-pulse" />
                        ))}
                    </div>
                ) : myPledges.length === 0 ? (
                    <p className="text-sm text-gray-500 font-light py-6 text-center">You haven&apos;t made any pledges yet.</p>
                ) : (
                    <div className="space-y-2.5">
                        {myPledges.map((p) => (
                            <MyPledgeRow key={p.id} pledge={p} onPaymentLogged={refetch} />
                        ))}
                    </div>
                )}
            </div>

            <div className="bg-white border border-[#121212]/5 rounded-2xl p-4 shadow-sm">
                <div className="flex items-center gap-2 mb-3">
                    <Mail size={14} className="text-[#756E69]" />
                    <span className="text-xs font-semibold uppercase tracking-wider text-[#121212]">
                        Email My Giving Statement
                    </span>
                </div>
                {statementMessage && <p className="text-xs text-green-600 mb-2">{statementMessage}</p>}
                <button
                    type="button"
                    onClick={handleStatement}
                    disabled={isRequestingStatement}
                    className="w-full bg-[#F4F1EA] text-[#121212] text-xs uppercase tracking-widest font-semibold py-2.5 rounded-xl hover:bg-[#EADCC9] transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                    {isRequestingStatement ? <Loader2 size={12} className="animate-spin" /> : null}
                    Send to My Email
                </button>
            </div>
        </div>
    );
}
