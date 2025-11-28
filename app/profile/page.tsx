"use client";

import { useState, useEffect } from "react";
import { Download, Upload, Trash2, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { ConfirmDialog } from "@/components/notes/confirm-dialog";

const PROFILE_KEY = "devutils-profile";

export default function ProfilePage() {
  const [storageUsed, setStorageUsed] = useState(0);
  const [storageTotal, setStorageTotal] = useState(0);
  const [storagePercentage, setStoragePercentage] = useState(0);
  const [name, setName] = useState("");
  const [isEditingName, setIsEditingName] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  useEffect(() => {
    calculateStorage();
    loadProfile();
  }, []);

  const loadProfile = () => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem(PROFILE_KEY);
      if (stored) {
        try {
          const profile = JSON.parse(stored);
          setName(profile.name || "");
        } catch {
          // Use default
        }
      }
    }
  };

  const saveProfile = () => {
    if (typeof window !== "undefined") {
      const profile = { name };
      localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
      setIsEditingName(false);
    }
  };

  const calculateStorage = () => {
    let total = 0;
    let used = 0;

    if (typeof window !== "undefined") {
      for (let key in localStorage) {
        if (localStorage.hasOwnProperty(key)) {
          const value = localStorage.getItem(key) || "";
          const size = new Blob([key + value]).size;
          total += size;
          used += size;
        }
      }

      const estimatedTotal = 5 * 1024 * 1024; // 5MB
      setStorageTotal(estimatedTotal);
      setStorageUsed(used);
      setStoragePercentage(Math.min((used / estimatedTotal) * 100, 100));
    }
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
  };

  const exportStorage = () => {
    if (typeof window === "undefined") return;

    const data: Record<string, string> = {};
    for (let key in localStorage) {
      if (localStorage.hasOwnProperty(key)) {
        data[key] = localStorage.getItem(key) || "";
      }
    }

    const json = JSON.stringify(data, null, 2);
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `devutils-backup-${new Date().toISOString().split("T")[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const importStorage = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const json = e.target?.result as string;
        const data = JSON.parse(json);

        localStorage.clear();

        for (const key in data) {
          localStorage.setItem(key, data[key]);
        }

        loadProfile();
        calculateStorage();
        window.location.reload();
      } catch (error) {
        alert("Error importing file. Please make sure it's a valid JSON file.");
        console.error("Import error:", error);
      }
    };
    reader.readAsText(file);

    event.target.value = "";
  };

  const clearStorage = () => {
    localStorage.clear();
    window.location.reload();
  };

  const circumference = 2 * Math.PI * 45;
  const offset = circumference - (storagePercentage / 100) * circumference;

  return (
    <div className="p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Profile</h1>

        <div className="space-y-6">
          {/* Profile Name */}
          <div className="bg-background/80 backdrop-blur-xl border border-border/50 rounded-3xl p-6 shadow-xl">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                <User className="w-8 h-8 text-primary" />
              </div>
              <div className="flex-1">
                {isEditingName ? (
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Enter your name"
                      className={cn(
                        "flex-1 px-4 py-2 rounded-xl border border-border/50",
                        "bg-background/50 focus:outline-none focus:border-primary",
                        "text-lg font-semibold"
                      )}
                      autoFocus
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          saveProfile();
                        } else if (e.key === "Escape") {
                          setIsEditingName(false);
                          loadProfile();
                        }
                      }}
                    />
                    <button
                      onClick={saveProfile}
                      className={cn(
                        "px-4 py-2 rounded-xl text-sm font-medium",
                        "bg-primary text-background",
                        "hover:bg-primary/90 transition-all"
                      )}
                    >
                      Save
                    </button>
                    <button
                      onClick={() => {
                        setIsEditingName(false);
                        loadProfile();
                      }}
                      className={cn(
                        "px-4 py-2 rounded-xl text-sm font-medium",
                        "border border-border/50 hover:bg-background/80 transition-all"
                      )}
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <div>
                    <h2 className="text-2xl font-bold mb-1">
                      {name || "Your Name"}
                    </h2>
                    <button
                      onClick={() => setIsEditingName(true)}
                      className="text-sm text-foreground/60 hover:text-primary transition-colors"
                    >
                      {name ? "Edit name" : "Add name"}
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Storage Usage */}
          <div className="bg-background/80 backdrop-blur-xl border border-border/50 rounded-3xl p-6 shadow-xl">
            <h2 className="text-xl font-semibold mb-4">LocalStorage Usage</h2>
            <div className="flex items-center gap-6">
              <div className="relative w-32 h-32">
                <svg className="transform -rotate-90 w-32 h-32">
                  <circle
                    cx="64"
                    cy="64"
                    r="45"
                    stroke="currentColor"
                    strokeWidth="8"
                    fill="none"
                    className="text-border/30"
                  />
                  <circle
                    cx="64"
                    cy="64"
                    r="45"
                    stroke="currentColor"
                    strokeWidth="8"
                    fill="none"
                    strokeDasharray={circumference}
                    strokeDashoffset={offset}
                    className={cn(
                      "transition-all duration-300",
                      storagePercentage > 80
                        ? "text-red-500"
                        : storagePercentage > 50
                          ? "text-yellow-500"
                          : "text-primary"
                    )}
                    strokeLinecap="round"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center">
                    {/* <div className="text-2xl font-bold">{Math.round(storagePercentage)}%</div> */}
                    <div className="text-2xl font-bold">{storageUsed}</div>
                    <div className="text-xs text-foreground/60">Used</div>
                  </div>
                </div>
              </div>
              <div className="flex-1">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-foreground/60">Used:</span>
                    <span className="font-medium">{formatBytes(storageUsed)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-foreground/60">Available:</span>
                    <span className="font-medium">{formatBytes(storageTotal - storageUsed)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-foreground/60">Total:</span>
                    <span className="font-medium">{formatBytes(storageTotal)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Export/Import */}
          <div className="bg-background/80 backdrop-blur-xl border border-border/50 rounded-3xl p-6 shadow-xl">
            <h2 className="text-xl font-semibold mb-4">Backup & Restore</h2>
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <button
                  onClick={exportStorage}
                  className={cn(
                    "flex items-center gap-2 px-6 py-3 rounded-xl",
                    "bg-primary text-background",
                    "hover:bg-primary/90 transition-all",
                    "font-medium"
                  )}
                >
                  <Download className="w-4 h-4" />
                  Export Data
                </button>
                <p className="text-sm text-foreground/60">
                  Download all your settings and data as a JSON file
                </p>
              </div>

              <div className="flex items-center gap-4">
                <label
                  className={cn(
                    "flex items-center gap-2 px-6 py-3 rounded-xl cursor-pointer",
                    "bg-background border-2 border-border/50",
                    "hover:bg-primary/10 hover:border-primary/50 transition-all",
                    "font-medium"
                  )}
                >
                  <Upload className="w-4 h-4" />
                  Import Data
                  <input
                    type="file"
                    accept=".json"
                    onChange={importStorage}
                    className="hidden"
                  />
                </label>
                <p className="text-sm text-foreground/60">
                  Restore settings and data from a previously exported JSON file
                </p>
              </div>
            </div>
          </div>

          {/* Clear Storage */}
          <div className="bg-background/80 backdrop-blur-xl border border-border/50 rounded-3xl p-6 shadow-xl">
            <h2 className="text-xl font-semibold mb-4">Danger Zone</h2>
            <div className="flex items-center gap-4">
              <button
                onClick={() => setShowClearConfirm(true)}
                className={cn(
                  "flex items-center gap-2 px-6 py-3 rounded-xl",
                  "bg-red-500/10 text-red-500 border-2 border-red-500/20",
                  "hover:bg-red-500/20 transition-all",
                  "font-medium"
                )}
              >
                <Trash2 className="w-4 h-4" />
                Clear All Data
              </button>
              <p className="text-sm text-foreground/60">
                Permanently delete all localStorage data. This action cannot be undone.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Clear Storage Confirmation */}
      <ConfirmDialog
        isOpen={showClearConfirm}
        title="Clear All Data"
        message="Are you sure you want to clear all localStorage data? This action cannot be undone and will delete all your settings, notes, and data."
        onConfirm={clearStorage}
        onCancel={() => setShowClearConfirm(false)}
      />
    </div>
  );
}

