"use client";

import React, { useState } from "react";
import { ArrowLeft, Trophy, CheckCircle2, XCircle, Users } from "lucide-react";
import { useRouter } from "next/navigation";
import { useGameSession, useSubmitAnswer } from "@/hooks/use-game-session";
import type { GameSessionStatePayload, PublicGameQuestion } from "@/hooks/use-game-session";

export const GameSessionPage = ({ code }: { code: string }) => {
    const router = useRouter();
    const { state, isLoading, error } = useGameSession(code);

    if (isLoading) {
        return (
            <div className="min-h-screen bg-[#FFFFFF] flex items-center justify-center">
                <div className="animate-pulse text-gray-400 text-xs uppercase tracking-widest">Loading game…</div>
            </div>
        );
    }

    if (error && !state) {
        return (
            <div className="min-h-screen bg-[#FFFFFF] px-6 pt-10 max-w-lg mx-auto flex flex-col items-start gap-3 text-gray-500">
                <button onClick={() => router.push("/games")} className="w-8 h-8 rounded-full bg-[#F4F1EA] flex items-center justify-center text-[#121212]">
                    <ArrowLeft size={16} />
                </button>
                <p className="text-sm font-light">{error}</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#FFFFFF] text-[#121212] pb-32 font-sans selection:bg-[#121212] selection:text-[#FFFFFF]">
            <div className="px-6 pt-6 pb-2 flex items-center justify-between max-w-lg mx-auto">
                <button
                    onClick={() => router.push("/games")}
                    className="w-8 h-8 rounded-full bg-[#F4F1EA] flex items-center justify-center text-[#121212] hover:bg-[#EADCC9] transition-colors"
                >
                    <ArrowLeft size={16} />
                </button>
                <span className="flex items-center gap-1.5 text-[10px] uppercase tracking-widest text-gray-500 font-semibold">
                    <Users size={12} />
                    {state?.participantCount ?? 0} playing
                </span>
            </div>

            <div className="px-6 pt-4 max-w-lg mx-auto space-y-5">
                {state?.status === "ENDED" ? (
                    <div className="text-center py-10 space-y-4">
                        <Trophy className="w-10 h-10 mx-auto text-amber-500" />
                        <h1 className="text-xl font-light text-[#121212]">Game Over!</h1>
                        <LeaderboardList entries={state.leaderboard} />
                    </div>
                ) : state?.currentQuestion ? (
                    <QuestionCard
                        key={state.currentQuestion.id}
                        code={code}
                        question={state.currentQuestion}
                        state={state}
                    />
                ) : (
                    <div className="text-center py-16 text-gray-500 font-light">
                        Waiting for the host to start the first question…
                    </div>
                )}

                {state?.status === "LIVE" && (
                    <div className="pt-4 border-t border-[#121212]/5">
                        <h2 className="text-[10px] uppercase tracking-widest text-gray-500 font-semibold mb-2">Leaderboard</h2>
                        <LeaderboardList entries={state.leaderboard} compact />
                    </div>
                )}
            </div>
        </div>
    );
};

// Keyed by question.id from the parent — remounting on a new question resets
// this component's local answer state for free, no reset-on-prop-change
// effect needed.
function QuestionCard({ code, question, state }: Readonly<{
    code: string;
    question: PublicGameQuestion;
    state: GameSessionStatePayload;
}>) {
    const { isSubmitting, submit } = useSubmitAnswer(code);
    const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
    const [result, setResult] = useState<{ isCorrect: boolean; pointsAwarded: number } | null>(null);
    const hasAnswered = selectedIndex !== null;

    async function handleAnswer(index: number) {
        if (hasAnswered || isSubmitting) return;
        setSelectedIndex(index);
        const res = await submit(question.id, index);
        if (res) setResult(res);
    }

    return (
        <>
            <div className="flex items-center justify-between text-[10px] uppercase tracking-widest text-gray-500 font-semibold">
                <span>Question {(state.currentQuestionIndex ?? 0) + 1} of {state.totalQuestions}</span>
                {state.secondsRemaining !== null && (
                    <span className={`font-mono text-sm ${state.secondsRemaining <= 5 ? "text-red-600" : "text-[#121212]"}`}>
                        {state.secondsRemaining}s
                    </span>
                )}
            </div>

            <h1 className="text-xl font-light tracking-tight text-[#121212] text-center leading-snug">
                {question.questionText}
            </h1>

            <div className="grid grid-cols-1 gap-3">
                {question.options.map((opt, i) => {
                    const isSelected = selectedIndex === i;
                    let stateClasses = "bg-white border-[#121212]/10 hover:border-[#121212]/30";
                    if (isSelected && result) {
                        stateClasses = result.isCorrect ? "bg-green-50 border-green-300" : "bg-red-50 border-red-300";
                    } else if (hasAnswered) {
                        stateClasses = "bg-white border-[#121212]/5 opacity-50";
                    }
                    return (
                        <button
                            key={opt + i}
                            onClick={() => handleAnswer(i)}
                            disabled={hasAnswered || isSubmitting}
                            className={`flex items-center justify-between border rounded-xl px-4 py-3.5 text-sm font-medium text-[#121212] transition-colors ${stateClasses}`}
                        >
                            {opt}
                            {isSelected && result && (
                                result.isCorrect
                                    ? <CheckCircle2 size={16} className="text-green-600" />
                                    : <XCircle size={16} className="text-red-600" />
                            )}
                        </button>
                    );
                })}
            </div>

            {result && (
                <div className={`text-center text-xs font-semibold ${result.isCorrect ? "text-green-700" : "text-red-700"}`}>
                    {result.isCorrect ? `Correct! +${result.pointsAwarded} points` : "Not quite — wait for the next question"}
                </div>
            )}
            {hasAnswered && !result && (
                <p className="text-center text-xs text-gray-500 font-light">Answer submitted — waiting for the host…</p>
            )}
        </>
    );
}

function LeaderboardList({ entries, compact }: Readonly<{ entries: { participantId: string; memberName: string; totalScore: number }[]; compact?: boolean }>) {
    if (entries.length === 0) {
        return <p className="text-center text-xs text-gray-400 font-light py-4">No players yet.</p>;
    }
    return (
        <div className="space-y-1.5">
            {entries.slice(0, compact ? 5 : entries.length).map((entry, i) => (
                <div key={entry.participantId} className="flex items-center justify-between bg-[#F4F1EA]/50 rounded-lg px-3 py-2 text-xs">
                    <span className="flex items-center gap-2 text-[#121212] font-medium">
                        <span className="text-gray-400 font-mono w-4">{i + 1}</span>
                        {entry.memberName}
                    </span>
                    <span className="font-mono text-[#121212]">{entry.totalScore}</span>
                </div>
            ))}
        </div>
    );
}
