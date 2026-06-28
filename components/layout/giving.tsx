"use client"

import React, { useState } from 'react';
import { HeartHandshake, CreditCard, ShieldCheck, CheckCircle2, AlertCircle, Loader2, Landmark, History } from 'lucide-react';

type GivingCategory = 'Tithe' | 'Offering' | 'Donation';
type TransactionStatus = 'Pending' | 'Success' | 'Failed';

interface GivingTransaction {
    id: string;
    userId: string | null;
    paymentReference: string;
    amount: number;
    category: GivingCategory;
    status: TransactionStatus;
    transactionDate: string;
}

const PAST_GIVING_HISTORY: GivingTransaction[] = [
    {
        id: 'tx-9921',
        userId: 'current-user-id',
        paymentReference: 'ch_3Mv8x1Lkd0s921a',
        amount: 150.00,
        category: 'Tithe',
        status: 'Success',
        transactionDate: 'Sun, Jun 7'
    },
    {
        id: 'tx-9914',
        userId: null,
        paymentReference: 'ch_3Mv5u2Lkd0s543b',
        amount: 50.00,
        category: 'Offering',
        status: 'Success',
        transactionDate: 'Sun, May 31'
    }
];

export const GivingPage = () => {
    const [amount, setAmount] = useState<string>('');
    const [category, setCategory] = useState<GivingCategory>('Tithe');
    const [isAnonymous, setIsAnonymous] = useState<boolean>(false);

    const [givingStatus, setGivingStatus] = useState<'idle' | 'processing' | 'success' | 'error'>('idle');
    const [activeTx, setActiveTx] = useState<GivingTransaction | null>(null);

    const handleProcessGiving = (e: React.FormEvent) => {
        e.preventDefault();
        const parsedAmount = parseFloat(amount);
        if (isNaN(parsedAmount) || parsedAmount <= 0) return;

        setGivingStatus('processing');

        setTimeout(() => {
            const isSuccessful = true;

            if (isSuccessful) {
                const newTx: GivingTransaction = {
                    id: `tx-${Math.floor(1000 + Math.random() * 9000)}`,
                    userId: isAnonymous ? null : 'current-user-id',
                    paymentReference: `pay_ref_${Math.random().toString(36).substring(2, 11)}`,
                    amount: parsedAmount,
                    category: category,
                    status: 'Success',
                    transactionDate: 'Today'
                };
                setActiveTx(newTx);
                setGivingStatus('success');
            } else {
                setGivingStatus('error');
            }
        }, 2000);
    };

    const resetForm = () => {
        setAmount('');
        setGivingStatus('idle');
        setActiveTx(null);
    };

    return (
        <div className="min-h-screen bg-[#FFFFFF] text-[#121212] pb-32 font-sans selection:bg-[#121212] selection:text-[#FFFFFF]">

            <div className="relative w-full h-[40vh] md:h-[45vh] overflow-hidden">
                <img
                    src="https://images.unsplash.com/photo-1673042872287-a77ef03317a4?q=80&w=1108&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
                    alt="Giving backdrop"
                    className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-black/50" />

                <div className="absolute bottom-0 inset-x-0 p-6 bg-gradient-to-t from-[#F9F9F9] via-[#F9F9F9]/40 to-transparent">
                    <span className="text-xs uppercase tracking-widest text-white/80 font-semibold flex items-center gap-1 drop-shadow-sm">
                        <HeartHandshake size={12} /> Financial Ledger
                    </span>
                    <h1 className="text-2xl font-light tracking-tight text-white mt-1 drop-shadow-md">
                        Stewardship & Giving
                    </h1>
                </div>
            </div>

            <div className="px-6 mt-8 max-w-md mx-auto">
                {givingStatus === 'idle' && (
                    <form onSubmit={handleProcessGiving} className="space-y-6">
                        <div>
                            <label className="text-[10px] uppercase tracking-wider text-gray-400 font-bold block mb-2">
                                Contribution Type (Category)
                            </label>
                            <div className="grid grid-cols-3 gap-2">
                                {(['Tithe', 'Offering', 'Donation'] as const).map((cat) => (
                                    <button
                                        key={cat}
                                        type="button"
                                        onClick={() => setCategory(cat)}
                                        className={`py-3 rounded-xl border text-xs font-semibold uppercase tracking-wider transition-all ${category === cat
                                            ? 'bg-[#121212] text-white border-transparent shadow-sm'
                                            : 'bg-white text-gray-600 border-[#121212]/10 hover:border-[#121212]/20'
                                            }`}
                                    >
                                        {cat}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div>
                            <label className="text-[10px] uppercase tracking-wider text-gray-400 font-bold block mb-2">
                                Offering Amount (Float)
                            </label>
                            <div className="relative rounded-xl border border-[#121212]/10 focus-within:border-[#121212]/30 transition-colors">
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-lg font-light text-gray-400">$</span>
                                <input
                                    type="number"
                                    step="0.01"
                                    min="0.01"
                                    required
                                    placeholder="0.00"
                                    value={amount}
                                    onChange={(e) => setAmount(e.target.value)}
                                    className="w-full bg-transparent pl-8 pr-4 py-4 text-xl font-normal focus:outline-none"
                                />
                            </div>
                        </div>

                        <div className="bg-[#F4F1EA]/50 rounded-2xl p-4 border border-[#121212]/5">
                            <div className="flex items-start justify-between">
                                <div className="pr-4">
                                    <h4 className="text-sm font-medium text-[#121212]">Give Anonymously</h4>
                                    <p className="text-xs text-gray-500 font-light mt-0.5">
                                        Omits your account link (user_id field) entirely from this ledger record.
                                    </p>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setIsAnonymous(!isAnonymous)}
                                    className={`w-10 h-6 flex items-center rounded-full p-0.5 transition-colors duration-200 focus:outline-none ${isAnonymous ? 'bg-[#8A817C]' : 'bg-gray-300'
                                        }`}
                                >
                                    <div className={`bg-white w-5 h-5 rounded-full shadow-md transform transition-transform duration-200 ${isAnonymous ? 'translate-x-4' : 'translate-x-0'
                                        }`} />
                                </button>
                            </div>
                        </div>

                        <button
                            type="submit"
                            className="w-full bg-[#121212] text-white text-xs uppercase tracking-widest font-semibold py-4 rounded-xl hover:bg-gray-800 transition-colors shadow-md flex items-center justify-center gap-2"
                        >
                            <CreditCard size={14} /> Process Secure Offering
                        </button>

                        <p className="text-[11px] text-gray-400 font-light text-center flex items-center justify-center gap-1">
                            <ShieldCheck size={12} className="text-green-600" /> Bank-grade processing • Secure Ledger Track
                        </p>
                    </form>
                )}

                {givingStatus === 'processing' && (
                    <div className="text-center py-16">
                        <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-[#8A817C]" />
                        <h3 className="text-md uppercase tracking-widest text-gray-400 font-semibold">Generating Ledger Entry</h3>
                        <p className="text-xs text-gray-400 font-light mt-1">Verifying secure payment gateways...</p>
                    </div>
                )}

                {givingStatus === 'success' && activeTx && (
                    <div className="text-center pt-4 border border-[#121212]/5 rounded-3xl p-6 bg-[#F9F9F9] shadow-sm">
                        <div className="w-12 h-12 rounded-full bg-green-50 text-green-600 flex items-center justify-center mx-auto mb-4">
                            <CheckCircle2 size={24} />
                        </div>
                        <h3 className="text-xl font-normal tracking-tight mb-1">Transaction Success</h3>
                        <p className="text-xs text-gray-400 uppercase font-semibold tracking-wider">{activeTx.category} Confirmed</p>

                        <div className="my-6 py-4 border-y border-[#121212]/5 space-y-2.5 text-left text-sm">
                            <div className="flex justify-between font-light">
                                <span className="text-gray-400">Ledger ID:</span>
                                <span className="font-mono text-xs">{activeTx.id}</span>
                            </div>
                            <div className="flex justify-between font-light">
                                <span className="text-gray-400">User Identity:</span>
                                <span>{activeTx.userId ? 'Linked (Member)' : 'Anonymous Entry'}</span>
                            </div>
                            <div className="flex justify-between font-light">
                                <span className="text-gray-400">Payment Ref:</span>
                                <span className="font-mono text-xs text-gray-500 max-w-[150px] truncate">{activeTx.paymentReference}</span>
                            </div>
                            <div className="flex justify-between pt-1 font-normal">
                                <span className="text-gray-500">Amount Settled:</span>
                                <span className="text-lg font-bold text-[#121212]">${activeTx.amount.toFixed(2)}</span>
                            </div>
                        </div>

                        <button
                            onClick={resetForm}
                            className="w-full bg-[#121212] text-white text-xs uppercase tracking-widest font-semibold py-3.5 rounded-xl hover:bg-gray-800 transition-colors"
                        >
                            Return to Ledger
                        </button>
                    </div>
                )}

                {givingStatus === 'error' && (
                    <div className="text-center pt-4 border border-[#121212]/5 rounded-3xl p-6 bg-red-50/30">
                        <div className="w-12 h-12 rounded-full bg-red-50 text-red-600 flex items-center justify-center mx-auto mb-4">
                            <AlertCircle size={22} />
                        </div>
                        <h3 className="text-xl font-normal tracking-tight mb-2">Ledger Verification Failed</h3>
                        <p className="text-sm text-gray-500 font-light mb-6">
                            The core payment gateway could not confirm the transfer parameters. Please confirm credentials.
                        </p>
                        <button
                            onClick={() => setGivingStatus('idle')}
                            className="w-full bg-[#121212] text-white text-xs uppercase tracking-widest font-semibold py-3.5 rounded-xl hover:bg-gray-800 transition-colors"
                        >
                            Try Again
                        </button>
                    </div>
                )}
            </div>

            <div className="px-6 mt-12 max-w-xl mx-auto space-y-4">
                <div className="flex justify-between items-center px-1">
                    <span className="text-xs font-semibold text-gray-400 uppercase tracking-widest flex items-center gap-1">
                        <History size={12} /> Contribution Logs
                    </span>
                </div>

                <div className="space-y-2.5">
                    {PAST_GIVING_HISTORY.map((log) => (
                        <div
                            key={log.id}
                            className="bg-white border border-[#121212]/5 p-4 shadow-sm flex items-center justify-between"
                        >
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-[#F4F1EA] flex items-center justify-center text-[#8A817C]">
                                    <Landmark size={18} />
                                </div>
                                <div>
                                    <div className="flex items-center gap-1.5">
                                        <h4 className="text-sm font-medium text-[#121212]">{log.category}</h4>
                                        <span className="text-[8px] tracking-wider uppercase bg-green-50 text-green-700 px-1 py-0.2 rounded font-bold">
                                            {log.status}
                                        </span>
                                    </div>
                                    <p className="text-[10px] text-gray-400 font-light mt-0.5">
                                        {log.userId ? 'Identified Record' : 'Anonymous Record'} • {log.transactionDate}
                                    </p>
                                </div>
                            </div>
                            <span className="text-sm font-bold text-[#121212]">
                                +${log.amount.toFixed(2)}
                            </span>
                        </div>
                    ))}
                </div>
            </div>

        </div>
    );
};