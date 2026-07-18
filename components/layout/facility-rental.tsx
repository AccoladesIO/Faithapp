"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import {
    ArrowLeft, Building2, Users, Loader2, ChevronRight, ChevronDown, CheckCircle2,
    Clock, XCircle, AlertCircle, Ban, Plus, Minus,
} from "lucide-react";
import { useRouter } from "next/navigation";
import {
    useFacilityRental, RentalFacility, RentalAddon, RentalBooking, BlockedRange,
} from "@/hooks/use-facility-rental";
import { formatCurrency } from "@/utils/currency";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatRange(startIso: string, endIso: string): string {
    const start = new Date(startIso);
    const end = new Date(endIso);
    const sameDay = start.toDateString() === end.toDateString();
    const dateOpts: Intl.DateTimeFormatOptions = { day: "numeric", month: "short", year: "numeric" };
    const timeOpts: Intl.DateTimeFormatOptions = { hour: "numeric", minute: "2-digit", hour12: true };
    if (sameDay) {
        return `${start.toLocaleDateString("en-GB", dateOpts)} · ${start.toLocaleTimeString("en-GB", timeOpts)} – ${end.toLocaleTimeString("en-GB", timeOpts)}`;
    }
    return `${start.toLocaleDateString("en-GB", dateOpts)} ${start.toLocaleTimeString("en-GB", timeOpts)} → ${end.toLocaleDateString("en-GB", dateOpts)} ${end.toLocaleTimeString("en-GB", timeOpts)}`;
}

function combineDateTime(date: string, time: string): string {
    return new Date(`${date}T${time}:00`).toISOString();
}

// ─── Status badge ─────────────────────────────────────────────────────────────

function BookingStatusBadge({ status }: { status: RentalBooking["status"] }) {
    const config: Record<RentalBooking["status"], { icon: React.ElementType; cls: string; label: string }> = {
        PENDING: { icon: Clock, cls: "bg-amber-50 text-amber-700", label: "Pending" },
        CONFIRMED: { icon: CheckCircle2, cls: "bg-blue-50 text-blue-700", label: "Confirmed" },
        IN_PROGRESS: { icon: Clock, cls: "bg-blue-50 text-blue-700", label: "In Progress" },
        COMPLETED: { icon: CheckCircle2, cls: "bg-green-50 text-green-700", label: "Completed" },
        CANCELLED: { icon: Ban, cls: "bg-gray-100 text-gray-500", label: "Cancelled" },
        REJECTED: { icon: XCircle, cls: "bg-red-50 text-red-600", label: "Rejected" },
    };
    const { icon: Icon, cls, label } = config[status];
    return (
        <div className={`flex items-center gap-1 px-2 py-0.5 rounded-full ${cls}`}>
            <Icon size={11} />
            <span className="text-[10px] font-bold uppercase tracking-wider">{label}</span>
        </div>
    );
}

// ─── Facility card ────────────────────────────────────────────────────────────

function FacilityCard({ facility, onSelect }: { facility: RentalFacility; onSelect: () => void }) {
    return (
        <button
            onClick={onSelect}
            className="w-full bg-white border border-[#121212]/5 rounded-2xl p-4 shadow-sm hover:border-[#121212]/15 transition-all text-left"
        >
            <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-medium text-[#121212]">{facility.name}</h3>
                    {facility.description && (
                        <p className="text-xs text-gray-500 font-light mt-1 line-clamp-2">{facility.description}</p>
                    )}
                    <div className="flex items-center gap-3 mt-2 text-[10px] text-gray-500 font-light">
                        {facility.capacity != null && (
                            <span className="flex items-center gap-1"><Users size={11} /> Up to {facility.capacity}</span>
                        )}
                        <span className="font-semibold text-[#121212]">{formatCurrency(facility.basePrice)} base</span>
                    </div>
                </div>
                <ChevronRight size={16} className="text-gray-500 flex-shrink-0 mt-0.5" />
            </div>
        </button>
    );
}

// ─── Booking form ─────────────────────────────────────────────────────────────

function BookingForm({
    facility, addons, onBack, onBooked,
}: {
    facility: RentalFacility;
    addons: RentalAddon[];
    onBack: () => void;
    onBooked: (booking: RentalBooking) => void;
}) {
    const { checkAvailability, createBooking, isSubmitting, error, setError } = useFacilityRental();
    const [date, setDate] = useState("");
    const [startTime, setStartTime] = useState("");
    const [endTime, setEndTime] = useState("");
    const [purpose, setPurpose] = useState("");
    const [quantities, setQuantities] = useState<Record<string, number>>({});
    const [blocked, setBlocked] = useState<BlockedRange[]>([]);
    const [checkingAvailability, setCheckingAvailability] = useState(false);

    useEffect(() => {
        if (!date) { setBlocked([]); return; }
        setCheckingAvailability(true);
        checkAvailability(facility.id, `${date}T00:00:00`, `${date}T23:59:59`)
            .then(setBlocked)
            .finally(() => setCheckingAvailability(false));
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [date, facility.id]);

    const toggleAddon = (id: string) => {
        setQuantities((p) => {
            const next = { ...p };
            if (next[id]) delete next[id];
            else next[id] = 1;
            return next;
        });
    };
    const setQty = (id: string, qty: number) => {
        setQuantities((p) => ({ ...p, [id]: Math.max(1, qty) }));
    };

    const selectedAddons = addons.filter((a) => quantities[a.id]);
    const addonServiceTotal = selectedAddons.reduce((sum, a) => sum + Number(a.price) * quantities[a.id], 0);
    const addonCautionTotal = selectedAddons.reduce((sum, a) => sum + Number(a.cautionAmount) * quantities[a.id], 0);
    const estimatedBeforeDiscount = Number(facility.basePrice) + addonServiceTotal;

    const canSubmit = !!date && !!startTime && !!endTime && !isSubmitting;

    const handleSubmit = async () => {
        setError(null);
        try {
            const booking = await createBooking({
                facilityId: facility.id,
                startDateTime: combineDateTime(date, startTime),
                endDateTime: combineDateTime(date, endTime),
                purpose: purpose || undefined,
                addons: selectedAddons.map((a) => ({ addonId: a.id, quantity: quantities[a.id] })),
            });
            onBooked(booking);
        } catch {
            /* error shown below */
        }
    };

    return (
        <div className="space-y-4">
            <button onClick={onBack} className="flex items-center gap-1.5 text-xs font-semibold text-[#756E69] hover:text-[#121212] transition-colors">
                <ArrowLeft size={14} /> Back to facilities
            </button>

            <div>
                <h2 className="text-lg font-normal text-[#121212] tracking-tight">{facility.name}</h2>
                {facility.description && <p className="text-xs text-gray-500 font-light mt-1">{facility.description}</p>}
            </div>

            <div className="grid grid-cols-3 gap-2">
                <div className="col-span-3">
                    <label className="text-[10px] uppercase tracking-wider text-gray-500 font-bold block mb-1.5">Date</label>
                    <input type="date" value={date} onChange={(e) => setDate(e.target.value)}
                        className="w-full bg-white border border-[#121212]/10 rounded-xl px-3 py-2.5 text-xs font-sans outline-none focus:border-[#121212]/30" />
                </div>
                <div className="col-span-3 sm:col-span-1">
                    <label className="text-[10px] uppercase tracking-wider text-gray-500 font-bold block mb-1.5">Start Time</label>
                    <input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)}
                        className="w-full bg-white border border-[#121212]/10 rounded-xl px-3 py-2.5 text-xs font-sans outline-none focus:border-[#121212]/30" />
                </div>
                <div className="col-span-3 sm:col-span-1">
                    <label className="text-[10px] uppercase tracking-wider text-gray-500 font-bold block mb-1.5">End Time</label>
                    <input type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)}
                        className="w-full bg-white border border-[#121212]/10 rounded-xl px-3 py-2.5 text-xs font-sans outline-none focus:border-[#121212]/30" />
                </div>
            </div>

            {date && (
                <div className="bg-[#F4F1EA]/60 border border-[#121212]/10 rounded-xl p-3">
                    <p className="text-[10px] uppercase tracking-wider text-gray-500 font-semibold mb-1.5">Already booked on this date</p>
                    {checkingAvailability ? (
                        <p className="text-xs text-gray-500 font-light flex items-center gap-1.5"><Loader2 size={11} className="animate-spin" /> Checking…</p>
                    ) : blocked.length === 0 ? (
                        <p className="text-xs text-green-700 font-light">No existing bookings — the whole day is open.</p>
                    ) : (
                        <div className="space-y-1">
                            {blocked.map((b, i) => (
                                <p key={i} className="text-xs text-gray-600 font-light">
                                    {new Date(b.start).toLocaleTimeString("en-GB", { hour: "numeric", minute: "2-digit", hour12: true })} – {new Date(b.end).toLocaleTimeString("en-GB", { hour: "numeric", minute: "2-digit", hour12: true })} ({b.reason})
                                </p>
                            ))}
                        </div>
                    )}
                </div>
            )}

            <div>
                <label className="text-[10px] uppercase tracking-wider text-gray-500 font-bold block mb-1.5">Purpose (Optional)</label>
                <textarea rows={2} value={purpose} onChange={(e) => setPurpose(e.target.value)} placeholder="What is this booking for?"
                    className="w-full bg-white border border-[#121212]/10 rounded-xl p-3 text-xs font-sans outline-none resize-none focus:border-[#121212]/30" />
            </div>

            {addons.length > 0 && (
                <div>
                    <label className="text-[10px] uppercase tracking-wider text-gray-500 font-bold block mb-1.5">Add-ons (Optional)</label>
                    <div className="space-y-2">
                        {addons.map((a) => {
                            const active = !!quantities[a.id];
                            return (
                                <div key={a.id} className={`bg-white border rounded-xl p-3 transition-colors ${active ? "border-[#121212]/20" : "border-[#121212]/5"}`}>
                                    <div className="flex items-center justify-between gap-2">
                                        <button onClick={() => toggleAddon(a.id)} className="flex-1 min-w-0 text-left">
                                            <p className="text-xs font-medium text-[#121212]">{a.name}</p>
                                            <p className="text-[10px] text-gray-500 font-light mt-0.5">
                                                {formatCurrency(a.price)}{Number(a.cautionAmount) > 0 && ` + ${formatCurrency(a.cautionAmount)} caution`}
                                            </p>
                                        </button>
                                        {active ? (
                                            <div className="flex items-center gap-1.5 flex-shrink-0">
                                                <button onClick={() => setQty(a.id, quantities[a.id] - 1)} className="w-6 h-6 rounded-full bg-[#F4F1EA] flex items-center justify-center text-[#121212]"><Minus size={12} /></button>
                                                <span className="text-xs font-semibold w-4 text-center">{quantities[a.id]}</span>
                                                <button onClick={() => setQty(a.id, quantities[a.id] + 1)} className="w-6 h-6 rounded-full bg-[#F4F1EA] flex items-center justify-center text-[#121212]"><Plus size={12} /></button>
                                            </div>
                                        ) : (
                                            <button onClick={() => toggleAddon(a.id)} className="text-[10px] uppercase tracking-wider font-bold text-[#121212] border border-[#121212]/20 px-2.5 py-1 rounded-lg flex-shrink-0">Add</button>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            <div className="bg-[#121212] text-white rounded-2xl p-4 space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                    <span className="text-white/60">Facility base price</span>
                    <span>{formatCurrency(facility.basePrice)}</span>
                </div>
                {addonServiceTotal > 0 && (
                    <div className="flex items-center justify-between text-xs">
                        <span className="text-white/60">Add-ons</span>
                        <span>{formatCurrency(addonServiceTotal)}</span>
                    </div>
                )}
                {addonCautionTotal > 0 && (
                    <div className="flex items-center justify-between text-xs">
                        <span className="text-white/60">Refundable caution</span>
                        <span>{formatCurrency(addonCautionTotal)}</span>
                    </div>
                )}
                <div className="flex items-center justify-between text-sm font-semibold pt-1.5 border-t border-white/10">
                    <span>Estimated total</span>
                    <span>{formatCurrency(estimatedBeforeDiscount + addonCautionTotal)}</span>
                </div>
                <p className="text-[9px] text-white/50 font-light leading-relaxed">
                    Before any membership discount — your final price is shown after booking.
                </p>
            </div>

            {error && <p className="text-xs text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">{error}</p>}

            <button onClick={handleSubmit} disabled={!canSubmit}
                className="w-full bg-[#121212] text-white text-xs uppercase tracking-widest font-semibold py-3 rounded-xl hover:bg-gray-800 transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
                {isSubmitting ? <><Loader2 size={13} className="animate-spin" /> Submitting…</> : "Request Booking"}
            </button>
        </div>
    );
}

// ─── Booking confirmation ─────────────────────────────────────────────────────

function BookingConfirmation({ booking, onDone }: { booking: RentalBooking; onDone: () => void }) {
    return (
        <div className="space-y-5 text-center">
            <div className="w-14 h-14 rounded-full bg-green-50 text-green-600 flex items-center justify-center mx-auto">
                <CheckCircle2 size={28} />
            </div>
            <div>
                <h3 className="text-lg font-normal tracking-tight text-[#121212]">Booking Requested</h3>
                <p className="text-xs text-gray-500 font-light mt-1">{booking.facility.name} · {formatRange(booking.startDateTime, booking.endDateTime)}</p>
            </div>
            <div className="bg-[#F4F1EA] rounded-2xl p-5 text-left space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-500">Service fee</span>
                    <span className="font-medium text-[#121212]">{formatCurrency(booking.serviceFee)}</span>
                </div>
                {booking.cautionTotal > 0 && (
                    <div className="flex items-center justify-between text-xs">
                        <span className="text-gray-500">Refundable caution</span>
                        <span className="font-medium text-[#121212]">{formatCurrency(booking.cautionTotal)}</span>
                    </div>
                )}
                <div className="flex items-center justify-between text-sm font-semibold pt-1.5 border-t border-[#121212]/10">
                    <span>Total due</span>
                    <span>{formatCurrency(booking.grandTotal)}</span>
                </div>
            </div>
            <p className="text-xs text-gray-500 font-light">Your booking is pending admin confirmation. Track its status under My Bookings.</p>
            <button onClick={onDone} className="w-full bg-[#121212] text-white text-xs uppercase tracking-widest font-semibold py-3 rounded-xl hover:bg-gray-800 transition-colors">
                View My Bookings
            </button>
        </div>
    );
}

// ─── Booking card (My Bookings list) ─────────────────────────────────────────

function BookingCard({ booking, onCancel, isSubmitting }: { booking: RentalBooking; onCancel: (id: string) => void; isSubmitting: boolean }) {
    const [expanded, setExpanded] = useState(false);
    const canCancel = booking.status === "PENDING" || booking.status === "CONFIRMED";

    return (
        <div className="bg-white border border-[#121212]/5 rounded-xl overflow-hidden">
            <button onClick={() => setExpanded((p) => !p)} className="w-full flex items-center justify-between p-3.5 text-left hover:bg-[#F9F9F9] transition-colors">
                <div className="min-w-0">
                    <div className="flex items-center gap-1.5 mb-1"><BookingStatusBadge status={booking.status} /></div>
                    <p className="text-xs font-medium text-[#121212] truncate">{booking.facility.name}</p>
                    <p className="text-[10px] text-gray-500 font-light mt-0.5">{formatRange(booking.startDateTime, booking.endDateTime)}</p>
                </div>
                {expanded ? <ChevronDown size={14} className="text-gray-500 flex-shrink-0 ml-2" /> : <ChevronRight size={14} className="text-gray-500 flex-shrink-0 ml-2" />}
            </button>
            {expanded && (
                <div className="px-3.5 pb-3.5 space-y-2.5 border-t border-[#121212]/5 pt-3">
                    {booking.purpose && <p className="text-xs text-gray-600 font-light"><span className="font-semibold text-[#121212]">Purpose:</span> {booking.purpose}</p>}
                    {booking.bookingAddons.length > 0 && (
                        <div className="space-y-0.5">
                            <p className="text-[10px] uppercase tracking-wider font-semibold text-gray-500">Add-ons</p>
                            {booking.bookingAddons.map((ba) => (
                                <p key={ba.id} className="text-xs text-gray-600 font-light">{ba.addon.name} × {ba.quantity} — {formatCurrency(Number(ba.addon.price) * ba.quantity)}</p>
                            ))}
                        </div>
                    )}
                    <div className="bg-[#F9F9F9] rounded-lg p-3 space-y-1">
                        <div className="flex items-center justify-between text-xs"><span className="text-gray-500">Service fee</span><span className="font-medium text-[#121212]">{formatCurrency(booking.serviceFee)}</span></div>
                        {booking.cautionTotal > 0 && <div className="flex items-center justify-between text-xs"><span className="text-gray-500">Caution</span><span className="font-medium text-[#121212]">{formatCurrency(booking.cautionTotal)}</span></div>}
                        <div className="flex items-center justify-between text-xs font-semibold pt-1 border-t border-[#121212]/10"><span>Total</span><span>{formatCurrency(booking.grandTotal)}</span></div>
                    </div>
                    {booking.payments.length > 0 && (
                        <div className="space-y-0.5">
                            <p className="text-[10px] uppercase tracking-wider font-semibold text-gray-500">Payments</p>
                            {booking.payments.map((p) => (
                                <div key={p.id} className="flex items-center justify-between text-xs text-gray-600 font-light">
                                    <span>{p.type === "SERVICE_FEE" ? "Service Fee" : "Caution"}</span>
                                    <span className={`font-semibold ${p.status === "PAID" ? "text-green-600" : p.status === "REFUNDED" ? "text-blue-600" : "text-amber-600"}`}>{p.status}</span>
                                </div>
                            ))}
                        </div>
                    )}
                    {booking.rejectionReason && (
                        <p className="text-xs text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">{booking.rejectionReason}</p>
                    )}
                    {canCancel && (
                        <button onClick={() => onCancel(booking.id)} disabled={isSubmitting}
                            className="w-full border border-red-100 text-red-600 text-[10px] uppercase tracking-widest font-semibold py-2.5 rounded-xl hover:bg-red-50 transition-colors disabled:opacity-50">
                            {isSubmitting ? "Cancelling…" : "Cancel Booking"}
                        </button>
                    )}
                </div>
            )}
        </div>
    );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export const FacilityRentalPage = () => {
    const router = useRouter();
    const {
        facilities, addons, bookings, isLoading, isSubmitting, error,
        fetchFacilities, fetchAddons, fetchMyBookings, cancelBooking,
    } = useFacilityRental();

    const [tab, setTab] = useState<"book" | "bookings">("book");
    const [selectedFacility, setSelectedFacility] = useState<RentalFacility | null>(null);
    const [confirmedBooking, setConfirmedBooking] = useState<RentalBooking | null>(null);

    useEffect(() => {
        fetchFacilities();
        fetchAddons();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        if (tab === "bookings") fetchMyBookings();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [tab]);

    const handleBooked = (booking: RentalBooking) => {
        setSelectedFacility(null);
        setConfirmedBooking(booking);
    };

    const handleDoneConfirming = () => {
        setConfirmedBooking(null);
        setTab("bookings");
    };

    return (
        <div className="min-h-screen bg-[#FFFFFF] text-[#121212] pb-32 font-sans selection:bg-[#121212] selection:text-[#FFFFFF]">
            <div className="relative w-full h-[40vh] overflow-hidden">
                <Image src="/images/facility-rental-hall.jpg" alt="Empty event hall" fill priority sizes="100vw" className="object-cover" />
                <div className="absolute inset-0 bg-black/50" />
                <div className="absolute top-4 left-4 z-10">
                    <button onClick={() => router.back()} className="p-2.5 bg-black/25 backdrop-blur-md hover:bg-black/40 text-white rounded-full transition-colors border border-white/10" aria-label="Go back">
                        <ArrowLeft size={16} />
                    </button>
                </div>
                <div className="absolute bottom-0 inset-x-0 p-6">
                    <span className="text-xs uppercase tracking-widest text-white/80 font-semibold flex items-center gap-1 drop-shadow-sm">
                        <Building2 size={12} /> Facilities
                    </span>
                    <h1 className="text-2xl font-light tracking-tight text-white mt-1 drop-shadow-md">Facility Rental</h1>
                </div>
            </div>

            <div className="px-6 mt-6 max-w-lg mx-auto space-y-4">
                {!selectedFacility && !confirmedBooking && (
                    <div className="flex bg-[#F4F1EA] p-0.5 rounded-xl">
                        <button onClick={() => setTab("book")} className={`flex-1 py-2 text-[10px] font-bold uppercase tracking-wider rounded-lg transition-colors ${tab === "book" ? "bg-white text-[#121212] shadow-sm" : "text-[#756E69]"}`}>
                            Book a Facility
                        </button>
                        <button onClick={() => setTab("bookings")} className={`flex-1 py-2 text-[10px] font-bold uppercase tracking-wider rounded-lg transition-colors ${tab === "bookings" ? "bg-white text-[#121212] shadow-sm" : "text-[#756E69]"}`}>
                            My Bookings {bookings.length > 0 && `(${bookings.length})`}
                        </button>
                    </div>
                )}

                {confirmedBooking ? (
                    <BookingConfirmation booking={confirmedBooking} onDone={handleDoneConfirming} />
                ) : selectedFacility ? (
                    <BookingForm facility={selectedFacility} addons={addons} onBack={() => setSelectedFacility(null)} onBooked={handleBooked} />
                ) : tab === "book" ? (
                    isLoading ? (
                        <div className="space-y-2 animate-pulse">{[1, 2, 3].map((i) => <div key={i} className="h-24 bg-gray-100 rounded-2xl" />)}</div>
                    ) : error ? (
                        <div className="flex flex-col items-start gap-2 py-8 text-gray-500"><AlertCircle size={20} /><p className="text-sm font-light">{error}</p></div>
                    ) : facilities.length === 0 ? (
                        <p className="text-xs text-gray-500 font-light text-center py-8">No facilities are available for booking right now.</p>
                    ) : (
                        <div className="space-y-2.5">
                            {facilities.map((f) => <FacilityCard key={f.id} facility={f} onSelect={() => setSelectedFacility(f)} />)}
                        </div>
                    )
                ) : (
                    isLoading ? (
                        <div className="space-y-2 animate-pulse">{[1, 2].map((i) => <div key={i} className="h-16 bg-gray-100 rounded-xl" />)}</div>
                    ) : error ? (
                        <p className="text-xs text-red-500 text-center py-8">{error}</p>
                    ) : bookings.length === 0 ? (
                        <p className="text-xs text-gray-500 font-light text-center py-8">You haven&apos;t booked a facility yet.</p>
                    ) : (
                        <div className="space-y-2">
                            {bookings.map((b) => <BookingCard key={b.id} booking={b} onCancel={cancelBooking} isSubmitting={isSubmitting} />)}
                        </div>
                    )
                )}
            </div>
        </div>
    );
};
