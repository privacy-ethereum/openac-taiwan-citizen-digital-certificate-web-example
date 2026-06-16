import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { setLocale } from "../i18n/store";
import { $state, dispatch } from "../store";
import { mountLanding } from "./landing";

describe("screens / landing", () => {
  let root: HTMLElement;
  let dispose: () => void;

  beforeEach(() => {
    root = document.createElement("div");
    document.body.appendChild(root);
    setLocale("en");
    dispose = mountLanding(root);
  });

  afterEach(() => {
    dispose();
    document.body.replaceChildren();
    setLocale("zh-TW");
    vi.restoreAllMocks();
    dispatch({ type: "reset" });
  });

  it("renders the headline, the intro, the CTA, and the privacy expandable", () => {
    expect(root.querySelector('[data-testid="landing-title"]')?.textContent).toBe(
      "Verified Taiwanese Badge",
    );
    const intro = root.querySelector('[data-testid="landing-intro"]')!;
    expect(intro.textContent).toContain("Prove you're Taiwanese");
    expect(root.querySelector('[data-testid="start-button"]')).not.toBeNull();
    expect(root.querySelector('[data-testid="privacy-sheet"]')).not.toBeNull();
  });

  it("privacy sheet contains all 3 pillars and the learn-more link", () => {
    expect(root.querySelector('[data-testid="privacy-sheet-pillar-result"]')).not.toBeNull();
    expect(root.querySelector('[data-testid="privacy-sheet-pillar-card"]')).not.toBeNull();
    expect(root.querySelector('[data-testid="privacy-sheet-pillar-zk"]')).not.toBeNull();
    const link = root.querySelector<HTMLAnchorElement>(
      '[data-testid="privacy-sheet-pillar-zk-link"]',
    );
    expect(link).not.toBeNull();
    expect(link!.href).toBe("https://pse.dev/projects/zk-id");
    expect(link!.rel).toBe("noopener noreferrer");
  });

  it("clicking 'Start' dispatches start", () => {
    const btn = root.querySelector<HTMLButtonElement>('[data-testid="start-button"]')!;
    expect(btn).not.toBeNull();
    btn.click();
    expect($state.get().phase).toBe("setup");
  });

  it("re-paints when the locale switches to zh-TW", () => {
    setLocale("zh-TW");
    expect(root.querySelector('[data-testid="landing-title"]')?.textContent).toBe(
      "台灣人徽章",
    );
    expect(
      root.querySelector('[data-testid="privacy-sheet-pillar-zk"] h3')?.textContent,
    ).toBe("零知識證明");
  });
});
