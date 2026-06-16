import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { createHexBlock, type HexField } from "./hex-block";

const FIELDS: HexField[] = [
  { id: "nullifier", label: "nullifier", value: "0x4f3a2d…ab7c" },
  { id: "pk_commit", label: "pk commit", value: "0x9999…cafe" },
];

describe("hex-block", () => {
  let writeText: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: { writeText },
    });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("renders summary, explanation, rows, and copy-all when configured", () => {
    const { el } = createHexBlock({
      summary: "▸ proof details",
      explanation: "5 fields, mono",
      fields: FIELDS,
      copyAllLabel: "copy all",
    });
    expect(el.querySelector(".hex-block-summary")?.textContent).toBe(
      "▸ proof details",
    );
    expect(el.querySelector(".hex-block-explanation")?.textContent).toBe(
      "5 fields, mono",
    );
    expect(el.querySelectorAll(".hex-block-row").length).toBe(2);
    expect(el.querySelector(".hex-block-copy-all")?.textContent).toBe("copy all");
  });

  it("clicking a row's copy button writes its value to the clipboard", async () => {
    const { el } = createHexBlock({ summary: "x", fields: FIELDS });
    const btn = el.querySelector<HTMLButtonElement>(
      '[data-testid="hex-block-row-nullifier-copy"]',
    );
    expect(btn).not.toBeNull();
    btn!.click();
    await vi.waitFor(() => expect(writeText).toHaveBeenCalledWith("0x4f3a2d…ab7c"));
  });

  it("after a copy click, the button text flashes to the copied label", async () => {
    const { el } = createHexBlock({
      summary: "x",
      fields: FIELDS,
      copiedLabel: "[✓ copied]",
    });
    const btn = el.querySelector<HTMLButtonElement>(
      '[data-testid="hex-block-row-nullifier-copy"]',
    )!;
    btn.click();
    // Wait for the clipboard promise to resolve and the flash to apply.
    await vi.waitFor(() => expect(btn.textContent).toBe("[✓ copied]"));
    expect(btn.dataset.copied).toBe("true");
    // Confirm the text reverts after the 1.5s timeout.
    await vi.waitFor(() => expect(btn.textContent).toBe("copy"), {
      timeout: 3000,
    });
    expect(btn.dataset.copied).toBeUndefined();
  });

  it("copy-all writes the joined label/value pairs", async () => {
    const { el } = createHexBlock({
      summary: "x",
      fields: FIELDS,
      copyAllLabel: "copy all",
    });
    const btn = el.querySelector<HTMLButtonElement>(
      '[data-testid="hex-block-copy-all"]',
    )!;
    btn.click();
    await vi.waitFor(() =>
      expect(writeText).toHaveBeenCalledWith(
        "nullifier: 0x4f3a2d…ab7c\npk commit: 0x9999…cafe",
      ),
    );
  });

  it("setFields replaces the row set", () => {
    const handle = createHexBlock({ summary: "x", fields: FIELDS });
    handle.setFields([{ id: "z", label: "z", value: "0xz" }]);
    expect(handle.el.querySelectorAll(".hex-block-row").length).toBe(1);
    expect(
      handle.el.querySelector('[data-testid="hex-block-row-z"]'),
    ).not.toBeNull();
  });

  it("dispose clears outstanding copy-flash timers", () => {
    vi.useFakeTimers();
    const handle = createHexBlock({ summary: "x", fields: FIELDS });
    handle.el
      .querySelector<HTMLButtonElement>(
        '[data-testid="hex-block-row-nullifier-copy"]',
      )!
      .click();
    handle.dispose();
    // No throw on advancing past the timer means the timer was cleared.
    expect(() => vi.advanceTimersByTime(2000)).not.toThrow();
  });
});
