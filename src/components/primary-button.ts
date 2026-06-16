// Mono CTA with three variants: primary (accent bg), ghost (Back/Cancel),
// text (smallest weight). Trailing arrow is the default for primary.

export type ButtonVariant = "primary" | "ghost" | "text";

export interface PrimaryButtonOptions {
  label: string;
  variant?: ButtonVariant;
  onClick: () => void;
  /** Disabled at construction; toggle with setDisabled. */
  disabled?: boolean;
  /** Description for screen readers when label alone isn't enough. */
  ariaLabel?: string;
  /** Override the trailing glyph; default "→" for primary, "" for others. */
  trailingGlyph?: string;
  /** Test id for selectors. */
  testId?: string;
}

export interface PrimaryButtonHandle {
  el: HTMLButtonElement;
  setLabel(label: string): void;
  setDisabled(disabled: boolean): void;
}

export function createPrimaryButton(
  opts: PrimaryButtonOptions,
): PrimaryButtonHandle {
  const variant = opts.variant ?? "primary";
  const el = document.createElement("button");
  el.type = "button";
  el.className = `primary-button-v2 primary-button-v2-${variant}`;
  if (opts.testId) el.dataset.testid = opts.testId;
  if (opts.ariaLabel) el.setAttribute("aria-label", opts.ariaLabel);
  el.disabled = opts.disabled ?? false;

  const labelEl = document.createElement("span");
  labelEl.className = "primary-button-v2-label";

  const glyphEl = document.createElement("span");
  glyphEl.className = "primary-button-v2-glyph";
  glyphEl.setAttribute("aria-hidden", "true");

  const defaultGlyph = variant === "primary" ? "→" : "";
  glyphEl.textContent = opts.trailingGlyph ?? defaultGlyph;

  el.append(labelEl, glyphEl);
  el.addEventListener("click", () => {
    if (!el.disabled) opts.onClick();
  });

  function setLabel(label: string): void {
    labelEl.textContent = label;
  }
  setLabel(opts.label);

  return {
    el,
    setLabel,
    setDisabled(disabled) {
      el.disabled = disabled;
    },
  };
}
