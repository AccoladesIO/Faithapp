"use client";

import React from "react";
import { ArrowLeft, Clock, MapPin, Wifi, Loader2, AlertCircle, CheckCircle2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEventDetail } from "@/hooks/use-event-detail";
import { formatLocalSlotTime } from "@/utils/parse-local-time";

function formatFullDate(isoDate: string): string {
    return new Date(isoDate + "T00:00:00").toLocaleDateString("en-GB", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
    });
}

function DetailSkeleton() {
    return (
        <div className="px-6 pt-8 max-w-lg mx-auto space-y-4 animate-pulse">
            <div className="h-3 w-24 bg-gray-100 rounded" />
            <div className="h-8 w-2/3 bg-gray-100 rounded" />
            <div className="h-24 w-full bg-gray-100 rounded mt-4" />
        </div>
    );
}

export const EventDetailPage = ({ id }: { id: string }) => {
    const router = useRouter();
    const {
        event, isLoading, error,
        isConfirmingOnline, onlineConfirmMessage, onlineConfirmError,
        confirmOnlineAttendance,
    } = useEventDetail(id);

    const canConfirmOnline = !!event?.onlineAttendanceEnabled && !event?.checkedIn;

    return (
        <div className="min-h-screen bg-[#FFFFFF] text-[#121212] pb-32 font-sans selection:bg-[#121212] selection:text-[#FFFFFF]">
            <div className="px-6 pt-6 pb-2 flex items-center gap-3 max-w-lg mx-auto">
                <button
                    onClick={() => router.back()}
                    className="w-8 h-8 rounded-full bg-[#F4F1EA] flex items-center justify-center text-[#121212] hover:bg-[#EADCC9] transition-colors"
                >
                    <ArrowLeft size={16} />
                </button>
                <span className="text-xs uppercase tracking-widest text-gray-500 font-semibold">Service Detail</span>
            </div>

            {isLoading ? (
                <DetailSkeleton />
            ) : error ? (
                <div className="px-6 pt-10 max-w-lg mx-auto flex flex-col items-start gap-3 text-gray-500">
                    <AlertCircle size={24} />
                    <p className="text-sm font-light">{error}</p>
                </div>
            ) : event ? (
                <div className="px-6 pt-4 max-w-lg mx-auto">
                    <span className="text-xs text-[#756E69] font-semibold uppercase tracking-wider">
                        {formatFullDate(event.eventDate)}
                    </span>
                    <h1 className="text-2xl font-light tracking-tight text-[#121212] mt-1 mb-2 leading-snug">
                        {event.name}
                    </h1>
                    {event.description && (
                        <p className="text-sm text-gray-600 font-light leading-relaxed mb-6">{event.description}</p>
                    )}

                    <div className="space-y-3">
                        {event.serviceSlots.map((slot) => {
                            const venue = slot.venueOverride ?? slot.config.defaultVenue;
                            return (
                                <div key={slot.id} className="bg-[#F9F9F9] border border-[#121212]/5 p-4">
                                    <h3 className="text-sm font-medium text-[#121212] mb-2">{slot.name}</h3>
                                    <div className="flex items-center gap-4 text-xs text-gray-500 font-light">
                                        <span className="flex items-center gap-1">
                                            <Clock size={12} className="text-[#756E69]" />
                                            {formatLocalSlotTime(slot.startTime, slot.endTime)}
                                        </span>
                                        <span className="flex items-center gap-1">
                                            <MapPin size={12} className="text-[#756E69]" />
                                            {venue.name}
                                        </span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {event.myCheckin && (
                        <div className="mt-6 flex items-center gap-2 bg-green-50 border border-green-100 text-green-700 px-4 py-3 rounded-xl text-xs font-medium">
                            <CheckCircle2 size={14} /> You checked in for {event.myCheckin.slotName} ({event.myCheckin.status})
                        </div>
                    )}

                    {canConfirmOnline && (
                        <div className="mt-8 pt-6 border-t border-[#121212]/5">
                            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-3 flex items-center gap-1.5">
                                <Wifi size={12} /> Watching Online
                            </h3>
                            <p className="text-xs text-gray-500 font-light mb-3">
                                Joined this service remotely? Confirm your attendance below.
                            </p>

                            {onlineConfirmMessage ? (
                                <div className="flex items-center gap-2 bg-green-50 border border-green-100 text-green-700 px-4 py-3 rounded-xl text-xs font-medium">
                                    <CheckCircle2 size={14} /> {onlineConfirmMessage}
                                </div>
                            ) : (
                                <>
                                    {onlineConfirmError && (
                                        <p className="text-xs text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2 mb-3">
                                            {onlineConfirmError}
                                        </p>
                                    )}
                                    <button
                                        onClick={confirmOnlineAttendance}
                                        disabled={isConfirmingOnline}
                                        className="w-full bg-[#121212] text-white text-xs uppercase tracking-widest font-semibold py-3 rounded-xl hover:bg-gray-800 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                                    >
                                        {isConfirmingOnline ? (
                                            <><Loader2 size={13} className="animate-spin" /> Confirming…</>
                                        ) : (
                                            "Confirm Online Attendance"
                                        )}
                                    </button>
                                </>
                            )}
                        </div>
                    )}
                </div>
            ) : null}
        </div>
    );
};
