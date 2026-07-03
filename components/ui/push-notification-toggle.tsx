/**
 * components/push-notification-toggle.tsx
 *
 * Simplified notifications panel for the profile page accordion.
 * Push notifications are enabled at the system level via the service worker
 * and announcement polling hook. The toggle UI is intentionally removed.
 */
"use client";

import React from "react";
import { BellRing, CheckCircle2 } from "lucide-react";

export function PushNotificationToggle() {
    return (
        <div className="pt-3 space-y-3">
            {/* Status row */}
            <div className="bg-white rounded-xl p-3.5 border border-[#121212]/5 flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-green-50 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <BellRing size={15} className="text-green-600" />
                </div>
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 mb-0.5">
                        <h4 className="text-xs font-semibold text-[#121212]">Push notifications enabled</h4>
                        <CheckCircle2 size={12} className="text-green-600 flex-shrink-0" />
                    </div>
                    <p className="text-[10px] text-gray-400 font-light leading-relaxed">
                        Disabling is currently unavailable. You will receive alerts for new announcements, service reminders, check-in windows, and prayer roster assignments.
                    </p>
                </div>
            </div>

            {/* What you receive */}
            <div className="space-y-1.5 px-1">
                <p className="text-[10px] uppercase tracking-wider text-gray-400 font-bold">
                    You'll be notified about
                </p>
                {[
                    "New church announcements",
                    "Upcoming service reminders",
                    "Check-in window opening",
                    "Prayer roster assignments",
                ].map((item) => (
                    <div key={item} className="flex items-center gap-2 text-xs text-gray-500 font-light">
                        <span className="w-1 h-1 rounded-full bg-[#8A817C] flex-shrink-0" />
                        {item}
                    </div>
                ))}
            </div>
        </div>
    );
}