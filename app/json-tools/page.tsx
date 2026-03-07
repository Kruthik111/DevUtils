"use client";

import { useState, useMemo } from "react";
import {
  Braces,
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
  ArrowDown,
} from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { Loading } from "@/components/ui/loading";
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

type ActiveTab = "validator" | "encode";

export default function JsonToolsPage() {
  const [activeTab, setActiveTab] = useState<ActiveTab>("validator");

  // Validator state
  const [input, setInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [indentSize, setIndentSize] = useState(2);
  const [showExternalTools, setShowExternalTools] = useState(true);

  // Encode/Decode state
  const [encodeInput, setEncodeInput] = useState("");
  const [encodeOutput, setEncodeOutput] = useState("");

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

  const handlePrettify = () => {
    if (!validation.valid || !validation.parsed) {
      toast.error("Cannot prettify invalid JSON");
      return;
    }
    setInput(JSON.stringify(validation.parsed, null, indentSize));
    toast.success("JSON prettified");
  };

  const handleMinify = () => {
    if (!validation.valid || !validation.parsed) {
      toast.error("Cannot minify invalid JSON");
      return;
    }
    setInput(JSON.stringify(validation.parsed));
    toast.success("JSON minified");
  };

  const handleSortKeys = () => {
    if (!validation.valid || !validation.parsed) {
      toast.error("Cannot sort keys in invalid JSON");
      return;
    }
    const sorted = sortObjectKeys(validation.parsed);
    setInput(JSON.stringify(sorted, null, indentSize));
    toast.success("Keys sorted alphabetically");
  };

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
    setSearchQuery("");
    toast.success("Cleared");
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

  // --- Encode / Decode logic ---
  const handleUrlEncode = () => {
    if (!encodeInput.trim()) {
      toast.error("Please enter text to encode");
      return;
    }
    setEncodeOutput(encodeURIComponent(encodeInput));
    toast.success("URL encoded");
  };

  const handleUrlDecode = () => {
    if (!encodeInput.trim()) {
      toast.error("Please enter text to decode");
      return;
    }
    try {
      setEncodeOutput(decodeURIComponent(encodeInput));
      toast.success("URL decoded");
    } catch {
      toast.error("Invalid URL-encoded string");
    }
  };

  const handleSwapEncode = () => {
    setEncodeInput(encodeOutput);
    setEncodeOutput("");
  };

  const handleClearEncode = () => {
    setEncodeInput("");
    setEncodeOutput("");
  };

  const tabs: { id: ActiveTab; label: string }[] = [
    { id: "validator", label: "Validate & Prettify" },
    { id: "encode", label: "URL Encode / Decode" },
  ];

  return (
    <div className="min-h-screen p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-linear-to-br from-amber-500 to-orange-600 mb-6">
            <Braces className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-4 text-foreground">
            JSON{" "}
            <span className="text-gray-600 dark:text-gray-400">Tools</span>
          </h1>
          <p className="text-xl text-foreground/60 max-w-2xl mx-auto">
            Validate, prettify, stringify, parse, and search your JSON data
          </p>
        </motion.div>

        {/* Tab Switcher */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="flex gap-2 mb-6"
        >
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "px-5 py-2.5 rounded-xl text-sm font-medium transition-all duration-200",
                activeTab === tab.id
                  ? "bg-linear-to-r from-amber-500 to-orange-600 text-white shadow-md shadow-amber-500/20"
                  : "border border-border/50 text-foreground/60 hover:bg-foreground/5 hover:text-foreground"
              )}
            >
              {tab.label}
            </button>
          ))}
        </motion.div>

        {/* ===== Validate & Prettify Tab ===== */}
        {activeTab === "validator" && (
          <>
            {/* Validation Status */}
            {input.trim() && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className={cn(
                  "mb-4 px-4 py-3 rounded-xl border flex items-center gap-3",
                  validation.valid
                    ? "bg-green-500/10 border-green-500/30 text-green-700 dark:text-green-400"
                    : "bg-red-500/10 border-red-500/30 text-red-700 dark:text-red-400"
                )}
              >
                {validation.valid ? (
                  <>
                    <Check className="w-5 h-5 shrink-0" />
                    <span className="font-medium">Valid JSON</span>
                  </>
                ) : (
                  <>
                    <X className="w-5 h-5 shrink-0" />
                    <span className="font-medium">Invalid JSON</span>
                    <span className="text-sm opacity-80">— {validation.error}</span>
                  </>
                )}
              </motion.div>
            )}

            {/* Toolbar */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-background/80 backdrop-blur-xl border border-border/50 rounded-2xl shadow-xl p-4 mb-4"
            >
              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={handlePrettify}
                  disabled={!validation.valid}
                  className={cn(
                    "flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200",
                    "bg-linear-to-r from-amber-500 to-orange-600 text-white",
                    "hover:from-amber-600 hover:to-orange-700",
                    "hover:scale-105 active:scale-95",
                    "disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100",
                    "shadow-md hover:shadow-lg shadow-amber-500/20"
                  )}
                >
                  <Sparkles className="w-4 h-4" />
                  Prettify
                </button>

                <button
                  onClick={handleMinify}
                  disabled={!validation.valid}
                  className={cn(
                    "flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200",
                    "border border-border/50 hover:bg-foreground/10",
                    "disabled:opacity-40 disabled:cursor-not-allowed"
                  )}
                >
                  Minify
                </button>

                <button
                  onClick={handleSortKeys}
                  disabled={!validation.valid}
                  className={cn(
                    "flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200",
                    "border border-border/50 hover:bg-foreground/10",
                    "disabled:opacity-40 disabled:cursor-not-allowed"
                  )}
                >
                  <SortAsc className="w-4 h-4" />
                  Sort Keys
                </button>

                <div className="flex items-center gap-2 ml-auto">
                  <select
                    value={indentSize}
                    onChange={(e) => setIndentSize(Number(e.target.value))}
                    className={cn(
                      "px-3 py-2 rounded-xl text-sm border border-border/50",
                      "bg-background text-foreground",
                      "focus:outline-none focus:ring-2 focus:ring-amber-500/50"
                    )}
                  >
                    <option value={2}>2 spaces</option>
                    <option value={4}>4 spaces</option>
                    <option value={1}>1 tab</option>
                  </select>

                  <button
                    onClick={() => handleCopy(input)}
                    className={cn(
                      "flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200",
                      "border border-border/50 hover:bg-foreground/10"
                    )}
                  >
                    <Copy className="w-4 h-4" />
                    Copy
                  </button>

                  <button
                    onClick={handleClear}
                    className={cn(
                      "flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200",
                      "border border-red-500/30 text-red-500 hover:bg-red-500/10"
                    )}
                  >
                    <Trash2 className="w-4 h-4" />
                    Clear
                  </button>
                </div>
              </div>
            </motion.div>

            {/* Search */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className="mb-4"
            >
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground/40" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search keys or values in JSON..."
                  className={cn(
                    "w-full pl-11 pr-4 py-3 rounded-xl border border-border/50",
                    "bg-background/80 backdrop-blur-xl text-foreground",
                    "focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-transparent",
                    "transition-all duration-200 text-sm"
                  )}
                />
              </div>

              {searchQuery.trim() && validation.valid && (
                <div className="mt-2 bg-background/80 backdrop-blur-xl border border-border/50 rounded-xl p-3 max-h-48 overflow-y-auto">
                  {searchResults.length > 0 ? (
                    <div className="space-y-1">
                      {searchResults.map((result, i) => (
                        <div
                          key={i}
                          className="flex items-center gap-2 text-sm py-1 px-2 rounded-lg hover:bg-foreground/5"
                        >
                          <span className="text-amber-600 dark:text-amber-400 font-mono text-xs">
                            {result.path}
                          </span>
                          <span className="text-foreground/40">→</span>
                          <span className="text-foreground/70 font-mono text-xs truncate">
                            {result.value}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-foreground/50">No matches found</p>
                  )}
                </div>
              )}
            </motion.div>

            {/* Editor */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-background/80 backdrop-blur-xl border border-border/50 rounded-2xl shadow-xl overflow-hidden mb-8"
            >
              <div className="flex items-center justify-between px-4 py-2 border-b border-border/50 bg-foreground/5">
                <span className="text-xs font-medium text-foreground/50">
                  JSON Input
                </span>
                <span className="text-xs text-foreground/40">
                  {input.trim()
                    ? `${lineCount} line${lineCount !== 1 ? "s" : ""} · ${input.length} chars`
                    : "Paste your JSON here"}
                </span>
              </div>
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                spellCheck={false}
                className={cn(
                  "w-full min-h-[400px] p-4 font-mono text-sm",
                  "bg-transparent text-foreground",
                  "focus:outline-none resize-y",
                  "placeholder:text-foreground/30"
                )}
                placeholder='{\n  "example": "Paste your JSON here",\n  "number": 42,\n  "nested": {\n    "key": "value"\n  }\n}'
              />
            </motion.div>

            {/* External Tools */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-background/80 backdrop-blur-xl border border-border/50 rounded-2xl shadow-xl p-6"
            >
              <button
                onClick={() => setShowExternalTools(!showExternalTools)}
                className="flex items-center gap-2 w-full text-left"
              >
                <h2 className="text-lg font-semibold text-foreground">
                  Other JSON Tools
                </h2>
                {showExternalTools ? (
                  <ChevronUp className="w-4 h-4 text-foreground/50" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-foreground/50" />
                )}
              </button>
              <p className="text-sm text-foreground/50 mt-1 mb-4">
                More powerful JSON tools available online
              </p>

              {showExternalTools && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {externalTools.map((tool) => (
                    <a
                      key={tool.name}
                      href={tool.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={cn(
                        "flex items-start gap-3 p-4 rounded-xl border border-border/50",
                        "hover:bg-foreground/5 transition-all duration-200",
                        "group"
                      )}
                    >
                      <ExternalLink className="w-4 h-4 mt-0.5 text-foreground/40 group-hover:text-amber-500 transition-colors shrink-0" />
                      <div>
                        <div className="font-medium text-sm text-foreground group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
                          {tool.name}
                        </div>
                        <div className="text-xs text-foreground/50 mt-0.5">
                          {tool.description}
                        </div>
                      </div>
                    </a>
                  ))}
                </div>
              )}
            </motion.div>
          </>
        )}

        {/* ===== URL Encode / Decode Tab ===== */}
        {activeTab === "encode" && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="space-y-4"
          >
            {/* Input */}
            <div className="bg-background/80 backdrop-blur-xl border border-border/50 rounded-2xl shadow-xl overflow-hidden">
              <div className="flex items-center justify-between px-4 py-2 border-b border-border/50 bg-foreground/5">
                <span className="text-xs font-medium text-foreground/50">
                  Input — Paste text or URL-encoded string
                </span>
                <span className="text-xs text-foreground/40">
                  {encodeInput.length} chars
                </span>
              </div>
              <textarea
                value={encodeInput}
                onChange={(e) => setEncodeInput(e.target.value)}
                spellCheck={false}
                className={cn(
                  "w-full min-h-[200px] p-4 font-mono text-sm",
                  "bg-transparent text-foreground",
                  "focus:outline-none resize-y",
                  "placeholder:text-foreground/30"
                )}
                placeholder={'Paste text to encode or URL-encoded string to decode...\n\nExample: %7B%22status%22:%22Synced%22%7D'}
              />
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={handleUrlDecode}
                className={cn(
                  "flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium transition-all duration-200",
                  "bg-linear-to-r from-orange-500 to-red-500 text-white",
                  "hover:from-orange-600 hover:to-red-600",
                  "hover:scale-105 active:scale-95",
                  "shadow-md hover:shadow-lg shadow-orange-500/20"
                )}
              >
                <ArrowRightLeft className="w-4 h-4" />
                URL Decode
              </button>

              <button
                onClick={handleUrlEncode}
                className={cn(
                  "flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium transition-all duration-200",
                  "bg-linear-to-r from-amber-500 to-orange-600 text-white",
                  "hover:from-amber-600 hover:to-orange-700",
                  "hover:scale-105 active:scale-95",
                  "shadow-md hover:shadow-lg shadow-amber-500/20"
                )}
              >
                <ArrowRightLeft className="w-4 h-4" />
                URL Encode
              </button>

              <div className="flex items-center gap-2 ml-auto">
                <button
                  onClick={handleSwapEncode}
                  disabled={!encodeOutput}
                  className={cn(
                    "flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200",
                    "border border-border/50 hover:bg-foreground/10",
                    "disabled:opacity-40 disabled:cursor-not-allowed"
                  )}
                  title="Move output to input"
                >
                  <ArrowDown className="w-4 h-4 rotate-180" />
                  Swap
                </button>

                <button
                  onClick={() => handleCopy(encodeOutput)}
                  className={cn(
                    "flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200",
                    "border border-border/50 hover:bg-foreground/10"
                  )}
                >
                  <Copy className="w-4 h-4" />
                  Copy
                </button>

                <button
                  onClick={handleClearEncode}
                  className={cn(
                    "flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200",
                    "border border-red-500/30 text-red-500 hover:bg-red-500/10"
                  )}
                >
                  <Trash2 className="w-4 h-4" />
                  Clear
                </button>
              </div>
            </div>

            {/* Output */}
            <div className="bg-background/80 backdrop-blur-xl border border-border/50 rounded-2xl shadow-xl overflow-hidden">
              <div className="flex items-center justify-between px-4 py-2 border-b border-border/50 bg-foreground/5">
                <span className="text-xs font-medium text-foreground/50">
                  Output
                </span>
                <span className="text-xs text-foreground/40">
                  {encodeOutput.length} chars
                </span>
              </div>
              <textarea
                value={encodeOutput}
                readOnly
                className={cn(
                  "w-full min-h-[200px] p-4 font-mono text-sm",
                  "bg-transparent text-foreground",
                  "focus:outline-none resize-y",
                  "placeholder:text-foreground/30"
                )}
                placeholder="Output will appear here..."
              />
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
