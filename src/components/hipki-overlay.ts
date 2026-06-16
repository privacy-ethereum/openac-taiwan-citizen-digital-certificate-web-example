import { $locale, t } from "../i18n/store";

export interface HipkiOverlayHandle {
  show(): void;
  hide(): void;
  dispose(): void;
}

export function mountHipkiOverlay(target: HTMLElement): HipkiOverlayHandle {
  target.innerHTML = `
    <div
      class="hipki-overlay"
      data-testid="hipki-overlay"
      role="status"
      aria-live="polite"
      hidden
    >
      <p class="hipki-overlay-text" data-testid="hipki-overlay-text"></p>
    </div>
  `;

  const overlayEl = target.querySelector<HTMLElement>(
    '[data-testid="hipki-overlay"]',
  )!;
  const textEl = target.querySelector<HTMLElement>(
    '[data-testid="hipki-overlay-text"]',
  )!;

  function paint(): void {
    textEl.textContent = t("setup.reader.popupBriefly");
  }

  paint();
  const unsubLocale = $locale.listen(paint);

  return {
    show(): void {
      overlayEl.hidden = false;
    },
    hide(): void {
      overlayEl.hidden = true;
    },
    dispose(): void {
      unsubLocale();
      overlayEl.hidden = true;
    },
  };
}
