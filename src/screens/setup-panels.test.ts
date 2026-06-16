import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { setLocale } from "../i18n/store";
import {
  initialWarmupComponents,
  type WarmupState,
} from "../setup-state";
import { paintWarmup, type WarmupPanelEls } from "./setup-panels";

function mountWarmupPanel(): WarmupPanelEls {
  const panel = document.createElement("div");
  panel.dataset.testid = "setup-assets";
  const body = document.createElement("div");
  body.dataset.testid = "assets-body";
  const retry = document.createElement("button");
  retry.dataset.testid = "assets-retry";
  retry.hidden = true;
  panel.append(body, retry);
  document.body.appendChild(panel);
  return { panel, body, retry };
}

describe("paintWarmup slow hint", () => {
  let els: WarmupPanelEls;

  beforeEach(() => {
    document.body.replaceChildren();
    setLocale("en");
    els = mountWarmupPanel();
  });

  afterEach(() => {
    setLocale("zh-TW");
    vi.restoreAllMocks();
  });

  it("does not render the hint while running without slow", () => {
    const state: WarmupState = {
      status: "running",
      components: initialWarmupComponents(),
    };
    paintWarmup(els, state);
    expect(
      els.body.querySelector('[data-testid="warmup-slow-hint"]'),
    ).toBeNull();
  });

  it("renders the reassurance hint when slow is true", () => {
    const state: WarmupState = {
      status: "running",
      components: initialWarmupComponents(),
      slow: true,
    };
    paintWarmup(els, state);
    const hint = els.body.querySelector<HTMLParagraphElement>(
      '[data-testid="warmup-slow-hint"]',
    );
    expect(hint).not.toBeNull();
    expect(hint!.textContent).toContain("takes a bit longer");
    expect(hint!.textContent).toContain("do not refresh");
  });

  it("uses the zh-TW string when locale is zh-TW", () => {
    setLocale("zh-TW");
    paintWarmup(els, {
      status: "running",
      components: initialWarmupComponents(),
      slow: true,
    });
    const hint = els.body.querySelector('[data-testid="warmup-slow-hint"]');
    expect(hint?.textContent).toContain("勿重新整理");
  });

  it("drops the hint when state transitions out of slow running", () => {
    paintWarmup(els, {
      status: "running",
      components: initialWarmupComponents(),
      slow: true,
    });
    expect(
      els.body.querySelector('[data-testid="warmup-slow-hint"]'),
    ).not.toBeNull();

    paintWarmup(els, { status: "ready" });
    expect(
      els.body.querySelector('[data-testid="warmup-slow-hint"]'),
    ).toBeNull();
  });

  it("does not render a quit-to-app CTA (mobile escape hatch removed)", () => {
    paintWarmup(els, {
      status: "running",
      components: initialWarmupComponents(),
      slow: true,
    });
    expect(
      els.body.querySelector('[data-testid="warmup-slow-cta"]'),
    ).toBeNull();
  });
});

describe("paintWarmup technical disclosure", () => {
  let els: WarmupPanelEls;

  beforeEach(() => {
    document.body.replaceChildren();
    setLocale("en");
    els = mountWarmupPanel();
  });

  afterEach(() => {
    setLocale("zh-TW");
    vi.restoreAllMocks();
  });

  it("renders a technical-details disclosure containing the raw worker message on error", () => {
    paintWarmup(els, {
      status: "error",
      message: "ensureAsset failed: hash mismatch for certChainRS2048",
    });
    const details = els.panel.querySelector<HTMLDetailsElement>(
      '[data-testid="warmup-technical"]',
    );
    expect(details).not.toBeNull();
    const body = details!.querySelector('[data-testid="warmup-technical-body"]');
    expect(body?.textContent).toContain(
      "ensureAsset failed: hash mismatch for certChainRS2048",
    );
    expect(body?.textContent).toContain("warmup");
  });

  it("does not render the disclosure on non-error states", () => {
    for (const state of [
      { status: "idle" } as const,
      { status: "running", components: initialWarmupComponents() } as const,
      { status: "ready" } as const,
    ]) {
      paintWarmup(els, state);
      expect(
        els.panel.querySelector('[data-testid="warmup-technical"]'),
      ).toBeNull();
    }
  });

  it("drops the disclosure after an error clears", () => {
    paintWarmup(els, { status: "error", message: "boom" });
    expect(
      els.panel.querySelector('[data-testid="warmup-technical"]'),
    ).not.toBeNull();
    paintWarmup(els, { status: "ready" });
    expect(
      els.panel.querySelector('[data-testid="warmup-technical"]'),
    ).toBeNull();
  });
});
