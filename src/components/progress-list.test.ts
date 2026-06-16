import { describe, expect, it } from "vitest";

import { createProgressList } from "./progress-list";

describe("progress-list", () => {
  it("renders each row with status-specific glyph + label + trailing", () => {
    const { el } = createProgressList([
      { id: "a", label: "Step A", status: "done", trailing: "1.2s" },
      { id: "b", label: "Step B", status: "in_progress" },
      { id: "c", label: "Step C", status: "pending" },
    ]);
    const rows = el.querySelectorAll("li");
    expect(rows.length).toBe(3);
    expect(rows[0].dataset.status).toBe("done");
    expect(rows[0].querySelector(".progress-list-glyph")?.textContent).toBe("[✓]");
    expect(rows[0].querySelector(".progress-list-trailing")?.textContent).toBe("1.2s");
    expect(rows[1].querySelector(".progress-list-glyph")?.textContent).toBe("[⠋]");
    expect(rows[1].getAttribute("aria-current")).toBe("step");
    expect(rows[2].querySelector(".progress-list-glyph")?.textContent).toBe("[·]");
  });

  it("update replaces the row set in place", () => {
    const handle = createProgressList([
      { id: "a", label: "first", status: "in_progress" },
    ]);
    handle.update([
      { id: "a", label: "first", status: "done", trailing: "ok" },
      { id: "b", label: "second", status: "in_progress" },
    ]);
    const rows = handle.el.querySelectorAll("li");
    expect(rows.length).toBe(2);
    expect(rows[0].dataset.status).toBe("done");
    expect(rows[1].dataset.status).toBe("in_progress");
  });

  it("error rows render the × glyph", () => {
    const { el } = createProgressList([
      { id: "x", label: "boom", status: "error", trailing: "wasm crashed" },
    ]);
    expect(
      el.querySelector("li")?.querySelector(".progress-list-glyph")?.textContent,
    ).toBe("[×]");
    expect(el.querySelector(".progress-list-trailing")?.textContent).toBe(
      "wasm crashed",
    );
  });

  it("only the in_progress row carries aria-current", () => {
    const { el } = createProgressList([
      { id: "a", label: "a", status: "done" },
      { id: "b", label: "b", status: "in_progress" },
      { id: "c", label: "c", status: "pending" },
    ]);
    const withAriaCurrent = el.querySelectorAll('[aria-current="step"]');
    expect(withAriaCurrent.length).toBe(1);
  });
});
