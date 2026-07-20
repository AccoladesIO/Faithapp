"use client";

import React, { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/context/auth-context";

const CHANGE_PASSWORD_PATH = "/change-password";

// Enforces a pending forced password change on every app load, not just the
// instant after login — requiresPasswordChange is persisted (see
// passwordChangeStore) so it survives a full app close/reopen, where the
// previous flow only ever routed here once, right after login.
export function PasswordChangeGate({ children }: { children: React.ReactNode }) {
    const { isAuthenticated, isLoading, requiresPasswordChange } = useAuth();
    const pathname = usePathname();
    const router = useRouter();

    const mustRedirect =
        isAuthenticated && requiresPasswordChange && pathname !== CHANGE_PASSWORD_PATH;

    useEffect(() => {
        if (mustRedirect) router.replace(CHANGE_PASSWORD_PATH);
    }, [mustRedirect, router]);

    if (isLoading) return <>{children}</>;
    if (mustRedirect) return null;

    return <>{children}</>;
}
