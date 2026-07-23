import { renderHook, waitFor, act } from "@testing-library/react";
import "@testing-library/jest-dom";
import { usePledges, usePledgeContributions } from "../use-pledges";
import { api } from "@/utils/auth/axios-client";

jest.mock("@/utils/auth/axios-client", () => ({
    api: { get: jest.fn(), post: jest.fn() },
}));

const mockGet = api.get as jest.MockedFunction<typeof api.get>;
const mockPost = api.post as jest.MockedFunction<typeof api.post>;

const campaign = { id: "camp1", name: "Building Fund", fundName: "Building", targetAmount: 1000000, totalPledged: 500000, totalPaid: 200000, startDate: "2026-01-01", endDate: "2026-12-31", description: null };
const myPledge = { id: "pl1", campaign: { id: "camp1", name: "Building Fund", fund: null }, totalAmount: "100000", amountPaid: 20000, frequency: "MONTHLY" as const, startDate: "2026-01-01", status: "ACTIVE" as const, notes: null };
const summary = { year: 2026, ytdTithes: 500000, ytdTitheCount: 10, lastTithe: null, activePledges: [], totalPledged: 100000, generatedAt: "2026-06-01" };
const contribution = { id: "co1", amount: "10000", paymentDate: "2026-06-01", reference: "TXN1", status: "PENDING" as const, reviewedAt: null, financeNote: null };

function mockHappyLoad() {
    mockGet
        .mockResolvedValueOnce({ data: { data: [campaign] } })
        .mockResolvedValueOnce({ data: { data: [myPledge] } })
        .mockResolvedValueOnce({ data: { data: summary } });
}

beforeEach(() => jest.clearAllMocks());

describe("usePledges — fetching", () => {
    it("loads campaigns, the caller's pledges, and their giving summary", async () => {
        mockHappyLoad();
        const { result } = renderHook(() => usePledges());

        await waitFor(() => expect(result.current.isLoading).toBe(false));

        expect(result.current.campaigns).toEqual([campaign]);
        expect(result.current.myPledges).toEqual([myPledge]);
        expect(result.current.summary).toEqual(summary);
    });

    it("sets an error message on failure", async () => {
        mockGet.mockRejectedValueOnce(new Error("Server error"));
        mockGet.mockResolvedValue({ data: { data: [] } });
        const { result } = renderHook(() => usePledges());

        await waitFor(() => expect(result.current.isLoading).toBe(false));

        expect(result.current.error).toBe("Server error");
    });
});

describe("usePledges — mutations", () => {
    it("makePledge posts the payload and refetches", async () => {
        mockHappyLoad();
        const { result } = renderHook(() => usePledges());
        await waitFor(() => expect(result.current.isLoading).toBe(false));

        mockPost.mockResolvedValueOnce({ data: {} });
        mockHappyLoad();

        await act(async () => {
            await result.current.makePledge({ campaignId: "camp1", totalAmount: 50000, frequency: "ONE_OFF", startDate: "2026-07-01" });
        });

        expect(mockPost).toHaveBeenCalledWith("/finance/me/pledges", {
            campaignId: "camp1", totalAmount: 50000, frequency: "ONE_OFF", startDate: "2026-07-01",
        });
    });

    it("makePledge sets pledgeError and rethrows on failure", async () => {
        mockHappyLoad();
        const { result } = renderHook(() => usePledges());
        await waitFor(() => expect(result.current.isLoading).toBe(false));

        mockPost.mockRejectedValueOnce(new Error("Campaign has ended"));

        let caught: Error | undefined;
        await act(async () => {
            try {
                await result.current.makePledge({ campaignId: "camp1", totalAmount: 1, frequency: "ONE_OFF", startDate: "2026-07-01" });
            } catch (e: unknown) { caught = e as Error; }
        });

        expect(caught?.message).toBe("Campaign has ended");
        expect(result.current.pledgeError).toBe("Campaign has ended");
    });

    it("submitContribution posts to the pledge's contributions endpoint", async () => {
        mockHappyLoad();
        const { result } = renderHook(() => usePledges());
        await waitFor(() => expect(result.current.isLoading).toBe(false));

        mockPost.mockResolvedValueOnce({ data: {} });
        mockHappyLoad();

        await act(async () => {
            await result.current.submitContribution("pl1", { amount: 10000, paymentDate: "2026-06-01", reference: "TXN1" });
        });

        expect(mockPost).toHaveBeenCalledWith("/finance/me/pledges/pl1/contributions", {
            amount: 10000, paymentDate: "2026-06-01", reference: "TXN1",
        });
    });

    it("requestGivingStatement posts and returns the confirmation message", async () => {
        mockHappyLoad();
        const { result } = renderHook(() => usePledges());
        await waitFor(() => expect(result.current.isLoading).toBe(false));

        mockPost.mockResolvedValueOnce({ data: { message: "Statement emailed." } });

        let message: string | undefined;
        await act(async () => { message = await result.current.requestGivingStatement(); });

        expect(mockPost).toHaveBeenCalledWith("/finance/me/giving-statement/send");
        expect(message).toBe("Statement emailed.");
    });
});

describe("usePledgeContributions", () => {
    it("does not fetch when pledgeId is null", () => {
        renderHook(() => usePledgeContributions(null));
        expect(mockGet).not.toHaveBeenCalled();
    });

    it("fetches contribution history for a given pledge", async () => {
        mockGet.mockResolvedValueOnce({ data: { data: [contribution] } });
        const { result } = renderHook(() => usePledgeContributions("pl1"));

        await waitFor(() => expect(result.current.isLoading).toBe(false));

        expect(mockGet).toHaveBeenCalledWith("/finance/me/pledges/pl1/contributions");
        expect(result.current.contributions).toEqual([contribution]);
    });

    it("sets an error message on failure", async () => {
        mockGet.mockRejectedValueOnce(new Error("Not found"));
        const { result } = renderHook(() => usePledgeContributions("pl1"));

        await waitFor(() => expect(result.current.isLoading).toBe(false));

        expect(result.current.error).toBe("Not found");
    });
});
