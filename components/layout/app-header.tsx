"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { useProfile } from "@/hooks/use-profile";
import { Avatar } from "@/components/ui/avatar";

export function AppHeader() {
    const router = useRouter();
    const { profile } = useProfile() ?? {};

    const fullName = profile ? `${profile?.firstname ?? ""} ${profile?.lastname ?? ""}` : "";

    return (
        <button
            onClick={() => router.push("/account")}
            aria-label="Account and settings"
            className="fixed top-4 right-4 z-30 w-9 h-9 rounded-full border-2 border-white/70 shadow-md flex items-center justify-center hover:scale-105 active:scale-95 transition-transform focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#EADCC9] overflow-hidden"
        >
            <Avatar photoUrl={profile?.photoUrl} name={fullName} size={34} />
        </button>
    );
}
