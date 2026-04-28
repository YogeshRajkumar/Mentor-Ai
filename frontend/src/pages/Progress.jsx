import { useEffect, useMemo, useRef, useState } from "react";
import { SkeletonCard } from "../components/ChatPanel";
import {
  fetchWithRetry, friendlyError,
  lsSet, slowNetworkTimer,
} from "../utils";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000";

function getStoredUserId() {
  return localStorage.getItem("USER_ID") || "";
}

function Spinner() {
  return <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />;
}

function getMotivationMessage(percent) {
  if (percent < 30) return "Start with small wins — every task done counts! 💪";
  if (percent < 70) return "You're improving — keep going, momentum is building! 🔥";
  return "Great progress — stay consistent and finish strong! 🏆";
}

function ProgressPage({ setGlobalMessage, isOffline }) {
  const [userId] = useState(() => getStoredUserId());
  const [tasks, setTasks]                   = useState([]);
  const [isLoading, setIsLoading]           = useState(true);
  const [error, setError]                   = useState("");
  const [isGeneratingSchedule, setIsGeneratingSchedule] = useState(false);
  const [visible, setVisible]               = useState(false);

  const fetchAbortRef = useRef(null);
  const fetchIdRef    = useRef(0);

  useEffect(() => {
    const t = requestAnimationFrame(() => setVisible(true));
    return () => cancelAnimationFrame(t);
  }, []);

  // ── Fetch with AbortController + isMounted + stale-ID ────────────────────
  const fetchAllTasks = async (uid) => {
    fetchAbortRef.current?.abort();
    const controller = new AbortController();
    fetchAbortRef.current = controller;

    const myId = ++fetchIdRef.current;
    setError("");

    const cancelSlow = slowNetworkTimer(
      () => setGlobalMessage?.("Slow network detected…"),
      1500
    );

    const res = await fetchWithRetry(
      `${API_BASE}/tasks/${uid}`,
      { signal: controller.signal }
    );
    cancelSlow();

    if (myId !== fetchIdRef.current) return;
    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    const data = await res.json();
    if (!data.success) { setError(data.message || "Something went wrong"); return; }
    setTasks(data.data || []);
  };

  const loadTasks = async (uid) => {
    try {
      setIsLoading(true);
      await fetchAllTasks(uid);
    } catch (e) {
      const msg = friendlyError(e);
      if (msg) setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const [hasLoaded, setHasLoaded] = useState(false);

  useEffect(() => {
    let isMounted = true;
    if (!userId || hasLoaded) {
      if (!userId) {
        setTasks([]);
        setError("Please create profile in Settings");
        setIsLoading(false);
      }
      return;
    }
    loadTasks(userId).then(() => { 
      if (isMounted) setHasLoaded(true); 
    });
    return () => {
      isMounted = false;
      fetchAbortRef.current?.abort();
    };
  }, [userId, hasLoaded]);

  const handleGenerateSchedule = async () => {
    if (!userId) { setError("Please create profile in Settings"); return; }
    if (isGeneratingSchedule || isOffline) return;
    setIsGeneratingSchedule(true);
    setError("");
    try {
      const res = await fetchWithRetry(`${API_BASE}/schedule/generate-weekly`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });
      const data = await res.json();
      if (!data.success) { setError(data.message || "Something went wrong"); return; }
      setGlobalMessage?.("Schedule generated successfully");
      lsSet("GLOBAL_MSG", "Schedule generated successfully");
      await fetchAllTasks(userId);
    } catch (e) {
      console.error("Generate schedule error:", e);
      setError(friendlyError(e));
    } finally {
      setIsGeneratingSchedule(false);
    }
  };

  const stats = useMemo(() => {
    const activeTasks = tasks.filter((t) => t.status !== "pending");
    const total     = activeTasks.length;
    const completed = activeTasks.filter((t) => {
      if (t.completed === true) return true;
      if (typeof t.completed === "boolean") return t.completed;
      return t.status?.toLowerCase?.() === "completed";
    }).length;
    const percent = total === 0 ? 0 : Math.round((completed / total) * 100);
    return { total, completed, percent, pending: total - completed };
  }, [tasks]);

  return (
    <main
      className={`min-w-0 flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 transition-opacity duration-300 ease-in-out ${
        visible ? "opacity-100" : "opacity-0"
      }`}
    >
      <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-2xl font-semibold tracking-tight text-gray-800">Progress</h2>
          {isOffline && (
            <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-600">Offline</span>
          )}
        </div>

        {error && !isLoading && (
          <div className="mt-3 flex items-center gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3">
            <p className="flex-1 text-sm text-red-600">{error}</p>
            {userId && !isOffline && (
              <button onClick={() => loadTasks(userId)} className="shrink-0 rounded-lg bg-red-500 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-red-600">Retry</button>
            )}
          </div>
        )}

        {!userId ? (
          <div className="mt-4 space-y-2">
            <p className="text-sm text-gray-500">No user profile found. Open <b>Settings</b> to create one.</p>
          </div>
        ) : isLoading ? (
          <div className="mt-4 space-y-2"><SkeletonCard /><SkeletonCard /><SkeletonCard /></div>
        ) : stats.total === 0 ? (
          <div className="mt-6 space-y-4">
            <div className="rounded-2xl border border-dashed border-gray-300 bg-gray-50 p-8 text-center">
              <p className="text-2xl mb-2">📊</p>
              <p className="text-sm font-medium text-gray-700">No tasks yet — generate a schedule to get started</p>
              <p className="mt-1 text-xs text-gray-500">Create tasks to start tracking your learning progress.</p>
            </div>
            <button
              onClick={handleGenerateSchedule}
              disabled={isGeneratingSchedule || !userId || isOffline}
              className="flex items-center justify-center gap-2 rounded-xl bg-indigo-500 px-4 py-2 text-sm font-medium text-white shadow-lg shadow-indigo-500/30 transition hover:bg-indigo-600 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isGeneratingSchedule ? <><Spinner /> Generating...</> : "Start tracking tasks"}
            </button>
          </div>
        ) : (
          <div className="mt-4 space-y-4">
            <div className="rounded-2xl border border-gray-200 bg-white p-4">
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-semibold text-gray-800">Overall completion</p>
                <p className="text-sm font-semibold">{stats.percent}%</p>
              </div>
              <div className="mt-3 h-2.5 overflow-hidden rounded-full bg-gray-100">
                <div className="h-2.5 rounded-full bg-gradient-to-r from-indigo-500 to-cyan-400 transition-all duration-700" style={{ width: `${stats.percent}%` }} />
              </div>
              <div className="mt-3 flex flex-wrap gap-3 text-xs text-gray-500">
                <div><span className="font-semibold text-emerald-600">{stats.completed}</span> completed</div>
                <div><span className="font-semibold text-red-500">{stats.pending}</span> pending</div>
                <div><span className="font-semibold text-gray-800">{stats.total}</span> total</div>
              </div>
            </div>

            <div className="rounded-2xl border border-gray-200 bg-white p-4">
              <p className="text-sm font-semibold text-gray-800">Next best action</p>
              <p className="mt-2 text-sm text-gray-500">{getMotivationMessage(stats.percent)}</p>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}

export default ProgressPage;
