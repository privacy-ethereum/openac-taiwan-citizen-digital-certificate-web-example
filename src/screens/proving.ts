import { mountProvingProgressStrip } from "../components/proving-progress-strip";
import {
  carouselLabels,
  provingCards,
  submittingCards,
} from "../components/zk-education-carousel-data";
import { mountZKEducationCarousel } from "../components/zk-education-carousel";
import { $locale, t } from "../i18n/store";
import { dispatch } from "../store";
import { resetCarousel } from "../ui";

export function mountProving(root: HTMLElement): () => void {
  // Reset before mount so the carousel's first paint reads phase=proving.
  resetCarousel("proving");

  root.innerHTML = `
    <section class="screen screen-proving">
      <h1 data-testid="proving-title"></h1>
      <p class="intro" data-testid="proving-intro"></p>
      <div data-testid="proving-progress-host"></div>
      <div data-testid="proving-carousel-host"></div>
      <div class="button-row proving-actions">
        <button class="secondary-button" data-testid="proving-cancel" type="button"></button>
      </div>
    </section>
  `;

  const titleEl = root.querySelector<HTMLElement>('[data-testid="proving-title"]')!;
  const introEl = root.querySelector<HTMLElement>('[data-testid="proving-intro"]')!;
  const progressHost = root.querySelector<HTMLElement>(
    '[data-testid="proving-progress-host"]',
  )!;
  const carouselHost = root.querySelector<HTMLElement>(
    '[data-testid="proving-carousel-host"]',
  )!;
  const cancelBtn = root.querySelector<HTMLButtonElement>(
    '[data-testid="proving-cancel"]',
  )!;

  function paint(): void {
    titleEl.textContent = t("proving.title");
    introEl.textContent = t("proving.intro");
    cancelBtn.textContent = t("proving.cancel");
  }
  paint();
  const unsubLocale = $locale.listen(paint);

  const stripHandle = mountProvingProgressStrip(progressHost);

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

  // Cancel drops the warm Worker (sign-main.ts terminates on phase change);
  // the Assets panel shows as "not warmed" on return to setup.
  const onCancel = () => dispatch({ type: "reset_to_setup" });
  cancelBtn.addEventListener("click", onCancel);

  return () => {
    cancelBtn.removeEventListener("click", onCancel);
    unsubLocale();
    unsubCarouselLocale();
    stripHandle.dispose();
    carouselHandle.dispose();
  };
}
