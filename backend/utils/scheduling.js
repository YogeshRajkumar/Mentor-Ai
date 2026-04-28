function toMinutes(timeStr) {
  if (!timeStr) return NaN;
  if (typeof timeStr !== "string") return NaN;

  const s = timeStr.trim().toUpperCase();
  // Handle "09:00 AM" / "7:00 PM"
  if (s.includes("AM") || s.includes("PM")) {
    const [timePart, meridiemPart] = s.split(" ");
    const meridiem = meridiemPart;
    const [hh, mm] = timePart.split(":");
    let hour = Number(hh);
    const minute = Number(mm);
    if (!Number.isFinite(hour) || !Number.isFinite(minute)) return NaN;

    if (meridiem === "PM" && hour !== 12) hour += 12;
    if (meridiem === "AM" && hour === 12) hour = 0;
    return hour * 60 + minute;
  }

  // Assume 24h "HH:MM"
  const [hh, mm] = s.split(":");
  const hour = Number(hh);
  const minute = Number(mm);
  if (!Number.isFinite(hour) || !Number.isFinite(minute)) return NaN;
  return hour * 60 + minute;
}

function fromMinutes(minutes) {
  const m = Math.max(0, Math.floor(minutes));
  const hour = Math.floor(m / 60);
  const minute = m % 60;
  const hh = String(hour).padStart(2, "0");
  const mm = String(minute).padStart(2, "0");
  return `${hh}:${mm}`;
}

function priorityRank(priority) {
  const p = typeof priority === "string" ? priority.toLowerCase() : "";
  if (p === "high") return 0;
  if (p === "medium") return 1;
  return 2; // low/unknown
}

export function generateDailySchedule({ freeTimeSlots, tasks }) {
  const slots = Array.isArray(freeTimeSlots) ? freeTimeSlots : [];
  const pendingTasks = Array.isArray(tasks) ? tasks : [];

  const pending = pendingTasks
    .filter((t) => (t.status || "").toLowerCase() === "pending")
    .sort((a, b) => priorityRank(a.priority) - priorityRank(b.priority));

  const assignedTasks = pending.slice(0, slots.length);

  const scheduled = [];
  const unscheduled = pending.slice(slots.length);

  for (let i = 0; i < assignedTasks.length; i++) {
    const slot = slots[i];
    const task = assignedTasks[i];

    scheduled.push({
      time_slot: `${slot.start} - ${slot.end}`,
      task_id: task._id,
    });
  }

  return { scheduled, unscheduled };
}

