// One-shot sessionStorage flag that tells the post-reload worker to bypass
// the browser HTTP cache. `clearAllAssets()` wipes OPFS/IDB but not the HTTP
// cache, so without this flag a reload re-serves stale CDN bytes (e.g. an
// out-of-date SMT snapshot). Consumed once per page load so a later manual
// reload doesn't inherit the flag.

const SESSION_KEY = "forceFreshAssets";

let cached: boolean | null = null;

export function consumeForceFreshAssetsFlag(): boolean {
  if (cached !== null) return cached;
  try {
    const present = sessionStorage.getItem(SESSION_KEY) === "1";
    if (present) sessionStorage.removeItem(SESSION_KEY);
    cached = present;
  } catch {
    cached = false;
  }
  return cached;
}

export function markForceFreshAssets(): void {
  try {
    sessionStorage.setItem(SESSION_KEY, "1");
  } catch (err) {
    console.warn("markForceFreshAssets: sessionStorage write failed", err);
  }
}

/** Test-only reset; not exported via the public surface in callers. */
export function _resetForceFreshFlagForTest(): void {
  cached = null;
  try {
    sessionStorage.removeItem(SESSION_KEY);
  } catch {
    // ignore
  }
}
