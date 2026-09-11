import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { Route, Routes } from "react-router-dom";
import Sidebar from "./components/Sidebar";
import ChatPanel from "./components/ChatPanel";
import DashboardPage from "./pages/Dashboard";
import TasksPage from "./pages/Tasks";
import SchedulePage from "./pages/Schedule";
import ProgressPage from "./pages/Progress";
import SettingsPage from "./pages/Settings";
import Login from "./pages/Login";
import Register from "./pages/Register";
import { lsGet, lsSet, lsRemove, fetchWithRetry, slowNetworkTimer, lsGetCached } from "./utils";
import { Navigate } from "react-router-dom";
import Checklist from "./pages/Checklist";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000";
//Samiath oru loosu
// ─── showToast helper ─────────────────────────────────────────────────────────
function showToast(setMsg, msg) {
  setMsg(msg);
  lsSet("GLOBAL_MSG", msg);
}

// ─── Global Toast ────────────────────────────────────────────────────────────
function GlobalToast({ message, onDismiss }) {
  if (!message) return null;

  const isOffline = message.toLowerCase().includes("offline");
  const colour = isOffline
    ? "bg-red-500 shadow-red-500/30"
    : "bg-green-500 shadow-green-500/30";

  return (
    <div
      className={`fixed top-4 right-4 z-50 flex items-center gap-2 rounded-xl ${colour} px-4 py-3 text-sm font-medium text-white shadow-lg transition-all duration-300`}
      role="status"
    >
      {isOffline ? (
        <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <line x1="1" y1="1" x2="23" y2="23" />
          <path d="M16.72 11.06A10.94 10.94 0 0119 12.55" />
          <path d="M5 12.55a10.94 10.94 0 015.17-2.39" />
          <path d="M10.71 5.05A16 16 0 0122.56 9" />
          <path d="M1.42 9a15.91 15.91 0 014.7-2.88" />
          <path d="M8.53 16.11a6 6 0 016.95 0" />
          <circle cx="12" cy="20" r="1" fill="currentColor" />
        </svg>
      ) : (
        <svg className="h-4 w-4 shrink-0" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
        </svg>
      )}
      {message}
      <button onClick={onDismiss} className="ml-1 rounded-md p-0.5 hover:bg-white/20 transition" aria-label="Dismiss">✕</button>
    </div>
  );
}

// ─── App ─────────────────────────────────────────────────────────────────────
const PrivateRoute = ({ children }) => {
  const isAuthenticated = !!localStorage.getItem("AUTH_TOKEN");
  return isAuthenticated ? children : <Navigate to="/login" />;
};

function App() {
  // Read USER_ID from localStorage immediately so it's available before /user/default resolves
  const [tasks, setTasks] = useState([]);
  const [chatMessages, setChatMessages] = useState([]);
  const [isTyping, setIsTyping] = useState(false);
  const [schedule, setSchedule] = useState(() => lsGetCached("SCHEDULE_WEEK") || []);
  const [globalUserId, setGlobalUserId] = useState(() => localStorage.getItem("USER_ID") || "");
  const [globalMessage, setGlobalMessage] = useState("");
  const [isOffline, setIsOffline] = useState(!navigator.onLine);

  const isAuthenticated = !!localStorage.getItem("AUTH_TOKEN");

  // Ref to cancel in-flight AI chat request on new submission
  const chatAbortRef = useRef(null);

  // ── Restore persisted toast ──────────────────────────────────────────────
  useEffect(() => {
    const saved = lsGet("GLOBAL_MSG");
    if (saved) { setGlobalMessage(saved); lsRemove("GLOBAL_MSG"); }
  }, []);

  // ── Auto-clear toast after 3 s ───────────────────────────────────────────
  useEffect(() => {
    if (!globalMessage) return;
    const t = setTimeout(() => setGlobalMessage(""), 3000);
    return () => clearTimeout(t);
  }, [globalMessage]);

  // ── Network status detection ─────────────────────────────────────────────
  useEffect(() => {
    const handleOffline = () => { setIsOffline(true); setGlobalMessage("offline"); };
    const handleOnline = () => { setIsOffline(false); setGlobalMessage("online ✓"); };
    window.addEventListener("offline", handleOffline);
    window.addEventListener("online", handleOnline);
    return () => {
      window.removeEventListener("offline", handleOffline);
      window.removeEventListener("online", handleOnline);
    };
  }, []);

  // ── Auth user ID detection ──────────────────────────────────────────────
  useEffect(() => {
    const cachedId = localStorage.getItem("USER_ID");
    if (cachedId && cachedId !== globalUserId) {
      setGlobalUserId(cachedId);
    }
  }, []); // Only check once on mount, let Login/Settings handle updates via state or navigation

  // ── Global task fetch (runs when userId is known) ──────────────────────────
  const [hasInitialFetch, setHasInitialFetch] = useState(false);

  useEffect(() => {
    let isMounted = true;
    
    // GUARD: Only fetch if we have a userId and haven't loaded yet
    if (!globalUserId || hasInitialFetch) {
      return;
    }

    console.log("📋 Initial task fetch for:", globalUserId);

    fetchWithRetry(`${API_BASE}/tasks/${globalUserId}`)
      .then(res => res.json())
      .then(data => {
        if (isMounted && data.success) {
          setTasks(data.data || []);
          setHasInitialFetch(true);
        }
      })
      .catch(err => console.error("❌ Task fetch failed:", err));

    return () => { isMounted = false; };
  }, [globalUserId, hasInitialFetch]);

  const pendingCount = useMemo(
    () => tasks.filter((task) => !task.completed).length,
    [tasks]
  );

  // ── Add task ─────────────────────────────────────────────────────────────
  const handleAddTask = async (taskData) => {
    if (!globalUserId) return;

    try {
      const res = await fetchWithRetry(`${API_BASE}/tasks/add`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...taskData,
          user_id: globalUserId,
          status: "idle",
        }),
      });

      const data = await res.json();

      if (data.success) {
        await fetchTasks();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleToggleTask = async (task) => {
    let newStatus = "pending";

    if (task.status === "idle") newStatus = "pending";
    else if (task.status === "pending") newStatus = "completed";
    else return;

    const res = await fetchWithRetry(`${API_BASE}/tasks/update/${task._id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    });

    const data = await res.json();

    if (data.success) {
      await fetchTasks(); // IMPORTANT
    }
  };

  const handleDeleteTask = async (id) => {
    try {
      const res = await fetchWithRetry(`${API_BASE}/tasks/delete/${id}`, { method: "DELETE" });
      const data = await res.json();

      if (data.success) {
        setTasks(prev => prev.filter(t => t._id !== id)); // only remove when DB confirms
      } else {
        console.error("Delete failed:", data.message);
        showToast(setGlobalMessage, "Delete failed — try again");
      }
    } catch (err) {
      console.error("Delete network error:", err);
      showToast(setGlobalMessage, "Network error — delete not saved");
    }
  };

  // ── AI chat with AbortController + isMounted + sanity check ─────────────
  const handleSendMessage = async (message) => {
    if (!message?.trim()) return;

    chatAbortRef.current?.abort();
    const controller = new AbortController();
    chatAbortRef.current = controller;

    const userMessage = { id: `u${Date.now()}`, role: "user", text: message };
    setChatMessages((prev) => [...prev, userMessage]);
    setIsTyping(true);

    const cancelSlowTimer = slowNetworkTimer(
      () => setGlobalMessage("Slow network detected…"),
      1500
    );

    try {
      await new Promise((r) => setTimeout(r, 500));

      // Extract last 5 messages for context
      const history = chatMessages.slice(-5).map(m => ({
        role: m.role,
        text: m.text
      }));

      const res = await fetchWithRetry(
        `${API_BASE}/ai/chat`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ message, userId: globalUserId, history }),
          signal: controller.signal,
        }
      );
      cancelSlowTimer();

      const data = await res.json();

      let replyData = data?.data?.reply;
      let replyText = "";

      if (Array.isArray(replyData)) {
        replyText = replyData.join("\n\n");
      } else if (typeof replyData === "string") {
        replyText = replyData;
      }

      if (!replyText || !replyText.trim()) {
        replyText = "AI response unavailable. Try again.";
      }

      const aiReply = {
        id: `a${Date.now()}`,
        role: "assistant",
        text: replyText,
        type: data?.data?.type || "guidance",
        structuredData: data?.data?.data || null,
        company: data?.data?.company || null,
        confidence: data?.data?.confidence ?? data?.confidence ?? null,
      };
      setChatMessages((prev) => [...prev, aiReply]);

      if (data?.data?.action === "generate_schedule") {
        setScheduleRefreshKey((prev) => prev + 1);
        showToast(setGlobalMessage, "AI updated your schedule");
        fetchWithRetry(`${API_BASE}/ai/feedback`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId: globalUserId, feedback: "good" }),
        }).catch((err) => console.error("Feedback error:", err));
      }
    } catch (error) {
      cancelSlowTimer();
      if (error?.name !== "AbortError") {
        setChatMessages((prev) => [
          ...prev,
          { id: `a${Date.now()}`, role: "assistant", text: "Unable to reach AI. Please check your connection." },
        ]);
      }
    } finally {
      setIsTyping(false);
    }
  };

  useEffect(() => () => chatAbortRef.current?.abort(), []);
  const fetchTasks = async () => {
    if (!globalUserId) return;

    const res = await fetchWithRetry(`${API_BASE}/tasks/${globalUserId}`);
    const data = await res.json();

    if (data.success) {
      setTasks(data.data || []);
    }
  };

  const handleScheduleStatusChange = useCallback(async (scheduleId, taskId, nextStatus) => {
    const token = localStorage.getItem("AUTH_TOKEN");
    console.log(`📡 [CENTRAL DEBUG] API Call for ${taskId}. Token present: ${!!token}`);

    // 1. Optimistic UI update across all days
    setSchedule((prev) =>
      prev.map((dayDoc) => ({
        ...dayDoc,
        tasks: dayDoc.tasks.map((t) =>
          String(t.task_id) === String(taskId) ? { ...t, status: nextStatus } : t
        ),
      }))
    );

    // 2. Persist to backend
    try {
      const res = await fetchWithRetry(`${API_BASE}/schedule/status/${scheduleId}`, {
        method: "PATCH",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ taskId, status: nextStatus }),
      });
      const data = await res.json();
      if (!data.success) {
        setGlobalMessage?.("Failed to sync schedule status");
      }
    } catch (e) {
      console.error("Schedule status sync failed:", e);
    }
  }, [setGlobalMessage]);

  return (
    <div className="h-full bg-gray-50 text-gray-800 font-sans">
      <GlobalToast message={globalMessage} onDismiss={() => setGlobalMessage("")} />

      <div className="mx-auto flex h-screen max-w-[1800px]">
        <Sidebar overflowHidden />

        {/* Dashboard center is flex-1 and scrollable itself, so layout doesn't bleed out */}
        <div className="min-w-0 flex-1 flex flex-col overflow-hidden">        
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/" element={<PrivateRoute><DashboardPage tasks={tasks} onAddTask={handleAddTask} onToggle={handleToggleTask} onDelete={handleDeleteTask} /></PrivateRoute>} />
              <Route path="/dashboard" element={<PrivateRoute><DashboardPage tasks={tasks} onAddTask={handleAddTask} onToggle={handleToggleTask} onDelete={handleDeleteTask} /></PrivateRoute>} />
              <Route path="/schedule" element={<PrivateRoute><SchedulePage userId={globalUserId} schedule={schedule} setSchedule={setSchedule} onStatusChange={handleScheduleStatusChange} setGlobalMessage={setGlobalMessage} isOffline={isOffline} /></PrivateRoute>} />
              <Route path="/tasks" element={<PrivateRoute><TasksPage tasks={tasks} setTasks={setTasks} onToggle={handleToggleTask} onDelete={handleDeleteTask} userId={globalUserId} setGlobalMessage={setGlobalMessage} isOffline={isOffline} /></PrivateRoute>} />
              <Route path="/progress" element={<PrivateRoute><ProgressPage userId={globalUserId} setGlobalMessage={setGlobalMessage} isOffline={isOffline} /></PrivateRoute>} />
              <Route path="/checklist" element={<Checklist />} />
              <Route path="/settings" element={<PrivateRoute><SettingsPage setGlobalMessage={setGlobalMessage} /></PrivateRoute>} />
            </Routes>
        </div>

        {isAuthenticated && (
          <ChatPanel messages={chatMessages} onSendMessage={handleSendMessage} isTyping={isTyping} isOffline={isOffline} />
        )}
      </div>
    </div>
  );
}

export default App;
