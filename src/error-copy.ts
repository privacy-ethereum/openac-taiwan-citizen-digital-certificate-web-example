import { t } from "./i18n/store";
import type { ManifestErrorCode } from "./manifest";

export type ErrorKind =
  | "network_offline"
  | "network_http"
  | "verifier_unavailable"
  | "verifier_provider_unavailable"
  | "challenge_expired"
  | "challenge_consumed"
  | "nullifier_duplicate"
  | "popup_blocked"
  | "popup_timeout"
  | "hipki_not_installed"
  | "card_reader_unreachable"
  | "card_sign_failed"
  | "asset_corrupt"
  | "asset_unreachable"
  | "storage_full"
  | "rate_limited"
  | "wasm_init"
  | "unknown";

export interface FriendlyErrorOptions {
  manifestCode?: ManifestErrorCode;
}

export interface FriendlyErrorCopy {
  kind: ErrorKind;
  headline: string;
  body: string;
  technical: string;
}

export function classifyError(
  where: string,
  rawMessage: string,
  opts?: FriendlyErrorOptions,
): ErrorKind {
  if (opts?.manifestCode === "rate_limited") return "rate_limited";
  if (opts?.manifestCode === "missing_asset" || opts?.manifestCode === "malformed") {
    return "asset_corrupt";
  }
  if (opts?.manifestCode === "unreachable") return "asset_unreachable";

  const m = rawMessage ?? "";

  // Server messages from go-zkid-verifier (httpapi/errors.go).
  if (/challenge expired/i.test(m)) return "challenge_expired";
  if (/challenge already consumed/i.test(m) || /challenge not found or already consumed/i.test(m)) {
    return "challenge_consumed";
  }
  if (/nullifier already registered/i.test(m)) return "nullifier_duplicate";
  if (/smt root provider unavailable/i.test(m) || /issuer cert provider unavailable/i.test(m)) {
    return "verifier_provider_unavailable";
  }

  if (/^hash mismatch for /.test(m)) return "asset_corrupt";
  if (/^HiPKI popup blocked/.test(m)) return "popup_blocked";
  if (/^HiPKI popup (did not signal ready|timeout)/.test(m)) {
    // CORS blocks a direct probe of localhost:61161, so a never-ready popup
    // during setup is our only signal that the plug-in isn't running.
    return where === "hipki" ? "hipki_not_installed" : "popup_timeout";
  }
  if (/^HiPKI sign failed/.test(m) || /^HiPKI sign response missing/.test(m)) {
    return "card_sign_failed";
  }
  if (/^HiPKI rejected PIN/.test(m)) return "card_sign_failed";

  if (/^HiPKI: /.test(m)) {
    return where === "hipki" ? "card_reader_unreachable" : "card_sign_failed";
  }

  const statusMatch = m.match(/returned (\d{3})\b/);
  if (statusMatch) {
    const code = Number.parseInt(statusMatch[1], 10);
    if (code >= 500) return "network_http";
    if (code >= 400) return "verifier_unavailable";
  }

  if (
    /exceed(s|ed)? .*storage quota/i.test(m) ||
    /\bQuotaExceededError\b/.test(m)
  ) {
    return "storage_full";
  }

  const isFetchFailure =
    /^fetch failed for /.test(m) ||
    /Failed to fetch/i.test(m) ||
    / returned no body$/.test(m);
  if (isFetchFailure) {
    if (typeof navigator !== "undefined" && navigator.onLine === false) {
      return "network_offline";
    }
    if (where === "hipki") return "hipki_not_installed";
    if (where === "warmup" || where === "smt_load") return "asset_unreachable";
    return "verifier_unavailable";
  }

  if (
    where === "warmup" &&
    (/wasm/i.test(m) || /did not export/.test(m) || /did not define/.test(m) || /failed to initialize/i.test(m))
  ) {
    return "wasm_init";
  }

  switch (where) {
    case "challenge":
    case "submit":
      return "verifier_unavailable";
    case "warmup":
    case "smt_load":
      return "asset_unreachable";
    case "hipki":
      return "card_reader_unreachable";
    default:
      return "unknown";
  }
}

export function friendlyErrorCopy(
  where: string,
  rawMessage: string,
  opts?: FriendlyErrorOptions,
): FriendlyErrorCopy {
  const kind = classifyError(where, rawMessage, opts);
  return {
    kind,
    headline: t(`errors.${kind}.headline`),
    body: t(`errors.${kind}.body`),
    technical: rawMessage ? `${where}: ${rawMessage}` : where,
  };
}
