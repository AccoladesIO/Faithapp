"use client";

import React from "react";
import { REACTION_EMOJIS, ReactionEmoji, useAnnouncementReactions } from "@/hooks/use-announcement-reactions";

export function ReactionBar({ announcementId }: { announcementId: string }) {
    const { summary, myReaction, isSubmitting, react } = useAnnouncementReactions(announcementId);

    const countFor = (emoji: string) => summary.find((s) => s.emoji === emoji)?.count ?? 0;

    return (
        <div className="flex items-center gap-1.5 flex-wrap">
            {REACTION_EMOJIS.map((emoji) => {
                const count = countFor(emoji);
                const isMine = myReaction === emoji;
                return (
                    <button
                        key={emoji}
                        type="button"
                        disabled={isSubmitting}
                        onClick={() => react(emoji as ReactionEmoji)}
                        className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs border transition-colors disabled:opacity-50 ${
                            isMine
                                ? "bg-[#121212] text-white border-[#121212]"
                                : "bg-white text-[#121212] border-[#121212]/10 hover:border-[#121212]/30"
                        }`}
                    >
                        <span>{emoji}</span>
                        {count > 0 && <span className="text-[10px] font-semibold">{count}</span>}
                    </button>
                );
            })}
        </div>
    );
}
