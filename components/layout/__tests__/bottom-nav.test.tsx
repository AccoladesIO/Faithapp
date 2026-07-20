import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import { BottomNav } from "../bottom-nav";

jest.mock("next/navigation", () => ({
    useRouter: () => ({ push: jest.fn() }),
}));

describe("BottomNav", () => {
    it("places Giving as a primary tab, right before More", () => {
        render(<BottomNav userRole="MEMBER" activeTab="home" />);

        const labels = screen.getAllByRole("button").map((btn) => btn.getAttribute("aria-label"));
        expect(labels).toEqual(["Home", "Events", "Attendance", "Giving", "More"]);
    });

    it("marks the tab matching activeTab as current", () => {
        render(<BottomNav userRole="MEMBER" activeTab="giving" />);

        expect(screen.getByLabelText("Giving")).toHaveAttribute("aria-current", "page");
        expect(screen.getByLabelText("Home")).not.toHaveAttribute("aria-current");
    });
});
