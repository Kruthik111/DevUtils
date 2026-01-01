"use client";

import { useEffect, useMemo, useState } from "react";
import { Loader2, Plus, Play, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Loading } from "@/components/ui/loading";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";

type DbCheck = {
  _id: string;
  title: string;
  endpoint: string;
  token?: string;
  paramsTemplate?: Record<string, any>;
};

export default function DbCheckPage() {
  const { status } = useSession();
  const router = useRouter();
  const [items, setItems] = useState<DbCheck[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [form, setForm] = useState({
    title: "",
    endpoint: "",
    token: "",
    paramsTemplate: "{}",
  });
  const [inputParams, setInputParams] = useState("{}");
  const [responsePreview, setResponsePreview] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);

  const selectedItem = useMemo(
    () => items.find((i) => i._id === selectedId) || null,
    [items, selectedId]
  );

  useEffect(() => {
    if (status === "loading") return;
    if (status === "unauthenticated") {
      router.push("/signin");
      return;
    }

    const checkAccessAndLoad = async () => {
      const accessRaw = typeof window !== "undefined" ? window.localStorage.getItem("devutils.access") : null;
      const access: string[] = accessRaw ? JSON.parse(accessRaw) : [];
      let allowed = access.includes("*") || access.includes("/db-check");

      // Fallback: fetch user access if not cached
      if (!allowed && typeof window !== "undefined") {
        try {
          const res = await fetch("/api/user/access");
          if (res.ok) {
            const data = await res.json();
            if (Array.isArray(data.hasAccess)) {
              window.localStorage.setItem("devutils.access", JSON.stringify(data.hasAccess));
              allowed = data.hasAccess.includes("*") || data.hasAccess.includes("/db-check");
            }
          }
        } catch {
          // ignore
        }
      }

      if (!allowed) {
        toast.error("Access denied for DB Check");
        router.push("/profile");
        return;
      }

      try {
        const res = await fetch("/api/db-checks");
        if (!res.ok) {
          throw new Error("Failed to load DB checks");
        }
        const data = await res.json();
        setItems(data.items || []);
        if (data.items?.length) {
          setSelectedId(data.items[0]._id);
          const first = data.items[0];
          setInputParams(JSON.stringify(first.paramsTemplate || {}, null, 2));
        }
      } catch (error) {
        console.error(error);
        toast.error("Failed to load DB checks");
      } finally {
        setIsLoading(false);
      }
    };
    checkAccessAndLoad();
  }, [router, status]);

  if (status === "loading") {
    return <Loading fullScreen />;
  }

  const handleSelect = (id: string) => {
    setSelectedId(id);
    const found = items.find((i) => i._id === id);
    setInputParams(JSON.stringify(found?.paramsTemplate || {}, null, 2));
    setResponsePreview(null);
  };

  const handleEdit = (item?: DbCheck) => {
    if (item) {
      setSelectedId(item._id);
      setForm({
        title: item.title,
        endpoint: item.endpoint,
        token: item.token || "",
        paramsTemplate: JSON.stringify(item.paramsTemplate || {}, null, 2),
      });
      setInputParams(JSON.stringify(item.paramsTemplate || {}, null, 2));
    } else {
      setSelectedId(null);
      setForm({
        title: "",
        endpoint: "",
        token: "",
        paramsTemplate: "{}",
      });
      setInputParams("{}");
    }
  };

  const handleSave = async () => {
    try {
      const parsedTemplate = form.paramsTemplate ? JSON.parse(form.paramsTemplate) : {};
      setIsSaving(true);
      const res = await fetch("/api/db-checks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: selectedId,
          title: form.title.trim(),
          endpoint: form.endpoint.trim(),
          token: form.token.trim() || undefined,
          paramsTemplate: parsedTemplate,
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || "Failed to save");
      }
      const data = await res.json();
      const saved = data.item as DbCheck;

      setItems((prev) => {
        const exists = prev.find((p) => p._id === saved._id);
        if (exists) {
          return prev.map((p) => (p._id === saved._id ? saved : p));
        }
        return [saved, ...prev];
      });
      setSelectedId(saved._id);
      setInputParams(JSON.stringify(saved.paramsTemplate || {}, null, 2));
      toast.success("Saved");
    } catch (error: any) {
      console.error(error);
      toast.error(error.message || "Failed to save");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      setIsDeleting(id);
      const res = await fetch(`/api/db-checks?id=${id}`, { method: "DELETE" });
      if (!res.ok) {
        throw new Error("Failed to delete");
      }
      setItems((prev) => prev.filter((p) => p._id !== id));
      if (selectedId === id) {
        setSelectedId(null);
        setInputParams("{}");
        setResponsePreview(null);
      }
      toast.success("Deleted");
    } catch (error) {
      console.error(error);
      toast.error("Failed to delete");
    } finally {
      setIsDeleting(null);
    }
  };

  const handleRun = async () => {
    if (!selectedId) {
      toast.error("Select a DB check first");
      return;
    }
    let parsedParams: any = {};
    try {
      parsedParams = inputParams ? JSON.parse(inputParams) : {};
    } catch {
      toast.error("Params must be valid JSON");
      return;
    }

    setIsRunning(true);
    setResponsePreview(null);
    try {
      const res = await fetch("/api/db-checks/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: selectedId, params: parsedParams }),
      });
      const data = await res.json();
      setResponsePreview(data);
      if (!res.ok) {
        toast.error(data.message || "Request failed");
      }
    } catch (error) {
      console.error(error);
      toast.error("Failed to run check");
    } finally {
      setIsRunning(false);
    }
  };

  if (isLoading) {
    return <Loading fullScreen />;
  }

  return (
    <div className="p-4 md:p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">DB Check</h1>
        <div className="flex gap-2">
          <button
            onClick={() => handleEdit()}
            className={cn(
              "inline-flex items-center gap-2 px-4 py-2 rounded-lg",
              "bg-primary text-background hover:bg-primary/90 transition-colors"
            )}
          >
            <Plus className="w-4 h-4" />
            New
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="bg-background/80 border border-border/50 rounded-2xl p-4 space-y-3">
          <h2 className="text-sm font-semibold text-foreground/70">Saved Checks</h2>
          <div className="space-y-2">
            {items.map((item) => (
              <div
                key={item._id}
                className={cn(
                  "border border-border/50 rounded-xl p-3 cursor-pointer",
                  selectedId === item._id ? "border-primary bg-primary/5" : "hover:bg-foreground/5"
                )}
                onClick={() => handleSelect(item._id)}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">{item.title}</div>
                    <div className="text-xs text-foreground/60 break-all">{item.endpoint}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEdit(item);
                      }}
                      className="p-2 rounded-md hover:bg-foreground/10"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(item._id);
                      }}
                      disabled={isDeleting === item._id}
                      className="p-2 rounded-md hover:bg-red-500/10 text-red-500 disabled:opacity-50"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
            {items.length === 0 && (
              <div className="text-sm text-foreground/60">No checks yet. Create one.</div>
            )}
          </div>
        </div>

        <div className="bg-background/80 border border-border/50 rounded-2xl p-4 space-y-4 lg:col-span-2">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-foreground/70">Configure</h2>
            <div className="flex gap-2">
              <button
                onClick={handleSave}
                disabled={isSaving}
                className={cn(
                  "inline-flex items-center gap-2 px-4 py-2 rounded-lg",
                  "bg-primary text-background hover:bg-primary/90 transition-colors",
                  "disabled:opacity-50"
                )}
              >
                {isSaving && <Loader2 className="w-4 h-4 animate-spin" />}
                Save
              </button>
              <button
                onClick={handleRun}
                disabled={isRunning || !selectedId}
                className={cn(
                  "inline-flex items-center gap-2 px-4 py-2 rounded-lg",
                  "bg-emerald-600 text-background hover:bg-emerald-500 transition-colors",
                  "disabled:opacity-50"
                )}
              >
                {isRunning ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
                Run
              </button>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-3">
            <div className="space-y-2">
              <label className="text-sm font-medium">Title</label>
              <input
                value={form.title}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                placeholder="e.g. Fetch user by mobile"
                className="w-full px-3 py-2 rounded-lg border border-border/50 bg-background"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Endpoint</label>
              <input
                value={form.endpoint}
                onChange={(e) => setForm((f) => ({ ...f, endpoint: e.target.value }))}
                placeholder="https://api.example.com/db/check"
                className="w-full px-3 py-2 rounded-lg border border-border/50 bg-background"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Token (optional)</label>
            <input
              value={form.token}
              onChange={(e) => setForm((f) => ({ ...f, token: e.target.value }))}
              placeholder="Bearer token"
              className="w-full px-3 py-2 rounded-lg border border-border/50 bg-background"
            />
          </div>

          <div className="grid md:grid-cols-2 gap-3">
            <div className="space-y-2">
              <label className="text-sm font-medium">Params Template (JSON)</label>
              <textarea
                value={form.paramsTemplate}
                onChange={(e) => setForm((f) => ({ ...f, paramsTemplate: e.target.value }))}
                rows={8}
                className="w-full px-3 py-2 rounded-lg border border-border/50 bg-background font-mono text-sm"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Params to Send (JSON)</label>
              <textarea
                value={inputParams}
                onChange={(e) => setInputParams(e.target.value)}
                rows={8}
                className="w-full px-3 py-2 rounded-lg border border-border/50 bg-background font-mono text-sm"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Response</label>
            <div className="min-h-[160px] rounded-xl border border-border/50 bg-foreground/5 p-3 font-mono text-sm overflow-auto">
              {responsePreview ? (
                <pre className="whitespace-pre-wrap wrap-break-word">
                  {JSON.stringify(responsePreview, null, 2)}
                </pre>
              ) : (
                <div className="text-foreground/60 text-sm">No response yet.</div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

