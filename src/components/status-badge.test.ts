import { describe, expect, it } from "vitest";

import { createStatusBadge } from "./status-badge";

describe("status-badge", () => {
  it("renders the ready glyph + label and sets aria-label", () => {
    const { el } = createStatusBadge({ kind: "ready", label: "ok", ariaLabel: "ready" });
    expect(el.dataset.kind).toBe("ready");
    expect(el.querySelector(".status-badge-glyph")?.textContent).toBe("✓");
    expect(el.querySelector(".status-badge-label")?.textContent).toBe("ok");
    expect(el.getAttribute("aria-label")).toBe("ready");
  });

  it("update swaps kind, glyph, label, and aria-label", () => {
    const handle = createStatusBadge({ kind: "loading", label: "fetching" });
    handle.update({ kind: "error", label: "boom", ariaLabel: "request failed" });
    expect(handle.el.dataset.kind).toBe("error");
    expect(handle.el.querySelector(".status-badge-glyph")?.textContent).toBe("×");
    expect(handle.el.querySelector(".status-badge-label")?.textContent).toBe("boom");
    expect(handle.el.getAttribute("aria-label")).toBe("request failed");
  });

  it("brackets are aria-hidden so screen readers don't announce them", () => {
    const { el } = createStatusBadge({ kind: "ready" });
    const hidden = el.querySelectorAll('[aria-hidden="true"]');
    // [, glyph, ]
    expect(hidden.length).toBeGreaterThanOrEqual(3);
  });

  it("falls back aria-label to kind when ariaLabel is omitted", () => {
    const { el } = createStatusBadge({ kind: "warn" });
    expect(el.getAttribute("aria-label")).toBe("warn");
  });
});
