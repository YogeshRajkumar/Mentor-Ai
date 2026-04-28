import React, { useState } from "react";
import { NavLink } from "react-router-dom";

const navItems = [
  { label: "Dashboard", to: "/",         icon: "⊞" },
  { label: "Schedule",  to: "/schedule", icon: "🗓" },
  { label: "Tasks",     to: "/tasks",    icon: "✅" },
  { label: "Progress",  to: "/progress", icon: "📈" },
  { label: "Placement Checklist", to: "/checklist", icon: "📋" },
  { label: "Settings",  to: "/settings", icon: "⚙" },
];

function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside
      className={`hidden border-r border-gray-200 bg-white transition-all duration-300 lg:flex lg:flex-col h-full ${
        collapsed ? "w-20" : "w-64"
      }`}
    >
      {/* ── Logo / Brand row ── */}
      <div className="flex h-20 items-center justify-between px-4">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 shrink-0 rounded-2xl bg-gradient-to-br from-indigo-500 to-cyan-400 shadow-lg shadow-indigo-500/30" />
          {!collapsed && (
            <div>
              <p className="text-sm text-gray-500">Welcome</p>
              <h1 className="text-lg font-semibold text-gray-800 tracking-tight">Mentor AI</h1>
            </div>
          )}
        </div>
        <button
          onClick={() => setCollapsed((prev) => !prev)}
          className="rounded-xl border border-gray-200 p-2 text-xs text-gray-500 transition hover:border-gray-300 hover:text-gray-700 active:scale-95"
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? ">" : "<"}
        </button>
      </div>

      {/* ── Nav links ── */}
      <nav className="flex-1 space-y-1 px-3 py-4 overflow-y-auto">
        {navItems.map((item) => (
          <div key={item.label} className="relative group">
            <NavLink
              to={item.to}
              end={item.to === "/"}
              className={({ isActive }) =>
                `flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200 ease-in-out ${
                  isActive
                    ? "scale-[1.02] bg-indigo-500 text-white shadow-md shadow-indigo-500/30"
                    : "text-gray-600 hover:bg-gray-100 hover:text-gray-900 active:scale-95"
                }`
              }
            >
              <span className="shrink-0 text-base leading-none">{item.icon}</span>
              {!collapsed && (
                <span className="truncate">{item.label}</span>
              )}
            </NavLink>

            {collapsed && (
              <span
                className="pointer-events-none absolute left-14 top-1/2 z-50 -translate-y-1/2 whitespace-nowrap rounded-lg bg-gray-800 px-2.5 py-1.5 text-xs font-medium text-white opacity-0 shadow-lg transition-opacity duration-150 group-hover:opacity-100"
                role="tooltip"
              >
                {item.label}
                <span className="absolute -left-1 top-1/2 -translate-y-1/2 h-2 w-2 rotate-45 bg-gray-800" />
              </span>
            )}
          </div>
        ))}
      </nav>
    </aside>
  );
}

export default React.memo(Sidebar);
