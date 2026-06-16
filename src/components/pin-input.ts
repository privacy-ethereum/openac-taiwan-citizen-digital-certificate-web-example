// Mono PIN input + status row that escalates ready → amber (1 wrong) →
// red (last try) → locked.

import { createStatusBadge, type StatusBadgeHandle } from "./status-badge";

export type PinAttemptsState =
  | { kind: "ready" }
  | { kind: "wrong"; triesLeft: number; message: string }
  | { kind: "locked"; message: string }
  | { kind: "verified"; message: string };

export interface PinInputOptions {
  placeholder: string;
  ariaLabel: string;
  onSubmit: (pin: string) => void;
  /** Initial state; default { kind: "ready" }. */
  initialState?: PinAttemptsState;
}

export interface PinInputHandle {
  el: HTMLElement;
  setState(state: PinAttemptsState): void;
  clear(): void;
}

export function createPinInput(opts: PinInputOptions): PinInputHandle {
  const wrap = document.createElement("div");
  wrap.className = "pin-input-v2";

  const input = document.createElement("input");
  input.type = "password";
  input.className = "pin-input-v2-field";
  input.dataset.testid = "pin-input";
  input.inputMode = "numeric";
  input.autocomplete = "off";
  input.placeholder = opts.placeholder;
  input.setAttribute("aria-label", opts.ariaLabel);

  input.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && !input.disabled) {
      e.preventDefault();
      const value = input.value;
      if (value) opts.onSubmit(value);
    }
  });

  const statusRow = document.createElement("div");
  statusRow.className = "pin-input-v2-status";

  const badge: StatusBadgeHandle = createStatusBadge({ kind: "pending" });
  statusRow.appendChild(badge.el);

  const message = document.createElement("span");
  message.className = "pin-input-v2-message";
  statusRow.appendChild(message);

  wrap.append(input, statusRow);

  function setState(state: PinAttemptsState): void {
    wrap.dataset.state = state.kind;
    if (state.kind === "ready") {
      input.disabled = false;
      input.dataset.tone = "neutral";
      message.textContent = "";
      badge.update({ kind: "pending", ariaLabel: "ready" });
      statusRow.style.display = "none";
      return;
    }
    statusRow.style.display = "";
    if (state.kind === "wrong") {
      input.disabled = false;
      input.dataset.tone = state.triesLeft <= 1 ? "error" : "warn";
      badge.update({ kind: "warn", ariaLabel: "wrong PIN" });
      message.textContent = state.message;
      return;
    }
    if (state.kind === "locked") {
      input.disabled = true;
      input.dataset.tone = "error";
      badge.update({ kind: "error", ariaLabel: "card locked" });
      message.textContent = state.message;
      return;
    }
    input.disabled = true;
    input.dataset.tone = "ok";
    badge.update({ kind: "ready", ariaLabel: "verified" });
    message.textContent = state.message;
  }

  setState(opts.initialState ?? { kind: "ready" });

  return {
    el: wrap,
    setState,
    clear() {
      input.value = "";
    },
  };
}
