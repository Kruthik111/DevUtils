"use client";

import { useEffect, useRef, useState } from "react";
import { RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const SNIPPETS = [
  "const sum = (nums) => nums.reduce((total, n) => total + n, 0);",
  "export default function App() { return <h1>Hello, world!</h1>; }",
  "if (!response.ok) throw new Error(`Request failed: ${response.status}`);",
  "const user = await User.findOne({ email }).select('+password');",
  "git commit -m \"fix: handle empty input\" && git push origin main",
  "SELECT name, COUNT(*) FROM orders GROUP BY name ORDER BY 2 DESC;",
  "useEffect(() => { const id = setInterval(tick, 1000); return () => clearInterval(id); }, []);",
  "const [state, setState] = useState<string | null>(null);",
  "docker run -d -p 8080:80 --name web --restart unless-stopped nginx:latest",
  "array.filter(Boolean).map((item) => item.trim().toLowerCase()).sort();",
];

const randomSnippet = (not?: string) => {
  const pool = SNIPPETS.filter((s) => s !== not);
  return pool[Math.floor(Math.random() * pool.length)];
};

export function TypingTest({ onFinish }: { onFinish: (wpm: number, accuracy: number) => void }) {
  const [target, setTarget] = useState(SNIPPETS[0]);
  const [typed, setTyped] = useState("");
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const [now, setNow] = useState(0);
  const [keystrokes, setKeystrokes] = useState({ total: 0, errors: 0 });
  const [result, setResult] = useState<{ wpm: number; accuracy: number } | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Pick the first snippet on the client only, so server and client HTML match
  useEffect(() => setTarget(randomSnippet()), []);

  // Tick the live WPM counter while typing
  useEffect(() => {
    if (!startedAt || result) return;
    const id = setInterval(() => setNow(Date.now()), 250);
    return () => clearInterval(id);
  }, [startedAt, result]);

  const minutes = startedAt ? (Math.max(now, startedAt) - startedAt) / 60000 : 0;
  const correct = [...typed].filter((c, i) => c === target[i]).length;
  const liveWpm = minutes > 0 ? Math.round(correct / 5 / minutes) : 0;
  const accuracy = keystrokes.total ? Math.round(((keystrokes.total - keystrokes.errors) / keystrokes.total) * 100) : 100;

  const handleChange = (value: string) => {
    if (result || value.length > target.length) return;

    const start = startedAt ?? Date.now();
    if (!startedAt) setStartedAt(start);

    // Count newly added characters, including ones later fixed with backspace
    const ks = { ...keystrokes };
    if (value.length > typed.length) {
      for (let i = typed.length; i < value.length; i++) {
        ks.total++;
        if (value[i] !== target[i]) ks.errors++;
      }
      setKeystrokes(ks);
    }
    setTyped(value);

    if (value.length === target.length) {
      const end = Date.now();
      const wpm = Math.round(target.length / 5 / ((end - start) / 60000));
      const acc = Math.round(((ks.total - ks.errors) / ks.total) * 100);
      setNow(end);
      setResult({ wpm, accuracy: acc });
      onFinish(wpm, acc);
    }
  };

  const reset = () => {
    setTarget(randomSnippet(target));
    setTyped("");
    setStartedAt(null);
    setNow(0);
    setKeystrokes({ total: 0, errors: 0 });
    setResult(null);
    inputRef.current?.focus();
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex justify-center gap-8 text-sm text-foreground/60">
        <span>WPM <b className="text-2xl text-foreground">{result?.wpm ?? liveWpm}</b></span>
        <span>Accuracy <b className="text-2xl text-foreground">{result?.accuracy ?? accuracy}%</b></span>
      </div>

      <div
        onClick={() => inputRef.current?.focus()}
        className="font-mono text-lg leading-relaxed p-6 rounded-2xl bg-foreground/5 border border-border/50 cursor-text break-all"
      >
        {[...target].map((char, i) => (
          <span
            key={i}
            className={cn(
              i >= typed.length && "text-foreground/40",
              i < typed.length && (typed[i] === char ? "text-foreground" : "text-red-500 bg-red-500/10"),
              i === typed.length && !result && "border-l-2 border-primary animate-pulse"
            )}
          >
            {char}
          </span>
        ))}
      </div>

      <input
        ref={inputRef}
        value={typed}
        onChange={(e) => handleChange(e.target.value)}
        onPaste={(e) => e.preventDefault()}
        disabled={!!result}
        autoFocus
        autoComplete="off"
        autoCorrect="off"
        autoCapitalize="off"
        spellCheck={false}
        aria-label="Type the snippet above"
        placeholder="Start typing to begin..."
        className="w-full h-16 px-5 rounded-xl border border-border bg-background text-foreground font-mono text-lg focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary"
      />

      <div className="flex items-center justify-between">
        <p className="font-semibold text-foreground">
          {result ? `Done! Score ${Math.round((result.wpm * result.accuracy) / 100)} (WPM × accuracy)` : ""}
        </p>
        <Button variant="outline" onClick={reset}>
          <RotateCcw className="w-4 h-4" /> {result ? "Next snippet" : "New snippet"}
        </Button>
      </div>
    </div>
  );
}
