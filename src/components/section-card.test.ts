import { describe, expect, it } from "vitest";

import { createSectionCard } from "./section-card";

describe("section-card", () => {
  it("renders title + body + actions when provided", () => {
    const action = document.createElement("button");
    action.textContent = "go";
    const { el } = createSectionCard({
      title: "READY",
      body: "all systems nominal",
      actions: action,
    });
    expect(el.querySelector(".section-card-title")?.textContent).toBe("READY");
    expect(el.querySelector(".section-card-body")?.textContent).toBe(
      "all systems nominal",
    );
    expect(el.querySelector(".section-card-actions button")?.textContent).toBe("go");
  });

  it("status defaults to 'default' and updates via setStatus", () => {
    const handle = createSectionCard({ title: "x" });
    expect(handle.el.dataset.status).toBe("default");
    handle.setStatus("ok");
    expect(handle.el.dataset.status).toBe("ok");
    handle.setStatus("error");
    expect(handle.el.dataset.status).toBe("error");
  });

  it("setBody accepts a Node graph and replaces existing content", () => {
    const handle = createSectionCard({ body: "first" });
    const replacement = document.createElement("p");
    replacement.textContent = "second";
    handle.setBody(replacement);
    expect(handle.el.querySelector(".section-card-body p")?.textContent).toBe(
      "second",
    );
  });
});
