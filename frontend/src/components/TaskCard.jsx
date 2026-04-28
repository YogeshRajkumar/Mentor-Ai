import React, { useState } from "react";

function Spinner() {
  return (
    <span className="inline-block h-3.5 w-3 animate-spin rounded-s border-2 border-current border-t-transparent" />
  );
}

const CATEGORY_LABELS = {
  java: "Problem Solving",
  aptitude: "Aptitude",
  project: "Project"
};

function TaskCard({ task, onToggle, onDelete }) {
  const priorityClasses = {
    Low:    "bg-emerald-50 text-emerald-600",
    Medium: "bg-amber-50 text-amber-600",
    High:   "bg-rose-50 text-rose-600",
  };

  const getStyle = () => {
    if (task.status === "completed") return "bg-green-500 text-white";
    if (task.status === "pending") return "bg-yellow-400 text-white";
    return "bg-indigo-500 text-white";
  };

  const getText = () => {
    if (task.status === "completed") return "Done";
    if (task.status === "pending") return "In Progress";
    return "Take Task";
  };
  const time = new Date().toLocaleTimeString([], {
  hour: 'numeric',
  minute: '2-digit',
  hour12: true
}).toLowerCase();

  return (
    <div className="w-full group rounded-2xl border border-gray-200 bg-white p-4 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg relative">
      {onDelete && (
        <button
          onClick={() => onDelete(task._id)}
          className="absolute top-2 right-2 text-gray-400 hover:text-red-500 transition-colors"
          aria-label="Delete task"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      )}

      <div className="mb-3 flex items-center gap-3 pr-6">
        <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
          {time}
        </p>
        <span
          className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
            priorityClasses[task.priority] ?? "bg-gray-100 text-gray-600"
          }`}
        >
          {task.priority || "Low"}
        </span>
      </div>

      <h4
        className={`text-sm font-semibold transition-all duration-300 ${
          task.completed || task.status === "completed"
            ? "text-gray-400 line-through opacity-60"
            : "text-gray-800"
        }`}
      >
        {task.title}
      </h4>

      <p className="mt-2 text-xs text-gray-500">
        {CATEGORY_LABELS[task.category?.toLowerCase()] || task.category} | {task.duration}
      </p>

      <button
        onClick={() => onToggle(task)}
        className={`mt-3 w-full rounded-lg py-2 text-xs font-medium transition ${getStyle()}`}
      >
        {getText()}
      </button>
    </div>
  );
}

export default React.memo(TaskCard);
