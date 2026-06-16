import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  $carousel,
  advanceCarousel,
  resetCarousel,
} from "../ui";
import {
  mountZKEducationCarousel,
  type CarouselDeck,
} from "./zk-education-carousel";

const PROVING_CARDS: CarouselDeck = [
  { id: "p1", headline: "Card stays", body: "Body 1", glyph: "▢" },
  { id: "p2", headline: "Math not data", body: "Body 2", glyph: "Σ" },
  { id: "p3", headline: "Local", body: "Body 3", glyph: "⌂" },
  { id: "p4", headline: "Almost done", body: "Body 4", glyph: "→" },
];

const SUBMITTING_CARDS: CarouselDeck = [
  { id: "s1", headline: "Only the answer", body: "Body 5", glyph: "?" },
  { id: "s2", headline: "Math verified", body: "Body 6", glyph: "✓" },
  { id: "s3", headline: "No trace", body: "Body 7", glyph: "∅" },
  { id: "s4", headline: "Open source", body: "Body 8", glyph: "⌥" },
];

const LABELS = { pause: "Pause", resume: "Resume", prev: "Prev", next: "Next" };

let originalMatchMedia: typeof window.matchMedia | undefined;

function mockMatchMedia(reduced: boolean): void {
  originalMatchMedia = window.matchMedia;
  window.matchMedia = ((query: string): MediaQueryList => {
    const matches = query.includes("prefers-reduced-motion") && reduced;
    return {
      matches,
      media: query,
      onchange: null,
      addListener: () => {},
      removeListener: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => false,
    } as unknown as MediaQueryList;
  }) as typeof window.matchMedia;
}

describe("zk-education-carousel", () => {
  let parent: HTMLElement;

  beforeEach(() => {
    parent = document.createElement("div");
    document.body.appendChild(parent);
    resetCarousel("proving");
    mockMatchMedia(false);
    vi.useFakeTimers();
  });

  afterEach(() => {
    document.body.replaceChildren();
    vi.useRealTimers();
    if (originalMatchMedia) window.matchMedia = originalMatchMedia;
  });

  it("renders 4 dots and shows the first proving card", () => {
    const handle = mountZKEducationCarousel(parent, {
      provingCards: PROVING_CARDS,
      submittingCards: SUBMITTING_CARDS,
      ariaLabel: "education",
      labels: LABELS,
    });
    expect(handle.el.dataset.mode).toBe("animated");
    expect(handle.el.querySelectorAll(".zk-carousel-dot").length).toBe(4);
    const headline = handle.el.querySelector(
      ".zk-carousel-card-headline",
    ) as HTMLElement;
    expect(headline.textContent).toBe("Card stays");
    handle.dispose();
  });

  it("auto-advance after 5s moves to the next card", () => {
    const handle = mountZKEducationCarousel(parent, {
      provingCards: PROVING_CARDS,
      submittingCards: SUBMITTING_CARDS,
      ariaLabel: "education",
      labels: LABELS,
    });
    expect($carousel.get().cardIndex).toBe(0);
    vi.advanceTimersByTime(5000);
    expect($carousel.get().cardIndex).toBe(1);
    handle.dispose();
  });

  it("manual nav (clicking a dot) sets the card and pauses auto-advance", () => {
    const handle = mountZKEducationCarousel(parent, {
      provingCards: PROVING_CARDS,
      submittingCards: SUBMITTING_CARDS,
      ariaLabel: "education",
      labels: LABELS,
    });
    const dot2 = handle.el.querySelector<HTMLButtonElement>(
      '[data-testid="zk-carousel-dot-2"]',
    )!;
    dot2.click();
    expect($carousel.get().cardIndex).toBe(2);
    expect($carousel.get().paused).toBe(true);
    // Confirm no auto-advance after pause.
    vi.advanceTimersByTime(10000);
    expect($carousel.get().cardIndex).toBe(2);
    handle.dispose();
  });

  it("pauseBtn toggles between pause and resume", () => {
    const handle = mountZKEducationCarousel(parent, {
      provingCards: PROVING_CARDS,
      submittingCards: SUBMITTING_CARDS,
      ariaLabel: "education",
      labels: LABELS,
    });
    const pauseBtn = handle.el.querySelector<HTMLButtonElement>(
      '[data-testid="zk-carousel-pause"]',
    )!;
    expect(pauseBtn.textContent).toBe("Pause");
    pauseBtn.click();
    expect(pauseBtn.textContent).toBe("Resume");
    expect($carousel.get().paused).toBe(true);
    pauseBtn.click();
    expect(pauseBtn.textContent).toBe("Pause");
    expect($carousel.get().paused).toBe(false);
    handle.dispose();
  });

  it("focusing a child element pauses auto-advance", () => {
    const handle = mountZKEducationCarousel(parent, {
      provingCards: PROVING_CARDS,
      submittingCards: SUBMITTING_CARDS,
      ariaLabel: "education",
      labels: LABELS,
    });
    handle.el.dispatchEvent(new FocusEvent("focusin", { bubbles: true }));
    expect($carousel.get().paused).toBe(true);
    handle.dispose();
  });

  it("phase swap re-renders with the submitting card set", () => {
    const handle = mountZKEducationCarousel(parent, {
      provingCards: PROVING_CARDS,
      submittingCards: SUBMITTING_CARDS,
      ariaLabel: "education",
      labels: LABELS,
    });
    resetCarousel("submitting");
    const headline = handle.el.querySelector(
      ".zk-carousel-card-headline",
    ) as HTMLElement;
    expect(headline.textContent).toBe("Only the answer");
    handle.dispose();
  });

  it("respects prefers-reduced-motion at mount: renders all 4 cards as static stack", () => {
    mockMatchMedia(true);
    const handle = mountZKEducationCarousel(parent, {
      provingCards: PROVING_CARDS,
      submittingCards: SUBMITTING_CARDS,
      ariaLabel: "education",
      labels: LABELS,
    });
    expect(handle.el.dataset.mode).toBe("static");
    expect(
      handle.el.querySelectorAll(".zk-carousel-static-card").length,
    ).toBe(4);
    // Auto-advance must NOT fire under reduced motion.
    vi.advanceTimersByTime(20000);
    expect($carousel.get().cardIndex).toBe(0);
    handle.dispose();
  });

  it("does not advance past the last card", () => {
    const handle = mountZKEducationCarousel(parent, {
      provingCards: PROVING_CARDS,
      submittingCards: SUBMITTING_CARDS,
      ariaLabel: "education",
      labels: LABELS,
    });
    advanceCarousel();
    advanceCarousel();
    advanceCarousel();
    advanceCarousel(); // already at 3, clamps
    expect($carousel.get().cardIndex).toBe(3);
    vi.advanceTimersByTime(10000);
    expect($carousel.get().cardIndex).toBe(3);
    handle.dispose();
  });

  it("dispose clears the timer and removes the element", () => {
    const handle = mountZKEducationCarousel(parent, {
      provingCards: PROVING_CARDS,
      submittingCards: SUBMITTING_CARDS,
      ariaLabel: "education",
      labels: LABELS,
    });
    expect(parent.querySelector(".zk-carousel")).not.toBeNull();
    handle.dispose();
    expect(parent.querySelector(".zk-carousel")).toBeNull();
    // Advancing timers after dispose should not throw.
    expect(() => vi.advanceTimersByTime(10000)).not.toThrow();
  });

});
