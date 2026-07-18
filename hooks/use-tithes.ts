"use client";

import { useState, useEffect, useCallback } from "react";
import { api } from "@/utils/auth/axios-client";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface TitheAccount {
    id: string;
    accountName: string;
    bankName: string;
    accountNumber: string;
    currency: string;
    isActive: boolean;
}

export interface TitheRecord {
    id: string;
    amount: string;
    paymentDate: string;
    bankName: string | null;
    reference: string | null;
    batch: { id: string; titheAccount: TitheAccount | null } | null;
}

export type ProofStatus = "PENDING" | "APPROVED" | "REJECTED";

export interface ProofOfPayment {
    id: string;
    amount: string;
    status: ProofStatus;
    createdAt: string;
}

export interface VirtualAccount {
    id: string;
    provider: string;
    bankName: string;
    accountNumber: string;
    accountName: string;
    isActive: boolean;
    createdAt: string;
}

export interface SubmitProofPayload {
    file: File;
    titheAccountId: string;
    amount: string;
    paymentDate: string; // "YYYY-MM-DD"
    reference: string;
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export interface UseTithesReturn {
    accounts: TitheAccount[];
    history: TitheRecord[];
    proofs: ProofOfPayment[];
    virtualAccount: VirtualAccount | null;

    isLoading: boolean;
    isLoadingVirtualAccount: boolean;
    isSubmittingProof: boolean;
    isCreatingVirtualAccount: boolean;
    isSendingStatement: boolean;

    error: string | null;
    proofError: string | null;
    virtualAccountError: string | null;

    submitProof: (payload: SubmitProofPayload) => Promise<void>;
    createVirtualAccount: (bvn: string) => Promise<void>;
    emailTitheStatement: (fromMonth: string, toMonth: string) => Promise<string>;
    refetch: () => void;
}

export function useTithes(): UseTithesReturn {
    const [accounts, setAccounts] = useState<TitheAccount[]>([]);
    const [history, setHistory] = useState<TitheRecord[]>([]);
    const [proofs, setProofs] = useState<ProofOfPayment[]>([]);
    const [virtualAccount, setVirtualAccount] = useState<VirtualAccount | null>(null);

    const [isLoading, setIsLoading] = useState(true);
    const [isLoadingVirtualAccount, setIsLoadingVirtualAccount] = useState(true);
    const [isSubmittingProof, setIsSubmittingProof] = useState(false);
    const [isCreatingVirtualAccount, setIsCreatingVirtualAccount] = useState(false);
    const [isSendingStatement, setIsSendingStatement] = useState(false);

    const [error, setError] = useState<string | null>(null);
    const [proofError, setProofError] = useState<string | null>(null);
    const [virtualAccountError, setVirtualAccountError] = useState<string | null>(null);

    const [fetchTick, setFetchTick] = useState(0);

    // ── Fetch accounts, history, proofs ───────────────────────────────────────
    useEffect(() => {
        let cancelled = false;

        async function load() {
            setIsLoading(true);
            setError(null);
            try {
                const [accountsRes, historyRes, proofsRes] = await Promise.all([
                    api.get<{ data: TitheAccount[] }>("/tithes/accounts"),
                    api.get<{ data: { data: TitheRecord[] } }>("/tithes/me?page=1&limit=20"),
                    api.get<{ data: { data: ProofOfPayment[] } }>("/tithes/proof?page=1&limit=20"),
                ]);
                if (!cancelled) {
                    setAccounts(accountsRes.data.data);
                    setHistory(historyRes.data.data.data);
                    setProofs(proofsRes.data.data.data);
                }
            } catch (err: unknown) {
                if (!cancelled)
                    setError(err instanceof Error ? err.message : "Failed to load giving data.");
            } finally {
                if (!cancelled) setIsLoading(false);
            }
        }

        load();
        return () => { cancelled = true; };
    }, [fetchTick]);

    // ── Fetch virtual account ─────────────────────────────────────────────────
    useEffect(() => {
        let cancelled = false;

        async function load() {
            setIsLoadingVirtualAccount(true);
            try {
                const res = await api.get<{ data: VirtualAccount[] }>("/tithes/me/virtual-accounts");
                if (!cancelled) {
                    const active = res.data.data.find((a) => a.isActive) ?? res.data.data[0] ?? null;
                    setVirtualAccount(active);
                }
            } catch {
                if (!cancelled) setVirtualAccount(null);
            } finally {
                if (!cancelled) setIsLoadingVirtualAccount(false);
            }
        }

        load();
        return () => { cancelled = true; };
    }, [fetchTick]);

    // ── Submit proof of payment ───────────────────────────────────────────────
    const submitProof = useCallback(async (payload: SubmitProofPayload) => {
        setIsSubmittingProof(true);
        setProofError(null);
        try {
            const formData = new FormData();
            formData.append("file", payload.file);
            formData.append("titheAccountId", payload.titheAccountId);
            formData.append("amount", payload.amount);
            formData.append("paymentDate", payload.paymentDate);
            formData.append("reference", payload.reference);

            await api.post("/tithes/proof", formData, {
                headers: { "Content-Type": "multipart/form-data" },
            });
            setFetchTick((t) => t + 1);
        } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : "Failed to submit proof of payment.";
            setProofError(msg);
            throw new Error(msg);
        } finally {
            setIsSubmittingProof(false);
        }
    }, []);

    // ── Create virtual account ────────────────────────────────────────────────
    const createVirtualAccount = useCallback(async (bvn: string) => {
        setIsCreatingVirtualAccount(true);
        setVirtualAccountError(null);
        try {
            await api.post("/tithes/me/virtual-account", { provider: "PAYSTACK", bvn });
            setFetchTick((t) => t + 1);
        } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : "Failed to create virtual account.";
            setVirtualAccountError(msg);
            throw new Error(msg);
        } finally {
            setIsCreatingVirtualAccount(false);
        }
    }, []);

    // ── Email tithe statement ──────────────────────────────────────────────────
    const emailTitheStatement = useCallback(async (fromMonth: string, toMonth: string) => {
        setIsSendingStatement(true);
        try {
            const res = await api.post<{ message: string }>(
                `/tithes/me/statement/send?fromMonth=${fromMonth}&toMonth=${toMonth}`
            );
            return res.data.message;
        } finally {
            setIsSendingStatement(false);
        }
    }, []);

    const refetch = useCallback(() => setFetchTick((t) => t + 1), []);

    return {
        accounts,
        history,
        proofs,
        virtualAccount,
        isLoading,
        isLoadingVirtualAccount,
        isSubmittingProof,
        isCreatingVirtualAccount,
        isSendingStatement,
        error,
        proofError,
        virtualAccountError,
        submitProof,
        createVirtualAccount,
        emailTitheStatement,
        refetch,
    };
}