// Auto-advancing 4-card carousel for the proving + submitting waits.
// setTimeout-per-card (not setInterval) so backgrounded tabs don't throttle
// and skip cards. Reduced-motion switches to a static stack.

import {
  $carousel,
  advanceCarousel,
  pauseCarousel,
  resumeCarousel,
  setCarouselCard,
} from "../ui";

export interface CarouselCard {
  /** Stable id for [data-testid] selectors. */
  id: string;
  headline: string;
  body: string;
  /** Optional mono glyph rendered next to the headline, e.g., "▢", "Σ", "⌂". */
  glyph?: string;
  /** Optional outbound link rendered as a CTA below the body. Opens in a new tab. */
  link?: { href: string; label: string };
}

/** Exactly 4 cards per phase — encoded in the type so callers can't pass the wrong length. */
export type CarouselDeck = readonly [CarouselCard, CarouselCard, CarouselCard, CarouselCard];

export interface ZKEducationCarouselOptions {
  provingCards: CarouselDeck;
  submittingCards: CarouselDeck;
  /** Auto-advance interval per card. Default 5000ms. */
  cardDurationMs?: number;
  /** ARIA group label, e.g., "zero-knowledge privacy education". */
  ariaLabel: string;
  /** Pause/resume button labels (i18n) — used by the manual control. */
  labels: {
    pause: string;
    resume: string;
    prev: string;
    next: string;
  };
}

export interface ZKEducationCarouselHandle {
  el: HTMLElement;
  /** Replace card decks + labels + ariaLabel in place. Used on locale change
   *  to swap text content without dispose+remount (preserves timer + state). */
  update(next: Pick<ZKEducationCarouselOptions, "provingCards" | "submittingCards" | "ariaLabel" | "labels">): void;
  dispose(): void;
}

const DEFAULT_CARD_DURATION_MS = 5000;
const REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)";

type CarouselRenderMode = "animated" | "static";

function modeFor(reduced: boolean): CarouselRenderMode {
  return reduced ? "static" : "animated";
}

export function mountZKEducationCarousel(
  parent: HTMLElement,
  opts: ZKEducationCarouselOptions,
): ZKEducationCarouselHandle {
  const duration = opts.cardDurationMs ?? DEFAULT_CARD_DURATION_MS;

  // Mutable refs swapped in by update() on locale change.
  let provingDeck = opts.provingCards;
  let submittingDeck = opts.submittingCards;
  let labels = opts.labels;

  const el = document.createElement("section");
  el.className = "zk-carousel";
  el.dataset.testid = "zk-carousel";
  el.setAttribute("role", "region");
  el.setAttribute("aria-label", opts.ariaLabel);

  const cardEl = document.createElement("div");
  cardEl.className = "zk-carousel-card";
  cardEl.dataset.testid = "zk-carousel-card";
  cardEl.setAttribute("aria-live", "polite");
  cardEl.setAttribute("aria-atomic", "true");

  const cardGlyph = document.createElement("span");
  cardGlyph.className = "zk-carousel-card-glyph";
  cardGlyph.setAttribute("aria-hidden", "true");

  const cardHeadline = document.createElement("h3");
  cardHeadline.className = "zk-carousel-card-headline";

  const cardBody = document.createElement("p");
  cardBody.className = "zk-carousel-card-body";

  const cardLink = document.createElement("a");
  cardLink.className = "zk-carousel-card-link";
  cardLink.dataset.testid = "zk-carousel-card-link";
  cardLink.target = "_blank";
  cardLink.rel = "noopener noreferrer";
  cardLink.hidden = true;

  cardEl.append(cardGlyph, cardHeadline, cardBody, cardLink);

  const stackEl = document.createElement("div");
  stackEl.className = "zk-carousel-static-stack";
  stackEl.dataset.testid = "zk-carousel-static-stack";

  const dotsEl = document.createElement("div");
  dotsEl.className = "zk-carousel-dots";
  dotsEl.setAttribute("role", "tablist");
  const dots: HTMLButtonElement[] = [];
  for (let i = 0; i < 4; i += 1) {
    const dot = document.createElement("button");
    dot.type = "button";
    dot.className = "zk-carousel-dot";
    dot.dataset.testid = `zk-carousel-dot-${i}`;
    dot.setAttribute("role", "tab");
    dot.addEventListener("click", () => setCarouselCard(i));
    dots.push(dot);
    dotsEl.appendChild(dot);
  }

  const pauseBtn = document.createElement("button");
  pauseBtn.type = "button";
  pauseBtn.className = "zk-carousel-pause";
  pauseBtn.dataset.testid = "zk-carousel-pause";
  pauseBtn.addEventListener("click", () => {
    if ($carousel.get().paused) resumeCarousel();
    else pauseCarousel();
  });

  const controlsEl = document.createElement("div");
  controlsEl.className = "zk-carousel-controls";
  controlsEl.append(dotsEl, pauseBtn);

  el.append(cardEl, stackEl, controlsEl);
  parent.appendChild(el);

  let advanceTimer: ReturnType<typeof setTimeout> | null = null;

  function clearAdvance(): void {
    if (advanceTimer != null) {
      clearTimeout(advanceTimer);
      advanceTimer = null;
    }
  }

  function scheduleAdvance(): void {
    clearAdvance();
    const state = $carousel.get();
    if (state.cardIndex >= 3) return;
    if (state.paused) return;
    if (reducedMotion) return;
    advanceTimer = setTimeout(() => {
      // Re-check paused — user may have navigated during the wait.
      if ($carousel.get().paused) return;
      advanceCarousel();
    }, duration);
  }

  let reducedMotion =
    typeof matchMedia !== "undefined" &&
    matchMedia(REDUCED_MOTION_QUERY).matches;
  el.dataset.mode = modeFor(reducedMotion);

  let mediaList: MediaQueryList | null = null;
  function onMediaChange(this: MediaQueryList): void {
    reducedMotion = this.matches;
    el.dataset.mode = modeFor(reducedMotion);
    if (reducedMotion) {
      clearAdvance();
      paintStatic();
    } else {
      paintActive();
      scheduleAdvance();
    }
  }
  if (typeof matchMedia !== "undefined") {
    mediaList = matchMedia(REDUCED_MOTION_QUERY);
    mediaList.addEventListener?.("change", onMediaChange);
  }

  function currentCards(): CarouselDeck {
    const phase = $carousel.get().phase;
    return phase === "proving" ? provingDeck : submittingDeck;
  }

  function paintActive(): void {
    const state = $carousel.get();
    const cards = currentCards();
    const card = cards[state.cardIndex] ?? cards[0];
    cardEl.dataset.cardId = card.id;
    cardGlyph.textContent = card.glyph ?? "";
    cardGlyph.style.display = card.glyph ? "" : "none";
    cardHeadline.textContent = card.headline;
    cardBody.textContent = card.body;
    if (card.link) {
      cardLink.href = card.link.href;
      cardLink.textContent = card.link.label;
      cardLink.hidden = false;
    } else {
      cardLink.removeAttribute("href");
      cardLink.textContent = "";
      cardLink.hidden = true;
    }

    dots.forEach((dot, idx) => {
      dot.setAttribute(
        "aria-selected",
        idx === state.cardIndex ? "true" : "false",
      );
      if (idx === state.cardIndex) dot.dataset.active = "true";
      else dot.removeAttribute("data-active");
    });

    pauseBtn.textContent = state.paused ? labels.resume : labels.pause;
    pauseBtn.setAttribute(
      "aria-label",
      state.paused ? labels.resume : labels.pause,
    );
  }

  function paintStatic(): void {
    stackEl.innerHTML = "";
    for (const card of currentCards()) {
      const node = document.createElement("article");
      node.className = "zk-carousel-static-card";
      node.dataset.cardId = card.id;
      const h = document.createElement("h3");
      h.textContent = (card.glyph ? `${card.glyph} ` : "") + card.headline;
      const p = document.createElement("p");
      p.textContent = card.body;
      node.append(h, p);
      if (card.link) {
        const a = document.createElement("a");
        a.className = "zk-carousel-card-link";
        a.href = card.link.href;
        a.target = "_blank";
        a.rel = "noopener noreferrer";
        a.textContent = card.link.label;
        node.append(a);
      }
      stackEl.appendChild(node);
    }
  }

  function onFocusIn(): void {
    pauseCarousel();
  }
  el.addEventListener("focusin", onFocusIn);

  function onCarouselChange(): void {
    if (reducedMotion) {
      paintStatic();
      return;
    }
    paintActive();
    scheduleAdvance();
  }
  const unsub = $carousel.listen(onCarouselChange);

  if (reducedMotion) paintStatic();
  else {
    paintActive();
    scheduleAdvance();
  }

  return {
    el,
    update(next) {
      provingDeck = next.provingCards;
      submittingDeck = next.submittingCards;
      labels = next.labels;
      el.setAttribute("aria-label", next.ariaLabel);
      if (reducedMotion) paintStatic();
      else paintActive();
    },
    dispose() {
      clearAdvance();
      unsub();
      el.removeEventListener("focusin", onFocusIn);
      mediaList?.removeEventListener?.("change", onMediaChange);
      el.remove();
    },
  };
}
