import { escapeText } from "../dom-utils";
import { $locale, t } from "../i18n/store";

export interface TechnicalItem {
  label: string;
  testid: string;
  value: string;
  copyValue?: string;
}

export interface TechnicalDetailsHandle {
  update(items: TechnicalItem[]): void;
  dispose(): void;
}

export interface TechnicalDetailsOptions {
  /** Override for the default `technical.explanation` line; pass an i18n key. */
  explanationKey?: string;
}

const COPIED_TIMEOUT_MS = 1500;

export function renderTechnicalDetails(
  target: HTMLElement,
  initialItems: TechnicalItem[],
  opts?: TechnicalDetailsOptions,
): TechnicalDetailsHandle {
  target.innerHTML = `
    <details class="technical-details" data-testid="technical-details">
      <summary class="technical-details-summary" data-testid="technical-details-summary"></summary>
      <p class="technical-details-explanation" data-testid="technical-details-explanation"></p>
      <div class="technical-details-rows" data-testid="technical-details-rows"></div>
      <button
        class="secondary-button technical-details-copy-all"
        data-testid="technical-details-copy-all"
        type="button"
      ></button>
    </details>
  `;

  const summaryEl = target.querySelector<HTMLElement>(
    '[data-testid="technical-details-summary"]',
  )!;
  const explanationEl = target.querySelector<HTMLElement>(
    '[data-testid="technical-details-explanation"]',
  )!;
  const rowsEl = target.querySelector<HTMLElement>(
    '[data-testid="technical-details-rows"]',
  )!;
  const copyBtn = target.querySelector<HTMLButtonElement>(
    '[data-testid="technical-details-copy-all"]',
  )!;

  let currentItems: TechnicalItem[] = initialItems;
  let copiedTimer: ReturnType<typeof setTimeout> | null = null;

  function paintShell(): void {
    summaryEl.textContent = t("technical.sectionTitle");
    explanationEl.textContent = t(opts?.explanationKey ?? "technical.explanation");
    if (copiedTimer == null) copyBtn.textContent = t("technical.copyAll");
  }

  function paintRows(): void {
    rowsEl.innerHTML = currentItems
      .map(
        (it) =>
          `<div class="technical-row">` +
            `<span class="technical-label">${escapeText(it.label)}</span>` +
            `<span class="technical-value mono" data-testid="${it.testid}">${escapeText(it.value)}</span>` +
          `</div>`,
      )
      .join("");
  }

  // Tab-separated rows are easy to paste into a spreadsheet or bug report.
  function copyAll(): void {
    const text = currentItems
      .map((it) => `${it.label}\t${it.copyValue ?? it.value}`)
      .join("\n");
    void navigator.clipboard?.writeText(text).then(() => {
      copyBtn.textContent = t("technical.copied");
      if (copiedTimer != null) clearTimeout(copiedTimer);
      copiedTimer = setTimeout(() => {
        copiedTimer = null;
        copyBtn.textContent = t("technical.copyAll");
      }, COPIED_TIMEOUT_MS);
    });
  }

  paintShell();
  paintRows();

  copyBtn.addEventListener("click", copyAll);
  const unsubLocale = $locale.listen(paintShell);

  return {
    update(items: TechnicalItem[]): void {
      currentItems = items;
      paintRows();
    },
    dispose(): void {
      copyBtn.removeEventListener("click", copyAll);
      unsubLocale();
      if (copiedTimer != null) {
        clearTimeout(copiedTimer);
        copiedTimer = null;
      }
    },
  };
}
