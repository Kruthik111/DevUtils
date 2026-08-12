"use client";

import { useEffect, useMemo, useState } from "react";
import { Plus, Trash2, ListTodo, Filter, ArrowUp, ArrowDown, RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils";
import { Loading } from "@/components/ui/loading";

const STORAGE_KEY = "devutils-tasks";
const PRIORITIES = ["Low", "Medium", "High", "Urgent"] as const;
const STATUSES = ["Todo", "InProgress", "Done", "Deferred"] as const;
const WHENS = ["Now", "ASAP", "Tomorrow", "Later"] as const;

type Task = {
  id: string;
  title: string;
  description?: string;
  priority: (typeof PRIORITIES)[number];
  status: (typeof STATUSES)[number];
  when: (typeof WHENS)[number];
};

type Column = "title" | "priority" | "status" | "when";

// Sort order for the enum columns is the declared order, not alphabetical.
const COLUMNS: { key: Column; label: string; options?: readonly string[] }[] = [
  { key: "title", label: "Task" },
  { key: "priority", label: "Priority", options: PRIORITIES },
  { key: "status", label: "Status", options: STATUSES },
  { key: "when", label: "When", options: WHENS },
];

const badge: Record<string, string> = {
  Urgent: "text-red-600 dark:text-red-400",
  High: "text-orange-600 dark:text-orange-400",
  Medium: "text-blue-600 dark:text-blue-400",
  Low: "text-foreground/50",
  Now: "text-red-600 dark:text-red-400",
  ASAP: "text-orange-600 dark:text-orange-400",
  Tomorrow: "text-blue-600 dark:text-blue-400",
  Later: "text-foreground/50",
  Todo: "text-foreground/70",
  InProgress: "text-yellow-600 dark:text-yellow-400",
  Done: "text-green-600 dark:text-green-400",
  Deferred: "text-foreground/50",
};

const selectClass =
  "rounded-lg border border-border bg-background px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50";
const inputClass =
  "w-full rounded-xl border border-border bg-background px-4 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50";

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [sort, setSort] = useState<{ key: Column; dir: 1 | -1 } | null>(null);
  const [filters, setFilters] = useState<Partial<Record<Column, string[]>>>({});
  const [openFilter, setOpenFilter] = useState<Column | null>(null);
  const [form, setForm] = useState({
    title: "",
    description: "",
    priority: "Medium" as Task["priority"],
    status: "Todo" as Task["status"],
    when: "Later" as Task["when"],
  });

  // Load once on mount (localStorage is client-only).
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setTasks(JSON.parse(raw));
    } catch {
      // corrupt/unavailable storage — start empty
    }
    setLoading(false);
  }, []);

  // Persist on every change, but not before the initial load has run.
  useEffect(() => {
    if (loading) return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
  }, [tasks, loading]);

  const addTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) return;
    setTasks((t) => [{ ...form, title: form.title.trim(), id: crypto.randomUUID() }, ...t]);
    setForm({ ...form, title: "", description: "" });
  };

  const updateTask = (id: string, patch: Partial<Task>) =>
    setTasks((t) => t.map((x) => (x.id === id ? { ...x, ...patch } : x)));

  const deleteTask = (id: string) => setTasks((t) => t.filter((x) => x.id !== id));

  // Click a header to sort; clicking the active column flips direction.
  const toggleSort = (key: Column) =>
    setSort((s) => (s?.key === key ? { key, dir: s.dir === 1 ? -1 : 1 } : { key, dir: 1 }));

  const toggleFilterValue = (key: Column, value: string) =>
    setFilters((f) => {
      const current = f[key] ?? [];
      const next = current.includes(value) ? current.filter((v) => v !== value) : [...current, value];
      return { ...f, [key]: next };
    });

  const visible = useMemo(() => {
    const rank = (col: Column, task: Task) => {
      const options = COLUMNS.find((c) => c.key === col)?.options;
      return options ? options.indexOf(task[col]) : 0;
    };

    // An empty (or missing) value list means "no filter on this column".
    const rows = tasks.filter((t) =>
      COLUMNS.every((c) => {
        const values = filters[c.key];
        return !values?.length || values.includes(t[c.key] ?? "");
      })
    );

    if (!sort) return rows;
    return [...rows].sort((a, b) => {
      const cmp =
        sort.key === "title"
          ? a.title.localeCompare(b.title)
          : rank(sort.key, a) - rank(sort.key, b);
      return cmp * sort.dir;
    });
  }, [tasks, filters, sort]);

  const activeFilters = COLUMNS.reduce((n, c) => n + (filters[c.key]?.length ?? 0), 0);

  return (
    <div className="min-h-screen p-4 md:p-8">
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="flex items-center gap-3">
          <div className="inline-flex items-center justify-center w-11 h-11 rounded-xl bg-primary shadow-lg shadow-primary/20">
            <ListTodo className="w-6 h-6 text-primary-foreground" />
          </div>
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-foreground">Task Manager</h1>
            <p className="text-sm text-foreground/60">
              {visible.length} of {tasks.length} task(s)
            </p>
          </div>
        </div>

        {/* Add form */}
        <form
          onSubmit={addTask}
          className="bg-background/80 border border-border/50 rounded-2xl p-4 md:p-6 space-y-3 shadow-sm"
        >
          <input
            className={inputClass}
            placeholder="Task title *"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            required
          />
          <textarea
            className={cn(inputClass, "resize-none")}
            rows={2}
            placeholder="Description (optional)"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
          />
          <div className="flex flex-wrap items-center gap-2">
            <select
              className={selectClass}
              value={form.priority}
              onChange={(e) => setForm({ ...form, priority: e.target.value as Task["priority"] })}
            >
              {PRIORITIES.map((p) => (
                <option key={p}>{p}</option>
              ))}
            </select>
            <select
              className={selectClass}
              value={form.status}
              onChange={(e) => setForm({ ...form, status: e.target.value as Task["status"] })}
            >
              {STATUSES.map((s) => (
                <option key={s}>{s}</option>
              ))}
            </select>
            <select
              className={selectClass}
              value={form.when}
              onChange={(e) => setForm({ ...form, when: e.target.value as Task["when"] })}
            >
              {WHENS.map((w) => (
                <option key={w}>{w}</option>
              ))}
            </select>
            <button
              type="submit"
              className="ml-auto flex items-center gap-2 px-5 py-2 rounded-xl bg-primary text-primary-foreground font-semibold hover:bg-primary/90"
            >
              <Plus className="w-4 h-4" />
              Add Task
            </button>
          </div>
        </form>

        {/* Table */}
        {loading ? (
          <Loading />
        ) : (
          // no overflow-x on this wrapper on purpose: it would clip the filter popovers
          <div className="border border-border rounded-2xl">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-border bg-foreground/5">
                  {COLUMNS.map((col) => (
                    <th key={col.key} className="p-3 font-semibold text-sm text-foreground/80">
                      <div className="flex items-center gap-1 relative">
                        <button
                          onClick={() => toggleSort(col.key)}
                          className="flex items-center gap-1 hover:text-foreground"
                        >
                          {col.label}
                          {sort?.key === col.key &&
                            (sort.dir === 1 ? (
                              <ArrowUp className="w-3 h-3" />
                            ) : (
                              <ArrowDown className="w-3 h-3" />
                            ))}
                        </button>
                        {col.options && (
                          <button
                            onClick={() => setOpenFilter((o) => (o === col.key ? null : col.key))}
                            aria-label={`Filter by ${col.label}`}
                            className={cn(
                              "p-1 rounded hover:bg-foreground/10",
                              filters[col.key]?.length ? "text-primary" : "text-foreground/40"
                            )}
                          >
                            <Filter className="w-3.5 h-3.5" />
                          </button>
                        )}
                        {openFilter === col.key && col.options && (
                          <>
                            {/* click-away backdrop */}
                            <div className="fixed inset-0 z-10" onClick={() => setOpenFilter(null)} />
                            <div className="absolute top-full left-0 z-20 mt-1 w-40 rounded-xl border border-border bg-background shadow-lg p-2 space-y-1">
                              {col.options.map((opt) => (
                                <label
                                  key={opt}
                                  className="flex items-center gap-2 px-2 py-1 rounded-lg text-sm font-normal hover:bg-foreground/5 cursor-pointer"
                                >
                                  <input
                                    type="checkbox"
                                    checked={filters[col.key]?.includes(opt) ?? false}
                                    onChange={() => toggleFilterValue(col.key, opt)}
                                  />
                                  <span className={badge[opt]}>{opt}</span>
                                </label>
                              ))}
                            </div>
                          </>
                        )}
                      </div>
                    </th>
                  ))}
                  <th className="p-3 w-10">
                    {(activeFilters > 0 || sort) && (
                      <button
                        onClick={() => {
                          setFilters({});
                          setSort(null);
                        }}
                        title="Reset filters and sort"
                        aria-label="Reset filters and sort"
                        className="p-1.5 rounded-lg text-foreground/50 hover:text-foreground hover:bg-foreground/10"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </th>
                </tr>
              </thead>
              <tbody>
                {visible.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-12 text-center text-foreground/50">
                      No tasks here.
                    </td>
                  </tr>
                ) : (
                  visible.map((task) => (
                    <tr key={task.id} className="border-b border-border/50 last:border-0">
                      <td className="p-3 align-top">
                        <p
                          className={cn(
                            "font-medium text-foreground",
                            task.status === "Done" && "line-through text-foreground/50"
                          )}
                        >
                          {task.title}
                        </p>
                        {task.description && (
                          <p className="text-sm text-foreground/60 whitespace-pre-wrap">
                            {task.description}
                          </p>
                        )}
                      </td>
                      <td className="p-3">
                        <select
                          className={cn(selectClass, badge[task.priority])}
                          value={task.priority}
                          onChange={(e) =>
                            updateTask(task.id, { priority: e.target.value as Task["priority"] })
                          }
                        >
                          {PRIORITIES.map((p) => (
                            <option key={p}>{p}</option>
                          ))}
                        </select>
                      </td>
                      <td className="p-3">
                        <select
                          className={cn(selectClass, badge[task.status])}
                          value={task.status}
                          onChange={(e) =>
                            updateTask(task.id, { status: e.target.value as Task["status"] })
                          }
                        >
                          {STATUSES.map((s) => (
                            <option key={s}>{s}</option>
                          ))}
                        </select>
                      </td>
                      <td className="p-3">
                        <select
                          className={cn(selectClass, badge[task.when])}
                          value={task.when}
                          onChange={(e) => updateTask(task.id, { when: e.target.value as Task["when"] })}
                        >
                          {WHENS.map((w) => (
                            <option key={w}>{w}</option>
                          ))}
                        </select>
                      </td>
                      <td className="p-3">
                        <button
                          onClick={() => deleteTask(task.id)}
                          aria-label={`Delete task ${task.title}`}
                          className="p-2 rounded-lg text-foreground/50 hover:text-red-500 hover:bg-red-500/10"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
