// Mono spinner step list. Stateless renderer; callers replace rows via
// update(). The active row gets aria-current="step".

export type ProgressRowStatus = "pending" | "in_progress" | "done" | "error";

export interface ProgressRowState {
  /** Stable id for replays, also exposed as data-testid. */
  id: string;
  /** Visible label. */
  label: string;
  status: ProgressRowStatus;
  /** Optional trailing string (duration, error message, sub-detail). */
  trailing?: string;
}

const GLYPH: Record<ProgressRowStatus, string> = {
  pending: "·",
  in_progress: "⠋",
  done: "✓",
  error: "×",
};

export interface ProgressListHandle {
  el: HTMLOListElement;
  update(rows: ProgressRowState[]): void;
}

export function createProgressList(
  initial: ProgressRowState[] = [],
): ProgressListHandle {
  const el = document.createElement("ol");
  el.className = "progress-list";
  el.setAttribute("role", "list");

  function rowMarkup(row: ProgressRowState): string {
    const id = row.id.replace(/[^a-zA-Z0-9_-]/g, "");
    return (
      `<li class="progress-list-row" role="listitem"` +
      ` data-testid="progress-${id}" data-status="${row.status}"` +
      (row.status === "in_progress" ? ` aria-current="step"` : "") +
      `>` +
      `<span class="progress-list-glyph" aria-hidden="true"></span>` +
      `<span class="progress-list-label"></span>` +
      `<span class="progress-list-trailing"></span>` +
      `</li>`
    );
  }

  function paint(rows: ProgressRowState[]): void {
    el.innerHTML = rows.map(rowMarkup).join("");
    rows.forEach((row, idx) => {
      const li = el.children[idx] as HTMLElement | undefined;
      if (!li) return;
      const glyph = li.querySelector<HTMLElement>(".progress-list-glyph");
      const label = li.querySelector<HTMLElement>(".progress-list-label");
      const trailing = li.querySelector<HTMLElement>(".progress-list-trailing");
      if (glyph) glyph.textContent = `[${GLYPH[row.status]}]`;
      if (label) label.textContent = row.label;
      if (trailing) trailing.textContent = row.trailing ?? "";
    });
  }

  paint(initial);

  return {
    el,
    update: paint,
  };
}
