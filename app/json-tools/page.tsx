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
  const [output, setOutput] = useState("");
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
    setOutput(JSON.stringify(validation.parsed, null, indentSize));
    toast.success("JSON prettified");
  };

  const handleMinify = () => {
    if (!validation.valid || !validation.parsed) {
      toast.error("Cannot minify invalid JSON");
      return;
    }
    setOutput(JSON.stringify(validation.parsed));
    toast.success("JSON minified");
  };

  const handleSortKeys = () => {
    if (!validation.valid || !validation.parsed) {
      toast.error("Cannot sort keys in invalid JSON");
      return;
    }
    const sorted = sortObjectKeys(validation.parsed);
    setOutput(JSON.stringify(sorted, null, indentSize));
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
    <div className="min-h-screen p-6 md:p-12 bg-background">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <div className="flex justify-center mb-4">
            <div className="p-3 bg-primary/10 rounded-2xl border border-primary/20">
              <Braces className="w-8 h-8 text-primary" />
            </div>
          </div>
          <h1 className="text-3xl font-bold mb-2 text-foreground">
            JSON{" "}
            <span className="text-primary">Tools</span>
          </h1>
          <p className="text-foreground/40 max-w-2xl mx-auto text-sm md:text-base">
            Professional JSON validation and formatting. Input on the left, results on the right.
          </p>
        </motion.div>

        {/* Tab Switcher */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="flex gap-2 mb-6 justify-center"
        >
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "px-6 py-2.5 rounded-xl text-sm font-bold transition-all duration-200 border",
                activeTab === tab.id
                  ? "bg-primary border-primary/50 text-primary-foreground shadow-lg shadow-primary/20"
                  : "bg-secondary border-border text-foreground/40 hover:text-foreground"
              )}
            >
              {tab.label}
            </button>
          ))}
        </motion.div>

        {/* ===== Validate & Prettify Tab ===== */}
        {activeTab === "validator" && (
          <>
            {/* Toolbar */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-secondary border border-border rounded-2xl shadow-xl p-4 mb-4"
            >
              <div className="flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-2">
                  <button
                    onClick={handlePrettify}
                    disabled={!validation.valid}
                    className={cn(
                      "flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold transition-all duration-200",
                      "bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-30 disabled:cursor-not-allowed shadow-lg shadow-primary/10"
                    )}
                  >
                    <Sparkles className="w-4 h-4" />
                    Format JSON
                  </button>

                  <button
                    onClick={handleMinify}
                    disabled={!validation.valid}
                    className={cn(
                      "flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all duration-200",
                      "bg-secondary border border-border text-foreground/80 hover:text-foreground disabled:opacity-30"
                    )}
                  >
                    Minify
                  </button>

                  <button
                    onClick={handleSortKeys}
                    disabled={!validation.valid}
                    className={cn(
                      "flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all duration-200",
                      "bg-secondary border border-border text-foreground/80 hover:text-foreground disabled:opacity-30"
                    )}
                  >
                    <SortAsc className="w-4 h-4" />
                    Sort Keys
                  </button>
                </div>

                <div className="h-8 w-px bg-border hidden sm:block mx-2" />

                <div className="flex items-center gap-3 ml-auto">
                  <div className="flex items-center gap-2 px-3 py-1.5 bg-secondary rounded-xl border border-border">
                    <span className="text-[10px] font-bold text-foreground/40 uppercase">Indent</span>
                    <select
                      value={indentSize}
                      onChange={(e) => setIndentSize(Number(e.target.value))}
                      className="bg-transparent text-xs font-bold text-foreground outline-none cursor-pointer"
                    >
                      <option value={2} className="bg-background">2 SPACES</option>
                      <option value={4} className="bg-background">4 SPACES</option>
                      <option value={1} className="bg-background">1 TAB</option>
                    </select>
                  </div>

                  <button
                    onClick={handleClear}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold text-foreground/40 hover:text-red-400 hover:bg-red-400/5 transition-all"
                  >
                    <Trash2 className="w-4 h-4" />
                    CLEAR ALL
                  </button>
                </div>
              </div>
            </motion.div>

            {/* Validation Status */}
            {input.trim() && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className={cn(
                  "mb-4 px-4 py-2.5 rounded-xl border flex items-center justify-between text-xs font-bold uppercase tracking-wider transition-colors",
                  validation.valid
                    ? "bg-green-500/10 border-green-500/20 text-green-400"
                    : "bg-red-500/10 border-red-500/20 text-red-400"
                )}
              >
                <div className="flex items-center gap-3">
                  {validation.valid ? <Check className="w-4 h-4" /> : <X className="w-4 h-4" />}
                  <span>{validation.valid ? "JSON is Valid" : `Error: ${validation.error}`}</span>
                </div>
              </motion.div>
            )}

            {/* Editors Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              {/* Left Column - Input */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
                className="flex flex-col h-full"
              >
                <div className="bg-background border border-border rounded-2xl shadow-xl overflow-hidden flex flex-col grow">
                  <div className="flex items-center justify-between px-5 py-3 border-b border-border bg-secondary">
                    <div className="flex items-center gap-2 uppercase tracking-widest text-[10px] font-black text-foreground/50">
                      <div className="w-2 h-2 rounded-full bg-primary" />
                      JSON Input
                    </div>
                    <span className="text-[10px] font-bold text-foreground/30">
                      {input.trim() ? `${lineCount} LINES · ${input.length} CHARS` : "Paste below"}
                    </span>
                  </div>
                  <textarea
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    spellCheck={false}
                    className={cn(
                      "w-full min-h-[500px] p-6 font-mono text-sm",
                      "bg-transparent text-foreground/90",
                      "focus:outline-none resize-none leading-relaxed",
                      "placeholder:text-foreground/20"
                    )}
                    placeholder='{
  "name": "DevUtils",
  "features": ["Validation", "Format"],
  "active": true
}'
                  />
                </div>
              </motion.div>

              {/* Right Column - Output */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
                className="flex flex-col h-full"
              >
                <div className="bg-background border border-border rounded-2xl shadow-xl overflow-hidden flex flex-col grow">
                  <div className="flex items-center justify-between px-5 py-3 border-b border-border bg-secondary">
                    <div className="flex items-center gap-2 uppercase tracking-widest text-[10px] font-black text-foreground/50">
                      <div className="w-2 h-2 rounded-full bg-green-500" />
                      Formatted Output
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="text-[10px] font-bold text-foreground/30 uppercase">
                        {output.trim() ? `${outputLineCount} LINES` : "Result here"}
                      </span>
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
                      placeholder="Formatted JSON will appear here after you click 'Format JSON'..."
                      className={cn(
                        "w-full h-full p-6 font-mono text-sm leading-relaxed",
                        "bg-background/20 text-foreground/90",
                        "focus:outline-none resize-none",
                        "placeholder:text-foreground/10"
                      )}
                    />
                    {!output && validation.valid && (
                      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <div className="bg-primary/5 border border-primary/10 px-4 py-2 rounded-lg text-[10px] font-bold text-primary/40 uppercase tracking-widest">
                          Ready to format
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            </div>

            {/* Search - Repositioned below editors */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25 }}
              className="mb-8"
            >
              <div className="bg-secondary border border-border rounded-2xl p-4">
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground/30" />
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
                              <span className="text-foreground/40 font-mono truncate">
                                {result.value}
                              </span>
                            </div>
                            <button
                              onClick={() => handleCopy(result.value)}
                              className="shrink-0 p-2 text-foreground/20 hover:text-foreground transition-colors"
                            >
                              <Copy className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-center py-4 text-xs font-bold text-foreground/20 uppercase tracking-widest">No matching keys or values</p>
                    )}
                  </div>
                )}
              </div>
            </motion.div>
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
                  <p className="text-[10px] text-foreground/30 uppercase tracking-tighter mt-1 font-bold">
                    Advanced tools for special use cases
                  </p>
                </div>
                <div className="ml-auto">
                  {showExternalTools ? (
                    <ChevronUp className="w-4 h-4 text-foreground/20" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-foreground/20" />
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
                        "flex items-start gap-4 p-5 rounded-2xl border border-border bg-secondary/50",
                        "hover:bg-accent hover:border-primary/30 transition-all duration-300",
                        "group/tool"
                      )}
                    >
                      <div className="mt-1 opacity-20 group-hover/tool:opacity-100 transition-opacity">
                        <ExternalLink className="w-3.5 h-3.5 text-primary" />
                      </div>
                      <div>
                        <div className="font-black text-[11px] text-foreground/70 group-hover/tool:text-primary transition-colors uppercase tracking-widest">
                          {tool.name}
                        </div>
                        <div className="text-[10px] text-foreground/30 mt-1.5 leading-relaxed font-medium">
                          {tool.description}
                        </div>
                      </div>
                    </a>
                  ))}
                </motion.div>
              )}
            </motion.div>
          </>        )}

        {/* ===== URL Encode / Decode Tab ===== */}
        {activeTab === "encode" && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="space-y-6"
          >
            {/* Input */}
            <div className="bg-background border border-border rounded-3xl shadow-2xl overflow-hidden">
              <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-secondary/50">
                <div className="flex items-center gap-2 uppercase tracking-widest text-[10px] font-black text-foreground/50">
                  <div className="w-2 h-2 rounded-full bg-primary" />
                  Source Text
                </div>
                <span className="text-[10px] font-bold text-foreground/30 uppercase tracking-tighter">
                  {encodeInput.length} CHARACTERS
                </span>
              </div>
              <textarea
                value={encodeInput}
                onChange={(e) => setEncodeInput(e.target.value)}
                spellCheck={false}
                className={cn(
                  "w-full min-h-[250px] p-8 font-mono text-sm leading-relaxed",
                  "bg-transparent text-foreground/90",
                  "focus:outline-none resize-none",
                  "placeholder:text-foreground/10"
                )}
                placeholder={'Paste text to encode or URL-encoded string to decode...\n\nExample: %7B%22status%22:%22Synced%22%7D'}
              />
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center gap-4 bg-background p-4 rounded-2xl border border-border">
              <div className="flex items-center gap-2">
                <button
                  onClick={handleUrlDecode}
                  className="flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-black uppercase tracking-widest bg-secondary border border-border text-foreground hover:bg-accent transition-all"
                >
                  <ArrowRightLeft className="w-4 h-4 text-primary" />
                  Decode
                </button>

                <button
                  onClick={handleUrlEncode}
                  className="flex items-center gap-2 px-8 py-3 rounded-xl text-sm font-black uppercase tracking-widest bg-primary text-primary-foreground hover:bg-primary/90 transition-all shadow-xl shadow-primary/20"
                >
                  <ArrowRightLeft className="w-4 h-4" />
                  Encode
                </button>
              </div>

              <div className="h-8 w-px bg-border hidden sm:block mx-2" />

              <div className="flex items-center gap-3 ml-auto">
                <button
                  onClick={handleSwapEncode}
                  disabled={!encodeOutput}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest text-foreground/40 border border-border hover:bg-foreground/5 disabled:opacity-20 transition-all"
                >
                  <ArrowDown className="w-4 h-4 rotate-180" />
                  Swap
                </button>

                <button
                  onClick={() => handleCopy(encodeOutput)}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest text-primary border border-primary/20 hover:bg-primary/5 transition-all"
                >
                  <Copy className="w-4 h-4" />
                  Copy Result
                </button>

                <button
                  onClick={handleClearEncode}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest text-red-400 hover:bg-red-400/5 transition-all"
                >
                  <Trash2 className="w-4 h-4" />
                  Clear
                </button>
              </div>
            </div>

            {/* Output */}
            <div className="bg-background border border-border rounded-3xl shadow-2xl overflow-hidden">
              <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-secondary/50">
                <div className="flex items-center gap-2 uppercase tracking-widest text-[10px] font-black text-primary">
                  <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                  Processed Result
                </div>
                <span className="text-[10px] font-bold text-foreground/30 uppercase tracking-tighter">
                  {encodeOutput.length} CHARACTERS
                </span>
              </div>
              <textarea
                value={encodeOutput}
                readOnly
                className={cn(
                  "w-full min-h-[250px] p-8 font-mono text-sm leading-relaxed",
                  "bg-background/20 text-primary/80",
                  "focus:outline-none resize-none",
                  "placeholder:text-foreground/5"
                )}
                placeholder="Conversion result will appear here..."
              />
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
