// Translates Worker Progress events into UI atom updates and FSM dispatches.
// Warmup events feed `$warmup` (setup Assets panel); proving events feed
// the 6-step list + `result`. `proving_complete` carries proof bytes that
// the FSM packages into a ProvingRun for the Review screen.

import { t } from "./i18n/store";
import type { CircuitKind } from "./manifest";
import {
  $smt,
  $warmup,
  initialWarmupComponents,
  type WarmupComponents,
} from "./setup-state";
import { dispatch } from "./store";
import {
  STEP_ORDER,
  markDone,
  markError,
  markInProgress,
  result,
  steps,
  type Step,
} from "./ui";
import type { Progress } from "./worker";

type WarmupEvent = Extract<Progress, { step: "warmup" }>;
type WitnessEvent = Extract<Progress, { step: "witness" }>;
type ProveEvent = Extract<Progress, { step: "prove" }>;
type ProvingCompleteEvent = Extract<Progress, { step: "proving_complete" }>;
type ErrorEvent = Extract<Progress, { step: "error" }>;

// Tracks the currently loading kind to mark the previous one "ready" on the next "load" event. Reset on new warmup or error.
let currentLoadKind: CircuitKind | null = null;

function applyWarmup(p: WarmupEvent): void {
  const cur = $warmup.get();
  const prev = cur.status === "running" ? cur.components : null;
  const components: WarmupComponents = prev
    ? { ...prev }
    : initialWarmupComponents();
  let changed = !prev;

  if (p.kind && p.phase === "download" && components[p.kind] === "pending") {
    components[p.kind] = "running";
    changed = true;
  }
  if (p.phase === "load" && p.kind) {
    if (
      currentLoadKind &&
      currentLoadKind !== p.kind &&
      components[currentLoadKind] !== "ready"
    ) {
      components[currentLoadKind] = "ready";
      changed = true;
    }
    if (components[p.kind] !== "running") {
      components[p.kind] = "running";
      changed = true;
    }
    currentLoadKind = p.kind;
  }

  if (changed) $warmup.set({ status: "running", components });
}

export function markPriorStepsDone(step: Step): void {
  for (const s of STEP_ORDER) {
    if (s === step) return;
    const cur = steps[s].get();
    if (cur.status === "pending" || cur.status === "in_progress") {
      markDone(s, cur.label);
    }
  }
}

function applyWitness(p: WitnessEvent): void {
  if (!p.kind) return;
  const step: Step = p.kind === "userSigRS2048" ? "prove_user_sig" : "prove_cert";
  if (p.status === "in_progress") {
    markPriorStepsDone(step);
    markInProgress(step, t("proving.sublabels.witness"));
  }
  // `done` for witness is a sub-phase; the subsequent `prove` in_progress
  // event overwrites the label.
}

function applyProve(p: ProveEvent): void {
  if (!p.kind) return;
  const step: Step = p.kind === "userSigRS2048" ? "prove_user_sig" : "prove_cert";
  if (p.status === "in_progress") {
    markPriorStepsDone(step);
    markInProgress(
      step,
      p.phase === "prep" ? t("proving.sublabels.prep") : t("proving.sublabels.proving"),
    );
  } else {
    markDone(step);
  }
}

export function applyProgress(p: Progress): void {
  switch (p.step) {
    case "warmup": {
      applyWarmup(p);
      return;
    }
    case "warmup_done": {
      currentLoadKind = null;
      $warmup.set({ status: "ready" });
      return;
    }
    case "smt_load": {
      $smt.set({
        status: "running",
        issuer: p.issuer,
        phase: p.phase,
        bytesDone: p.bytesDone,
        bytesTotal: p.bytesTotal,
      });
      return;
    }
    case "smt_ready": {
      $smt.set({
        status: "ready",
        issuer: p.issuer,
        rootHex: p.rootHex,
        crlNumber: p.crlNumber,
      });
      return;
    }
    case "smt_proof_done":
    case "smt_proof_error":
      // Routed via addEventListener on the main thread (smt-client.ts).
      // No UI side effect needed here.
      return;
    case "witness": {
      applyWitness(p);
      return;
    }
    case "prove": {
      applyProve(p);
      return;
    }
    case "proving_complete": {
      const done = p as ProvingCompleteEvent;
      // Backstop: mark every step done so the UI is consistent even if a
      // per-step event was dropped or raced before teardown.
      for (const s of STEP_ORDER) {
        const cur = steps[s].get();
        if (cur.status !== "error") markDone(s, cur.label);
      }
      dispatch({
        type: "proving_complete",
        run: {
          challenge: done.challenge,
          certChainType:
            done.certKind === "certChainRS4096" ? "rs4096" : "rs2048",
          certProofBytes: done.certProofBytes,
          userSigProofBytes: done.userSigProofBytes,
          certKind: done.certKind,
          provingMs: done.provingMs,
        },
      });
      return;
    }
    case "error": {
      const e = p as ErrorEvent;
      // Warmup / manifest errors route to $warmup (Assets panel); SMT engine
      // load errors route to $smt; proving errors land on whichever proving
      // step is live.
      if (e.where === "manifest") {
        currentLoadKind = null;
        $warmup.set({
          status: "error",
          message: e.message,
          kind: "manifest",
          manifestCode: e.manifestCode,
        });
        return;
      }
      if (e.where === "warmup") {
        currentLoadKind = null;
        $warmup.set({ status: "error", message: e.message, kind: "warmup" });
        return;
      }
      if (e.where === "smt_load") {
        $smt.set({
          status: "error",
          message: e.message,
          manifestCode: e.manifestCode,
        });
        return;
      }
      let target: Step | undefined;
      for (const s of STEP_ORDER) {
        if (steps[s].get().status === "in_progress") {
          target = s;
          break;
        }
      }
      if (!target) {
        for (const s of STEP_ORDER) {
          if (steps[s].get().status === "pending") {
            target = s;
            break;
          }
        }
      }
      if (target) markError(target, e.message);
      result.set({ kind: "error", where: e.where, message: e.message });
      dispatch({
        type: "pipeline_error",
        where: e.where,
        message: e.message,
      });
      return;
    }
  }
}
