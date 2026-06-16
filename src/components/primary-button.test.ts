import { describe, expect, it, vi } from "vitest";

import { createPrimaryButton } from "./primary-button";

describe("primary-button", () => {
  it("primary variant renders label + arrow glyph and fires onClick", () => {
    const onClick = vi.fn();
    const { el } = createPrimaryButton({ label: "Start", onClick, testId: "go" });
    expect(el.dataset.testid).toBe("go");
    expect(el.classList.contains("primary-button-v2-primary")).toBe(true);
    expect(el.querySelector(".primary-button-v2-label")?.textContent).toBe("Start");
    expect(el.querySelector(".primary-button-v2-glyph")?.textContent).toBe("→");
    el.click();
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it("ghost variant has empty default glyph and the ghost class", () => {
    const { el } = createPrimaryButton({
      label: "Back",
      variant: "ghost",
      onClick: () => {},
    });
    expect(el.classList.contains("primary-button-v2-ghost")).toBe(true);
    expect(el.querySelector(".primary-button-v2-glyph")?.textContent).toBe("");
  });

  it("disabled blocks the onClick handler", () => {
    const onClick = vi.fn();
    const { el, setDisabled } = createPrimaryButton({ label: "x", onClick });
    setDisabled(true);
    el.click();
    expect(onClick).not.toHaveBeenCalled();
    setDisabled(false);
    el.click();
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it("setLabel updates the visible text without recreating the button", () => {
    const handle = createPrimaryButton({ label: "first", onClick: () => {} });
    handle.setLabel("second");
    expect(handle.el.querySelector(".primary-button-v2-label")?.textContent).toBe(
      "second",
    );
  });
});
