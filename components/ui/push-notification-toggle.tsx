/**
 * components/push-notification-toggle.tsx
 *
 * Shows the real push notification state.
 * Per the backend guide, disabling on logout is not supported —
 * the subscription must stay alive for offline delivery.
 * An explicit opt-out button is provided for users who want to disable.
 */
"use client";

import React from "react";
import { BellRing, BellOff, Loader2, AlertCircle, CheckCircle2 } from "lucide-react";
import { usePush } from "@/hooks/use-push";

export function PushNotificationToggle() {
    const { isSubscribed, permission, isLoading, error, unsubscribe } = usePush();

    if (permission === "unsupported") {
        return (
            <div className="pt-3 flex items-start gap-2 text-xs text-gray-400 font-light">
                <AlertCircle size={13} className="flex-shrink-0 mt-0.5" />
                <p>Push notifications are not supported in this browser.</p>
            </div>
        );
    }

    return (
        <div className="pt-3 space-y-3">
            {/* Status row */}
            <div className="bg-white rounded-xl p-3.5 border border-[#121212]/5 flex items-start gap-3">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${isSubscribed ? "bg-green-50" : "bg-gray-100"}`}>
                    {isLoading
                        ? <Loader2 size={15} className="animate-spin text-[#8A817C]" />
                        : isSubscribed
                            ? <BellRing size={15} className="text-green-600" />
                            : <BellOff size={15} className="text-gray-400" />}
                </div>
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 mb-0.5">
                        <h4 className="text-xs font-semibold text-[#121212]">
                            {isSubscribed ? "Push notifications enabled" : "Push notifications off"}
                        </h4>
                        {isSubscribed && <CheckCircle2 size={12} className="text-green-600 flex-shrink-0" />}
                    </div>
                    <p className="text-[10px] text-gray-400 font-light leading-relaxed">
                        {permission === "denied"
                            ? "Blocked in your browser settings. Enable notifications for this site to receive alerts."
                            : isSubscribed
                                ? "You will receive alerts for prayer rosters, service reminders and announcements — even when the app is closed."
                                : "Notifications are currently disabled on this device."}
                    </p>
                </div>
            </div>

            {/* What you receive — only when subscribed */}
            {isSubscribed && (
                <div className="space-y-1.5 px-1">
                    <p className="text-[10px] uppercase tracking-wider text-gray-400 font-bold">
                        You'll be notified about
                    </p>
                    {[
                        "Prayer selection window opening",
                        "Prayer slot assignments & reminders",
                        "Service & event reminders",
                        "Church-wide announcements",
                    ].map((item) => (
                        <div key={item} className="flex items-center gap-2 text-xs text-gray-500 font-light">
                            <span className="w-1 h-1 rounded-full bg-[#8A817C] flex-shrink-0" />
                            {item}
                        </div>
                    ))}
                </div>
            )}

            {/* Permission denied helper */}
            {permission === "denied" && (
                <p className="text-[10px] text-gray-400 font-light px-1 leading-relaxed">
                    To re-enable: open your browser settings, find this site under Notifications, and set it to Allow. Then log out and back in.
                </p>
            )}

            {/* Opt-out button — only shown when subscribed */}
            {isSubscribed && (
                <button
                    onClick={unsubscribe}
                    disabled={isLoading}
                    className="w-full border border-[#121212]/10 text-xs uppercase tracking-widest font-semibold py-2.5 rounded-xl text-gray-500 hover:text-red-600 hover:border-red-100 hover:bg-red-50 transition-colors disabled:opacity-50"
                >
                    {isLoading ? "Processing…" : "Disable Notifications"}
                </button>
            )}

            {error && (
                <p className="text-xs text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
                    {error}
                </p>
            )}
        </div>
    );
}