"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Download, Upload, Trash2, User, Lock } from "lucide-react";
import { cn } from "@/lib/utils";
import { ConfirmDialog } from "@/components/notes/confirm-dialog";
import { Loading } from "@/components/ui/loading";
import { toast } from "sonner";

const PROFILE_KEY = "devutils-profile";

export default function ProfilePage() {
  const router = useRouter();
  const { data: session, update, status } = useSession();

  // All hooks must be called before any conditional returns
  const [storageUsed, setStorageUsed] = useState(0);
  const [storageTotal, setStorageTotal] = useState(0);
  const [storagePercentage, setStoragePercentage] = useState(0);
  const [name, setName] = useState("");
  const [isEditingName, setIsEditingName] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);

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
      const usedPercentage = (used / estimatedTotal) * 100;
      console.log(usedPercentage);
      setStoragePercentage(Math.min(usedPercentage, 100));
    }
  };

  useEffect(() => {
    calculateStorage();
    if (session?.user?.name) {
      setName(session.user.name);
    }
  }, [session]);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/signin');
    }
  }, [status, router]);

  // Show loading while checking auth
  if (status === 'loading') {
    return <Loading fullScreen />;
  }

  // Don't render if not authenticated
  if (status === 'unauthenticated') {
    return null;
  }

  const saveProfile = async () => {
    if (!session?.user?.id) return;

    try {
      const response = await fetch("/api/user/profile", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name }),
      });

      if (response.ok) {
        // Update the session to reflect the new name
        await update({ name });
        setIsEditingName(false);
      }
    } catch (error) {
      console.error("Error updating profile:", error);
    }
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
  };

  const exportDbBackup = async () => {
    try {
      setIsExporting(true);
      const response = await fetch("/api/notes/backup");
      if (!response.ok) {
        toast.error("Failed to export data. Please try again.");
        return;
      }

      const data = await response.json();
      const json = JSON.stringify(data, null, 2);
      const blob = new Blob([json], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `devutils-notes-backup-${new Date().toISOString().split("T")[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success("Exported notes backup.");
    } catch (error) {
      console.error("Export error:", error);
      toast.error("Failed to export data. Please try again.");
    } finally {
      setIsExporting(false);
    }
  };

  const importDbBackup = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const json = e.target?.result as string;
        const data = JSON.parse(json);

        if (!data || !Array.isArray(data.groups) || !Array.isArray(data.notes)) {
          toast.error("Invalid backup file.");
          return;
        }

        setIsImporting(true);
        const response = await fetch("/api/notes/backup", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        });

        if (!response.ok) {
          toast.error("Failed to import data. Please try again.");
          return;
        }

        toast.success("Imported notes backup.");
      } catch (error) {
        console.error("Import error:", error);
        toast.error("Error importing file. Please make sure it's a valid JSON.");
      } finally {
        setIsImporting(false);
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
              <div className="w-16 h-16 rounded-full bg-primary flex items-center justify-center text-primary-foreground shadow-lg shadow-primary/20">
                <User className="w-8 h-8" />
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
                          setName(session?.user?.name || "");
                        }
                      }}
                    />
                    <button
                      onClick={saveProfile}
                      className={cn(
                        "px-4 py-2 rounded-xl text-sm font-medium",
                        "bg-primary text-primary-foreground",
                        "hover:bg-primary/90 transition-all"
                      )}
                    >
                      Save
                    </button>
                    <button
                      onClick={() => {
                        setIsEditingName(false);
                        setName(session?.user?.name || "");
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
                    <div className="text-2xl font-bold">{Number(storagePercentage).toPrecision(1)}%</div>
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
                  onClick={exportDbBackup}
                  disabled={isExporting}
                  className={cn(
                    "flex items-center gap-2 px-6 py-3 rounded-xl",
                    "bg-primary text-primary-foreground",
                    "hover:bg-primary/90 transition-all",
                    "font-medium",
                    "disabled:opacity-50"
                  )}
                >
                  <Download className="w-4 h-4" />
                  {isExporting ? "Exporting..." : "Export Data"}
                </button>
                <p className="text-sm text-foreground/60">
                  Download your notes and groups as a JSON backup from the database.
                </p>
              </div>

              <div className="flex items-center gap-4">
                <label
                  className={cn(
                    "flex items-center gap-2 px-6 py-3 rounded-xl cursor-pointer",
                    "bg-background border-2 border-border/50",
                    "hover:bg-primary/10 hover:border-primary/50 transition-all",
                    "font-medium",
                    isImporting && "opacity-50 cursor-not-allowed"
                  )}
                >
                  <Upload className="w-4 h-4" />
                  {isImporting ? "Importing..." : "Import Data"}
                  <input
                    type="file"
                    accept=".json"
                    onChange={importDbBackup}
                    className="hidden"
                    disabled={isImporting}
                  />
                </label>
                <p className="text-sm text-foreground/60">
                  Restore notes and groups from a previously exported backup file.
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

