export function predictFailure(task, history = [], user) {
  try {
    if (!task) return baseResponse();

    let score = 0;
    let reason = "Standard task parameters.";
    let suggestion = "Proceed on standard timeline.";

    const now = new Date();
    const isDeadlineClose = task.deadline && ((new Date(task.deadline) - now) / (1000 * 60 * 60) < 48);
    const notStarted = task.status === "idle";

    // 1. DEADLINE PRESSURE
    if (isDeadlineClose && notStarted) {
      score += 5;
      reason = "Deadline is very close and task is not started.";
      suggestion = "Start immediately or assign highest priority.";
    } else if (isDeadlineClose) {
      score += 2;
    } else if (task.deadline) {
      const diffDays = (new Date(task.deadline) - now) / (1000 * 60 * 60 * 24);
      if (diffDays <= 2) score += 2;
    }

    // 2. USER HISTORY
    if (history.length > 0) {
      const sameCategory = history.filter(h => h.category === task.category);
      if (sameCategory.length > 0) {
        const successRate = sameCategory.filter(h => h.completed).length / sameCategory.length;
        if (successRate < 0.3) {
          score += 4;
          reason = "Historical data shows repeated failures in this category.";
          suggestion = "Allocate extra buffer time or review foundation concepts.";
        } else if (successRate > 0.8) {
          score -= 2;
          reason = "Consistent success demonstrated in this track.";
          suggestion = "Normal workflow prioritization.";
        }
      }
    }

    // 3. LEARNING SCORE IMPACT
    const learning = user?.learning_score ?? 1;
    if (learning < 0.7) {
      score += 2;
    } else if (learning > 1.5 && score < 3) {
      score -= 1;
    }

    // 4. BIG TASK IMPACT
    if (task.duration > 120) {
      score += 2;
      if (score >= 4 && reason === "Standard task parameters.") {
         reason = "Large time commitment historically triggers drop-off.";
         suggestion = "Break this task horizontally across multiple shorter slices.";
      }
    }

    let risk = "low";
    if (score >= 6) risk = "high";
    else if (score >= 3) risk = "medium";

    if (risk === "low" && reason === "Standard task parameters.") {
      reason = "Task falls within normal completion confidence.";
      suggestion = "Continue standard schedule flow.";
    }

    return {
      risk,
      reason,
      suggestion,
      score,
      confidence: Math.max(0, Math.min(1, score / 10)),
    };
  } catch {
    return baseResponse();
  }
}

function baseResponse() {
  return {
    risk: "low",
    reason: "Default fallback state.",
    suggestion: "Complete task normally.",
    score: 0,
    confidence: 0,
  };
}