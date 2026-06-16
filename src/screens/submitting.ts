// Live elapsed counter while prove-main.ts POSTs to /link-verify.

import {
  carouselLabels,
  provingCards,
  submittingCards,
} from "../components/zk-education-carousel-data";
import { mountZKEducationCarousel } from "../components/zk-education-carousel";
import { formatDuration } from "../format";
import { $locale, t } from "../i18n/store";
import { $state } from "../store";
import { resetCarousel } from "../ui";

export function mountSubmitting(root: HTMLElement): () => void {
  // Reset before mount so the carousel's first paint reads phase=submitting.
  resetCarousel("submitting");

  root.innerHTML = `
    <section class="screen screen-submitting">
      <h1 data-testid="submitting-title"></h1>
      <p class="intro" data-testid="submitting-intro"></p>
      <div class="submit-status" data-testid="submit-status">
        <span class="submit-status-title" data-testid="step-submit-title"></span>
        <span class="submit-status-elapsed" data-testid="submit-elapsed">0.0 s</span>
      </div>
      <div class="submit-shimmer" aria-hidden="true"></div>
      <div class="submitting-carousel" data-testid="submitting-carousel-host"></div>
    </section>
  `;

  const titleEl = root.querySelector<HTMLElement>('[data-testid="submitting-title"]')!;
  const introEl = root.querySelector<HTMLElement>('[data-testid="submitting-intro"]')!;
  const stepTitleEl = root.querySelector<HTMLElement>('[data-testid="step-submit-title"]')!;
  const elapsedEl = root.querySelector<HTMLElement>('[data-testid="submit-elapsed"]')!;
  const carouselHost = root.querySelector<HTMLElement>(
    '[data-testid="submitting-carousel-host"]',
  )!;

  function paintLabels(): void {
    titleEl.textContent = t("submitting.title");
    introEl.textContent = t("submitting.intro");
    stepTitleEl.textContent = t("submitting.submitStep");
  }
  paintLabels();
  const unsubLocale = $locale.listen(paintLabels);

  const carouselHandle = mountZKEducationCarousel(carouselHost, {
    provingCards: provingCards(),
    submittingCards: submittingCards(),
    ariaLabel: t("carousel.ariaLabel"),
    labels: carouselLabels(),
  });

  const unsubCarouselLocale = $locale.listen(() => {
    carouselHandle.update({
      provingCards: provingCards(),
      submittingCards: submittingCards(),
      ariaLabel: t("carousel.ariaLabel"),
      labels: carouselLabels(),
    });
  });

  let rafId: number | null = null;
  function tick(): void {
    const state = $state.get();
    if (state.phase !== "submitting") return;
    elapsedEl.textContent = formatDuration(performance.now() - state.startedAt);
    rafId = requestAnimationFrame(tick);
  }
  rafId = requestAnimationFrame(tick);

  return () => {
    if (rafId != null) cancelAnimationFrame(rafId);
    unsubLocale();
    unsubCarouselLocale();
    carouselHandle.dispose();
  };
}
