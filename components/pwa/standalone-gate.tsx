"use client";


import React, { useEffect, useState } from "react";
import InstallWall from "./install-wall";

const IS_DEV = process.env.NEXT_PUBLIC_ENV === "development";

function useIsStandalone(): boolean | null {
    // null = not yet determined (SSR / before mount)
    const [isStandalone, setIsStandalone] = useState<boolean | null>(null);

    useEffect(() => {
        // manifest.json declares display: "fullscreen" — Android launches an
        // installed app in whichever of fullscreen/standalone/minimal-ui it
        // actually granted, so all three count as "installed", not just
        // "standalone" (checking that alone left a correctly installed app
        // stuck on the install wall).
        const standalone =
            window.matchMedia("(display-mode: fullscreen)").matches ||
            window.matchMedia("(display-mode: standalone)").matches ||
            window.matchMedia("(display-mode: minimal-ui)").matches ||
            (window.navigator as unknown as { standalone?: boolean }).standalone === true;
        setIsStandalone(standalone);
    }, []);

    return isStandalone;
}

export function StandaloneGate({ children }: { children: React.ReactNode }) {
    const isStandalone = useIsStandalone();

    // Not yet mounted — render nothing to avoid SSR flash
    if (isStandalone === null) return null;

    // Development bypass — always show the app
    if (IS_DEV) return <>{children}</>;

    // Production + not standalone → show install wall
    if (!isStandalone) return <InstallWall />;

    // Standalone mode — render the app normally
    return <>{children}</>;
}