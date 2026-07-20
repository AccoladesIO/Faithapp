import { renderHook, waitFor, act } from "@testing-library/react";
import "@testing-library/jest-dom";
import { useEditProfile } from "../use-edit-profile";
import { api } from "@/utils/auth/axios-client";

jest.mock("@/utils/auth/axios-client", () => ({
    api: { patch: jest.fn(), post: jest.fn(), delete: jest.fn() },
}));

const mockPatch = api.patch as jest.MockedFunction<typeof api.patch>;
const mockPost = api.post as jest.MockedFunction<typeof api.post>;
const mockDelete = api.delete as jest.MockedFunction<typeof api.delete>;

beforeEach(() => jest.clearAllMocks());

describe("useEditProfile", () => {
    it("updateMyProfile patches /members/me with the given payload", async () => {
        mockPatch.mockResolvedValueOnce({ data: { data: { firstname: "New" } } });
        const { result } = renderHook(() => useEditProfile());

        let response;
        await act(async () => {
            response = await result.current.updateMyProfile({ firstname: "New" });
        });

        expect(mockPatch).toHaveBeenCalledWith("/members/me", { firstname: "New" });
        expect(response).toEqual({ firstname: "New" });
        expect(result.current.isSubmitting).toBe(false);
    });

    it("updateMyPhoto uploads the file as multipart form data to /members/me/photo", async () => {
        mockPost.mockResolvedValueOnce({ data: { data: { photoUrl: "https://res.cloudinary.com/x.jpg" } } });
        const { result } = renderHook(() => useEditProfile());
        const file = new File(["img"], "photo.png", { type: "image/png" });

        let response;
        await act(async () => {
            response = await result.current.updateMyPhoto(file);
        });

        expect(mockPost).toHaveBeenCalledWith(
            "/members/me/photo",
            expect.any(FormData),
            { headers: { "Content-Type": "multipart/form-data" } },
        );
        const sentFormData = mockPost.mock.calls[0][1] as FormData;
        expect(sentFormData.get("photo")).toBe(file);
        expect(response).toEqual({ photoUrl: "https://res.cloudinary.com/x.jpg" });
    });

    it("updateMyPhoto surfaces the backend error message on failure", async () => {
        mockPost.mockRejectedValueOnce({ response: { data: { message: "Only image files are allowed" } } });
        const { result } = renderHook(() => useEditProfile());
        const file = new File(["img"], "photo.pdf", { type: "application/pdf" });

        let caught: Error | undefined;
        await act(async () => {
            try { await result.current.updateMyPhoto(file); } catch (e: unknown) { caught = e as Error; }
        });

        expect(caught?.message).toBe("Only image files are allowed");
        expect(result.current.isSubmitting).toBe(false);
    });

    it("removeMyPhoto deletes /members/me/photo", async () => {
        mockDelete.mockResolvedValueOnce({ data: { data: { photoUrl: null } } });
        const { result } = renderHook(() => useEditProfile());

        let response;
        await act(async () => {
            response = await result.current.removeMyPhoto();
        });

        expect(mockDelete).toHaveBeenCalledWith("/members/me/photo");
        expect(response).toEqual({ photoUrl: null });
    });

    it("removeMyPhoto falls back to a generic message when the error carries none", async () => {
        mockDelete.mockRejectedValueOnce("network fail");
        const { result } = renderHook(() => useEditProfile());

        let caught: Error | undefined;
        await act(async () => {
            try { await result.current.removeMyPhoto(); } catch (e: unknown) { caught = e as Error; }
        });

        expect(caught?.message).toBe("Failed to remove photo.");
    });

    it("tracks isSubmitting across the request lifecycle", async () => {
        let resolveRequest: (v: unknown) => void = () => {};
        mockPatch.mockReturnValueOnce(new Promise((resolve) => { resolveRequest = resolve; }));
        const { result } = renderHook(() => useEditProfile());

        act(() => { void result.current.updateMyProfile({ firstname: "New" }); });
        await waitFor(() => expect(result.current.isSubmitting).toBe(true));

        await act(async () => {
            resolveRequest({ data: { data: {} } });
        });
        await waitFor(() => expect(result.current.isSubmitting).toBe(false));
    });
});
