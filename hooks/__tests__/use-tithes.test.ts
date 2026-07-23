import { renderHook, waitFor, act } from "@testing-library/react";
import "@testing-library/jest-dom";
import { useTithes } from "../use-tithes";
import { api } from "@/utils/auth/axios-client";

jest.mock("@/utils/auth/axios-client", () => ({
    api: { get: jest.fn(), post: jest.fn() },
}));

const mockGet = api.get as jest.MockedFunction<typeof api.get>;
const mockPost = api.post as jest.MockedFunction<typeof api.post>;

const account = { id: "a1", accountName: "Tithes", bankName: "First Bank", accountNumber: "123", currency: "NGN", isActive: true };
const record = { id: "r1", amount: "5000", paymentDate: "2026-06-01", bankName: null, reference: null, batch: null };
const proof = { id: "p1", amount: "5000", status: "PENDING" as const, createdAt: "2026-06-01" };
const virtualAccount = { id: "va1", provider: "PAYSTACK", bankName: "GTBank", accountNumber: "9988", accountName: "John Doe", isActive: true, createdAt: "2026-06-01" };

function mockHappyLoad() {
    mockGet
        .mockResolvedValueOnce({ data: { data: [account] } })
        .mockResolvedValueOnce({ data: { data: { data: [record] } } })
        .mockResolvedValueOnce({ data: { data: { data: [proof] } } })
        .mockResolvedValueOnce({ data: { data: [virtualAccount] } });
}

beforeEach(() => jest.clearAllMocks());

describe("useTithes — fetching", () => {
    it("loads accounts, history, proofs, and the active virtual account", async () => {
        mockHappyLoad();
        const { result } = renderHook(() => useTithes());

        await waitFor(() => expect(result.current.isLoading).toBe(false));
        await waitFor(() => expect(result.current.isLoadingVirtualAccount).toBe(false));

        expect(result.current.accounts).toEqual([account]);
        expect(result.current.history).toEqual([record]);
        expect(result.current.proofs).toEqual([proof]);
        expect(result.current.virtualAccount).toEqual(virtualAccount);
    });

    it("picks the first virtual account when none are marked active", async () => {
        mockGet
            .mockResolvedValueOnce({ data: { data: [account] } })
            .mockResolvedValueOnce({ data: { data: { data: [] } } })
            .mockResolvedValueOnce({ data: { data: { data: [] } } })
            .mockResolvedValueOnce({ data: { data: [{ ...virtualAccount, isActive: false }] } });

        const { result } = renderHook(() => useTithes());
        await waitFor(() => expect(result.current.isLoadingVirtualAccount).toBe(false));

        expect(result.current.virtualAccount).toEqual({ ...virtualAccount, isActive: false });
    });

    it("sets virtualAccount to null when the member has none", async () => {
        mockGet
            .mockResolvedValueOnce({ data: { data: [account] } })
            .mockResolvedValueOnce({ data: { data: { data: [] } } })
            .mockResolvedValueOnce({ data: { data: { data: [] } } })
            .mockResolvedValueOnce({ data: { data: [] } });

        const { result } = renderHook(() => useTithes());
        await waitFor(() => expect(result.current.isLoadingVirtualAccount).toBe(false));

        expect(result.current.virtualAccount).toBeNull();
    });

    it("sets an error message when the main fetch fails", async () => {
        mockGet.mockRejectedValueOnce(new Error("Network down"));
        mockGet.mockResolvedValueOnce({ data: { data: [] } });

        const { result } = renderHook(() => useTithes());
        await waitFor(() => expect(result.current.isLoading).toBe(false));

        expect(result.current.error).toBe("Network down");
    });
});

describe("useTithes — mutations", () => {
    it("submitProof posts multipart form data and triggers a refetch", async () => {
        mockHappyLoad();
        const { result } = renderHook(() => useTithes());
        await waitFor(() => expect(result.current.isLoading).toBe(false));

        mockPost.mockResolvedValueOnce({ data: {} });
        mockHappyLoad();

        const file = new File(["receipt"], "receipt.jpg", { type: "image/jpeg" });
        await act(async () => {
            await result.current.submitProof({
                file, titheAccountId: "a1", amount: "5000", paymentDate: "2026-06-01", reference: "TXN1",
            });
        });

        expect(mockPost).toHaveBeenCalledWith(
            "/tithes/proof",
            expect.any(FormData),
            { headers: { "Content-Type": "multipart/form-data" } },
        );
    });

    it("submitProof sets proofError and rethrows on failure", async () => {
        mockHappyLoad();
        const { result } = renderHook(() => useTithes());
        await waitFor(() => expect(result.current.isLoading).toBe(false));

        mockPost.mockRejectedValueOnce(new Error("File too large"));
        const file = new File(["receipt"], "receipt.jpg", { type: "image/jpeg" });

        let caught: Error | undefined;
        await act(async () => {
            try {
                await result.current.submitProof({ file, titheAccountId: "a1", amount: "5000", paymentDate: "2026-06-01", reference: "TXN1" });
            } catch (e: unknown) { caught = e as Error; }
        });

        expect(caught?.message).toBe("File too large");
        expect(result.current.proofError).toBe("File too large");
    });

    it("createVirtualAccount posts the BVN and provider, then refetches", async () => {
        mockHappyLoad();
        const { result } = renderHook(() => useTithes());
        await waitFor(() => expect(result.current.isLoading).toBe(false));

        mockPost.mockResolvedValueOnce({ data: {} });
        mockHappyLoad();

        await act(async () => { await result.current.createVirtualAccount("12345678901"); });

        expect(mockPost).toHaveBeenCalledWith("/tithes/me/virtual-account", { provider: "PAYSTACK", bvn: "12345678901" });
    });

    it("emailTitheStatement posts to the statement endpoint and returns the confirmation message", async () => {
        mockHappyLoad();
        const { result } = renderHook(() => useTithes());
        await waitFor(() => expect(result.current.isLoading).toBe(false));

        mockPost.mockResolvedValueOnce({ data: { message: "Statement sent to your email." } });

        let message: string | undefined;
        await act(async () => {
            message = await result.current.emailTitheStatement("2026-01", "2026-06");
        });

        expect(mockPost).toHaveBeenCalledWith("/tithes/me/statement/send?fromMonth=2026-01&toMonth=2026-06");
        expect(message).toBe("Statement sent to your email.");
    });
});
