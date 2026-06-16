// Entry point for `/` (sign route): landing → setup → ready → sign-phase
// pipeline, then handoff to `/prove` via sessionStorage.
// Kept separate from `prove-main.ts` because `/` must preserve popup opener,
// while `/prove` is cross-origin-isolated for threaded proving.

import "./style.css";
import { IcCardAuthProvider } from "./auth-providers/ic-card";
import { $challenge, clearChallenge } from "./challenge-state";
import { consumeForceFreshAssetsFlag } from "./force-fresh-flag";
import { mountLocaleSwitcher } from "./i18n/switcher";
import { runSignPhasePipeline, PipelineAborted } from "./pipeline";
import { mountRouter } from "./router";
import { $hipki, $pin, $smt, $warmup, resetSetup } from "./setup-state";
import { getSmtTestProof } from "./smt-client";
import { saveProveInput } from "./storage-handoff";
import { dispatch, $state, type AppState } from "./store";
type Phase = AppState["phase"];
import { resetUi, result } from "./ui";
import { installWarmupSlowWatchdog } from "./warmup-slow-watchdog";
import { createWorkerLifecycle } from "./worker-lifecycle";
import type { WorkerInMsg } from "./worker";

function boot(): void {
  const root = document.querySelector<HTMLElement>("#app");
  if (!root) {
    throw new Error("sign-main.ts: #app root missing in index.html");
  }

  mountLocaleSwitcher(document.querySelector<HTMLElement>("#locale-switcher"));
  mountRouter(root);

  const { ensureWorker, terminateWorker } = createWorkerLifecycle();
  let runController: AbortController | null = null;

  function abortActiveRun(): void {
    runController?.abort();
    runController = null;
  }

  function killWorkerForCancel(): void {
    terminateWorker();
    $warmup.set({ status: "idle" });
    $smt.set({ status: "idle" });
  }

  async function handleSignPhase(): Promise<void> {
    resetUi();
    result.set({ kind: "running" });

    const hipkiState = $hipki.get();
    const pinState = $pin.get();
    const challengeState = $challenge.get();
    if ($warmup.get().status !== "ready") {
      dispatch({
        type: "pipeline_error",
        where: "setup",
        message: "proving runtime not warmed",
      });
      return;
    }
    if (challengeState.status !== "ready") {
      dispatch({
        type: "pipeline_error",
        where: "challenge",
        message: "challenge not pre-fetched",
      });
      return;
    }
    if (hipkiState.status !== "card_ready") {
      dispatch({ type: "pipeline_error", where: "setup", message: "card not ready" });
      return;
    }
    if (pinState.status !== "locked") {
      dispatch({ type: "pipeline_error", where: "setup", message: "PIN not verified" });
      return;
    }
    const auth = new IcCardAuthProvider({
      pin: pinState.pin,
      slotDescription: hipkiState.card.slotDescription,
    });
    const cardForPipeline = hipkiState.card;

    runController = new AbortController();
    const myController = runController;
    try {
      const proveInput = await runSignPhasePipeline(ensureWorker(), {
        card: cardForPipeline,
        auth,
        challenge: challengeState.challenge,
        signal: myController.signal,
      });
      // Drop Worker refs before navigation to avoid late events.
      terminateWorker();
      saveProveInput(proveInput);
      window.location.assign("/prove");
    } catch (err) {
      if (err instanceof PipelineAborted) return;
      if ($state.get().phase === "proving") {
        const message = err instanceof Error ? err.message : String(err);
        dispatch({ type: "pipeline_error", where: "proving", message });
      }
    } finally {
      if (runController === myController) runController = null;
    }
  }

  function triggerWarmupIfIdle(): void {
    const cur = $warmup.get();
    if (cur.status !== "idle") return;
    const w = ensureWorker();
    const msg: WorkerInMsg = {
      type: "warmup",
      forceRefresh: cur.forceRefresh,
      forceFreshAssets: consumeForceFreshAssetsFlag(),
    };
    w.postMessage(msg);
  }

  function currentIssuer(): "g2" | "g3" | null {
    const hipki = $hipki.get();
    return hipki.status === "card_ready" ? hipki.card.issuer : null;
  }

  function triggerLoadSmt(): void {
    const issuer = currentIssuer();
    if (!issuer) return;
    const smt = $smt.get();
    if (smt.status === "running") return;
    if (smt.status === "ready" && smt.issuer === issuer) return;
    if (getSmtTestProof()) {
      $smt.set({ status: "ready", issuer, rootHex: "test", crlNumber: "0" });
      return;
    }
    const forceRefresh = smt.status === "idle" ? smt.forceRefresh : undefined;
    const w = ensureWorker();
    const msg: WorkerInMsg = {
      type: "load_smt",
      issuer,
      forceRefresh,
      forceFreshAssets: consumeForceFreshAssetsFlag(),
    };
    w.postMessage(msg);
  }

  $warmup.listen((warmup) => {
    if ($state.get().phase !== "setup") return;
    if (warmup.status === "idle") triggerWarmupIfIdle();
  });

  installWarmupSlowWatchdog($warmup);

  $hipki.listen((hipki) => {
    if (hipki.status !== "card_ready") return;
    if ($state.get().phase !== "setup") return;
    triggerLoadSmt();
  });
  $smt.listen((smt) => {
    if (smt.status !== "idle") return;
    if ($state.get().phase !== "setup") return;
    triggerLoadSmt();
  });

  let prevPhase: Phase = $state.get().phase;
  $state.listen(async (state) => {
    const wasProving = prevPhase === "proving";
    prevPhase = state.phase;

    if (state.phase !== "proving") abortActiveRun();

    switch (state.phase) {
      case "landing":
        resetSetup();
        clearChallenge();
        terminateWorker();
        $warmup.set({ status: "idle" });
        return;
      case "setup":
        if (wasProving) {
          killWorkerForCancel();
          $pin.set({ status: "pending" });
        }
        clearChallenge();
        triggerWarmupIfIdle();
        return;
      case "ready":
        return;
      case "proving":
        await handleSignPhase();
        return;
      // These phases belong to `/prove`; ignore if reached here.
      case "review":
      case "submitting":
      case "result":
      case "error":
        return;
    }
  });
}

boot();
