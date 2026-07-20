import { getStrength } from "../password-strength";

describe("getStrength", () => {
    it("scores an empty password as too weak", () => {
        expect(getStrength("")).toEqual({ score: 0, label: "Too weak", color: "bg-red-400" });
    });

    it("scores a short password as weak", () => {
        expect(getStrength("abc")).toEqual({ score: 0, label: "Too weak", color: "bg-red-400" });
    });

    it("scores an 8+ char lowercase-only password as weak", () => {
        expect(getStrength("abcdefgh")).toEqual({ score: 1, label: "Weak", color: "bg-red-400" });
    });

    it("scores 8+ chars plus uppercase as fair", () => {
        expect(getStrength("Abcdefgh")).toEqual({ score: 2, label: "Fair", color: "bg-amber-400" });
    });

    it("scores 8+ chars, uppercase, and a digit as good", () => {
        expect(getStrength("Abcdefg1")).toEqual({ score: 3, label: "Good", color: "bg-blue-400" });
    });

    it("caps at 'Strong' even when every rule is satisfied", () => {
        expect(getStrength("Abcdefghij1!")).toEqual({ score: 4, label: "Strong", color: "bg-green-500" });
    });

    it("does not exceed a score of 4 despite 5 satisfiable rules", () => {
        // length>=8, length>=12, uppercase, digit, special char — all five true
        const result = getStrength("Abcdefghij1!");
        expect(result.score).toBeLessThanOrEqual(4);
    });
});
