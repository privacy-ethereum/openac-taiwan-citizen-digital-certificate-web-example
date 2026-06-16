import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { $state } from "../store";
import {
  STEP_ORDER,
  markDone,
  markError,
  markInProgress,
  result,
  resetUi,
} from "../ui";
import { mountProvingProgressStrip } from "./proving-progress-strip";

function setProvingPhase(): void {
  $state.set({ phase: "proving", startedAt: performance.now() });
}

describe("proving-progress-strip", () => {
  let parent: HTMLElement;

  beforeEach(() => {
    parent = document.createElement("div");
    document.body.appendChild(parent);
    resetUi();
    setProvingPhase();
  });

  afterEach(() => {
    document.body.replaceChildren();
    resetUi();
    $state.set({ phase: "landing" });
  });

  it("renders 6 segments and a hidden details by default", () => {
    const handle = mountProvingProgressStrip(parent);
    const segs = handle.el.querySelectorAll(
      ".proving-progress-strip-segments > li",
    );
    expect(segs.length).toBe(STEP_ORDER.length);
    for (const seg of segs) {
      expect((seg as HTMLElement).dataset.segmentStatus).toBe("pending");
    }
    const details = handle.el.querySelector(
      "[data-testid='proving-progress-details']",
    ) as HTMLDetailsElement;
    expect(details.open).toBe(false);
    handle.dispose();
  });

  it("hosts the existing step-list + result data-testids inside the disclosure", () => {
    const handle = mountProvingProgressStrip(parent);
    const stepList = handle.el.querySelector("[data-testid='step-list']");
    const resultBanner = handle.el.querySelector("[data-testid='result']");
    expect(stepList).not.toBeNull();
    expect(resultBanner).not.toBeNull();
    handle.dispose();
  });

  it("segments reflect step atom transitions", () => {
    const handle = mountProvingProgressStrip(parent);
    markInProgress("challenge");
    markDone("challenge");
    markInProgress("sign");

    const segs = handle.el.querySelectorAll(
      ".proving-progress-strip-segments > li",
    );
    expect((segs[0] as HTMLElement).dataset.segmentStatus).toBe("done");
    expect((segs[1] as HTMLElement).dataset.segmentStatus).toBe("in_progress");
    expect((segs[2] as HTMLElement).dataset.segmentStatus).toBe("pending");
    handle.dispose();
  });

  it("summary advances to the in-progress step", () => {
    const handle = mountProvingProgressStrip(parent);
    markDone("challenge");
    markInProgress("sign");

    const counter = handle.el.querySelector(
      "[data-testid='proving-progress-counter']",
    );
    expect(counter?.textContent).toContain("2");
    expect(counter?.textContent).toContain("6");
    expect(
      (handle.el.querySelector(
        ".proving-progress-strip-summary",
      ) as HTMLElement).dataset.status,
    ).toBe("in_progress");
    handle.dispose();
  });

  it("auto-opens the disclosure when an error fires", () => {
    const handle = mountProvingProgressStrip(parent);
    const details = handle.el.querySelector(
      "[data-testid='proving-progress-details']",
    ) as HTMLDetailsElement;
    expect(details.open).toBe(false);

    markError("smt", "snapshot unavailable");
    result.set({ kind: "error", where: "smt", message: "snapshot unavailable" });

    expect(details.open).toBe(true);
    expect(
      (handle.el.querySelector(
        ".proving-progress-strip-summary",
      ) as HTMLElement).dataset.status,
    ).toBe("error");
    handle.dispose();
  });

  it("respects a manual collapse after an error auto-opened the disclosure", () => {
    const handle = mountProvingProgressStrip(parent);
    markError("smt", "snapshot unavailable");
    result.set({ kind: "error", where: "smt", message: "snapshot unavailable" });
    const details = handle.el.querySelector(
      "[data-testid='proving-progress-details']",
    ) as HTMLDetailsElement;
    expect(details.open).toBe(true);

    details.open = false;
    details.dispatchEvent(new Event("toggle"));

    // Triggering another error-state notification (same message) must not
    // re-open it because the user has explicitly collapsed.
    result.set({ kind: "error", where: "smt", message: "snapshot unavailable" });
    expect(details.open).toBe(false);
    handle.dispose();
  });

  it("collapses to all-done state when every step finishes", () => {
    const handle = mountProvingProgressStrip(parent);
    for (const step of STEP_ORDER) {
      markInProgress(step);
      markDone(step);
    }
    expect(
      (handle.el.querySelector(
        ".proving-progress-strip-summary",
      ) as HTMLElement).dataset.status,
    ).toBe("done");
    const segs = handle.el.querySelectorAll(
      ".proving-progress-strip-segments > li",
    );
    for (const seg of segs) {
      expect((seg as HTMLElement).dataset.segmentStatus).toBe("done");
    }
    handle.dispose();
  });

  it("dispose removes the element and detaches listeners", () => {
    const handle = mountProvingProgressStrip(parent);
    expect(parent.querySelector(".proving-progress-strip")).not.toBeNull();
    handle.dispose();
    expect(parent.querySelector(".proving-progress-strip")).toBeNull();
    // After dispose, further atom changes must not throw or repaint anything.
    expect(() => markInProgress("challenge")).not.toThrow();
  });
});
