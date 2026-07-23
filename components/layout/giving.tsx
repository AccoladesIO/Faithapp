"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import {
    HeartHandshake, ShieldCheck, CheckCircle2, AlertCircle, Loader2,
    Landmark, History, Copy, Check, Upload, FileText, Download,
    Briefcase, X, Building2, ChevronDown, Target, Sparkles,
    ArrowLeft,
} from "lucide-react";
import { useProfile } from "@/hooks/use-profile";
import { useTithes, ProofStatus, TitheAccount } from "@/hooks/use-tithes";
import { useFinanceRequests, FinanceRequestStatus } from "@/hooks/use-finance-requests";
import { PledgesSection } from "@/components/layout/giving-pledges";
import { useRouter } from "next/navigation";
import { formatCurrency } from "@/utils/currency";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(iso: string): string {
    return new Date(iso.length === 10 ? `${iso}T00:00:00` : iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

function currentMonthValue(): string {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

// ─── Status pill ──────────────────────────────────────────────────────────────

function StatusPill({ status }: { status: ProofStatus | FinanceRequestStatus }) {
    const styles: Record<string, string> = {
        PENDING: "bg-amber-50 text-amber-700",
        APPROVED: "bg-green-50 text-green-700",
        REJECTED: "bg-red-50 text-red-700",
    };
    return (
        <span className={`text-[8px] tracking-wider uppercase px-1.5 py-0.5 rounded font-bold ${styles[status]}`}>
            {status}
        </span>
    );
}

// ─── Copy-to-clipboard field ───────────────────────────────────────────────────

function CopyField({ label, value }: { label: string; value: string }) {
    const [copied, setCopied] = useState(false);
    const handleCopy = () => {
        navigator.clipboard.writeText(value);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };
    return (
        <div className="flex items-center justify-between py-2">
            <div>
                <p className="text-[10px] uppercase tracking-wider text-gray-500 font-bold">{label}</p>
                <p className="text-sm font-medium text-[#121212] mt-0.5">{value}</p>
            </div>
            <button
                type="button"
                onClick={handleCopy}
                className="p-2 text-[#756E69] hover:text-[#121212] hover:bg-[#F4F1EA] rounded-lg transition-colors"
            >
                {copied ? <Check size={14} className="text-green-600" /> : <Copy size={14} />}
            </button>
        </div>
    );
}

// ─── Giving accounts (the actual accounts to give to) ──────────────────────────

export function GivingAccountsCard({ accounts }: { accounts: TitheAccount[] }) {
    const activeAccounts = accounts.filter((a) => a.isActive);
    if (activeAccounts.length === 0) return null;

    return (
        <div className="space-y-3">
            <div className="flex items-center gap-1.5 px-1">
                <Landmark size={13} className="text-[#756E69]" />
                <span className="text-xs font-semibold text-gray-500 uppercase tracking-widest">
                    {activeAccounts.length > 1 ? "Give To Any Of These Accounts" : "Give To This Account"}
                </span>
            </div>
            {/* Capped height once accounts start stacking, so the list scrolls in
                place instead of pushing the rest of the page down as accounts grow. */}
            <div className={activeAccounts.length > 2 ? "space-y-3 max-h-80 overflow-y-auto pr-1 -mr-1" : "space-y-3"}>
                {activeAccounts.map((account) => (
                    <div key={account.id} className="bg-white border border-[#121212]/10 rounded-2xl p-5 shadow-sm">
                        <div className="flex items-center justify-between mb-1">
                            <p className="text-sm font-medium text-[#121212]">{account.accountName}</p>
                            <span className="text-[9px] uppercase tracking-wider font-bold bg-[#F4F1EA] text-[#756E69] px-2 py-0.5 rounded-full">
                                {account.currency}
                            </span>
                        </div>
                        <p className="text-xs text-gray-500 font-light mb-2">{account.bankName}</p>
                        <CopyField label="Account Number" value={account.accountNumber} />
                    </div>
                ))}
            </div>
        </div>
    );
}

// ─── Virtual account card ───────────────────────────────────────────────────────

function VirtualAccountCard() {
    const { virtualAccount, isLoadingVirtualAccount, isCreatingVirtualAccount, virtualAccountError, createVirtualAccount } = useTithes();
    const [bvn, setBvn] = useState("");
    const [showBvnForm, setShowBvnForm] = useState(false);

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await createVirtualAccount(bvn);
            setShowBvnForm(false);
        } catch { /* error surfaced via hook */ }
    };

    if (isLoadingVirtualAccount) {
        return (
            <div className="bg-[#F4F1EA]/50 rounded-2xl p-5 border border-[#121212]/5 animate-pulse">
                <div className="h-3 w-32 bg-gray-200 rounded mb-3" />
                <div className="h-4 w-48 bg-gray-200 rounded mb-2" />
                <div className="h-4 w-40 bg-gray-200 rounded" />
            </div>
        );
    }

    if (virtualAccount) {
        return (
            <div className="bg-[#F4F1EA]/50 rounded-2xl p-5 border border-[#121212]/5">
                <div className="flex items-center gap-2 mb-1">
                    <Building2 size={14} className="text-[#756E69]" />
                    <span className="text-[10px] uppercase tracking-wider text-gray-500 font-bold">
                        Your Dedicated Giving Account
                    </span>
                </div>
                <p className="text-xs text-gray-500 font-light mb-2">
                    Transfer to this account anytime — it&apos;s reserved just for you.
                </p>
                <div className="divide-y divide-[#121212]/5">
                    <CopyField label="Bank" value={virtualAccount.bankName} />
                    <CopyField label="Account Number" value={virtualAccount.accountNumber} />
                    <CopyField label="Account Name" value={virtualAccount.accountName} />
                </div>
            </div>
        );
    }

    return (
        <div className={showBvnForm
            ? "bg-[#F4F1EA]/50 rounded-2xl p-5 border border-[#121212]/5"
            : "bg-[#F9F9F9] rounded-2xl p-5 border-2 border-dashed border-[#121212]/10"
        }>
            {!showBvnForm ? (
                <div className="text-center py-2">
                    <div className="inline-flex items-center gap-1 text-[9px] uppercase tracking-wider font-bold bg-[#EADCC9] text-[#121212] px-2.5 py-1 rounded-full mb-3">
                        <Sparkles size={10} /> Coming Soon
                    </div>
                    <Building2 size={20} className="text-gray-400 mx-auto mb-2" />
                    <h4 className="text-sm font-medium text-gray-500 mb-1">Dedicated Giving Account</h4>
                    <p className="text-xs text-gray-400 font-light">
                        A personal bank account number for tithes and offerings — not yet available. Use the account above for now.
                    </p>
                </div>
            ) : (
                <form onSubmit={handleCreate} className="space-y-3">
                    <div>
                        <label className="text-[10px] uppercase tracking-wider text-gray-500 font-bold block mb-1.5">
                            Bank Verification Number (BVN)
                        </label>
                        <input
                            type="text"
                            required
                            pattern="[0-9]{11}"
                            maxLength={11}
                            placeholder="11-digit BVN"
                            value={bvn}
                            onChange={(e) => setBvn(e.target.value.replace(/\D/g, ""))}
                            className="w-full bg-white border border-[#121212]/10 rounded-xl px-3 py-2.5 text-sm font-sans outline-none focus:border-[#121212]/30"
                        />
                    </div>
                    {virtualAccountError && (
                        <p className="text-xs text-red-600">{virtualAccountError}</p>
                    )}
                    <div className="flex gap-2">
                        <button
                            type="button"
                            onClick={() => setShowBvnForm(false)}
                            className="flex-1 text-xs uppercase tracking-widest font-semibold py-2.5 rounded-xl border border-[#121212]/10 text-gray-500 hover:text-[#121212] transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={isCreatingVirtualAccount || bvn.length !== 11}
                            className="flex-1 bg-[#121212] text-white text-xs uppercase tracking-widest font-semibold py-2.5 rounded-xl hover:bg-gray-800 transition-colors disabled:opacity-50 flex items-center justify-center gap-1.5"
                        >
                            {isCreatingVirtualAccount ? <Loader2 size={12} className="animate-spin" /> : null}
                            Confirm
                        </button>
                    </div>
                </form>
            )}
        </div>
    );
}

// ─── Proof of payment form ───────────────────────────────────────────────────

function ProofOfPaymentForm({ accounts }: { accounts: { id: string; accountName: string; bankName: string }[] }) {
    const { isSubmittingProof, proofError, submitProof } = useTithes();
    const [open, setOpen] = useState(false);
    const [file, setFile] = useState<File | null>(null);
    const [titheAccountId, setTitheAccountId] = useState("");
    const [amount, setAmount] = useState("");
    const [paymentDate, setPaymentDate] = useState("");
    const [reference, setReference] = useState("");
    const [success, setSuccess] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!file) return;
        try {
            await submitProof({ file, titheAccountId, amount, paymentDate, reference });
            setFile(null);
            setTitheAccountId("");
            setAmount("");
            setPaymentDate("");
            setReference("");
            setOpen(false);
            setSuccess(true);
            setTimeout(() => setSuccess(false), 3000);
        } catch { /* proofError shown in UI */ }
    };

    return (
        <div>
            {success && (
                <div className="flex items-center gap-2 bg-green-50 border border-green-100 text-green-700 px-4 py-3 rounded-xl text-xs font-medium mb-4">
                    <CheckCircle2 size={14} /> Proof of payment submitted — pending review.
                </div>
            )}

            {!open ? (
                <button
                    type="button"
                    onClick={() => setOpen(true)}
                    className="w-full flex items-center justify-center gap-2 py-3 border-2 border-dashed border-[#121212]/10 rounded-xl text-xs font-semibold uppercase tracking-widest text-[#756E69] hover:border-[#121212]/20 hover:text-[#121212] transition-all"
                >
                    <Upload size={14} /> Already Paid? Submit Proof
                </button>
            ) : (
                <form onSubmit={handleSubmit} className="bg-white border border-[#121212]/10 rounded-2xl p-5 space-y-4">
                    <div className="flex items-center justify-between">
                        <h3 className="text-sm font-semibold uppercase tracking-wider text-[#121212]">
                            Submit Proof of Payment
                        </h3>
                        <button type="button" onClick={() => setOpen(false)} className="text-gray-500 hover:text-[#121212]">
                            <X size={16} />
                        </button>
                    </div>

                    <div>
                        <label className="text-[10px] uppercase tracking-wider text-gray-500 font-bold block mb-1.5">
                            Receipt (Image or PDF, max 2MB)
                        </label>
                        <label className="flex items-center gap-2 w-full bg-[#F9F9F9] border border-dashed border-[#121212]/15 rounded-xl px-3 py-3 text-xs cursor-pointer hover:border-[#121212]/30 transition-colors">
                            <FileText size={14} className="text-[#756E69] flex-shrink-0" />
                            <span className="truncate text-gray-500">{file ? file.name : "Choose a file…"}</span>
                            <input
                                type="file"
                                required
                                accept="image/*,application/pdf"
                                onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                                className="hidden"
                            />
                        </label>
                    </div>

                    <div>
                        <label className="text-[10px] uppercase tracking-wider text-gray-500 font-bold block mb-1.5">
                            Account Paid Into
                        </label>
                        <select
                            required
                            value={titheAccountId}
                            onChange={(e) => setTitheAccountId(e.target.value)}
                            className="w-full bg-[#F9F9F9] border border-[#121212]/10 rounded-xl px-3 py-2.5 text-xs font-sans outline-none focus:border-[#121212]/30 appearance-none"
                        >
                            <option value="">-- Select account --</option>
                            {accounts.map((a) => (
                                <option key={a.id} value={a.id}>{a.accountName} — {a.bankName}</option>
                            ))}
                        </select>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="text-[10px] uppercase tracking-wider text-gray-500 font-bold block mb-1.5">Amount</label>
                            <input
                                type="number"
                                required
                                min="1"
                                step="0.01"
                                placeholder="10000"
                                value={amount}
                                onChange={(e) => setAmount(e.target.value)}
                                className="w-full bg-[#F9F9F9] border border-[#121212]/10 rounded-xl px-3 py-2.5 text-xs font-sans outline-none focus:border-[#121212]/30"
                            />
                        </div>
                        <div>
                            <label className="text-[10px] uppercase tracking-wider text-gray-500 font-bold block mb-1.5">Payment Date</label>
                            <input
                                type="date"
                                required
                                value={paymentDate}
                                onChange={(e) => setPaymentDate(e.target.value)}
                                className="w-full bg-[#F9F9F9] border border-[#121212]/10 rounded-xl px-3 py-2.5 text-xs font-sans outline-none focus:border-[#121212]/30"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="text-[10px] uppercase tracking-wider text-gray-500 font-bold block mb-1.5">
                            Transaction Reference
                        </label>
                        <input
                            type="text"
                            required
                            placeholder="TXN123456"
                            value={reference}
                            onChange={(e) => setReference(e.target.value)}
                            className="w-full bg-[#F9F9F9] border border-[#121212]/10 rounded-xl px-3 py-2.5 text-xs font-sans outline-none focus:border-[#121212]/30"
                        />
                    </div>

                    {proofError && <p className="text-xs text-red-600">{proofError}</p>}

                    <button
                        type="submit"
                        disabled={isSubmittingProof}
                        className="w-full bg-[#121212] text-white text-xs uppercase tracking-widest font-semibold py-3 rounded-xl hover:bg-gray-800 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                        {isSubmittingProof ? <Loader2 size={13} className="animate-spin" /> : null}
                        Submit Proof
                    </button>
                </form>
            )}
        </div>
    );
}

// ─── Tithe statement email ──────────────────────────────────────────────────

function TitheStatementEmail() {
    const { isSendingStatement, emailTitheStatement } = useTithes();
    const [fromMonth, setFromMonth] = useState(currentMonthValue());
    const [toMonth, setToMonth] = useState(currentMonthValue());
    const [message, setMessage] = useState<string | null>(null);

    const handleSend = async () => {
        try {
            const msg = await emailTitheStatement(fromMonth, toMonth);
            setMessage(msg);
            setTimeout(() => setMessage(null), 4000);
        } catch {
            setMessage("Could not send statement. Please try again.");
        }
    };

    return (
        <div className="bg-white border border-[#121212]/5 rounded-2xl p-4 shadow-sm">
            <div className="flex items-center gap-2 mb-3">
                <Download size={14} className="text-[#756E69]" />
                <span className="text-xs font-semibold uppercase tracking-wider text-[#121212]">
                    Email My Tithe Statement
                </span>
            </div>
            <div className="grid grid-cols-2 gap-3 mb-3">
                <div>
                    <label className="text-[10px] uppercase tracking-wider text-gray-500 font-bold block mb-1">From</label>
                    <input
                        type="month"
                        value={fromMonth}
                        onChange={(e) => setFromMonth(e.target.value)}
                        className="w-full bg-[#F9F9F9] border border-[#121212]/10 rounded-lg px-2.5 py-2 text-xs outline-none focus:border-[#121212]/30"
                    />
                </div>
                <div>
                    <label className="text-[10px] uppercase tracking-wider text-gray-500 font-bold block mb-1">To</label>
                    <input
                        type="month"
                        value={toMonth}
                        min={fromMonth}
                        onChange={(e) => setToMonth(e.target.value)}
                        className="w-full bg-[#F9F9F9] border border-[#121212]/10 rounded-lg px-2.5 py-2 text-xs outline-none focus:border-[#121212]/30"
                    />
                </div>
            </div>
            {message && <p className="text-xs text-green-600 mb-2">{message}</p>}
            <button
                type="button"
                onClick={handleSend}
                disabled={isSendingStatement}
                className="w-full bg-[#F4F1EA] text-[#121212] text-xs uppercase tracking-widest font-semibold py-2.5 rounded-xl hover:bg-[#EADCC9] transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
                {isSendingStatement ? <Loader2 size={12} className="animate-spin" /> : null}
                Send to My Email
            </button>
        </div>
    );
}

// ─── Finance request form (worker only) ──────────────────────────────────────

function FinanceRequestForm({ departmentId, onClose }: { departmentId: string; onClose: () => void }) {
    const { categories, isSubmitting, submitError, createRequest } = useFinanceRequests();
    const [categoryId, setCategoryId] = useState("");
    const [reason, setReason] = useState("");
    const [amount, setAmount] = useState("");
    const [bankName, setBankName] = useState("");
    const [accountNumber, setAccountNumber] = useState("");
    const [accountName, setAccountName] = useState("");
    const [attachment, setAttachment] = useState<File | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await createRequest({
                categoryId,
                departmentId,
                reason,
                amount,
                recipientBankName: bankName,
                recipientAccountNumber: accountNumber,
                recipientAccountName: accountName,
                attachment: attachment ?? undefined,
            });
            onClose();
        } catch { /* submitError shown in UI */ }
    };

    return (
        <form onSubmit={handleSubmit} className="bg-white border border-[#121212]/10 rounded-2xl p-5 space-y-4">
            <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold uppercase tracking-wider text-[#121212]">
                    New Finance Request
                </h3>
                <button type="button" onClick={onClose} className="text-gray-500 hover:text-[#121212]">
                    <X size={16} />
                </button>
            </div>

            <div>
                <label className="text-[10px] uppercase tracking-wider text-gray-500 font-bold block mb-1.5">Category</label>
                <select
                    required
                    value={categoryId}
                    onChange={(e) => setCategoryId(e.target.value)}
                    className="w-full bg-[#F9F9F9] border border-[#121212]/10 rounded-xl px-3 py-2.5 text-xs font-sans outline-none focus:border-[#121212]/30 appearance-none"
                >
                    <option value="">-- Select category --</option>
                    {categories.filter((c) => c.isActive).map((c) => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                </select>
            </div>

            <div>
                <label className="text-[10px] uppercase tracking-wider text-gray-500 font-bold block mb-1.5">Reason</label>
                <textarea
                    required
                    rows={2}
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    placeholder="Purchase of new projector for services"
                    className="w-full bg-[#F9F9F9] border border-[#121212]/10 rounded-xl p-3 text-xs font-sans outline-none resize-none focus:border-[#121212]/30"
                />
            </div>

            <div>
                <label className="text-[10px] uppercase tracking-wider text-gray-500 font-bold block mb-1.5">Amount</label>
                <input
                    type="number"
                    required
                    min="1"
                    step="0.01"
                    placeholder="150000"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="w-full bg-[#F9F9F9] border border-[#121212]/10 rounded-xl px-3 py-2.5 text-xs font-sans outline-none focus:border-[#121212]/30"
                />
            </div>

            <div className="grid grid-cols-2 gap-3">
                <div>
                    <label className="text-[10px] uppercase tracking-wider text-gray-500 font-bold block mb-1.5">Bank Name</label>
                    <input
                        type="text"
                        required
                        placeholder="First Bank"
                        value={bankName}
                        onChange={(e) => setBankName(e.target.value)}
                        className="w-full bg-[#F9F9F9] border border-[#121212]/10 rounded-xl px-3 py-2.5 text-xs font-sans outline-none focus:border-[#121212]/30"
                    />
                </div>
                <div>
                    <label className="text-[10px] uppercase tracking-wider text-gray-500 font-bold block mb-1.5">Account Number</label>
                    <input
                        type="text"
                        required
                        placeholder="1234567890"
                        value={accountNumber}
                        onChange={(e) => setAccountNumber(e.target.value)}
                        className="w-full bg-[#F9F9F9] border border-[#121212]/10 rounded-xl px-3 py-2.5 text-xs font-sans outline-none focus:border-[#121212]/30"
                    />
                </div>
            </div>

            <div>
                <label className="text-[10px] uppercase tracking-wider text-gray-500 font-bold block mb-1.5">Recipient Account Name</label>
                <input
                    type="text"
                    required
                    placeholder="ABC Suppliers Ltd"
                    value={accountName}
                    onChange={(e) => setAccountName(e.target.value)}
                    className="w-full bg-[#F9F9F9] border border-[#121212]/10 rounded-xl px-3 py-2.5 text-xs font-sans outline-none focus:border-[#121212]/30"
                />
            </div>

            <div>
                <label className="text-[10px] uppercase tracking-wider text-gray-500 font-bold block mb-1.5">
                    Attachment (Optional — budget/invoice)
                </label>
                <label className="flex items-center gap-2 w-full bg-[#F9F9F9] border border-dashed border-[#121212]/15 rounded-xl px-3 py-3 text-xs cursor-pointer hover:border-[#121212]/30 transition-colors">
                    <FileText size={14} className="text-[#756E69] flex-shrink-0" />
                    <span className="truncate text-gray-500">{attachment ? attachment.name : "Choose a file…"}</span>
                    <input
                        type="file"
                        accept="image/*,application/pdf"
                        onChange={(e) => setAttachment(e.target.files?.[0] ?? null)}
                        className="hidden"
                    />
                </label>
            </div>

            {submitError && <p className="text-xs text-red-600">{submitError}</p>}

            <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-[#121212] text-white text-xs uppercase tracking-widest font-semibold py-3 rounded-xl hover:bg-gray-800 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
                {isSubmitting ? <Loader2 size={13} className="animate-spin" /> : null}
                Submit Request
            </button>
        </form>
    );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export const GivingPage = () => {
    const { profile } = useProfile();
    const router = useRouter();
    const isWorker = profile?.isHod;
    const departmentId = profile?.workerProfile?.department?.id;

    const { accounts, history, proofs, isLoading, error } = useTithes();
    const { requests, isLoading: financeLoading } = useFinanceRequests();

    const [activeTab, setActiveTab] = useState<"give" | "pledges" | "finance">("give");
    const [showFinanceForm, setShowFinanceForm] = useState(false);

    return (
        <div className="min-h-screen bg-[#FFFFFF] text-[#121212] pb-32 font-sans selection:bg-[#121212] selection:text-[#FFFFFF]">

            {/* ── Hero ─────────────────────────────────────────────────── */}
            <div className="relative w-full h-[40vh] overflow-hidden">
                <Image
                    src="/images/giving-backdrop.jpg"
                    alt="Giving backdrop"
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
                        aria-label="Back to home"
                    >
                        <ArrowLeft size={16} />
                    </button>
                </div>
                <div className="absolute bottom-0 inset-x-0 p-6 b">
                    <span className="text-xs uppercase tracking-widest text-white/80 font-semibold flex items-center gap-1 drop-shadow-sm">
                        <HeartHandshake size={12} /> Stewardship
                    </span>
                    <h1 className="text-2xl font-light tracking-tight text-white mt-1 drop-shadow-md">
                        Giving & Finance
                    </h1>
                </div>
            </div>

            {/* ── Tab switch ─────────────────────────────────────────────── */}
            <div className="px-6 mt-6 max-w-md mx-auto">
                <div className="flex bg-[#F4F1EA] p-1 rounded-xl">
                    <button
                        onClick={() => setActiveTab("give")}
                        className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-semibold uppercase tracking-wider rounded-lg transition-colors ${activeTab === "give" ? "bg-[#121212] text-white" : "text-[#756E69] hover:text-[#121212]"}`}
                    >
                        <HeartHandshake size={13} /> Give
                    </button>
                    <button
                        onClick={() => setActiveTab("pledges")}
                        className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-semibold uppercase tracking-wider rounded-lg transition-colors ${activeTab === "pledges" ? "bg-[#121212] text-white" : "text-[#756E69] hover:text-[#121212]"}`}
                    >
                        <Target size={13} /> Pledges
                    </button>
                    {isWorker && (
                        <button
                            onClick={() => setActiveTab("finance")}
                            className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-semibold uppercase tracking-wider rounded-lg transition-colors ${activeTab === "finance" ? "bg-[#121212] text-white" : "text-[#756E69] hover:text-[#121212]"}`}
                        >
                            <Briefcase size={13} /> Finance Requests
                        </button>
                    )}
                </div>
            </div>

            {/* ── GIVE TAB ───────────────────────────────────────────────── */}
            {activeTab === "give" && (
                <div className="px-6 mt-8 max-w-md mx-auto space-y-6">

                    {error && (
                        <div className="flex items-center gap-2 bg-red-50 border border-red-100 text-red-600 px-4 py-3 rounded-xl text-xs font-medium">
                            <AlertCircle size={14} /> {error}
                        </div>
                    )}

                    {/* Accounts to give to */}
                    <GivingAccountsCard accounts={accounts} />

                    {/* Proof of payment */}
                    <ProofOfPaymentForm accounts={accounts} />

                    {/* Tithe statement email */}
                    <TitheStatementEmail />

                    {/* Virtual account — not yet implemented, de-emphasized */}
                    <VirtualAccountCard />

                    {/* <p className="text-[11px] text-gray-500 font-light text-center flex items-center justify-center gap-1">
                        <ShieldCheck size={12} className="text-green-600" /> Bank-grade processing • Secure Ledger
                    </p> */}

                    {/* Pending proofs */}
                    {proofs.length > 0 && (
                        <div className="space-y-3">
                            <span className="text-xs font-semibold text-gray-500 uppercase tracking-widest px-1">
                                Submitted Proofs
                            </span>
                            {proofs.map((p) => (
                                <div key={p.id} className="bg-white border border-[#121212]/5 p-4 shadow-sm flex items-center justify-between">
                                    <div>
                                        <div className="flex items-center gap-1.5">
                                            <h4 className="text-sm font-medium text-[#121212]">{formatCurrency(p.amount)}</h4>
                                            <StatusPill status={p.status} />
                                        </div>
                                        <p className="text-[10px] text-gray-500 font-light mt-0.5">
                                            Submitted {formatDate(p.createdAt)}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* History */}
                    <div className="space-y-3">
                        <div className="flex justify-between items-center px-1">
                            <span className="text-xs font-semibold text-gray-500 uppercase tracking-widest flex items-center gap-1">
                                <History size={12} /> Tithe History
                            </span>
                        </div>

                        {isLoading ? (
                            <div className="space-y-2.5">
                                {[1, 2].map((i) => (
                                    <div key={i} className="bg-white border border-[#121212]/5 p-4 h-16 animate-pulse" />
                                ))}
                            </div>
                        ) : history.length === 0 ? (
                            <p className="text-sm text-gray-500 font-light py-6 text-center">No giving records yet.</p>
                        ) : (
                            <div className="space-y-2.5">
                                {history.map((log) => (
                                    <div key={log.id} className="bg-white border border-[#121212]/5 p-4 shadow-sm flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 bg-[#F4F1EA] flex items-center justify-center text-[#756E69]">
                                                <Landmark size={18} />
                                            </div>
                                            <div>
                                                <h4 className="text-sm font-medium text-[#121212]">
                                                    {log.batch?.titheAccount?.accountName ?? log.bankName ?? "Manual Payment"}
                                                </h4>
                                                <p className="text-[10px] text-gray-500 font-light mt-0.5">
                                                    {formatDate(log.paymentDate)}
                                                </p>
                                            </div>
                                        </div>
                                        <span className="text-sm font-bold text-[#121212]">
                                            +{formatCurrency(log.amount)}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* ── PLEDGES TAB ────────────────────────────────────────────── */}
            {activeTab === "pledges" && (
                <div className="px-6 mt-8 max-w-md mx-auto">
                    <PledgesSection />
                </div>
            )}

            {/* ── FINANCE TAB (worker only) ─────────────────────────────── */}
            {activeTab === "finance" && isWorker && (
                <div className="px-6 mt-8 max-w-md mx-auto space-y-6">

                    {!showFinanceForm ? (
                        <button
                            type="button"
                            onClick={() => setShowFinanceForm(true)}
                            disabled={!departmentId}
                            className="w-full flex items-center justify-center gap-2 py-3 border-2 border-dashed border-[#121212]/10 rounded-xl text-xs font-semibold uppercase tracking-widest text-[#756E69] hover:border-[#121212]/20 hover:text-[#121212] transition-all disabled:opacity-50"
                        >
                            <Briefcase size={14} /> New Finance Request
                        </button>
                    ) : departmentId ? (
                        <FinanceRequestForm departmentId={departmentId} onClose={() => setShowFinanceForm(false)} />
                    ) : null}

                    <div className="space-y-3">
                        <span className="text-xs font-semibold text-gray-500 uppercase tracking-widest px-1">
                            My Requests
                        </span>

                        {financeLoading ? (
                            <div className="space-y-2.5">
                                {[1, 2].map((i) => (
                                    <div key={i} className="bg-white border border-[#121212]/5 p-4 h-20 animate-pulse" />
                                ))}
                            </div>
                        ) : requests.length === 0 ? (
                            <p className="text-sm text-gray-500 font-light py-6 text-center">No finance requests yet.</p>
                        ) : (
                            <div className="space-y-2.5">
                                {requests.map((req) => (
                                    <div key={req.id} className="bg-white border border-[#121212]/5 p-4 shadow-sm">
                                        <div className="flex items-center justify-between mb-1.5">
                                            <div className="flex items-center gap-1.5">
                                                <h4 className="text-sm font-medium text-[#121212]">{req.category.name}</h4>
                                                <StatusPill status={req.status} />
                                            </div>
                                            <span className="text-sm font-bold text-[#121212]">{formatCurrency(req.amount)}</span>
                                        </div>
                                        <p className="text-xs text-gray-500 font-light line-clamp-2 mb-1">{req.reason}</p>
                                        <p className="text-[10px] text-gray-500 font-light">
                                            {req.department.name} • {formatDate(req.createdAt)}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};