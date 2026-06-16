// Auto-opens the <details> disclosure when an error fires so failures are
// never hidden behind the collapsed step list.

import { $locale, t } from "../i18n/store";
import { $state } from "../store";
import {
  STEP_ORDER,
  mountSteps,
  result,
  type StepStatus,
  steps,
  stepTitle,
} from "../ui";
import { formatDuration } from "../format";

export interface ProvingProgressStripHandle {
  el: HTMLElement;
  dispose(): void;
}

const SEGMENT_GLYPH: Record<StepStatus, string> = {
  pending: "[ ]",
  in_progress: "[ ]",
  done: "[✓]",
  error: "[!]",
};

export function mountProvingProgressStrip(
  parent: HTMLElement,
): ProvingProgressStripHandle {
  const el = document.createElement("div");
  el.className = "proving-progress-strip";
  el.dataset.testid = "proving-progress";

  const summary = document.createElement("div");
  summary.className = "proving-progress-strip-summary";
  summary.dataset.testid = "proving-progress-summary";

  const glyphEl = document.createElement("span");
  glyphEl.className = "proving-progress-strip-glyph";
  glyphEl.setAttribute("aria-hidden", "true");

  const labelEl = document.createElement("span");
  labelEl.className = "proving-progress-strip-label";
  labelEl.dataset.testid = "proving-progress-label";

  const counterEl = document.createElement("span");
  counterEl.className = "proving-progress-strip-counter";
  counterEl.dataset.testid = "proving-progress-counter";

  const elapsedEl = document.createElement("span");
  elapsedEl.className = "proving-progress-strip-elapsed";
  elapsedEl.dataset.testid = "proving-progress-elapsed";

  summary.append(glyphEl, labelEl, counterEl, elapsedEl);

  const segments = document.createElement("ol");
  segments.className = "proving-progress-strip-segments";
  segments.setAttribute("role", "list");
  segments.dataset.testid = "proving-progress-segments";
  for (const step of STEP_ORDER) {
    const seg = document.createElement("li");
    seg.dataset.testid = `proving-progress-segment-${step}`;
    seg.dataset.segmentStatus = "pending";
    segments.appendChild(seg);
  }

  const details = document.createElement("details");
  details.className = "proving-progress-strip-details";
  details.dataset.testid = "proving-progress-details";

  const summaryToggle = document.createElement("summary");
  summaryToggle.className = "proving-progress-strip-toggle";
  summaryToggle.dataset.testid = "proving-progress-toggle";

  const toggleLabel = document.createElement("span");
  toggleLabel.className = "proving-progress-strip-toggle-label";
  summaryToggle.appendChild(toggleLabel);

  const stepList = document.createElement("ol");
  stepList.id = "step-list";
  stepList.dataset.testid = "step-list";

  const resultEl = document.createElement("div");
  resultEl.id = "result";
  resultEl.dataset.testid = "result";

  details.append(summaryToggle, stepList, resultEl);
  el.append(summary, segments, details);
  parent.appendChild(el);

  const disposeSteps = mountSteps(stepList, resultEl);

  // Track whether the user has manually collapsed the details after an error
  // forced it open, so we don't re-open on every subsequent paint.
  let userCollapsedAfterError = false;
  let lastErrorAutoOpened = false;

  function readSegmentStatuses(): StepStatus[] {
    return STEP_ORDER.map((s) => steps[s].get().status);
  }

  function currentStepIndex(statuses: StepStatus[]): number {
    const errIdx = statuses.indexOf("error");
    if (errIdx !== -1) return errIdx;
    const inProg = statuses.indexOf("in_progress");
    if (inProg !== -1) return inProg;
    const lastDone = statuses.lastIndexOf("done");
    if (lastDone === -1) return 0;
    if (lastDone === STEP_ORDER.length - 1) return STEP_ORDER.length - 1;
    return lastDone + 1;
  }

  function paintSegments(statuses: StepStatus[]): void {
    statuses.forEach((status, idx) => {
      const li = segments.children[idx] as HTMLElement | undefined;
      if (li) li.dataset.segmentStatus = status;
    });
  }

  function paintSummary(statuses: StepStatus[]): void {
    const total = STEP_ORDER.length;
    const errorIdx = statuses.indexOf("error");
    const allDone = statuses.every((s) => s === "done");
    const noneStarted = statuses.every((s) => s === "pending");

    if (errorIdx !== -1) {
      glyphEl.textContent = SEGMENT_GLYPH.error;
      labelEl.textContent = stepTitle(STEP_ORDER[errorIdx]!);
      counterEl.textContent = t("proving.progress.summary", {
        current: errorIdx + 1,
        total,
      });
      summary.dataset.status = "error";
      return;
    }

    if (allDone) {
      glyphEl.textContent = SEGMENT_GLYPH.done;
      labelEl.textContent = t("proving.progress.statusDone");
      counterEl.textContent = t("proving.progress.summary", {
        current: total,
        total,
      });
      summary.dataset.status = "done";
      return;
    }

    if (noneStarted) {
      glyphEl.textContent = SEGMENT_GLYPH.in_progress;
      labelEl.textContent = t("proving.progress.statusIdle");
      counterEl.textContent = t("proving.progress.summary", {
        current: 1,
        total,
      });
      summary.dataset.status = "in_progress";
      return;
    }

    const idx = currentStepIndex(statuses);
    glyphEl.textContent = SEGMENT_GLYPH.in_progress;
    labelEl.textContent = stepTitle(STEP_ORDER[idx]!);
    counterEl.textContent = t("proving.progress.summary", {
      current: idx + 1,
      total,
    });
    summary.dataset.status = "in_progress";
  }

  function paintToggle(): void {
    toggleLabel.textContent = details.open
      ? t("proving.progress.hideSteps")
      : t("proving.progress.showSteps");
  }

  function paintAriaLabel(statuses: StepStatus[]): void {
    const idx = currentStepIndex(statuses);
    segments.setAttribute(
      "aria-label",
      t("proving.progress.segmentsLabel", {
        current: idx + 1,
        total: STEP_ORDER.length,
      }),
    );
  }

  function paint(): void {
    const statuses = readSegmentStatuses();
    paintSegments(statuses);
    paintSummary(statuses);
    paintAriaLabel(statuses);
  }

  function syncDetailsOnError(): void {
    const r = result.get();
    if (r.kind === "error" && !details.open && !userCollapsedAfterError) {
      details.open = true;
      lastErrorAutoOpened = true;
      paintToggle();
    }
    if (r.kind !== "error") {
      // Reset the auto-open latch once we leave the error state, so a future
      // error during the same mount opens the disclosure again.
      lastErrorAutoOpened = false;
      userCollapsedAfterError = false;
    }
  }

  paint();
  paintToggle();

  const stepDisposers = STEP_ORDER.map((s) => steps[s].listen(paint));
  const resultDisposer = result.listen(() => {
    paint();
    syncDetailsOnError();
  });
  const localeDisposer = $locale.listen(() => {
    paint();
    paintToggle();
  });
  syncDetailsOnError();

  function onToggle(): void {
    paintToggle();
    if (!details.open && lastErrorAutoOpened) {
      userCollapsedAfterError = true;
    }
  }
  details.addEventListener("toggle", onToggle);

  // Live elapsed timer matches submitting.ts: rAF loop reading $state.startedAt.
  let rafId: number | null = null;
  function tick(): void {
    const s = $state.get();
    if (s.phase !== "proving") {
      elapsedEl.textContent = "";
      rafId = null;
      return;
    }
    const now = performance.now();
    elapsedEl.textContent = formatDuration(now - s.startedAt);
    rafId = requestAnimationFrame(tick);
  }
  rafId = requestAnimationFrame(tick);

  return {
    el,
    dispose() {
      if (rafId != null) cancelAnimationFrame(rafId);
      details.removeEventListener("toggle", onToggle);
      for (const d of stepDisposers) d();
      resultDisposer();
      localeDisposer();
      disposeSteps();
      el.remove();
    },
  };
}
