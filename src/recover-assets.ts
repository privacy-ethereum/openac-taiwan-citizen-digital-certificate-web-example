// On `asset_corrupt` we wipe every cached asset and reload, since a digest
// mismatch can leak across panels (one bad release tag corrupts both warmup
// and SMT caches).

import { clearAllAssets } from "./asset-store";
import { classifyError } from "./error-copy";
import { markForceFreshAssets } from "./force-fresh-flag";
import { $smt, $warmup, type SmtState, type WarmupState } from "./setup-state";
import { clearProveInput } from "./storage-handoff";

async function resetAllAssetsAndReload(): Promise<void> {
  try {
    await clearAllAssets();
  } catch (err) {
    console.warn("recover-assets: clearAllAssets failed:", err);
  }
  try {
    clearProveInput();
  } catch (err) {
    console.warn("recover-assets: clearProveInput failed:", err);
  }
  // `clearAllAssets` only wipes OPFS/IDB. Without this flag the reload would
  // refetch the manifest and assets from the browser HTTP cache (max-age=60
  // for SMT, max-age=300 for keys) and hit the same digest/byte pair that
  // triggered `asset_corrupt` in the first place.
  markForceFreshAssets();
  location.reload();
}

async function recover(
  state: WarmupState | SmtState,
  where: "warmup" | "smt_load",
  setIdle: () => void,
): Promise<void> {
  if (state.status !== "error") return;
  const kind = classifyError(where, state.message, {
    manifestCode: state.manifestCode,
  });
  if (kind === "asset_corrupt") {
    await resetAllAssetsAndReload();
    return;
  }
  setIdle();
}

export const recoverFromWarmupError = (): Promise<void> =>
  recover($warmup.get(), "warmup", () => $warmup.set({ status: "idle" }));

export const recoverFromSmtError = (): Promise<void> =>
  recover($smt.get(), "smt_load", () => $smt.set({ status: "idle" }));
