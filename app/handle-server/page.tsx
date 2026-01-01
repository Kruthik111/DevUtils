"use client";

import { useEffect, useMemo, useState } from "react";
import { Plus, Pencil, Trash2, RefreshCw, Server, Globe2, Activity, Database, Cpu, Info } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Loading } from "@/components/ui/loading";
import { ConfirmDialog } from "@/components/notes/confirm-dialog";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";

type Service = {
  _id: string;
  name: string;
};

type Environment = {
  _id: string;
  name: string;
  variables?: Record<string, any>;
  isDefault?: boolean;
  baseUrl?: string;
};

type HealthResponse = {
  status?: string;
  service?: {
    name?: string;
    version?: string;
    uptime?: string;
    environment?: string;
  };
  database?: {
    status?: string;
    readyState?: number;
    host?: string;
    name?: string;
  };
  memory?: {
    rss?: string;
    heapTotal?: string;
    heapUsed?: string;
    external?: string;
  };
};

export default function HandleServerPage() {
  const { status } = useSession();
  const router = useRouter();
  const [services, setServices] = useState<Service[]>([]);
  const [environments, setEnvironments] = useState<Environment[]>([]);
  const [selectedEnvId, setSelectedEnvId] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [isHealthLoading, setIsHealthLoading] = useState<string | null>(null);
  const [healthMap, setHealthMap] = useState<Record<string, HealthResponse | null>>({});
  const [showConfirm, setShowConfirm] = useState<{ open: boolean; id: string | null }>({ open: false, id: null });
  const [envForm, setEnvForm] = useState({ name: "" });
  const [form, setForm] = useState({
    id: "",
    name: "",
  });
  const [envEditForm, setEnvEditForm] = useState({
    baseUrl: "",
  });

  const selectedEnv = useMemo(
    () => environments.find((e) => e._id === selectedEnvId) || environments[0],
    [environments, selectedEnvId]
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
      let allowed = access.includes("*") || access.includes("/handle-server");

      // Fallback: probe admin access once if cache missing
      if (!allowed && typeof window !== "undefined") {
        try {
          const probe = await fetch("/api/users/access");
          if (probe.ok) {
            window.localStorage.setItem("devutils.access", JSON.stringify(["*"]));
            allowed = true;
          }
        } catch {
          // ignore
        }
      }

      if (!allowed) {
        toast.error("Access denied for Handle Server");
        router.push("/profile");
        return;
      }

      const load = async () => {
      try {
        const [svcRes, envRes] = await Promise.all([fetch("/api/services"), fetch("/api/environments")]);
        if (!svcRes.ok || !envRes.ok) {
          throw new Error("Failed to load data");
        }
        const svcData = await svcRes.json();
        const envData = await envRes.json();
        setServices(svcData.items || []);
        const envs: Environment[] = envData.environments || [];
        setEnvironments(envs);
        if (envs.length > 0) {
          const def = envs.find((e) => e.isDefault) || envs[0];
          setSelectedEnvId(def._id);
          setEnvEditForm({ baseUrl: def.baseUrl || "" });
        }
      } catch (error) {
        console.error(error);
        toast.error("Failed to load services");
      } finally {
        setIsLoading(false);
      }
    };
      load();
    };
    checkAccessAndLoad();
  }, [router, status]);

  if (status === "loading") {
    return <Loading fullScreen />;
  }

  const resetForm = () => {
    setForm({
      id: "",
      name: "",
    });
  };

  useEffect(() => {
    if (selectedEnv) {
      setEnvEditForm({ baseUrl: selectedEnv.baseUrl || "" });
    } else {
      setEnvEditForm({ baseUrl: "" });
    }
  }, [selectedEnv]);

  const handleSave = async () => {
    if (!form.name.trim()) {
      toast.error("Name is required");
      return;
    }
    try {
      setIsSaving(true);
      const res = await fetch("/api/services", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: form.id || undefined,
          name: form.name.trim(),
          // adding service requires only name; baseUrl optional for later updates
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || "Failed to save service");
      }
      const data = await res.json();
      const saved = data.item as Service;
      setServices((prev) => {
        const exists = prev.find((p) => p._id === saved._id);
        if (exists) {
          return prev.map((p) => (p._id === saved._id ? saved : p));
        }
        return [...prev, saved];
      });
      toast.success("Saved service");
      resetForm();
    } catch (error: any) {
      console.error(error);
      toast.error(error.message || "Failed to save service");
    } finally {
      setIsSaving(false);
    }
  };

  const handleEdit = (svc: Service) => {
    setForm({
      id: svc._id,
      name: svc.name,
    });
  };

  const handleEnvBaseUrlUpdate = async () => {
    if (!selectedEnv) {
      toast.error("Select an environment");
      return;
    }
    try {
      setIsSaving(true);
      const res = await fetch("/api/environments", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: selectedEnv._id,
          name: selectedEnv.name,
          variables: selectedEnv.variables || {},
          baseUrl: envEditForm.baseUrl || undefined,
          isDefault: selectedEnv.isDefault || false,
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || "Failed to update environment");
      }
      const data = await res.json();
      const updated = data.environment as Environment;
      setEnvironments((prev) => prev.map((e) => (e._id === updated._id ? updated : e)));
      setEnvEditForm({ baseUrl: updated.baseUrl || "" });
      toast.success("Updated environment base URL");
    } catch (error: any) {
      console.error(error);
      toast.error(error.message || "Failed to update environment");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      setIsDeleting(id);
      const res = await fetch(`/api/services?id=${id}`, { method: "DELETE" });
      if (!res.ok) {
        throw new Error("Failed to delete");
      }
      setServices((prev) => prev.filter((p) => p._id !== id));
      toast.success("Deleted service");
    } catch (error) {
      console.error(error);
      toast.error("Failed to delete");
    } finally {
      setIsDeleting(null);
      setShowConfirm({ open: false, id: null });
    }
  };

  const fetchHealth = async (svc: Service) => {
    const baseUrl = selectedEnv?.baseUrl;
    if (!baseUrl) {
      toast.error(`No base URL set for ${selectedEnv?.name || "env"}`);
      return;
    }
    setIsHealthLoading(svc._id);
    setHealthMap((m) => ({ ...m, [svc._id]: null }));
    try {
      const res = await fetch(`${baseUrl}/${svc.name}/health`);
      const text = await res.text();
      let json: any = null;
      try {
        json = JSON.parse(text);
      } catch {
        // non-JSON
      }
      setHealthMap((m) => ({ ...m, [svc._id]: json ?? text }));
      if (!res.ok) {
        toast.error(`Health check failed (${res.status})`);
      }
    } catch (error) {
      console.error(error);
      toast.error("Failed to fetch health");
    } finally {
      setIsHealthLoading(null);
    }
  };

  const handleCheckAll = async () => {
    const list = services;
    if (!list.length) {
      toast.error("No services to check");
      return;
    }
    setIsHealthLoading("all");
    setHealthMap((m) => ({ ...m, ...Object.fromEntries(list.map((s) => [s._id, null])) }));
    try {
      await Promise.all(
        list.map(async (svc) => {
          const baseUrl = selectedEnv?.baseUrl;
          if (!baseUrl) {
            setHealthMap((m) => ({ ...m, [svc._id]: { status: "missing base URL" } }));
            return;
          }
          try {
            const res = await fetch(`${baseUrl}/${svc.name}/health`);
            const text = await res.text();
            let json: any = null;
            try {
              json = JSON.parse(text);
            } catch {
              // non-JSON
            }
            setHealthMap((m) => ({ ...m, [svc._id]: json ?? text }));
            if (!res.ok) {
              toast.error(`${svc.name} failed (${res.status})`);
            }
          } catch (error) {
            console.error(error);
            setHealthMap((m) => ({ ...m, [svc._id]: { status: "error" } }));
          }
        })
      );
    } finally {
      setIsHealthLoading(null);
    }
  };

  if (isLoading) {
    return <Loading fullScreen />;
  }

  return (
    <div className="p-6 md:p-8 space-y-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <h1 className="text-2xl md:text-3xl font-bold">Server Dashboard</h1>
        <div className="flex gap-3 items-center flex-wrap">
          <select
            value={selectedEnvId}
            onChange={(e) => setSelectedEnvId(e.target.value)}
            className="px-3 py-2 rounded-lg border border-border/50 bg-background"
          >
            {environments.map((env) => (
              <option key={env._id} value={env._id}>
                {env.name}
              </option>
            ))}
          </select>
          <div className="flex gap-2">
            <input
              value={envForm.name}
              onChange={(e) => setEnvForm({ name: e.target.value })}
              placeholder="Add environment"
              className="px-3 py-2 rounded-lg border border-border/50 bg-background"
            />
            <button
              onClick={async () => {
                if (!envForm.name.trim()) {
                  toast.error("Environment name is required");
                  return;
                }
                try {
                  setIsSaving(true);
                  const res = await fetch("/api/environments", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ name: envForm.name.trim(), variables: {} }),
                  });
                  if (!res.ok) {
                    const err = await res.json().catch(() => ({}));
                    throw new Error(err.message || "Failed to add environment");
                  }
                  const data = await res.json();
                  const env = data.environment as Environment;
                  setEnvironments((prev) => [...prev, env]);
                  setSelectedEnvId(env._id);
                  setEnvForm({ name: "" });
                  toast.success("Environment added");
                } catch (error: any) {
                  console.error(error);
                  toast.error(error.message || "Failed to add environment");
                } finally {
                  setIsSaving(false);
                }
              }}
              className={cn(
                "px-4 py-2 rounded-lg bg-primary text-background hover:bg-primary/90",
                "disabled:opacity-50"
              )}
              disabled={isSaving}
            >
              Add
            </button>
          </div>
          {services.length > 0 && (
            <button
              onClick={handleCheckAll}
              disabled={isHealthLoading === "all"}
              className={cn(
                "inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm",
                "bg-emerald-700 text-background hover:bg-emerald-600 transition-colors",
                "disabled:opacity-50"
              )}
            >
              {isHealthLoading === "all" ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Activity className="w-4 h-4" />}
              Check All
            </button>
          )}
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-4">
        <div className="space-y-4">
          <div className="bg-background/80 border border-border/50 rounded-2xl p-4 space-y-3">
            <h2 className="text-sm font-semibold text-foreground/70">Add / Edit Service</h2>
            <div className="space-y-3">
              <div className="space-y-1">
                <label className="text-sm font-medium">Name</label>
                <input
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  className="w-full px-3 py-2 rounded-lg border border-border/50 bg-background"
                  placeholder="sales-service"
                />
              </div>
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
                  {isSaving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                  {form.id ? "Update" : "Add"}
                </button>
                <button
                  onClick={resetForm}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-border/50 hover:bg-foreground/5"
                >
                  Reset
                </button>
              </div>
            </div>
          </div>

          <div className="bg-background/80 border border-border/50 rounded-2xl p-4 space-y-3">
            <h2 className="text-sm font-semibold text-foreground/70">Environment Base URL</h2>
            <div className="space-y-3">
              <div className="space-y-1">
                <label className="text-sm font-medium">Selected Environment</label>
                <input
                  disabled
                  value={selectedEnv?.name || ""}
                  className="w-full px-3 py-2 rounded-lg border border-border/50 bg-background/70"
                />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium">Base URL</label>
                <input
                  value={envEditForm.baseUrl}
                  onChange={(e) => setEnvEditForm({ baseUrl: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-border/50 bg-background"
                  placeholder="https://api.example.com"
                />
              </div>
              <button
                onClick={handleEnvBaseUrlUpdate}
                disabled={isSaving || !selectedEnv}
                className={cn(
                  "inline-flex items-center gap-2 px-4 py-2 rounded-lg",
                  "bg-emerald-600 text-background hover:bg-emerald-500 transition-colors",
                  "disabled:opacity-50"
                )}
              >
                {isSaving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                Update
              </button>
            </div>
          </div>
        </div>

        <div className="lg:col-span-2 space-y-3">
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {services.map((svc) => {
              const health = healthMap[svc._id];
              const status = typeof health === "object" && health ? (health as any).status : undefined;
              const activeBaseUrl = selectedEnv?.baseUrl;
              return (
                <div
                  key={svc._id}
                  className="border border-border/50 rounded-2xl p-4 bg-background/80 space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-semibold">{svc.name}</div>
              <div className="text-xs text-foreground/60 break-all">{activeBaseUrl || "No base URL"}</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleEdit(svc)}
                        className="p-2 rounded-md hover:bg-foreground/10"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setShowConfirm({ open: true, id: svc._id })}
                        disabled={isDeleting === svc._id}
                        className="p-2 rounded-md hover:bg-red-500/10 text-red-500 disabled:opacity-50"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-foreground/70">
                    <Globe2 className="w-4 h-4" />
                    {(selectedEnv?.name || "Env").toUpperCase()}
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => fetchHealth(svc)}
                      disabled={isHealthLoading === svc._id || isHealthLoading === "all"}
                      className={cn(
                        "inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm",
                        "bg-emerald-600 text-background hover:bg-emerald-500 transition-colors",
                        "disabled:opacity-50"
                      )}
                    >
                      {isHealthLoading === svc._id ? (
                        <RefreshCw className="w-4 h-4 animate-spin" />
                      ) : (
                        <Activity className="w-4 h-4" />
                      )}
                      Check Health
                    </button>
                  </div>
                  {health && typeof health === "object" ? (
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-2">
                        <Server className="w-4 h-4 text-foreground/70" />
                        <span className="font-medium">Status:</span> {health.status ?? "—"}
                      </div>
                      <div className="flex items-center gap-2">
                        <Info className="w-4 h-4 text-foreground/70" />
                        <span className="font-medium">Uptime:</span> {health.service?.uptime ?? "—"}
                      </div>
                      <div className="flex items-center gap-2">
                        <Database className="w-4 h-4 text-foreground/70" />
                        <span className="font-medium">DB:</span> {health.database?.status ?? "—"} ({health.database?.host ?? "—"})
                      </div>
                      <div className="flex items-center gap-2">
                        <Cpu className="w-4 h-4 text-foreground/70" />
                        <span className="font-medium">Memory:</span> {health.memory?.heapUsed ?? "—"} / {health.memory?.heapTotal ?? "—"}
                      </div>
                    </div>
                  ) : health ? (
                    <div className="text-sm text-foreground/70 wrap-break-word">{String(health)}</div>
                  ) : (
                    <div className="text-sm text-foreground/60">No data yet</div>
                  )}
                </div>
              );
            })}
            {services.length === 0 && (
              <div className="text-sm text-foreground/60 border border-border/50 rounded-2xl p-4">
                No services yet.
              </div>
            )}
          </div>
        </div>
      </div>

      <ConfirmDialog
        isOpen={showConfirm.open}
        title="Delete service"
        message="Are you sure you want to delete this service?"
        onConfirm={() => showConfirm.id && handleDelete(showConfirm.id)}
        onCancel={() => setShowConfirm({ open: false, id: null })}
      />
    </div>
  );
}

