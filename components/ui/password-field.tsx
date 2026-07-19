"use client";

import React, { useState } from "react";
import { Eye, EyeOff, Lock } from "lucide-react";

export function PasswordField({
    label,
    value,
    onChange,
    placeholder,
}: {
    label: string;
    value: string;
    onChange: (v: string) => void;
    placeholder?: string;
}) {
    const [show, setShow] = useState(false);
    return (
        <div>
            <label className="text-[10px] uppercase tracking-wider text-gray-500 font-bold block mb-1.5">
                {label}
            </label>
            <div className="relative rounded-xl border border-[#121212]/10 focus-within:border-[#121212]/30 transition-colors bg-[#F4F1EA]/20">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={15} />
                <input
                    type={show ? "text" : "password"}
                    required
                    placeholder={placeholder ?? "••••••••"}
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    className="w-full bg-transparent pl-11 pr-12 py-3.5 text-sm focus:outline-none"
                />
                <button
                    type="button"
                    onClick={() => setShow((s) => !s)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-600 focus:outline-none"
                >
                    {show ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
            </div>
        </div>
    );
}
