"use client";

import { useEffect, useRef, useState } from "react";
import { RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type Cell = "X" | "O" | null;
type Result = "win" | "draw" | "loss";

const LINES = [
  [0, 1, 2], [3, 4, 5], [6, 7, 8],
  [0, 3, 6], [1, 4, 7], [2, 5, 8],
  [0, 4, 8], [2, 4, 6],
];
const MISTAKE_CHANCE = 0.2; // how often the computer plays a random move, so it can be beaten
const COMPUTER_DELAY_MS = 1000; // pause before the computer moves, so it feels like it's thinking

function winner(board: Cell[]) {
  for (const [a, b, c] of LINES) {
    if (board[a] && board[a] === board[b] && board[a] === board[c]) return { mark: board[a], line: [a, b, c] };
  }
  return null;
}

// Score from O's (computer's) point of view
function minimax(board: Cell[], turn: "X" | "O"): number {
  const w = winner(board);
  if (w) return w.mark === "O" ? 1 : -1;
  if (board.every(Boolean)) return 0;

  const scores = board.flatMap((c, i) => {
    if (c) return [];
    const next = [...board];
    next[i] = turn;
    return [minimax(next, turn === "X" ? "O" : "X")];
  });
  return turn === "O" ? Math.max(...scores) : Math.min(...scores);
}

function computerMove(board: Cell[]) {
  const empty = board.flatMap((c, i) => (c ? [] : [i]));
  if (Math.random() < MISTAKE_CHANCE) return empty[Math.floor(Math.random() * empty.length)];

  let best = empty[0];
  let bestScore = -Infinity;
  for (const i of empty) {
    const next = [...board];
    next[i] = "O";
    const s = minimax(next, "X");
    if (s > bestScore) [best, bestScore] = [i, s];
  }
  return best;
}

function outcome(board: Cell[]): Result | null {
  const w = winner(board);
  if (w) return w.mark === "X" ? "win" : "loss";
  return board.every(Boolean) ? "draw" : null;
}

export function TicTacToe({ onFinish }: { onFinish: (result: Result) => void }) {
  const [board, setBoard] = useState<Cell[]>(Array(9).fill(null));
  const [tally, setTally] = useState({ win: 0, draw: 0, loss: 0 });
  const [thinking, setThinking] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => () => clearTimeout(timer.current), []);

  const result = outcome(board);
  const winLine = winner(board)?.line ?? [];

  const finish = (r: Result) => {
    setTally((t) => ({ ...t, [r]: t[r] + 1 }));
    onFinish(r);
  };

  const play = (i: number) => {
    if (board[i] || result || thinking) return;

    const next = [...board];
    next[i] = "X";
    setBoard(next);
    const r = outcome(next);
    if (r) return finish(r);

    setThinking(true);
    timer.current = setTimeout(() => {
      const after = [...next];
      after[computerMove(next)] = "O";
      setBoard(after);
      setThinking(false);
      const r2 = outcome(after);
      if (r2) finish(r2);
    }, COMPUTER_DELAY_MS);
  };

  const restart = () => {
    clearTimeout(timer.current);
    setThinking(false);
    setBoard(Array(9).fill(null));
  };

  const message = { win: "You win! +3", draw: "Draw. +1", loss: "Computer wins." };

  return (
    <div className="flex flex-col items-center gap-6">
      <div className="flex gap-6 text-sm text-foreground/60">
        <span>Wins <b className="text-foreground">{tally.win}</b></span>
        <span>Draws <b className="text-foreground">{tally.draw}</b></span>
        <span>Losses <b className="text-foreground">{tally.loss}</b></span>
      </div>

      <div className="grid grid-cols-3 gap-2 w-full max-w-xs">
        {board.map((cell, i) => (
          <button
            key={i}
            onClick={() => play(i)}
            disabled={!!cell || !!result || thinking}
            aria-label={`Cell ${i + 1}${cell ? `, ${cell}` : ""}`}
            className={cn(
              "aspect-square rounded-2xl border border-border/50 bg-foreground/5 text-4xl font-bold transition-all",
              !cell && !result && !thinking && "hover:bg-primary/10 hover:border-primary/50",
              cell === "X" ? "text-primary" : "text-foreground/70",
              winLine.includes(i) && "bg-primary/20 border-primary"
            )}
          >
            {cell}
          </button>
        ))}
      </div>

      <p className="h-6 font-semibold text-foreground" aria-live="polite">
        {result ? message[result] : thinking ? "Computer is thinking..." : "You are X. Your move."}
      </p>

      <Button variant="outline" onClick={restart}>
        <RotateCcw className="w-4 h-4" /> {result ? "Play again" : "Restart"}
      </Button>
    </div>
  );
}
