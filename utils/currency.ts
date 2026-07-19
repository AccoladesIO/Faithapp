export const currencySymbol = process.env.NEXT_PUBLIC_CURRENCY_SYMBOL ?? '₦';
export const currencyLocale = process.env.NEXT_PUBLIC_CURRENCY_LOCALE ?? 'en-NG';

export function formatCurrency(amount: string | number): string {
    const n = typeof amount === "string" ? parseFloat(amount) : amount;
    return `${currencySymbol}${n.toLocaleString(currencyLocale, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}
