import { describe, expect, it, vi } from "vitest";

import { createPinInput } from "./pin-input";

describe("pin-input", () => {
  it("renders a password input with placeholder + aria-label", () => {
    const { el } = createPinInput({
      placeholder: "PIN",
      ariaLabel: "Citizen Digital Certificate PIN",
      onSubmit: () => {},
    });
    const input = el.querySelector<HTMLInputElement>("input");
    expect(input).not.toBeNull();
    expect(input!.type).toBe("password");
    expect(input!.placeholder).toBe("PIN");
    expect(input!.getAttribute("aria-label")).toBe(
      "Citizen Digital Certificate PIN",
    );
  });

  it("Enter triggers onSubmit with the current value", () => {
    const onSubmit = vi.fn();
    const { el } = createPinInput({ placeholder: "x", ariaLabel: "x", onSubmit });
    const input = el.querySelector<HTMLInputElement>("input")!;
    input.value = "1234";
    input.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter" }));
    expect(onSubmit).toHaveBeenCalledWith("1234");
  });

  it("ready state hides the status row", () => {
    const { el } = createPinInput({
      placeholder: "x",
      ariaLabel: "x",
      onSubmit: () => {},
    });
    const status = el.querySelector<HTMLElement>(".pin-input-v2-status")!;
    expect(status.style.display).toBe("none");
  });

  it("wrong (2 tries left) shows amber tone; wrong (1 left) shows error tone", () => {
    const handle = createPinInput({
      placeholder: "x",
      ariaLabel: "x",
      onSubmit: () => {},
    });
    handle.setState({ kind: "wrong", triesLeft: 2, message: "2 tries left" });
    const input = handle.el.querySelector<HTMLInputElement>("input")!;
    expect(input.dataset.tone).toBe("warn");
    expect(handle.el.querySelector(".pin-input-v2-message")?.textContent).toBe(
      "2 tries left",
    );

    handle.setState({ kind: "wrong", triesLeft: 1, message: "last try" });
    expect(input.dataset.tone).toBe("error");
  });

  it("locked state disables the input and shows the lock message", () => {
    const handle = createPinInput({
      placeholder: "x",
      ariaLabel: "x",
      onSubmit: () => {},
    });
    handle.setState({ kind: "locked", message: "service center visit required" });
    const input = handle.el.querySelector<HTMLInputElement>("input")!;
    expect(input.disabled).toBe(true);
    expect(handle.el.querySelector(".pin-input-v2-message")?.textContent).toBe(
      "service center visit required",
    );
  });

  it("verified state disables input and switches badge to ready", () => {
    const handle = createPinInput({
      placeholder: "x",
      ariaLabel: "x",
      onSubmit: () => {},
    });
    handle.setState({ kind: "verified", message: "PIN OK" });
    const input = handle.el.querySelector<HTMLInputElement>("input")!;
    expect(input.disabled).toBe(true);
    expect(handle.el.dataset.state).toBe("verified");
  });

  it("clear() empties the input value", () => {
    const handle = createPinInput({
      placeholder: "x",
      ariaLabel: "x",
      onSubmit: () => {},
    });
    const input = handle.el.querySelector<HTMLInputElement>("input")!;
    input.value = "1234";
    handle.clear();
    expect(input.value).toBe("");
  });

  it("Enter on a disabled (locked) input does not fire onSubmit", () => {
    const onSubmit = vi.fn();
    const handle = createPinInput({
      placeholder: "x",
      ariaLabel: "x",
      onSubmit,
    });
    handle.setState({ kind: "locked", message: "locked" });
    const input = handle.el.querySelector<HTMLInputElement>("input")!;
    input.value = "9999";
    input.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter" }));
    expect(onSubmit).not.toHaveBeenCalled();
  });
});
