"use client";

import { useState, useMemo, useEffect } from "react";
import {
  Check,
  X,
  Copy,
  Trash2,
  Sparkles,
  Search,
  ExternalLink,
  SortAsc,
  ChevronDown,
  ChevronUp,
  ArrowRightLeft,
  Link,
  Unlink,
} from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface ExternalTool {
  name: string;
  url: string;
  description: string;
}

const externalTools: ExternalTool[] = [
  {
    name: "JSONLint",
    url: "https://jsonlint.com",
    description:
      "Validate, prettify, sort keys, JSON to CSV converter and more",
  },
  {
    name: "JSON Editor Online",
    url: "https://jsoneditoronline.org",
    description: "View, edit, format, and validate JSON in a tree or code view",
  },
  {
    name: "JSON Formatter",
    url: "https://jsonformatter.curiousconcept.com",
    description: "Format and validate JSON with multiple output options",
  },
  {
    name: "JSON Crack",
    url: "https://jsoncrack.com",
    description:
      "Visualize JSON data into interactive graphs and tree diagrams",
  },
  {
    name: "JSON Path Finder",
    url: "https://jsonpathfinder.com",
    description: "Find paths to values within your JSON structure",
  },
];

function sortObjectKeys(obj: unknown): unknown {
  if (Array.isArray(obj)) {
    return obj.map(sortObjectKeys);
  }
  if (obj !== null && typeof obj === "object") {
    return Object.keys(obj as Record<string, unknown>)
      .sort()
      .reduce((sorted: Record<string, unknown>, key) => {
        sorted[key] = sortObjectKeys((obj as Record<string, unknown>)[key]);
        return sorted;
      }, {});
  }
  return obj;
}

type Action = "prettify" | "minify" | "sort" | "encode" | "decode";

export default function JsonToolsPage() {
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [activeAction, setActiveAction] = useState<Action>("decode");
  const [searchQuery, setSearchQuery] = useState("");
  const [indentSize, setIndentSize] = useState(2);
  const [showExternalTools, setShowExternalTools] = useState(true);

  // --- Validator logic ---
  const validation = useMemo(() => {
    if (!input.trim()) return { valid: null, error: null, parsed: null };
    try {
      const parsed = JSON.parse(input);
      return { valid: true, error: null, parsed };
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : "Invalid JSON";
      return { valid: false, error: message, parsed: null };
    }
  }, [input]);

  // JSON actions work on the input, or fall back to the result pane (so
  // decode → minify/sort chains work without swapping first)
  const outputJson = useMemo(() => {
    if (!output.trim()) return null;
    try {
      return { value: JSON.parse(output) as unknown };
    } catch {
      return null;
    }
  }, [output]);

  const jsonSource = validation.valid
    ? { value: validation.parsed as unknown }
    : outputJson;

  // One entry point for every action. Button clicks run it loud (toasts);
  // the auto-run effect below re-runs the active action silently as you type.
  const applyAction = (action: Action, silent = false) => {
    setActiveAction(action);

    if (!input.trim()) {
      setOutput("");
      if (!silent) toast.error(action === "decode" ? "Nothing to decode" : action === "encode" ? "Nothing to encode" : "Nothing to process");
      return;
    }

    switch (action) {
      case "encode":
        setOutput(encodeURIComponent(input));
        if (!silent) toast.success("URL encoded");
        return;
      case "decode":
        try {
          setOutput(decodeURIComponent(input));
          if (!silent) toast.success("URL decoded");
        } catch {
          if (!silent) toast.error("Invalid URL-encoded string");
        }
        return;
      case "prettify":
        if (!jsonSource) {
          if (!silent) toast.error(validation.error ?? "No valid JSON to format");
          return;
        }
        setOutput(JSON.stringify(jsonSource.value, null, indentSize));
        if (!silent) toast.success("JSON prettified");
        return;
      case "minify":
        if (!jsonSource) {
          if (!silent) toast.error("No valid JSON to minify");
          return;
        }
        setOutput(JSON.stringify(jsonSource.value));
        if (!silent) toast.success("JSON minified");
        return;
      case "sort":
        if (!jsonSource) {
          if (!silent) toast.error("No valid JSON to sort");
          return;
        }
        setOutput(JSON.stringify(sortObjectKeys(jsonSource.value), null, indentSize));
        if (!silent) toast.success("Keys sorted alphabetically");
        return;
    }
  };

  // Auto-run: pasting or editing the input immediately produces output for the
  // selected action — no button click needed.
  useEffect(() => {
    applyAction(activeAction, true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [input, indentSize]);

  const handleCopy = async (text: string) => {
    if (!text.trim()) {
      toast.error("Nothing to copy");
      return;
    }
    try {
      await navigator.clipboard.writeText(text);
      toast.success("Copied to clipboard");
    } catch {
      toast.error("Failed to copy");
    }
  };

  const handleClear = () => {
    setInput("");
    setOutput("");
    setSearchQuery("");
    toast.success("Cleared all");
  };

  const searchResults = useMemo(() => {
    if (!searchQuery.trim() || !validation.valid || !validation.parsed) return [];

    const results: { path: string; value: string }[] = [];

    function traverse(obj: unknown, path: string) {
      if (obj !== null && typeof obj === "object") {
        for (const [key, value] of Object.entries(obj as Record<string, unknown>)) {
          const currentPath = path ? `${path}.${key}` : key;
          const keyMatch = key.toLowerCase().includes(searchQuery.toLowerCase());
          const valueMatch =
            typeof value === "string" &&
            value.toLowerCase().includes(searchQuery.toLowerCase());
          const numMatch =
            typeof value === "number" &&
            String(value).includes(searchQuery);

          if (keyMatch || valueMatch || numMatch) {
            results.push({
              path: currentPath,
              value: JSON.stringify(value),
            });
          }

          if (typeof value === "object" && value !== null) {
            traverse(value, currentPath);
          }
        }
      }
    }

    traverse(validation.parsed, "");
    return results;
  }, [searchQuery, validation.valid, validation.parsed]);

  const lineCount = input.split("\n").length;
  const outputLineCount = output.split("\n").length;

  const actionBtn = (active: boolean) =>
    cn(
      "flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all duration-200 w-full disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-secondary disabled:hover:border-border",
      active
        ? "bg-primary text-primary-foreground border border-primary shadow-sm"
        : "bg-secondary border border-border text-foreground hover:bg-accent hover:border-primary/40"
    );

  const handleSwap = () => {
    setInput(output);
    setOutput(input);
  };

  return (
    <div className="min-h-screen p-4 md:p-8 bg-background">
      <div className="max-w-[1800px] mx-auto">
            {/* Validation Status */}
            {input.trim() && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className={cn(
                  "mb-4 px-4 py-2.5 rounded-xl border flex items-center justify-between text-xs font-bold uppercase tracking-wider transition-colors",
                  validation.valid
                    ? "bg-green-500/10 border-green-500/20 text-green-600"
                    : "bg-secondary border-border text-foreground/60"
                )}
              >
                <div className="flex items-center gap-3">
                  {validation.valid ? <Check className="w-4 h-4" /> : <X className="w-4 h-4" />}
                  <span>{validation.valid ? "JSON is Valid" : `Not valid JSON: ${validation.error}`}</span>
                </div>
              </motion.div>
            )}

            {/* Search - above the editors */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="mb-4"
            >
              <div className="bg-secondary border border-border rounded-2xl p-4">
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground/55" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search paths or values in your parsed JSON..."
                    className={cn(
                      "w-full pl-11 pr-4 py-3 rounded-xl border border-border",
                      "bg-background text-foreground",
                      "focus:outline-none focus:ring-1 focus:ring-primary/50",
                      "transition-all duration-200 text-sm"
                    )}
                  />
                </div>

                {searchQuery.trim() && validation.valid && (
                  <div className="mt-4 border-t border-border pt-4 max-h-64 overflow-y-auto custom-scrollbar">
                    {searchResults.length > 0 ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        {searchResults.map((result, i) => (
                          <div
                            key={i}
                            className="flex items-center justify-between gap-3 text-xs p-3 rounded-xl bg-background border border-border hover:border-primary/30 transition-all"
                          >
                            <div className="flex flex-col gap-1 overflow-hidden">
                              <span className="text-primary font-black tracking-tighter truncate">
                                {result.path}
                              </span>
                              <span className="text-foreground/60 font-mono truncate">
                                {result.value}
                              </span>
                            </div>
                            <button
                              onClick={() => handleCopy(result.value)}
                              className="shrink-0 p-2 text-foreground/45 hover:text-foreground transition-colors"
                            >
                              <Copy className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-center py-4 text-xs font-bold text-foreground/45 uppercase tracking-widest">No matching keys or values</p>
                    )}
                  </div>
                )}
              </div>
            </motion.div>

            {/* Editors Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-[1fr_200px_1fr] gap-4 items-stretch mb-8">
              {/* Left Column - Input */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
                className="flex flex-col h-full"
              >
                <div className="bg-secondary border border-border rounded-2xl shadow-xl overflow-hidden flex flex-col grow">
                  <div className="flex items-center justify-between px-5 py-3 border-b border-border bg-accent/40">
                    <div className="flex items-center gap-2 uppercase tracking-widest text-[10px] font-black text-foreground">
                      <div className="w-2 h-2 rounded-full bg-primary" />
                      Input
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="text-[10px] font-bold text-foreground/55 uppercase">
                        {input.trim() ? `${lineCount} LINES · ${input.length} CHARS` : "Paste below"}
                      </span>
                      {input && (
                        <button
                          onClick={() => handleCopy(input)}
                          className="text-primary hover:text-primary/80 transition-colors"
                          title="Copy input"
                        >
                          <Copy className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                  <textarea
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    spellCheck={false}
                    className={cn(
                      "w-full min-h-[500px] p-6 font-mono text-sm",
                      "bg-secondary text-foreground",
                      "focus:outline-none resize-none leading-relaxed",
                      "placeholder:text-foreground/45"
                    )}
                    placeholder={'Paste JSON to validate/format, or any text to URL encode/decode...\n\n{\n  "name": "DevUtils",\n  "active": true\n}'}
                  />
                </div>
              </motion.div>

              {/* Middle action column */}
              <div className="flex lg:flex-col flex-wrap gap-3 lg:justify-center lg:py-8">
                <button
                  onClick={() => applyAction("prettify")}
                  disabled={!jsonSource}
                  className={actionBtn(activeAction === "prettify")}
                >
                  <Sparkles className="w-4 h-4" />
                  Validate & Prettify
                </button>

                <button
                  onClick={handleSwap}
                  disabled={!input && !output}
                  className={actionBtn(false)}
                >
                  <ArrowRightLeft className="w-4 h-4" />
                  Swap
                </button>

                <button
                  onClick={() => applyAction("encode")}
                  className={actionBtn(activeAction === "encode")}
                >
                  <Link className="w-4 h-4" />
                  URL Encode
                </button>

                <button
                  onClick={() => applyAction("decode")}
                  className={actionBtn(activeAction === "decode")}
                >
                  <Unlink className="w-4 h-4" />
                  URL Decode
                </button>

                <div className="hidden lg:block h-px w-full bg-border my-2" />

                <button
                  onClick={() => applyAction("minify")}
                  disabled={!jsonSource}
                  className={actionBtn(activeAction === "minify")}
                >
                  Minify
                </button>

                <button
                  onClick={() => applyAction("sort")}
                  disabled={!jsonSource}
                  className={actionBtn(activeAction === "sort")}
                >
                  <SortAsc className="w-4 h-4" />
                  Sort Keys
                </button>

                <div className="hidden lg:block h-px w-full bg-border my-2" />

                <button
                  onClick={handleClear}
                  className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold text-foreground/70 border border-transparent hover:text-red-600 hover:border-red-600/30 hover:bg-red-600/10 transition-all w-full"
                >
                  <Trash2 className="w-4 h-4" />
                  CLEAR ALL
                </button>
              </div>

              {/* Right Column - Output */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
                className="flex flex-col h-full"
              >
                <div className="bg-secondary border border-border rounded-2xl shadow-xl overflow-hidden flex flex-col grow">
                  <div className="flex items-center justify-between px-5 py-3 border-b border-border bg-accent/40">
                    <div className="flex items-center gap-2 uppercase tracking-widest text-[10px] font-black text-foreground">
                      <div className="w-2 h-2 rounded-full bg-green-500" />
                      Result
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="text-[10px] font-bold text-foreground/55 uppercase">
                        {output.trim() ? `${outputLineCount} LINES` : "Result here"}
                      </span>
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] font-bold text-foreground/55 uppercase">Indent</span>
                        <select
                          value={indentSize}
                          onChange={(e) => setIndentSize(Number(e.target.value))}
                          className="bg-transparent text-[10px] font-bold text-foreground outline-none cursor-pointer"
                        >
                          <option value={2} className="bg-background">2 SPACES</option>
                          <option value={4} className="bg-background">4 SPACES</option>
                          <option value={1} className="bg-background">1 TAB</option>
                        </select>
                      </div>
                      {output && (
                        <button
                          onClick={() => handleCopy(output)}
                          className="text-primary hover:text-primary/80 transition-colors"
                          title="Copy results"
                        >
                          <Copy className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                  <div className="relative grow min-h-[500px]">
                    <textarea
                      value={output}
                      readOnly
                      placeholder="Result will appear here..."
                      className={cn(
                        "w-full h-full p-6 font-mono text-sm leading-relaxed",
                        "bg-secondary text-foreground",
                        "focus:outline-none resize-none",
                        "placeholder:text-foreground/45"
                      )}
                    />
                    {!output && validation.valid && (
                      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <div className="bg-primary/10 border border-primary/20 px-4 py-2 rounded-lg text-[10px] font-bold text-primary/80 uppercase tracking-widest">
                          Ready to format
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            </div>

            {/* External Tools */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-secondary border border-border rounded-3xl shadow-2xl p-8"
            >
              <button
                onClick={() => setShowExternalTools(!showExternalTools)}
                className="flex items-center gap-3 w-full text-left group"
              >
                <div className="p-2 bg-primary/10 rounded-lg group-hover:bg-primary/20 transition-colors">
                  <ExternalLink className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <h2 className="text-sm font-black text-foreground uppercase tracking-widest leading-none">
                    External Utilities
                  </h2>
                  <p className="text-[10px] text-foreground/55 uppercase tracking-tighter mt-1 font-bold">
                    Advanced tools for special use cases
                  </p>
                </div>
                <div className="ml-auto">
                  {showExternalTools ? (
                    <ChevronUp className="w-4 h-4 text-foreground/45" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-foreground/45" />
                  )}
                </div>
              </button>
              
              {showExternalTools && (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-8"
                >
                  {externalTools.map((tool) => (
                    <a
                      key={tool.name}
                      href={tool.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={cn(
                        "flex items-start gap-4 p-5 rounded-2xl border border-border bg-background",
                        "hover:bg-accent hover:border-primary/40 transition-all duration-300",
                        "group/tool"
                      )}
                    >
                      <div className="mt-1 opacity-60 group-hover/tool:opacity-100 transition-opacity">
                        <ExternalLink className="w-3.5 h-3.5 text-primary" />
                      </div>
                      <div>
                        <div className="font-black text-[11px] text-foreground group-hover/tool:text-primary transition-colors uppercase tracking-widest">
                          {tool.name}
                        </div>
                        <div className="text-[10px] text-foreground/55 mt-1.5 leading-relaxed font-medium">
                          {tool.description}
                        </div>
                      </div>
                    </a>
                  ))}
                </motion.div>
              )}
            </motion.div>
      </div>
    </div>
  );
}
