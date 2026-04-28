// ─── Cache versioning ─────────────────────────────────────────────────────────
// Bump this when the cache schema changes to automatically discard stale data.
export const CACHE_VERSION = "v1";

// Versioned key helper — old keys are simply ignored on read
function vKey(key) { return `${key}_${CACHE_VERSION}`; }

// ─── fetchWithRetry ───────────────────────────────────────────────────────────
// • Accepts an AbortSignal via options.signal — passes it to both attempts
// • On network failure, retries once after `delay` ms
// • AbortError is re-thrown immediately (no retry on intentional cancel)
export async function fetchWithRetry(url, options = {}, delay = 1000) {
  const { signal, headers = {} } = options;
  const token = localStorage.getItem("AUTH_TOKEN");
  const mergedHeaders = token ? { ...headers, Authorization: `Bearer ${token}` } : headers;

  const attempt = async () => {
    const res = await fetch(url, { ...options, headers: mergedHeaders });
    if (res.status === 401) {
      localStorage.removeItem("AUTH_TOKEN");
      localStorage.removeItem("USER_ID");
      window.location.href = "/login";
    }
    return res;
  };

  try {
    return await attempt();
  } catch (firstErr) {
    // Don't retry if the caller intentionally aborted
    if (firstErr?.name === "AbortError") throw firstErr;

    // Bail out of the delay early if already aborted
    await new Promise((resolve, reject) => {
      const t = setTimeout(resolve, delay);
      signal?.addEventListener("abort", () => {
        clearTimeout(t);
        reject(Object.assign(new Error("AbortError"), { name: "AbortError" }));
      });
    });

    try {
      return await attempt();
    } catch (secondErr) {
      throw secondErr;
    }
  }
}

// ─── Slow-network detector ────────────────────────────────────────────────────
// Returns a cancel function. Calls `onSlow` if `ms` elapses before cancelled.
export function slowNetworkTimer(onSlow, ms = 1500) {
  const t = setTimeout(onSlow, ms);
  return () => clearTimeout(t);
}

// ─── Friendly error messages ──────────────────────────────────────────────────
export function friendlyError(err) {
  // Suppress AbortError — it's intentional, not a real failure
  if (err?.name === "AbortError") return "";

  const msg = err?.message || String(err || "");
  if (!msg || msg.includes("Failed to fetch") || msg.includes("NetworkError")) {
    return "Unable to load data. Please check your connection.";
  }
  if (msg.includes("404")) return "Resource not found. Please try again.";
  if (msg.includes("500")) return "Server error. Please try again in a moment.";
  return msg;
}

// ─── Versioned localStorage helpers (safe – never throws) ─────────────────────
export function lsGet(key) {
  try { return localStorage.getItem(key); } catch (_) { return null; }
}

export function lsSet(key, value) {
  try { localStorage.setItem(key, value); } catch (_) {}
}

export function lsRemove(key) {
  try { localStorage.removeItem(key); } catch (_) {}
}

// Versioned cache helpers — automatically namespaced with CACHE_VERSION
export function lsGetCached(key) {
  try {
    const raw = localStorage.getItem(vKey(key));
    return raw ? JSON.parse(raw) : null;
  } catch (_) { return null; }
}

export function lsSetCached(key, value) {
  try { localStorage.setItem(vKey(key), JSON.stringify(value)); } catch (_) {}
}
