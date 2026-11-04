"use client";

import { useState } from "react";
import Link from "next/link";
import { notFound, useParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { Grid3x3, Keyboard } from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { TicTacToe } from "@/components/games/tic-tac-toe";
import { TypingTest } from "@/components/games/typing-test";
import { Leaderboard } from "@/components/games/leaderboard";

const GAMES = {
  "tic-tac-toe": { id: "tictactoe", title: "Tic-tac-toe", icon: Grid3x3, unit: "pts", hint: "Win = 3 pts, draw = 1 pt. Ranked by total points." },
  "typing-test": { id: "typing", title: "Typing Test", icon: Keyboard, unit: "wpm", hint: "Score = WPM × accuracy. Ranked by best run." },
};

export default function GamePage() {
  const { game: slug } = useParams<{ game: string }>();
  const { status } = useSession();
  const [refreshKey, setRefreshKey] = useState(0);

  const game = GAMES[slug as keyof typeof GAMES];
  if (!game) notFound();
  const Icon = game.icon;

  // Only signed-in users' results count toward the leaderboard; guests just play
  const submit = async (body: Record<string, unknown>) => {
    if (status !== "authenticated") return;
    try {
      const res = await fetch("/api/games/scores", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ game: game.id, ...body }),
      });
      if (!res.ok) throw new Error();
      setRefreshKey((k) => k + 1);
    } catch {
      toast.error("Couldn't save your score");
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-3 mb-6">
        <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-primary shadow-lg shadow-primary/20">
          <Icon className="w-5 h-5 text-primary-foreground" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-foreground leading-tight">{game.title}</h1>
          <p className="text-sm text-foreground/60">Take a break. Climb the leaderboard.</p>
        </div>
      </motion.div>

      <div className="grid lg:grid-cols-[1fr_360px] gap-6">
        <div className="bg-background/80 backdrop-blur-xl border border-border/50 rounded-2xl shadow-xl p-6 md:p-8">
          <p className="text-sm text-foreground/50 text-center mb-6">
            {game.hint}
            {status === "unauthenticated" && (
              <>
                {" "}Playing as guest, scores aren't saved.{" "}
                <Link href="/signin" className="text-primary font-semibold hover:underline">Sign in</Link> to join the leaderboard.
              </>
            )}
          </p>
          {game.id === "tictactoe" ? (
            <TicTacToe onFinish={(result) => submit({ result })} />
          ) : (
            <TypingTest onFinish={(wpm, accuracy) => submit({ wpm, accuracy })} />
          )}
        </div>

        <Leaderboard game={game.id} unit={game.unit} refreshKey={refreshKey} />
      </div>
    </div>
  );
}
