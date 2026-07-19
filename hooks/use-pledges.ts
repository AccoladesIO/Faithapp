"use client";

import { useState, useEffect, useCallback } from "react";
import { api } from "@/utils/auth/axios-client";

// ─── Types ────────────────────────────────────────────────────────────────────

export type PledgeFrequency = "ONE_OFF" | "MONTHLY" | "QUARTERLY";
export type PledgeStatus = "ACTIVE" | "COMPLETED" | "CANCELLED";
export type PledgeContributionStatus = "PENDING" | "CONFIRMED" | "DECLINED";

export interface PledgeCampaign {
    id: string;
    name: string;
    fundName: string | null;
    targetAmount: number;
    totalPledged: number;
    totalPaid: number;
    startDate: string;
    endDate: string;
    description: string | null;
}

export interface MyPledge {
    id: string;
    campaign: { id: string; name: string; fund: { name: string } | null } | null;
    totalAmount: string;
    amountPaid: number;
    frequency: PledgeFrequency;
    startDate: string;
    status: PledgeStatus;
    notes: string | null;
}

export interface PledgeContribution {
    id: string;
    amount: string;
    paymentDate: string;
    reference: string | null;
    status: PledgeContributionStatus;
    reviewedAt: string | null;
    financeNote: string | null;
}

export interface SubmitContributionPayload {
    amount: number;
    paymentDate: string; // "YYYY-MM-DD"
    reference?: string;
}

export interface GivingSummaryPledge {
    id: string;
    campaign: string;
    fund: string;
    totalAmount: number;
    frequency: PledgeFrequency;
    startDate: string;
}

export interface GivingSummary {
    year: number;
    ytdTithes: number;
    ytdTitheCount: number;
    lastTithe: { date: string; amount: number; source: string } | null;
    activePledges: GivingSummaryPledge[];
    totalPledged: number;
    generatedAt: string;
}

export interface MakePledgePayload {
    campaignId: string;
    totalAmount: number;
    frequency: PledgeFrequency;
    startDate: string; // "YYYY-MM-DD"
    notes?: string;
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export interface UsePledgesReturn {
    campaigns: PledgeCampaign[];
    myPledges: MyPledge[];
    summary: GivingSummary | null;

    isLoading: boolean;
    isMakingPledge: boolean;
    isRequestingStatement: boolean;

    error: string | null;
    pledgeError: string | null;

    makePledge: (payload: MakePledgePayload) => Promise<void>;
    submitContribution: (pledgeId: string, payload: SubmitContributionPayload) => Promise<void>;
    requestGivingStatement: () => Promise<string>;
    refetch: () => void;
}

export function usePledges(): UsePledgesReturn {
    const [campaigns, setCampaigns] = useState<PledgeCampaign[]>([]);
    const [myPledges, setMyPledges] = useState<MyPledge[]>([]);
    const [summary, setSummary] = useState<GivingSummary | null>(null);

    const [isLoading, setIsLoading] = useState(true);
    const [isMakingPledge, setIsMakingPledge] = useState(false);
    const [isRequestingStatement, setIsRequestingStatement] = useState(false);

    const [error, setError] = useState<string | null>(null);
    const [pledgeError, setPledgeError] = useState<string | null>(null);

    const [fetchTick, setFetchTick] = useState(0);

    useEffect(() => {
        let cancelled = false;

        async function load() {
            setIsLoading(true);
            setError(null);
            try {
                const [campaignsRes, pledgesRes, summaryRes] = await Promise.all([
                    api.get<{ data: PledgeCampaign[] }>("/finance/pledge-campaigns"),
                    api.get<{ data: MyPledge[] }>("/finance/me/pledges"),
                    api.get<{ data: GivingSummary }>("/finance/me/giving-summary"),
                ]);
                if (!cancelled) {
                    setCampaigns(campaignsRes.data.data);
                    setMyPledges(pledgesRes.data.data);
                    setSummary(summaryRes.data.data);
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

    const makePledge = useCallback(async (payload: MakePledgePayload) => {
        setIsMakingPledge(true);
        setPledgeError(null);
        try {
            await api.post("/finance/me/pledges", payload);
            setFetchTick((t) => t + 1);
        } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : "Failed to make pledge.";
            setPledgeError(msg);
            throw new Error(msg);
        } finally {
            setIsMakingPledge(false);
        }
    }, []);

    const submitContribution = useCallback(
        async (pledgeId: string, payload: SubmitContributionPayload) => {
            setIsMakingPledge(true);
            setPledgeError(null);
            try {
                await api.post(`/finance/me/pledges/${pledgeId}/contributions`, payload);
                setFetchTick((t) => t + 1);
            } catch (err: unknown) {
                const msg = err instanceof Error ? err.message : "Failed to log payment.";
                setPledgeError(msg);
                throw new Error(msg);
            } finally {
                setIsMakingPledge(false);
            }
        },
        []
    );

    const requestGivingStatement = useCallback(async () => {
        setIsRequestingStatement(true);
        try {
            const res = await api.post<{ message: string }>("/finance/me/giving-statement/send");
            return res.data.message;
        } finally {
            setIsRequestingStatement(false);
        }
    }, []);

    const refetch = useCallback(() => setFetchTick((t) => t + 1), []);

    return {
        campaigns,
        myPledges,
        summary,
        isLoading,
        isMakingPledge,
        isRequestingStatement,
        error,
        pledgeError,
        makePledge,
        submitContribution,
        requestGivingStatement,
        refetch,
    };
}

// ─── Per-pledge contribution history (lazy, on-demand) ────────────────────────

export interface UsePledgeContributionsReturn {
    contributions: PledgeContribution[];
    isLoading: boolean;
    error: string | null;
    refetch: () => void;
}

export function usePledgeContributions(pledgeId: string | null): UsePledgeContributionsReturn {
    const [contributions, setContributions] = useState<PledgeContribution[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [fetchTick, setFetchTick] = useState(0);

    useEffect(() => {
        if (!pledgeId) return;
        let cancelled = false;

        async function load() {
            setIsLoading(true);
            setError(null);
            try {
                const res = await api.get<{ data: PledgeContribution[] }>(
                    `/finance/me/pledges/${pledgeId}/contributions`
                );
                if (!cancelled) setContributions(res.data.data);
            } catch (err: unknown) {
                if (!cancelled)
                    setError(err instanceof Error ? err.message : "Failed to load payment history.");
            } finally {
                if (!cancelled) setIsLoading(false);
            }
        }

        load();
        return () => { cancelled = true; };
    }, [pledgeId, fetchTick]);

    const refetch = useCallback(() => setFetchTick((t) => t + 1), []);

    return { contributions, isLoading, error, refetch };
}
