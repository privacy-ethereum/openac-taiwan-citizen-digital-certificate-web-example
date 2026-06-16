import { describe, expect, it } from "vitest";

import { createPrivacySheet } from "./privacy-sheet";

const PILLARS = [
  {
    id: "result",
    title: "ONLY THE NECESSARY RESULT",
    body: 'Test Verifier learns "verified ≥18" and nothing else.',
  },
  {
    id: "card",
    title: "NO FULL CREDENTIAL SHARED",
    body: "Your card stays in your hands.",
  },
  {
    id: "zk",
    title: "ZERO-KNOWLEDGE PROOF",
    body: "Math proves the claim without the data.",
    learnMoreText: "learn more →",
    learnMoreHref: "https://pse.dev/projects/zk-id",
  },
];

describe("privacy-sheet", () => {
  it("renders <details><summary> + each pillar with title and body", () => {
    const { el } = createPrivacySheet({
      summary: "how this works",
      pillars: PILLARS,
    });
    expect(el.tagName).toBe("DETAILS");
    expect(el.querySelector(".privacy-sheet-summary")?.textContent).toBe(
      "how this works",
    );
    const sections = el.querySelectorAll(".privacy-sheet-pillar");
    expect(sections.length).toBe(3);
    expect(sections[0].querySelector("h3")?.textContent).toBe(
      "ONLY THE NECESSARY RESULT",
    );
    expect(sections[2].querySelector("p")?.textContent).toBe(
      "Math proves the claim without the data.",
    );
  });

  it("renders an external 'learn more →' link with rel='noopener noreferrer'", () => {
    const { el } = createPrivacySheet({
      summary: "x",
      pillars: PILLARS,
    });
    const link = el.querySelector<HTMLAnchorElement>(
      '[data-testid="privacy-sheet-pillar-zk-link"]',
    );
    expect(link).not.toBeNull();
    expect(link!.href).toBe("https://pse.dev/projects/zk-id");
    expect(link!.target).toBe("_blank");
    expect(link!.rel).toBe("noopener noreferrer");
    expect(link!.textContent).toBe("learn more →");
  });

  it("setSummary swaps the summary in place", () => {
    const handle = createPrivacySheet({ summary: "first", pillars: PILLARS });
    handle.setSummary("second");
    expect(handle.el.querySelector(".privacy-sheet-summary")?.textContent).toBe(
      "second",
    );
  });

  it("setPillars replaces the pillar set", () => {
    const handle = createPrivacySheet({ summary: "x", pillars: PILLARS });
    handle.setPillars([{ id: "only", title: "ONLY", body: "lone pillar" }]);
    expect(handle.el.querySelectorAll(".privacy-sheet-pillar").length).toBe(1);
  });

  it("pillars without learnMoreText omit the link", () => {
    const { el } = createPrivacySheet({
      summary: "x",
      pillars: [PILLARS[0]],
    });
    expect(el.querySelector(".privacy-sheet-learn-more")).toBeNull();
  });
});
