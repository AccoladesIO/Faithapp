import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import { GivingAccountsCard } from "../giving";
import type { TitheAccount } from "@/hooks/use-tithes";

function account(overrides: Partial<TitheAccount> = {}): TitheAccount {
    return {
        id: "acc-1",
        accountName: "Building Fund",
        bankName: "First Bank",
        accountNumber: "1234567890",
        currency: "NGN",
        isActive: true,
        ...overrides,
    };
}

describe("GivingAccountsCard", () => {
    it("renders nothing when there are no active accounts", () => {
        const { container } = render(<GivingAccountsCard accounts={[account({ isActive: false })]} />);
        expect(container).toBeEmptyDOMElement();
    });

    it("uses singular copy for exactly one active account", () => {
        render(<GivingAccountsCard accounts={[account()]} />);
        expect(screen.getByText("Give To This Account")).toBeInTheDocument();
        expect(screen.getByText("Building Fund")).toBeInTheDocument();
        expect(screen.getByText("1234567890")).toBeInTheDocument();
    });

    it("uses plural copy and lists every active account when there is more than one", () => {
        render(
            <GivingAccountsCard
                accounts={[
                    account({ id: "acc-1", accountName: "Tithes" }),
                    account({ id: "acc-2", accountName: "Building Fund" }),
                ]}
            />
        );

        expect(screen.getByText("Give To Any Of These Accounts")).toBeInTheDocument();
        expect(screen.getByText("Tithes")).toBeInTheDocument();
        expect(screen.getByText("Building Fund")).toBeInTheDocument();
    });

    it("filters out inactive accounts", () => {
        render(
            <GivingAccountsCard
                accounts={[
                    account({ id: "acc-1", accountName: "Tithes", isActive: true }),
                    account({ id: "acc-2", accountName: "Old Closed Account", isActive: false }),
                ]}
            />
        );

        expect(screen.getByText("Give To This Account")).toBeInTheDocument();
        expect(screen.queryByText("Old Closed Account")).not.toBeInTheDocument();
    });
});
