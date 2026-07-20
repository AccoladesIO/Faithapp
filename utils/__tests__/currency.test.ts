import { formatCurrency } from "../currency";

describe("formatCurrency", () => {
    it("formats a numeric amount with the currency symbol and two decimals", () => {
        expect(formatCurrency(15000)).toBe("₦15,000.00");
    });

    it("formats a string amount", () => {
        expect(formatCurrency("2500.5")).toBe("₦2,500.50");
    });

    it("formats zero", () => {
        expect(formatCurrency(0)).toBe("₦0.00");
    });

    it("formats large amounts with thousands separators", () => {
        expect(formatCurrency(1234567.89)).toBe("₦1,234,567.89");
    });
});
