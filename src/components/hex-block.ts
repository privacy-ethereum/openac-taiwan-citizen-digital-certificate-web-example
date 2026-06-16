// Native <details> disclosure with mono-rendered fields and per-row
// copy-with-flash. Generalization of technical-details.ts.

export interface HexField {
  /** Stable id for [data-testid] selectors. */
  id: string;
  /** Visible mono label (left column). */
  label: string;
  /** Visible mono value (right column). Long hex is OK; word-wrap handles it. */
  value: string;
  /** What to copy when the user clicks the row's copy button. Defaults to value. */
  copyValue?: string;
}

export interface HexBlockOptions {
  /** Summary text rendered next to the disclosure ▸ glyph. */
  summary: string;
  /** Sub-explanation rendered between summary and rows when expanded. */
  explanation?: string;
  /** Initial set of fields. Update later via setFields(). */
  fields: HexField[];
  /** "Copy all" button label; if omitted no copy-all button is rendered. */
  copyAllLabel?: string;
  /** Toast text after a successful copy (per-row + copy-all). Default "[✓ copied]". */
  copiedLabel?: string;
  /** Test-id prefix; default "hex-block". */
  testIdPrefix?: string;
}

export interface HexBlockHandle {
  el: HTMLDetailsElement;
  setFields(fields: HexField[]): void;
  setSummary(summary: string): void;
  setCopyAllLabel(label: string | null): void;
  dispose(): void;
}

const COPIED_TIMEOUT_MS = 1500;
const DEFAULT_COPIED = "[✓ copied]";

export function createHexBlock(opts: HexBlockOptions): HexBlockHandle {
  const prefix = opts.testIdPrefix ?? "hex-block";
  const copiedLabel = opts.copiedLabel ?? DEFAULT_COPIED;

  const el = document.createElement("details");
  el.className = "hex-block";
  el.dataset.testid = prefix;

  const summaryEl = document.createElement("summary");
  summaryEl.className = "hex-block-summary";
  summaryEl.dataset.testid = `${prefix}-summary`;

  const explanationEl = document.createElement("p");
  explanationEl.className = "hex-block-explanation";
  explanationEl.dataset.testid = `${prefix}-explanation`;

  const rowsEl = document.createElement("div");
  rowsEl.className = "hex-block-rows";
  rowsEl.dataset.testid = `${prefix}-rows`;

  const copyAllEl = document.createElement("button");
  copyAllEl.type = "button";
  copyAllEl.className = "hex-block-copy-all";
  copyAllEl.dataset.testid = `${prefix}-copy-all`;

  el.append(summaryEl, explanationEl, rowsEl, copyAllEl);

  // Cleared on dispose so a flash doesn't fire on a detached node.
  const timers = new Map<string, ReturnType<typeof setTimeout>>();

  function flashCopied(targetEl: HTMLElement, restoreText: string, key: string): void {
    const prior = timers.get(key);
    if (prior) clearTimeout(prior);
    targetEl.textContent = copiedLabel;
    targetEl.dataset.copied = "true";
    const t = setTimeout(() => {
      targetEl.textContent = restoreText;
      targetEl.removeAttribute("data-copied");
      timers.delete(key);
    }, COPIED_TIMEOUT_MS);
    timers.set(key, t);
  }

  async function writeClipboard(text: string): Promise<boolean> {
    if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
      try {
        await navigator.clipboard.writeText(text);
        return true;
      } catch {
        return false;
      }
    }
    return false;
  }

  function paintRows(fields: HexField[]): void {
    rowsEl.innerHTML = "";
    fields.forEach((field) => {
      const row = document.createElement("div");
      row.className = "hex-block-row";
      row.dataset.testid = `${prefix}-row-${field.id}`;

      const label = document.createElement("span");
      label.className = "hex-block-label";
      label.textContent = field.label;

      const value = document.createElement("code");
      value.className = "hex-block-value";
      value.textContent = field.value;

      const copyBtn = document.createElement("button");
      copyBtn.type = "button";
      copyBtn.className = "hex-block-row-copy";
      copyBtn.dataset.testid = `${prefix}-row-${field.id}-copy`;
      copyBtn.textContent = "copy";
      copyBtn.setAttribute("aria-label", `Copy ${field.label}`);
      copyBtn.addEventListener("click", async () => {
        const ok = await writeClipboard(field.copyValue ?? field.value);
        if (ok) flashCopied(copyBtn, "copy", `row-${field.id}`);
      });

      row.append(label, value, copyBtn);
      rowsEl.appendChild(row);
    });
  }

  function paintSummary(summary: string): void {
    summaryEl.textContent = summary;
  }

  function paintExplanation(explanation?: string): void {
    if (explanation) {
      explanationEl.textContent = explanation;
      explanationEl.style.display = "";
    } else {
      explanationEl.textContent = "";
      explanationEl.style.display = "none";
    }
  }

  function paintCopyAll(label: string | null, fields: HexField[]): void {
    if (!label) {
      copyAllEl.style.display = "none";
      return;
    }
    copyAllEl.style.display = "";
    copyAllEl.textContent = label;
    copyAllEl.onclick = async () => {
      const text = fields
        .map((f) => `${f.label}: ${f.copyValue ?? f.value}`)
        .join("\n");
      const ok = await writeClipboard(text);
      if (ok) flashCopied(copyAllEl, label, "copy-all");
    };
  }

  let currentFields = opts.fields;
  paintSummary(opts.summary);
  paintExplanation(opts.explanation);
  paintRows(currentFields);
  paintCopyAll(opts.copyAllLabel ?? null, currentFields);

  return {
    el,
    setFields(next) {
      currentFields = next;
      paintRows(next);
      paintCopyAll(opts.copyAllLabel ?? null, next);
    },
    setSummary: paintSummary,
    setCopyAllLabel(label) {
      paintCopyAll(label, currentFields);
    },
    dispose() {
      for (const t of timers.values()) clearTimeout(t);
      timers.clear();
    },
  };
}
