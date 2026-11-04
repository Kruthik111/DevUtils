"use client";

import { useEffect, useState } from "react";
import { Trophy, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

type Entry = { userId: string; name: string; image?: string; score: number; games: number };

export function Leaderboard({ game, unit, refreshKey }: { game: string; unit: string; refreshKey: number }) {
  const [period, setPeriod] = useState<"weekly" | "overall">("weekly");
  const [data, setData] = useState<{ weekly: Entry[]; overall: Entry[] } | null>(null);

  useEffect(() => {
    fetch(`/api/games/scores?game=${game}`)
      .then((res) => (res.ok ? res.json() : null))
      .then(setData)
      .catch(() => setData(null));
  }, [game, refreshKey]);

  const entries = data?.[period] ?? [];

  return (
    <div className="bg-background/80 backdrop-blur-xl border border-border/50 rounded-2xl shadow-xl p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="flex items-center gap-2 font-bold text-foreground">
          <Trophy className="w-5 h-5 text-primary" /> Leaderboard
        </h2>
        <div className="flex bg-foreground/5 rounded-xl p-1 text-xs font-semibold">
          {(["weekly", "overall"] as const).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={cn(
                "px-3 py-1.5 rounded-lg capitalize transition-colors",
                period === p ? "bg-primary text-primary-foreground" : "text-foreground/60 hover:text-foreground"
              )}
            >
              {p === "weekly" ? "This week" : "All time"}
            </button>
          ))}
        </div>
      </div>

      {!data ? (
        <div className="flex justify-center py-8">
          <Loader2 className="w-5 h-5 animate-spin text-foreground/40" />
        </div>
      ) : entries.length === 0 ? (
        <p className="text-sm text-foreground/50 text-center py-8">No scores yet. Be the first!</p>
      ) : (
        <ol className="space-y-1">
          {entries.map((e, i) => (
            <li key={e.userId} className="flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-foreground/5">
              <span className={cn("w-6 text-sm font-bold", i < 3 ? "text-primary" : "text-foreground/40")}>{i + 1}</span>
              {e.image ? (
                <img src={e.image} alt="" className="w-7 h-7 rounded-full" referrerPolicy="no-referrer" />
              ) : (
                <span className="w-7 h-7 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center">
                  {e.name[0]?.toUpperCase()}
                </span>
              )}
              <span className="flex-1 truncate text-sm text-foreground">{e.name}</span>
              <span className="text-sm font-bold text-foreground">
                {e.score} <span className="text-xs font-normal text-foreground/50">{unit}</span>
              </span>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
