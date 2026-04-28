import { useEffect, useRef, useState, useCallback } from "react";
import { SkeletonCard } from "../components/ChatPanel";
import { fetchWithRetry, friendlyError, lsGetCached, lsSetCached, slowNetworkTimer } from "../utils";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000";
const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

const STATUS_STYLES = {
  idle:      { label: "Take Task",      className: "bg-gray-100 text-gray-600 hover:bg-gray-200" },
  pending:   { label: "In Progress",   className: "bg-yellow-100 text-yellow-700 hover:bg-yellow-200" },
  completed: { label: "Completed", className: "bg-green-100 text-green-700 hover:bg-green-200" },
};

const PRIORITY_BADGE = {
  high:   "bg-red-100 text-red-600",
  medium: "bg-orange-100 text-orange-600",
  low:    "bg-blue-100 text-blue-600",
};

const CATEGORY_LABELS = {
  java: "Problem Solving",
  aptitude: "Aptitude",
  project: "Project"
};

function getStoredUserId() {
  return localStorage.getItem("USER_ID") || "";
}

function Spinner() {
  return (
    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
  );
}

function EmptyDay() {
  return (
    <p className="rounded-xl border border-dashed border-gray-200 py-4 text-center text-xs text-gray-400">
      No tasks
    </p>
  );
}

// ── Task card inside a day column ────────────────────────────────
function TaskCard({ scheduleId, task, onStatusChange }) {
  const [busy, setBusy] = useState(false);
  const currentStatus = (task.status || "idle").toLowerCase();
  const style = STATUS_STYLES[currentStatus] ?? STATUS_STYLES.idle;

  const handleClick = async (e) => {
    if (e) e.stopPropagation();
    if (busy) return;

    // Strict Cycle: idle -> pending -> completed -> idle
    const cycle = { idle: "pending", pending: "completed", completed: "idle" };
    const nextStatus = cycle[currentStatus] || "pending";
    
    console.log(`📡 [DEBUG] Local Click: ${currentStatus} -> ${nextStatus}`);
    
    setBusy(true);
    try {
      // Delegate to central handler in App.jsx
      await onStatusChange(scheduleId, task.task_id, nextStatus);
    } catch (err) {
      console.error("❌ Click delegate failed:", err);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-3 shadow-sm transition hover:shadow-md">
      {/* Title */}
      <p className={`truncate text-sm font-semibold transition-colors ${currentStatus === "completed" ? "text-gray-400 line-through" : "text-gray-800"}`}>
        {task.title}
      </p>

      {/* Meta row */}
      <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
        {task.priority && (
          <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${PRIORITY_BADGE[String(task.priority).toLowerCase()] ?? "bg-gray-100 text-gray-500"}`}>
            {task.priority}
          </span>
        )}
        {task.category && (
          <span className="rounded-full bg-indigo-50 px-2 py-0.5 text-[10px] font-medium text-indigo-600 uppercase">
            {CATEGORY_LABELS[String(task.category).toLowerCase()] || task.category}
          </span>
        )}
        {task.duration && (
          <span className="rounded-full bg-gray-50 px-2 py-0.5 text-[10px] text-gray-500">
            {task.duration} min
          </span>
        )}
      </div>

      {/* Action area */}
      <div className="mt-3">
        {currentStatus === "completed" ? (
          <div className="flex items-center justify-center gap-1.5 rounded-lg bg-green-50 py-1.5 text-xs font-bold text-green-600">
            <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
            Done
          </div>
        ) : (
          <button
            onClick={handleClick}
            disabled={busy}
            className={`flex w-full items-center justify-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition active:scale-95 disabled:opacity-60 ${style.className}`}
          >
            {busy ? <Spinner /> : currentStatus === "pending" ? "Mark Done" : "Take Task"}
          </button>
        )}
      </div>
    </div>
  );
}

// ── Day column ───────────────────────────────────────────────────
function DayColumn({ dayDoc, onStatusChange }) {
  const isWeekend = dayDoc.day === "Sat" || dayDoc.day === "Sun";
  return (
    <div className={`flex min-w-[160px] flex-col rounded-2xl border p-3 ${isWeekend ? "border-indigo-100 bg-indigo-50/40" : "border-gray-100 bg-gray-50/50"}`}>
      {/* Day header */}
      <div className="mb-3 flex items-center justify-between">
        <span className={`text-xs font-bold uppercase tracking-widest ${isWeekend ? "text-indigo-500" : "text-gray-500"}`}>
          {dayDoc.day}
        </span>
        <span className="rounded-full bg-white px-2 py-0.5 text-[10px] font-medium text-gray-500 shadow-sm">
          {dayDoc.tasks.length}
        </span>
      </div>

      {/* Task cards */}
      <div className="flex flex-col gap-2">
        {dayDoc.tasks.length === 0 ? (
          <EmptyDay />
        ) : (
          dayDoc.tasks.map((task, i) => (
            <TaskCard
              key={`${task.task_id}-${i}`}
              scheduleId={dayDoc._id}
              task={task}
              onStatusChange={onStatusChange}
            />
          ))
        )}
      </div>
    </div>
  );
}

// ── Main Page ────────────────────────────────────────────────────
function SchedulePage({ userId, schedule, setSchedule, onStatusChange, setGlobalMessage, isOffline }) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [visible, setVisible] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);

  useEffect(() => {
    const t = requestAnimationFrame(() => setVisible(true));
    return () => cancelAnimationFrame(t);
  }, []);

  const fetchSchedule = useCallback(async (uid) => {
    if (!uid) return;
    setError("");
    const cancelSlow = slowNetworkTimer(
      () => setGlobalMessage?.("Slow network detected…"),
      1500
    );

    try {
      const res = await fetchWithRetry(`${API_BASE}/schedule/${uid}`);
      cancelSlow();
      const json = await res.json();
      if (json.success) {
        setSchedule(json.data ?? []);
        lsSetCached("SCHEDULE_WEEK", json.data);
        setLastUpdated(Date.now());
      } else {
        setError(json.message || "Failed to load schedule");
      }
    } catch (e) {
      setError(friendlyError(e));
    }
  }, [setSchedule, setGlobalMessage]);

  const loadSchedule = useCallback(async (uid) => {
    try {
      setIsLoading(true);
      await fetchSchedule(uid);
    } catch (e) {
      const msg = friendlyError(e);
      if (msg) setError(msg);
    } finally {
      setIsLoading(false);
    }
  }, [fetchSchedule]);

  // ── Generate schedule ────────────────────────────────────────
  const generateAndFetch = async () => {
    if (!userId) { setError("Please create profile in Settings"); return; }
    if (isGenerating || isOffline) return;
    setIsGenerating(true);
    setError("");
    try {
      const res = await fetchWithRetry(`${API_BASE}/schedule/generate-weekly`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });
      const data = await res.json();
      if (!data.success) {
        setError(data.message || "Generation failed");
        return;
      }
      setGlobalMessage?.("Weekly schedule generated ✅");
      await fetchSchedule(userId);
    } catch (e) {
      setError(friendlyError(e));
    } finally {
      setIsGenerating(false);
    }
  };

  // ── Optimistic status update (Syncs across ALL days) ──────────
  const handleStatusChange = useCallback((scheduleId, taskId, newStatus) => {
    setSchedule((prev) =>
      prev.map((dayDoc) => ({
        ...dayDoc,
        tasks: dayDoc.tasks.map((t) =>
          String(t.task_id) === String(taskId) ? { ...t, status: newStatus } : t
        ),
      }))
    );
  }, []);

  // ── Auto-load on mount ───────────────────────────────────────
  const [hasLoaded, setHasLoaded] = useState(false);

  useEffect(() => {
    if (!userId || hasLoaded) return;
    loadSchedule(userId).then(() => setHasLoaded(true));
  }, [userId, hasLoaded, loadSchedule]);

  // ── Derived state ────────────────────────────────────────────
  const hasSchedule = schedule.some((d) => d.tasks?.length > 0);
  const totalTasks  = schedule.reduce((sum, d) => sum + (d.tasks?.length ?? 0), 0);

  const diffMin = lastUpdated ? Math.floor((Date.now() - lastUpdated) / 60000) : null;
  const lastUpdatedLabel =
    diffMin === null    ? null
    : diffMin < 1      ? "just now"
    : diffMin === 1    ? "1 min ago"
    : diffMin < 60     ? `${diffMin} min ago`
    : new Date(lastUpdated).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

  return (
    <main
      className={`min-w-0 flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 transition-opacity duration-300 ease-in-out ${
        visible ? "opacity-100" : "opacity-0"
      }`}
    >
      {/* ── Header ─────────────────────────────────────────────── */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight text-gray-800">Weekly Schedule</h2>
          {lastUpdatedLabel && (
            <p className="mt-0.5 text-xs text-gray-400">Last updated: {lastUpdatedLabel}</p>
          )}
        </div>

        <div className="flex items-center gap-2">
          {isOffline && (
            <span className="rounded-full bg-red-100 px-2.5 py-1 text-xs font-medium text-red-600">
              Offline
            </span>
          )}
          {hasSchedule && (
            <span className="rounded-full bg-indigo-50 px-2.5 py-1 text-xs font-medium text-indigo-600">
              {totalTasks} task{totalTasks !== 1 ? "s" : ""} this week
            </span>
          )}
          {userId && (
            <button
              onClick={generateAndFetch}
              disabled={isGenerating || isOffline}
              className="flex items-center gap-2 rounded-xl bg-indigo-500 px-4 py-2 text-sm font-medium text-white shadow-md shadow-indigo-500/30 transition hover:bg-indigo-600 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isGenerating ? <><Spinner /> Generating…</> : hasSchedule ? "Regenerate" : "Generate Schedule"}
            </button>
          )}
        </div>
      </div>

      {/* ── Error banner ────────────────────────────────────────── */}
      {error && !isLoading && (
        <div className="mb-4 flex items-center gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3">
          <p className="flex-1 text-sm text-red-600">{error}</p>
          {userId && !isOffline && (
            <button
              onClick={() => loadSchedule(userId)}
              className="shrink-0 rounded-lg bg-red-500 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-600"
            >
              Retry
            </button>
          )}
        </div>
      )}

      {/* ── No user ─────────────────────────────────────────────── */}
      {!userId ? (
        <div className="rounded-2xl border border-dashed border-gray-300 bg-gray-50 p-10 text-center">
          <p className="text-3xl mb-2">👤</p>
          <p className="text-sm text-gray-600 font-medium">No user profile found</p>
          <p className="mt-1 text-xs text-gray-400">Open Settings to create your profile first.</p>
        </div>

      /* ── Loading skeleton ──────────────────────────────────────── */
      ) : isLoading ? (
        <div className="mt-2 space-y-2">
          <SkeletonCard /><SkeletonCard /><SkeletonCard />
        </div>

      /* ── Empty state ──────────────────────────────────────────── */
      ) : !hasSchedule ? (
        <div className="rounded-2xl border border-dashed border-gray-300 bg-gray-50 p-10 text-center">
          <p className="text-4xl mb-3">🗓️</p>
          <p className="text-sm font-semibold text-gray-700">No schedule generated yet</p>
          <p className="mt-1 text-xs text-gray-400">
            Click <strong>Generate Schedule</strong> to build your AI-powered weekly plan.
          </p>
        </div>

      /* ── 7-day grid ───────────────────────────────────────────── */
      ) : (
        <div className="rounded-3xl  p-4">
          {/* Horizontal scroll on small screens; grid on large */}
          <div
            className="grid gap-3"
            style={{ gridTemplateColumns: "repeat(7, minmax(155px, 1fr))" }}
          >
            {DAYS.map((day) => {
              const dayDoc = schedule.find((d) => d.day === day) ?? { day, tasks: [] };
              return (
                <DayColumn
                  key={day}
                  dayDoc={dayDoc}
                  onStatusChange={handleStatusChange}
                />
              );
            })}
          </div>

          {/* Legend */}
          <div className="mt-4 flex flex-wrap items-center gap-3 border-t border-gray-100 pt-3">
            {Object.entries(STATUS_STYLES).map(([k, v]) => (
              <span key={k} className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${v.className}`}>
                {v.label}
              </span>
            ))}
            <span className="ml-auto text-xs text-gray-400">
              Sat &amp; Sun = incomplete tasks catchup
            </span>
          </div>
        </div>
      )}
    </main>
  );
}

export default SchedulePage;
