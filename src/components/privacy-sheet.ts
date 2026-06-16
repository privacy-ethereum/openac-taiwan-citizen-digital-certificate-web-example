// Inline expandable privacy explainer (native <details>) with N pillars.

export interface PrivacyPillar {
  /** Stable id used for [data-testid]. */
  id: string;
  title: string;
  body: string;
  /** Optional trailing inline link (e.g., "learn more →"). */
  learnMoreText?: string;
  learnMoreHref?: string;
}

export interface PrivacySheetOptions {
  summary: string;
  pillars: PrivacyPillar[];
  /** Test-id prefix; default "privacy-sheet". */
  testIdPrefix?: string;
}

export interface PrivacySheetHandle {
  el: HTMLDetailsElement;
  setSummary(summary: string): void;
  setPillars(pillars: PrivacyPillar[]): void;
}

export function createPrivacySheet(
  opts: PrivacySheetOptions,
): PrivacySheetHandle {
  const prefix = opts.testIdPrefix ?? "privacy-sheet";
  const el = document.createElement("details");
  el.className = "privacy-sheet";
  el.dataset.testid = prefix;

  const summaryEl = document.createElement("summary");
  summaryEl.className = "privacy-sheet-summary";
  summaryEl.dataset.testid = `${prefix}-summary`;

  const body = document.createElement("div");
  body.className = "privacy-sheet-body";

  el.append(summaryEl, body);

  function paintSummary(summary: string): void {
    summaryEl.textContent = summary;
  }

  function paintPillars(pillars: PrivacyPillar[]): void {
    body.innerHTML = "";
    for (const pillar of pillars) {
      const section = document.createElement("section");
      section.className = "privacy-sheet-pillar";
      section.dataset.testid = `${prefix}-pillar-${pillar.id}`;

      const title = document.createElement("h3");
      title.className = "privacy-sheet-pillar-title";
      title.textContent = pillar.title;

      const text = document.createElement("p");
      text.className = "privacy-sheet-pillar-body";
      text.textContent = pillar.body;

      section.append(title, text);

      if (pillar.learnMoreText && pillar.learnMoreHref) {
        const link = document.createElement("a");
        link.className = "privacy-sheet-learn-more";
        link.dataset.testid = `${prefix}-pillar-${pillar.id}-link`;
        link.href = pillar.learnMoreHref;
        link.target = "_blank";
        link.rel = "noopener noreferrer";
        link.textContent = pillar.learnMoreText;
        section.appendChild(link);
      }

      body.appendChild(section);
    }
  }

  paintSummary(opts.summary);
  paintPillars(opts.pillars);

  return {
    el,
    setSummary: paintSummary,
    setPillars: paintPillars,
  };
}
