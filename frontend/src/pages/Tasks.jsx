import { useEffect, useRef, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { SkeletonCard } from "../components/ChatPanel";
import {
  fetchWithRetry, friendlyError,
  lsGetCached, lsSetCached, lsSet,
  slowNetworkTimer,
} from "../utils";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000";

const CATEGORY_LABELS = {
  java: "Problem Solving",
  aptitude: "Aptitude",
  project: "Project"
};

function getStoredUserId() {
  return localStorage.getItem("USER_ID") || "";
}

function Spinner() {
  return <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />;
}

function LastUpdated({ ts }) {
  if (!ts) return null;
  const diffMin = Math.floor((Date.now() - ts) / 60000);
  const label =
    diffMin < 1   ? "just now"
    : diffMin === 1 ? "1 min ago"
    : diffMin < 60  ? `${diffMin} min ago`
    : new Date(ts).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  return <span className="text-xs text-gray-500">Last updated: {label}</span>;
}

function TasksPage({ tasks, setTasks, onToggle, onDelete, userId: propUserId, setGlobalMessage, isOffline }) {
  const [userId] = useState(() => propUserId || getStoredUserId());

  const [isLoading, setIsLoading]             = useState(true);
  const [error, setError]                     = useState("");
  const [isAdding, setIsAdding]               = useState(false);
  const [isGeneratingSchedule, setIsGeneratingSchedule] = useState(false);
  const [lastUpdated, setLastUpdated]         = useState(null);
  const [visible, setVisible]                 = useState(false);
  const navigate = useNavigate();

  // Request cancellation ref
  const fetchAbortRef = useRef(null);
  // Stale-response protection
  const fetchIdRef = useRef(0);

  // ── Page fade-in ──────────────────────────────────────────────────────────
  useEffect(() => {
    const t = requestAnimationFrame(() => setVisible(true));
    return () => cancelAnimationFrame(t);
  }, []);

  // ── Core fetch — AbortController + isMounted + stale-ID ──────────────────
  const fetchTasks = useCallback(async (uid) => {
    // Cancel any previous fetch
    fetchAbortRef.current?.abort();
    const controller = new AbortController();
    fetchAbortRef.current = controller;

    // Stale-response ID for this specific call
    const myId = ++fetchIdRef.current;

    setError("");

    const cancelSlow = slowNetworkTimer(
      () => setGlobalMessage?.("Slow network detected…"),
      1500
    );

    try {
      const res = await fetchWithRetry(
        `${API_BASE}/tasks/${uid || userId}`,
        { signal: controller.signal }
      );
      cancelSlow();

      // Discard if a newer fetch has started
      if (myId !== fetchIdRef.current) return;

      if (!res.ok) {
        const errData = await res.json().catch(() => null);
        throw new Error(errData?.message || `HTTP ${res.status}`);
      }
      const data = await res.json();
      if (!data.success) { setError(data.message || "Something went wrong"); return; }

      const taskList = data.data || [];
      setTasks(taskList);
      setLastUpdated(Date.now());
      lsSetCached("TASKS", taskList); // versioned cache
    } catch (err) {
      if (err.name !== "AbortError") throw err;
    }
  }, [userId, setTasks, setGlobalMessage]);

  const loadTasks = useCallback(async (uid) => {
    try {
      setIsLoading(true);
      await fetchTasks(uid);
    } catch (e) {
      const msg = friendlyError(e);
      if (msg) setError(msg); 
    } finally {
      setIsLoading(false);
    }
  }, [fetchTasks]);

  const [hasLoaded, setHasLoaded] = useState(false);

  useEffect(() => {
    let isMounted = true;
    
    // GUARD: Only fetch if we have a userId and haven't loaded yet
    if (!userId || hasLoaded) {
      if (!userId && !isLoading) setIsLoading(false);
      return;
    }

    // Since App.jsx already fetches tasks, we only fetch here if tasks prop is empty
    if (tasks && tasks.length > 0) {
      setIsLoading(false);
      setHasLoaded(true);
      return;
    }

    loadTasks(userId).then(() => { 
      if (isMounted) setHasLoaded(true); 
    });

    return () => {
      isMounted = false;
      fetchAbortRef.current?.abort();
    };
  }, [userId, hasLoaded, loadTasks, tasks, isLoading]);

  // ── Add task — optimistic UI + duplicate guard ────────────────────────────
  const handleAddTask = async () => {
    if (!userId) { setError("Please create profile in Settings"); return; }
    if (isAdding || isGeneratingSchedule || isOffline) return;

    const TITLE = "Aptitude Practice (Sample)";

    // Prevent duplicate title (case-insensitive)
    const isDuplicate = tasks.some(
      (t) => (t.title ?? "").toLowerCase() === TITLE.toLowerCase()
    );
    if (isDuplicate) {
      setGlobalMessage?.(`"${TITLE}" already exists`);
      return;
    }

    const optimisticId = `opt_${Date.now()}`;
    const optimisticTask = {
      id: optimisticId, _id: optimisticId,
      title: TITLE, category: "aptitude", priority: "medium",
      duration: 45, status: "idle", completed: false, _optimistic: true,
    };

    setTasks((prev) => [optimisticTask, ...prev]);
    setIsAdding(true);
    setError("");

    try {
      const res = await fetchWithRetry(`${API_BASE}/tasks/add`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: TITLE, category: "aptitude", priority: "medium", duration: 45, user_id: userId }),
      });
      const data = await res.json();

      if (!data.success) {
        setTasks((prev) => prev.filter((t) => t.id !== optimisticId));
        setError(data.message || "Something went wrong");
        return;
      }

      setGlobalMessage?.("Task added successfully");
      lsSet("GLOBAL_MSG", "Task added successfully");
      await fetchTasks(userId);
    } catch (err) {
      console.error("Add task error:", err);
      setTasks((prev) => prev.filter((t) => t.id !== optimisticId));
      setError(friendlyError(err));
    } finally {
      setIsAdding(false);
    }
  };

  const handleGenerateSchedule = async () => {
    if (!userId) { setError("Please create profile in Settings"); return; }
    if (isAdding || isGeneratingSchedule || isOffline) return;
    setIsGeneratingSchedule(true);
    setError("");

    try {
      const res = await fetchWithRetry(`${API_BASE}/schedule/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });
      const data = await res.json();
      if (!data.success) { setError(data.message || "Something went wrong"); return; }

      setGlobalMessage?.("Schedule generated successfully");
      lsSet("GLOBAL_MSG", "Schedule generated successfully");
      await fetchTasks(userId);
      navigate("/schedule");
    } catch (err) {
      console.error("Generate schedule error:", err);
      setError(friendlyError(err));
    } finally {
      setIsGeneratingSchedule(false);
    }
  };

  const isBusy = isAdding || isGeneratingSchedule || isOffline;

  return (
    <main
      className={`min-w-0 flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 transition-opacity duration-300 ease-in-out ${
        visible ? "opacity-100" : "opacity-0"
      }`}
    >
      <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-2xl font-semibold tracking-tight text-gray-800">Tasks</h2>
          <div className="flex items-center gap-3">
            {isOffline && <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-600">Offline</span>}
            <LastUpdated ts={lastUpdated} />
          </div>
        </div>

        {error && !isLoading && (
          <div className="mt-3 flex items-center gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3">
            <p className="flex-1 text-sm text-red-600">{error}</p>
            {userId && !isOffline && (
              <button onClick={() => loadTasks(userId)} className="shrink-0 rounded-lg bg-red-500 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-red-600">
                Retry
              </button>
            )}
          </div>
        )}

        {!userId ? (
          <div className="mt-4 space-y-2">
            <p className="text-sm text-gray-500">No user profile found. Open <b>Settings</b> to create one.</p>
          </div>
        ) : isLoading ? (
          <div className="mt-4 space-y-2"><SkeletonCard /><SkeletonCard /><SkeletonCard /></div>
        ) : tasks.length === 0 ? (
          <div className="mt-6 space-y-4">
            <div className="rounded-2xl border border-dashed border-gray-300 p-8 text-center bg-gray-50">
              <p className="text-3xl mb-2">🚀</p>
              <p className="text-sm font-medium text-gray-700">Start by adding your first task</p>
              <p className="mt-1 text-xs text-gray-500">Or generate an AI-powered schedule based on your profile</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button onClick={handleAddTask} disabled={isBusy} className="flex items-center justify-center gap-2 rounded-xl bg-indigo-500 px-4 py-2 text-sm font-medium text-white shadow-lg shadow-indigo-500/30 transition hover:bg-indigo-600 disabled:opacity-60 disabled:cursor-not-allowed">
                {isAdding ? <><Spinner /> Adding...</> : "Create your first task"}
              </button>
              <button onClick={handleGenerateSchedule} disabled={isBusy} className="flex items-center justify-center gap-2 rounded-xl bg-emerald-500 px-4 py-2 text-sm font-medium text-white shadow-lg shadow-emerald-500/30 transition hover:bg-emerald-600 disabled:opacity-60 disabled:cursor-not-allowed">
                {isGeneratingSchedule ? <><Spinner /> Generating...</> : "Generate AI schedule"}
              </button>
            </div>
          </div>
        ) : (
          <div className="mt-4 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-sm text-gray-500">
                {tasks.filter((t) => !t._optimistic).length} task{tasks.filter((t) => !t._optimistic).length === 1 ? "" : "s"}
              </p>
              <div className="flex flex-wrap gap-2">
                <button onClick={handleAddTask} disabled={isBusy} className="flex items-center justify-center gap-2 rounded-xl bg-indigo-500 px-4 py-2 text-sm font-medium text-white shadow-lg shadow-indigo-500/30 transition hover:bg-indigo-600 disabled:opacity-60 disabled:cursor-not-allowed">
                  {isAdding ? <><Spinner /> Adding...</> : "Add Task"}
                </button>
                <button onClick={handleGenerateSchedule} disabled={isBusy} className="flex items-center justify-center gap-2 rounded-xl bg-emerald-500 px-4 py-2 text-sm font-medium text-white shadow-lg shadow-emerald-500/30 transition hover:bg-emerald-600 disabled:opacity-60 disabled:cursor-not-allowed">
                  {isGeneratingSchedule ? <><Spinner /> Generating...</> : "Generate Schedule"}
                </button>
              </div>
            </div>

            <div className="space-y-2">
              {tasks.map((task) => {
                const status      = (task.status ?? "idle").toLowerCase();
                const isOptimistic = !!task._optimistic;

                const statusBadge = {
                  idle:      { label: "Take Task",      cls: "bg-gray-100 text-gray-600" },
                  pending:   { label: "In Progress",   cls: "bg-amber-100 text-amber-700" },
                  completed: { label: "Completed", cls: "bg-emerald-100 text-emerald-700" },
                }[status] ?? { label: status, cls: "bg-gray-100 text-gray-600" };

                return (
                  <div
                    key={task.id ?? task._id ?? `${task.title}-${task.time ?? ""}`}
                    className={`flex flex-col gap-1 rounded-2xl border p-4 transition-opacity ${
                      isOptimistic
                        ? "border-indigo-200 bg-indigo-50 opacity-70"
                        : "border-gray-200 bg-white"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <h3 className={`text-sm font-semibold ${ status === "completed" ? "line-through text-gray-400" : "text-gray-800" }`}>
                        {task.title}
                        {isOptimistic && <span className="ml-2 text-xs font-normal text-indigo-500">saving…</span>}
                      </h3>
                      <div className="flex items-center gap-2">
                        {status !== "completed" && onToggle && !isOptimistic && (
                          <button
                            onClick={() => onToggle(task)}
                            className={`rounded-lg px-3 py-1 text-xs font-medium transition-all ${
                              status === "pending"
                                ? "bg-amber-500 text-white hover:bg-amber-600"
                                : "bg-indigo-500 text-white hover:bg-indigo-600 shadow-sm shadow-indigo-500/20"
                            }`}
                          >
                            {status === "pending" ? "Done" : "Take Task"}
                          </button>
                        )}
                        <span className={`shrink-0 rounded-full px-2 py-1 text-xs font-medium ${statusBadge.cls}`}>
                          {statusBadge.label}
                        </span>
                        {onDelete && !isOptimistic && (
                          <button
                            onClick={() => onDelete(task._id)}
                            className="text-gray-400 hover:text-red-500 transition-colors p-1"
                            title="Delete Task"
                          >
                             <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-4v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        )}
                      </div>
                    </div>
                    <div className="text-xs text-gray-500">
                      {CATEGORY_LABELS[task.category.toLowerCase()] || task.category} · Priority: {task.priority}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}

export default TasksPage;
