import { useMemo, useState } from "react";
import TaskCard from "./TaskCard";


const initialForm = {
  title: "",
  category: "",
  priority: "",
  duration: "",
};

function Dashboard({ tasks, onAddTask, onToggle, onDelete }) {
  const [formData, setFormData] = useState(initialForm);

  const completedCount = useMemo(
    () => tasks.filter((task) => task.status === "completed").length,
    [tasks]
  );
  const pendingCount = tasks.filter((t) => t.status === "pending").length;
  const idleCount    = tasks.filter((t) => !t.status || t.status === "idle").length;

  const userName = localStorage.getItem("USER_NAME") || "User";

  const progressData = useMemo(() => {
    const total     = tasks.length;
    const completed = tasks.filter((t) => t.status === "completed").length;

    // Map category labels to DB enum values
    const categoryMap = {
      "Problem Solving": "java",
      "Aptitude":        "aptitude",
      "Project":         "project",
    };
    const colours = [
      "from-indigo-500 to-blue-400",
      "from-cyan-500 to-sky-400",
      "from-violet-500 to-fuchsia-400",
    ];

    return Object.entries(categoryMap).map(([skill, dbKey], i) => {
      const catTasks     = tasks.filter((t) => (t.category ?? "").toLowerCase() === dbKey);
      const catCompleted = catTasks.filter((t) => t.status === "completed").length;
      const catPct = catTasks.length === 0 ? 0 : Math.round((catCompleted / catTasks.length) * 100);
      return { skill, value: catPct, color: colours[i] };
    });
  }, [tasks]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };
  const parseDuration = (value) => {
  if (!value) return 0;

  const lower = value.toLowerCase().trim();

  if (lower.includes("hr")) {
    return parseInt(lower) * 60;
  }

  if (lower.includes("min")) {
    return parseInt(lower);
  }

  return parseInt(lower) || 0;
};

 const handleAddTask = (event) => {
  event.preventDefault();

  if (!formData.title.trim()) return;

  const formattedTask = {
    ...formData,
    duration: parseDuration(formData.duration), // ✅ FIX HERE
  };

  onAddTask(formattedTask);
  setFormData(initialForm);
};

  const priorityOrder = {
    High: 3,
    Medium: 2,
    Low: 1,
  };

  const sortedTasks = [...tasks].sort(
    (a, b) => (priorityOrder[b.priority] || 0) - (priorityOrder[a.priority] || 0)
  );

  return (
    <main className="min-w-0 flex-1 flex flex-col h-full bg-gray-50">
      <div>
        {/* ── Header section ── */}
        <section className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 className="text-2xl font-semibold tracking-tight text-gray-800">
                Good Evening, {userName}
              </h2>
              <p className="mt-1 text-sm text-gray-500">
                AI Suggestion: You are close to your weekly goal. Prioritize one high-impact Java session today.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-gray-600 shadow-sm transition hover:border-gray-300 hover:text-gray-900 active:scale-95">
                Notifications
              </button>
              <div className="h-10 w-10 rounded-full bg-gradient-to-br from-indigo-500 to-cyan-400 shadow-sm shadow-indigo-500/20" />
            </div>
          </div>
        </section>

        {/* ── Main grid ── */}
        <section className="grid gap-6 xl:grid-cols-3 p-4 overflow-hidden">
          <div className="space-y-6 xl:col-span-2 w-full">
            {/* Today's Schedule */}
            <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm flex flex-col">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-800">Today's Schedule</h3>
                <p className="text-sm text-gray-500">
                  {completedCount} Completed · {pendingCount} In Progress · {idleCount} Tasks
                </p>
              </div>

              <div className="w-full h-[430px] overflow-y-auto no-scrollbar">
                {sortedTasks.length === 0 ? (
                  <div className="flex items-center justify-center h-full text-gray-500">
                    🚀 No tasks yet — start by adding one
                  </div>
                ) : (
                  <div className="flex flex-col gap-2 w-full">
                    {sortedTasks.map((task) => (
                      <TaskCard key={task._id || task.id} task={task} onToggle={onToggle} onDelete={onDelete} />
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Add Task */}
            <div className="mt-4 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
              <h3 className="text-sm font-semibold text-gray-800 mb-3">
                Add Task
              </h3>
              <div className="flex gap-2 items-center">
                <input
                  type="text"
                  placeholder="Title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="flex-1 rounded-lg border border-gray-200 px-2 py-1 text-xs"
                />
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="rounded-lg border border-gray-200 px-2 py-1 text-xs"
                >
                  <option value="">Select Category</option>
                  <option value="java">Problem Solving</option>
                  <option value="aptitude">Aptitude</option>
                  <option value="project">Project</option>
                </select>
                <select
                  value={formData.priority}
                  onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                  className="rounded-lg border border-gray-200 px-2 py-1 text-xs"
                >
                  <option value="">Select Priority</option>
                  <option value="Low">Low</option>
                  <option value="Medium">Medium</option>
                  <option value="High">High</option>
                </select>
                <input
                  type="text"
                  placeholder="Duration"
                  value={formData.duration}
                  onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                  className="w-20 rounded-lg border border-gray-200 px-2 py-1 text-xs"
                />
                <button
                  onClick={handleAddTask}
                  disabled={!formData.title.trim()}
                  className="bg-indigo-500 px-3 py-1 text-xs font-medium text-white rounded-lg hover:bg-indigo-400 disabled:opacity-60 shrink-0"
                >
                  Add
                </button>
              </div>
            </div>
          </div>

          {/* Right column */}
          <div className="space-y-6 hidden xl:block">
            {/* Free time suggestion */}
            <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-800">Free Time Suggestion</h3>
              <p className="mt-3 rounded-2xl bg-indigo-50 p-4 text-sm text-indigo-900 border border-indigo-100">
                You have 2 hours free. Focus on Aptitude practice with timed
                quizzes and quick error analysis.
              </p>
            </div>

            {/* Dynamic progress bars */}
            <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-800">Progress</h3>
              <div className="mt-5 space-y-5">
                {progressData.map((item) => (
                  <div key={item.skill}>
                    <div className="mb-1.5 flex items-center justify-between text-sm">
                      <span className="text-gray-600 font-medium">{item.skill}</span>
                      <span className="font-semibold text-gray-800">{item.value}%</span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-gray-100">
                      <div
                        className={`h-2 rounded-full bg-gradient-to-r transition-all duration-700 ${item.color}`}
                        style={{ width: `${item.value}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>



            {/* Placement alert */}
            <div className="rounded-3xl border border-red-100 bg-red-50 p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-red-800">
                Placement Alert
              </h3>
              <p className="mt-2 text-sm text-red-600">
                HCL drive in 5 days — focus on Java and Aptitude. Allocate at
                least 90 minutes daily for revision.
              </p>
            </div>
          </div>
        </section>
        
        {/* Horizontal scroll for right column on mobile/tablet */}
        <section className="flex gap-4 overflow-x-auto pb-4 xl:hidden snap-x">
          <div className="w-[85vw] sm:w-[320px] shrink-0 snap-center rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-800">Free Time Suggestion</h3>
            <p className="mt-3 rounded-2xl bg-indigo-50 p-4 text-sm text-indigo-900 border border-indigo-100">
              You have 2 hours free. Focus on Aptitude practice with timed quizzes and quick error analysis.
            </p>
          </div>
          <div className="w-[85vw] sm:w-[320px] shrink-0 snap-center rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-800">Progress</h3>
            <div className="mt-4 space-y-4">
              {progressData.map((item) => (
                <div key={item.skill}>
                  <div className="mb-1.5 flex items-center justify-between text-sm">
                    <span className="text-gray-600 font-medium">{item.skill}</span>
                    <span className="font-semibold text-gray-800">{item.value}%</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-gray-100">
                    <div className={`h-2 rounded-full bg-gradient-to-r transition-all duration-700 ${item.color}`} style={{ width: `${item.value}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>


          <div className="w-[85vw] sm:w-[320px] shrink-0 snap-center rounded-3xl border border-red-100 bg-red-50 p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-red-800">Placement Alert</h3>
            <p className="mt-2 text-sm text-red-600">
              HCL drive in 5 days — focus on Java and Aptitude. Allocate at least 90 minutes daily for revision.
            </p>
          </div>
        </section>
      </div>


    </main>
  );
}

export default Dashboard;
