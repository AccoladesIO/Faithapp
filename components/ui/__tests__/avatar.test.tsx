import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import { Avatar } from "../avatar";

describe("Avatar", () => {
    it("renders initials from the name when no photoUrl is given", () => {
        render(<Avatar name="Ada Lovelace" />);
        expect(screen.getByText("AL")).toBeInTheDocument();
        expect(screen.queryByRole("img")).not.toBeInTheDocument();
    });

    it("renders initials when photoUrl is null", () => {
        render(<Avatar name="Grace Hopper" photoUrl={null} />);
        expect(screen.getByText("GH")).toBeInTheDocument();
    });

    it("renders the photo instead of initials when photoUrl is set", () => {
        render(<Avatar name="Ada Lovelace" photoUrl="https://res.cloudinary.com/x/ada.jpg" />);
        expect(screen.getByRole("img", { name: "Ada Lovelace" })).toBeInTheDocument();
        expect(screen.queryByText("AL")).not.toBeInTheDocument();
    });

    it("falls back to a single '?' for a blank name", () => {
        render(<Avatar name="" />);
        expect(screen.getByText("?")).toBeInTheDocument();
    });

    it("caps initials at two characters for multi-word names", () => {
        render(<Avatar name="Mary Ann Smith" />);
        expect(screen.getByText("MA")).toBeInTheDocument();
    });
});
