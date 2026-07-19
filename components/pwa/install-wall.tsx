"use client";

import React, { useEffect, useState } from "react";
import { ArrowDownToLine, Share2, Plus, MoreHorizontal, BellRing } from "lucide-react";
import { detectPlatform, type Platform } from "@/lib/platform";

const PRODUCT_NAME = process.env.NEXT_PUBLIC_PRODUCT_NAME ?? "Discovery Hub";
const CHURCH_NAME = process.env.NEXT_PUBLIC_CHURCH_NAME ?? "RCCG Discovery Centre";

interface BeforeInstallPromptEvent extends Event {
    prompt: () => Promise<void>;
    userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export default function InstallWall() {
    const [platform, setPlatform] = useState<Platform>("other");
    const [deferredPrompt, setPrompt] = useState<BeforeInstallPromptEvent | null>(null);
    const [installing, setInstalling] = useState(false);
    const [promptDismissed, setDismissed] = useState(false);

    useEffect(() => {
        setPlatform(detectPlatform());
        const handler = (e: Event) => {
            e.preventDefault();
            setPrompt(e as BeforeInstallPromptEvent);
        };
        window.addEventListener("beforeinstallprompt", handler);
        return () => window.removeEventListener("beforeinstallprompt", handler);
    }, []);

    const handleInstall = async () => {
        if (!deferredPrompt) return;
        setInstalling(true);
        try {
            await deferredPrompt.prompt();
            const { outcome } = await deferredPrompt.userChoice;
            if (outcome === "accepted") setPrompt(null);
            else setDismissed(true);
        } catch {
        } finally {
            setInstalling(false);
        }
    };

    const iosSteps = [
        { icon: Share2, text: "Tap the Share icon at the bottom of Safari" },
        { icon: Plus, text: 'Tap "Add to Home Screen" from the menu' },
        { icon: ArrowDownToLine, text: 'Tap "Add" in the top-right corner' },
    ];

    const desktopSteps = [
        { icon: MoreHorizontal, text: "Open this page in Google Chrome or Microsoft Edge" },
        { icon: ArrowDownToLine, text: 'Click the install icon (⊕) in the address bar, or open the browser menu and choose "Install App"' },
    ];

    const showNativeButton = !!deferredPrompt && !promptDismissed;
    const showManualIos = platform === "ios" && !showNativeButton;
    const showManualOther = !showNativeButton && !showManualIos;

    return (
        <div className="min-h-screen bg-[#F4F1EA] flex flex-col items-center justify-between py-12 px-6 font-sans selection:bg-[#121212] selection:text-white">
            <div />
            <div className="w-full max-w-sm space-y-8">
                <div className="text-center space-y-4">
                    <div>
                        <h1 className="text-2xl font-light tracking-tight text-[#121212]">
                            {PRODUCT_NAME}
                        </h1>
                        <p className="text-[10px] uppercase tracking-widest text-[#756E69] font-semibold mt-1">
                            BY
                        </p>
                        <p className="text-[10px] uppercase tracking-widest text-[#756E69] font-semibold mt-1">
                            {CHURCH_NAME}
                        </p>
                    </div>
                </div>

                <div className="text-center">
                    <h2 className="text-lg font-normal text-[#121212] tracking-tight">
                        Install to get started
                    </h2>
                    <p className="text-xs text-[#756E69] font-light leading-relaxed">
                        {PRODUCT_NAME} runs as an installed app on your device. It only takes a moment to set up.
                    </p>
                </div>

                <div className="flex items-start gap-2.5 bg-white border border-[#121212]/5 rounded-xl p-3.5">
                    <BellRing size={15} className="text-[#756E69] flex-shrink-0 mt-0.5" />
                    <p className="text-[11px] text-gray-600 font-light leading-relaxed text-left">
                        Once installed, you can turn on notifications for prayer reminders, service updates and announcements.
                    </p>
                </div>

                {showNativeButton && (
                    <button
                        onClick={handleInstall}
                        disabled={installing}
                        className="w-full bg-[#121212] text-white text-xs uppercase tracking-widest font-semibold py-4 rounded-2xl hover:bg-[#121212]/90 active:scale-[0.98] transition-all shadow-lg disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                        <ArrowDownToLine size={15} />
                        {installing ? "Installing…" : "Install App"}
                    </button>
                )}

                {showManualIos && (
                    <div className="bg-white border border-[#121212]/5 rounded-2xl p-5 shadow-sm space-y-4">
                        <p className="text-[10px] uppercase tracking-widest text-[#756E69] font-semibold">
                            How to install on iPhone / iPad
                        </p>
                        <ol className="space-y-3">
                            {iosSteps.map(({ icon: Icon, text }, i) => (
                                <li key={i} className="flex items-start gap-3">
                                    <div className="w-6 h-6 rounded-full bg-[#121212] text-white flex items-center justify-center flex-shrink-0 mt-0.5">
                                        <span className="text-[10px] font-bold">{i + 1}</span>
                                    </div>
                                    <p className="text-xs text-gray-600 font-light leading-relaxed pt-0.5">{text}</p>
                                </li>
                            ))}
                        </ol>
                        <div className="flex items-center justify-center gap-4 pt-2 border-t border-[#121212]/5">
                            <div className="flex items-center gap-1.5 text-[#756E69]">
                                <Share2 size={16} />
                                <span className="text-[10px] font-semibold uppercase tracking-wider">Share</span>
                            </div>
                            <span className="text-gray-300 text-xs">→</span>
                            <div className="flex items-center gap-1.5 text-[#756E69]">
                                <Plus size={16} />
                                <span className="text-[10px] font-semibold uppercase tracking-wider">Add to Home</span>
                            </div>
                        </div>
                    </div>
                )}

                {showManualOther && (
                    <div className="bg-white border border-[#121212]/5 rounded-2xl p-5 shadow-sm space-y-4">
                        <p className="text-[10px] uppercase tracking-widest text-[#756E69] font-semibold">
                            How to install
                        </p>
                        <ol className="space-y-3">
                            {desktopSteps.map(({ icon: Icon, text }, i) => (
                                <li key={i} className="flex items-start gap-3">
                                    <div className="w-6 h-6 rounded-full bg-[#121212] text-white flex items-center justify-center flex-shrink-0 mt-0.5">
                                        <span className="text-[10px] font-bold">{i + 1}</span>
                                    </div>
                                    <p className="text-xs text-gray-600 font-light leading-relaxed pt-0.5">{text}</p>
                                </li>
                            ))}
                        </ol>
                    </div>
                )}

                <div className="flex items-center gap-3">
                    <div className="flex-1 h-px bg-[#121212]/5" />
                    <span className="text-[10px] uppercase tracking-widest text-gray-500 font-semibold">or</span>
                    <div className="flex-1 h-px bg-[#121212]/5" />
                </div>

                <div className="text-center">
                    <p className="text-xs text-gray-500 font-light">
                        Already installed?
                    </p>
                    <button
                        onClick={() => window.location.reload()}
                        className="mt-1 text-xs font-semibold text-[#121212] uppercase tracking-widest hover:underline"
                    >
                        Open from your home screen
                    </button>
                </div>
            </div>

            <p className="text-[10px] text-gray-500 font-light text-center tracking-wide">
                © {new Date().getFullYear()} {CHURCH_NAME}
            </p>
        </div>
    );
}