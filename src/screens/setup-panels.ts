// Shared paint logic for the Warmup + SMT panels used by setup.ts.

import { friendlyErrorCopy } from "../error-copy";
import { humanBytes } from "../format";
import { t } from "../i18n/store";
import type { CircuitKind } from "../manifest";
import {
  WARMUP_COMPONENT_ORDER,
  type SmtState,
  type WarmupComponents,
  type WarmupState,
} from "../setup-state";

export interface WarmupPanelEls {
  panel: HTMLElement;
  body: HTMLElement;
  retry: HTMLButtonElement;
}

export interface SmtPanelEls {
  panel: HTMLElement;
  body: HTMLElement;
  retry: HTMLButtonElement;
}

function componentLabel(kind: CircuitKind): string {
  return t(`setup.runtime.components.${kind}`);
}

function renderPanelTechnical(
  panel: HTMLElement,
  testid: string,
  technical: string,
): void {
  const details = document.createElement("details");
  details.className = "setup-panel-technical";
  details.dataset.testid = testid;
  const summary = document.createElement("summary");
  summary.className = "setup-panel-technical-summary";
  summary.textContent = t("errors.technicalLabel");
  const pre = document.createElement("pre");
  pre.className = "setup-panel-technical-body";
  pre.dataset.testid = `${testid}-body`;
  pre.textContent = technical;
  details.appendChild(summary);
  details.appendChild(pre);
  panel.appendChild(details);
}

function clearPanelTechnical(panel: HTMLElement): void {
  panel.querySelector(":scope > .setup-panel-technical")?.remove();
}

function renderWarmupComponents(
  body: HTMLElement,
  components: WarmupComponents,
): void {
  body.textContent = "";
  const row = document.createElement("div");
  row.className = "warmup-components";
  row.dataset.testid = "warmup-components";
  for (const kind of WARMUP_COMPONENT_ORDER) {
    const item = document.createElement("span");
    item.className = "warmup-component";
    item.dataset.testid = `warmup-component-${kind}`;
    item.dataset.status = components[kind];
    const label = document.createElement("span");
    label.className = "warmup-component-label";
    label.textContent = componentLabel(kind);
    item.appendChild(label);
    row.appendChild(item);
  }
  body.appendChild(row);
}

export function paintWarmup(
  els: WarmupPanelEls,
  state: WarmupState,
): void {
  els.panel.classList.remove("setup-panel-ok");
  clearPanelTechnical(els.panel);
  switch (state.status) {
    case "idle":
      els.body.textContent = t("setup.runtime.preparing");
      els.retry.hidden = true;
      break;
    case "running":
      renderWarmupComponents(els.body, state.components);
      if (state.slow) {
        const hint = document.createElement("p");
        hint.className = "warmup-slow-hint";
        hint.dataset.testid = "warmup-slow-hint";
        hint.textContent = t("setup.runtime.slowHint");
        els.body.appendChild(hint);
      }
      els.retry.hidden = true;
      break;
    case "ready":
      els.body.textContent = t("setup.runtime.ready");
      els.panel.classList.add("setup-panel-ok");
      els.retry.hidden = true;
      break;
    case "error": {
      const copy = friendlyErrorCopy("warmup", state.message, {
        manifestCode: state.kind === "manifest" ? state.manifestCode : undefined,
      });
      els.body.textContent = copy.body;
      els.retry.hidden = false;
      els.retry.textContent = t(
        copy.kind === "asset_corrupt" ? "setup.runtime.reset" : "setup.runtime.retry",
      );
      els.retry.disabled = false;
      renderPanelTechnical(els.panel, "warmup-technical", copy.technical);
      break;
    }
  }
}

type RunningSmt = Extract<SmtState, { status: "running" }>;

function smtPhaseLabel(phase: RunningSmt["phase"]): string {
  switch (phase) {
    case "wasm":
      return t("setup.smt.phases.wasm");
    case "snapshot":
      return t("setup.smt.phases.snapshot");
    case "ingest":
      return t("setup.smt.phases.ingest");
  }
}

function smtProgressSuffix(state: RunningSmt): string {
  const isIngest = state.phase === "ingest";
  if (state.bytesTotal > 0) {
    if (isIngest) {
      return t("setup.smt.progressNodes", {
        done: state.bytesDone.toLocaleString(),
        total: state.bytesTotal.toLocaleString(),
      });
    }
    return t("setup.smt.progressBytes", {
      done: humanBytes(state.bytesDone, "0 B"),
      total: humanBytes(state.bytesTotal, "0 B"),
    });
  }
  if (state.bytesDone > 0 && !isIngest) {
    return t("setup.smt.progressBytesOnly", {
      done: humanBytes(state.bytesDone, "0 B"),
    });
  }
  return "";
}

export interface PaintSmtOpts {
  /** Override the idle copy when the panel is gated on a prior step (e.g. card-ready). */
  idleBody?: () => string;
}

export function paintSmt(
  els: SmtPanelEls,
  state: SmtState,
  opts: PaintSmtOpts = {},
): void {
  els.panel.classList.remove("setup-panel-ok");
  clearPanelTechnical(els.panel);
  switch (state.status) {
    case "idle":
      els.body.textContent = opts.idleBody?.() ?? t("setup.smt.bodyLoading");
      els.retry.hidden = true;
      break;
    case "running":
      els.body.textContent = `${smtPhaseLabel(state.phase)}${smtProgressSuffix(state)}`;
      els.retry.hidden = true;
      break;
    case "ready":
      els.body.textContent = t("setup.smt.ready", {
        crlNumber: state.crlNumber,
        issuer: state.issuer.toUpperCase(),
      });
      els.panel.classList.add("setup-panel-ok");
      els.retry.hidden = true;
      break;
    case "error": {
      const copy = friendlyErrorCopy("smt_load", state.message, {
        manifestCode: state.manifestCode,
      });
      els.body.textContent = copy.body;
      els.retry.hidden = false;
      els.retry.textContent = t(
        copy.kind === "asset_corrupt" ? "setup.smt.reset" : "setup.smt.retry",
      );
      els.retry.disabled = false;
      renderPanelTechnical(els.panel, "smt-technical", copy.technical);
      break;
    }
  }
}
