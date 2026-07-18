export interface StrengthResult {
    score: number; // 0–4
    label: string;
    color: string;
}

export function getStrength(password: string): StrengthResult {
    let score = 0;
    if (password.length >= 8) score++;
    if (password.length >= 12) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;

    const capped = Math.min(score, 4) as 0 | 1 | 2 | 3 | 4;
    const map: Record<0 | 1 | 2 | 3 | 4, { label: string; color: string }> = {
        0: { label: "Too weak", color: "bg-red-400" },
        1: { label: "Weak", color: "bg-red-400" },
        2: { label: "Fair", color: "bg-amber-400" },
        3: { label: "Good", color: "bg-blue-400" },
        4: { label: "Strong", color: "bg-green-500" },
    };
    return { score: capped, ...map[capped] };
}
