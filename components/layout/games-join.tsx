"use client";

import React, { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { ArrowLeft, Gamepad2 } from "lucide-react";
import { useJoinGame } from "@/hooks/use-game-session";

export const GamesJoinPage = () => {
    const router = useRouter();
    const { isJoining, error, join } = useJoinGame();
    const [code, setCode] = useState("");

    async function handleJoin(e: React.FormEvent) {
        e.preventDefault();
        const trimmed = code.trim().toUpperCase();
        if (!trimmed) return;
        const ok = await join(trimmed);
        if (ok) router.push(`/games/${trimmed}`);
    }

    return (
        <div className="min-h-screen bg-[#FFFFFF] text-[#121212] pb-32 font-sans selection:bg-[#121212] selection:text-[#FFFFFF]">
            <div className="relative w-full h-[32vh] overflow-hidden">
                <Image src="/images/teamwork-hands-unity.jpg" alt="Group of hands together" fill priority sizes="100vw" className="object-cover" />
                <div className="absolute inset-0 bg-black/50" />
                <div className="absolute top-4 left-4 z-10">
                    <button
                        onClick={() => router.back()}
                        className="p-2.5 bg-black/25 backdrop-blur-md hover:bg-black/40 text-white rounded-full transition-colors border border-white/10"
                        aria-label="Go back"
                    >
                        <ArrowLeft size={16} />
                    </button>
                </div>
                <div className="absolute bottom-0 inset-x-0 p-6">
                    <span className="text-xs uppercase tracking-widest text-white/80 font-semibold flex items-center gap-1 drop-shadow-sm">
                        <Gamepad2 size={12} /> Play Together
                    </span>
                    <h1 className="text-2xl font-light tracking-tight text-white mt-1 drop-shadow-md">
                        Join a Game
                    </h1>
                </div>
            </div>

            <div className="px-6 mt-8 max-w-lg mx-auto">
                <form onSubmit={handleJoin} className="space-y-4">
                    <div>
                        <label htmlFor="join-code" className="text-[10px] uppercase tracking-wider text-gray-500 font-bold block mb-1.5">
                            Join Code
                        </label>
                        <input
                            id="join-code"
                            autoFocus
                            value={code}
                            onChange={(e) => setCode(e.target.value)}
                            placeholder="GAME-XXXXXX"
                            className="w-full bg-white border border-[#121212]/10 rounded-xl px-4 py-4 text-center text-lg font-mono tracking-widest uppercase outline-none focus:border-[#121212]/30"
                        />
                    </div>

                    {error && (
                        <div className="bg-red-50 border border-red-100 text-red-700 px-4 py-3 rounded-xl text-xs font-medium">
                            {error}
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={isJoining || !code.trim()}
                        className="w-full bg-[#121212] text-white py-3.5 rounded-xl text-xs font-semibold uppercase tracking-wider hover:bg-[#121212]/90 transition-colors disabled:opacity-40"
                    >
                        {isJoining ? "Joining…" : "Join Game"}
                    </button>
                </form>

                <p className="text-xs text-gray-500 font-light text-center mt-6">
                    Ask whoever is hosting for the join code — it looks like GAME-X7K2P9.
                </p>
            </div>
        </div>
    );
};
