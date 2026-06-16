// Setup-screen state. Lives outside the FSM phase union so it survives
// Retry — after proving, the user can re-prove without re-detecting the
// card or re-typing the PIN.
//
// HiPKI is a two-step click flow: `Detect readers` (CheckEnvir) lists
// slots; the user picks one and clicks `Read card` (GetUserCert scoped
// to that slot) to parse the cert and unlock PIN entry.

import { atom, computed, type ReadableAtom, type WritableAtom } from "nanostores";

import type { CircuitKind } from "./manifest";
import type { CardContext } from "./pipeline";
import type { Pin } from "./pin";
import type { SmtIssuer } from "./smt-client";
import type { SmtLoadPhase } from "./smt-local";

/** Snapshot of one slot the picker shows the user. */
export interface ReaderSlot {
  slotDescription: string;
  /** Card serial if a card is inserted, else undefined. */
  cardSN?: string;
}

export type HipkiState =
  | { status: "probing" }
  | { status: "detecting" }
  | { status: "not_installed"; message: string }
  | {
      status: "readers_listed";
      slots: ReaderSlot[];
      serverVersion?: string;
      /** Slot the user picked (defaults to the first slot with a card). */
      selectedSlot?: string;
    }
  | { status: "reading"; slotDescription: string }
  | {
      status: "card_ready";
      card: CardContext;
      cardSN: string;
      subjectDN?: string;
      serverVersion?: string;
    };

export type PinState =
  | { status: "pending" }
  | { status: "verifying"; cardSN: string }
  | {
      status: "locked";
      pin: Pin;
      cardSN: string;
      attemptsRemaining: number;
    }
  | {
      status: "error";
      message: string;
      attemptsRemaining: number;
    };

export type ManifestErrorCode =
  | "rate_limited"
  | "unreachable"
  | "malformed"
  | "missing_asset";

export type ComponentStatus = "pending" | "running" | "ready";

export type WarmupComponents = Record<CircuitKind, ComponentStatus>;

export const WARMUP_COMPONENT_ORDER: CircuitKind[] = [
  "certChainRS2048",
  "certChainRS4096",
  "userSigRS2048",
];

export function initialWarmupComponents(): WarmupComponents {
  return {
    certChainRS2048: "pending",
    certChainRS4096: "pending",
    userSigRS2048: "pending",
  };
}

/** Worker warmup status. Drives the Assets panel and contributes to
 *  `$setupReady`. `idle.forceRefresh` tells the Worker to drop its
 *  in-memory witness-wasm cache before re-running warmup. */
export type WarmupState =
  | { status: "idle"; forceRefresh?: boolean }
  | { status: "running"; components: WarmupComponents; slow?: boolean }
  | { status: "ready" }
  | {
      status: "error";
      message: string;
      kind?: "warmup" | "manifest";
      manifestCode?: ManifestErrorCode;
    };

/** Revocation-tree load status. Triggered by HiPKI reaching `card_ready`
 *  (because the issuer is only known after the card is parsed) and gates
 *  Continue alongside $warmup / $hipki / $pin. `idle.forceRefresh` tells the
 *  Worker to null its captured manifest before the next load. */
export type SmtState =
  | { status: "idle"; forceRefresh?: boolean }
  | {
      status: "running";
      issuer: SmtIssuer;
      phase: SmtLoadPhase;
      bytesDone: number;
      bytesTotal: number;
    }
  | { status: "ready"; issuer: SmtIssuer; rootHex: string; crlNumber: string }
  | { status: "error"; message: string; manifestCode?: ManifestErrorCode };

export const $hipki: WritableAtom<HipkiState> = atom<HipkiState>({
  status: "probing",
});
export const $pin: WritableAtom<PinState> = atom<PinState>({
  status: "pending",
});
export const $warmup: WritableAtom<WarmupState> = atom<WarmupState>({
  status: "idle",
});
export const $smt: WritableAtom<SmtState> = atom<SmtState>({ status: "idle" });

/** Derived: true when every setup panel is green. Gates Continue. */
export const $setupReady: ReadableAtom<boolean> = computed(
  [$warmup, $hipki, $smt, $pin],
  (warmup, hipki, smt, pin) => {
    if (warmup.status !== "ready") return false;
    if (smt.status !== "ready") return false;
    return hipki.status === "card_ready" && pin.status === "locked";
  },
);

/** Reset every setup atom. Called on FSM `reset` → landing. The `Pin`
 *  wrapper's own `consume()` is the authoritative single-use sink; the atom
 *  update drops the reference so nothing else can reach it. */
export function resetSetup(): void {
  $hipki.set({ status: "probing" });
  $pin.set({ status: "pending" });
  $warmup.set({ status: "idle" });
  $smt.set({ status: "idle" });
}

/** Single source of truth for "card is parsed and ready for PIN entry". */
export function isCardReady(): boolean {
  return $hipki.get().status === "card_ready";
}

/** Invalidate a verified PIN. Called whenever the card context changes
 *  (re-detect, re-read) so a `locked` PIN can't refer to a card the user
 *  no longer has selected. */
export function dropStalePin(): void {
  const pinNow = $pin.get();
  if (pinNow.status === "locked" || pinNow.status === "verifying") {
    $pin.set({ status: "pending" });
  }
}
