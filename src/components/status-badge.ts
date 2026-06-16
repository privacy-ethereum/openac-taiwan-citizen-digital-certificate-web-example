// Mono `[glyph label]` status pill. Brackets are aria-hidden so screen
// readers announce just the status word.

export type BadgeKind = "ready" | "loading" | "error" | "warn" | "pending";

export interface StatusBadgeOptions {
  kind: BadgeKind;
  /** Plain-language word the screen reader announces. Defaults to the kind. */
  ariaLabel?: string;
  /** Visible label after the glyph, e.g. "ready" or "2 tries left". */
  label?: string;
}

export interface StatusBadgeHandle {
  el: HTMLElement;
  update(opts: StatusBadgeOptions): void;
}

const GLYPH: Record<BadgeKind, string> = {
  ready: "✓",
  loading: "⠋",
  error: "×",
  warn: "⚠",
  pending: "·",
};

export function createStatusBadge(opts: StatusBadgeOptions): StatusBadgeHandle {
  const el = document.createElement("span");
  el.className = "status-badge";
  el.setAttribute("role", "status");

  const open = document.createElement("span");
  open.setAttribute("aria-hidden", "true");
  open.textContent = "[";

  const glyph = document.createElement("span");
  glyph.className = "status-badge-glyph";
  glyph.setAttribute("aria-hidden", "true");

  const label = document.createElement("span");
  label.className = "status-badge-label";

  const close = document.createElement("span");
  close.setAttribute("aria-hidden", "true");
  close.textContent = "]";

  el.append(open, glyph, label, close);

  function update(next: StatusBadgeOptions): void {
    el.dataset.kind = next.kind;
    glyph.textContent = GLYPH[next.kind];
    label.textContent = next.label ?? "";
    el.setAttribute("aria-label", next.ariaLabel ?? next.kind);
  }

  update(opts);
  return { el, update };
}
