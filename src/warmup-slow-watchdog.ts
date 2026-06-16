// Flips `$warmup.slow` to `true` once warmup has been `running` for longer
// than `SLOW_HINT_DELAY_MS`. The Assets panel uses that flag to render a
// reassurance hint so mobile users stop reaching for refresh while the
// worker is still busy decompressing and loading proving keys.
//
// Re-arms on every fresh transition into `running`. Clears the timer when
// warmup leaves `running` for any reason (ready, error, idle).

import type { WritableAtom } from "nanostores";

import type { WarmupState } from "./setup-state";

export const SLOW_HINT_DELAY_MS = 15_000;

export interface SlowTimerHost {
  setTimeout: (cb: () => void, ms: number) => number;
  clearTimeout: (handle: number) => void;
}

/** Subscribe the watchdog to `$warmup`. Returns the underlying nanostores
 *  unsubscribe so callers can detach (kept simple because sign-main never
 *  unmounts in practice, but the test exercise relies on it). */
export function installWarmupSlowWatchdog(
  warmup: WritableAtom<WarmupState>,
  host: SlowTimerHost = window,
): () => void {
  let timer: number | undefined;
  let armedForRun = false;

  const fire = (): void => {
    timer = undefined;
    const cur = warmup.get();
    if (cur.status !== "running" || cur.slow) return;
    warmup.set({ ...cur, slow: true });
  };

  const cancel = (): void => {
    if (timer !== undefined) {
      host.clearTimeout(timer);
      timer = undefined;
    }
  };

  const unsubscribe = warmup.subscribe((state) => {
    if (state.status === "running") {
      // Arm exactly once per `running` episode. Subsequent same-status writes
      // (e.g. component pills flipping) must not restart the countdown.
      if (!armedForRun) {
        armedForRun = true;
        timer = host.setTimeout(fire, SLOW_HINT_DELAY_MS);
      }
      return;
    }
    cancel();
    armedForRun = false;
  });

  return () => {
    unsubscribe();
    cancel();
  };
}
