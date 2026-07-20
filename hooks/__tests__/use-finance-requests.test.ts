import { renderHook, waitFor, act } from "@testing-library/react";
import "@testing-library/jest-dom";
import { useFinanceRequests } from "../use-finance-requests";
import { api } from "@/utils/auth/axios-client";

jest.mock("@/utils/auth/axios-client", () => ({
    api: { get: jest.fn(), post: jest.fn() },
}));

const mockGet = api.get as jest.MockedFunction<typeof api.get>;
const mockPost = api.post as jest.MockedFunction<typeof api.post>;

const category = { id: "cat1", name: "Equipment", isActive: true };
const request = {
    id: "fr1",
    requestedBy: { id: "m1", firstname: "Ada", lastname: "Lovelace", email: "ada@church.test" },
    department: { id: "d1", name: "Media" },
    category,
    amount: "150000",
    reason: "New projector",
    status: "PENDING" as const,
    recipientBankName: "First Bank",
    recipientAccountNumber: "1234567890",
    recipientAccountName: "ABC Suppliers",
    createdAt: "2026-06-01",
};

function mockHappyLoad() {
    mockGet
        .mockResolvedValueOnce({ data: { data: [category] } })
        .mockResolvedValueOnce({ data: { data: { data: [request] } } });
}

beforeEach(() => jest.clearAllMocks());

describe("useFinanceRequests — fetching", () => {
    it("loads categories and requests together", async () => {
        mockHappyLoad();
        const { result } = renderHook(() => useFinanceRequests());

        await waitFor(() => expect(result.current.isLoading).toBe(false));

        expect(result.current.categories).toEqual([category]);
        expect(result.current.requests).toEqual([request]);
    });

    it("sets an error message when either fetch fails", async () => {
        mockGet.mockRejectedValueOnce(new Error("Network down"));
        mockGet.mockResolvedValueOnce({ data: { data: { data: [] } } });
        const { result } = renderHook(() => useFinanceRequests());

        await waitFor(() => expect(result.current.isLoading).toBe(false));

        expect(result.current.error).toBe("Network down");
    });
});

describe("useFinanceRequests — createRequest", () => {
    it("posts multipart form data including the attachment and refetches", async () => {
        mockHappyLoad();
        const { result } = renderHook(() => useFinanceRequests());
        await waitFor(() => expect(result.current.isLoading).toBe(false));

        mockPost.mockResolvedValueOnce({ data: {} });
        mockHappyLoad();
        const attachment = new File(["doc"], "invoice.pdf", { type: "application/pdf" });

        await act(async () => {
            await result.current.createRequest({
                categoryId: "cat1", departmentId: "d1", reason: "New projector", amount: "150000",
                recipientBankName: "First Bank", recipientAccountNumber: "1234567890",
                recipientAccountName: "ABC Suppliers", attachment,
            });
        });

        expect(mockPost).toHaveBeenCalledWith("/finance/requests", expect.any(FormData), {
            headers: { "Content-Type": "multipart/form-data" },
        });
        const sent = mockPost.mock.calls[0][1] as FormData;
        expect(sent.get("attachment")).toBe(attachment);
    });

    it("sets submitError and rethrows on failure", async () => {
        mockHappyLoad();
        const { result } = renderHook(() => useFinanceRequests());
        await waitFor(() => expect(result.current.isLoading).toBe(false));

        mockPost.mockRejectedValueOnce(new Error("Category is inactive"));

        let caught: Error | undefined;
        await act(async () => {
            try {
                await result.current.createRequest({
                    categoryId: "cat1", departmentId: "d1", reason: "x", amount: "1",
                    recipientBankName: "b", recipientAccountNumber: "1", recipientAccountName: "n",
                });
            } catch (e: unknown) { caught = e as Error; }
        });

        expect(caught?.message).toBe("Category is inactive");
        expect(result.current.submitError).toBe("Category is inactive");
    });
});

describe("useFinanceRequests — getRequestById", () => {
    it("fetches a single request by id", async () => {
        mockHappyLoad();
        const { result } = renderHook(() => useFinanceRequests());
        await waitFor(() => expect(result.current.isLoading).toBe(false));

        mockGet.mockResolvedValueOnce({ data: { data: request } });

        let fetched;
        await act(async () => { fetched = await result.current.getRequestById("fr1"); });

        expect(mockGet).toHaveBeenCalledWith("/finance/requests/fr1");
        expect(fetched).toEqual(request);
    });
});
