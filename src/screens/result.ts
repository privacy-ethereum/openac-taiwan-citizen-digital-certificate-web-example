// Result screen for both terminal `result` and `error` phases.
//
// Voice: headlines are short and direct — "Verified" / "Not verified" /
// "Couldn't verify". The longer detail line carries the why.
//
// TODO (follow-up): render reason chips on rejected (challenge expired /
// network / verifier-side) and category chips on error (your card /
// your network / our verifier / unknown). Requires extending AppState's
// `result` and `error` variants in store.ts and wiring the upstream
// dispatch site (prove-main.ts handleSubmitFailure) to attach the
// classification. Tracked separately so this PR ships the visible voice
// change without the cross-file plumbing.
//
// TODO (follow-up): migrate technical-details rendering to the new
// hex-block component. Visible behavior will be identical; the
// generalization is what makes the new result screen's "▸ proof
// details (5 fields)" disclosure share code with the existing
// technical-details path.

import {
  renderTechnicalDetails,
  type TechnicalDetailsHandle,
  type TechnicalItem,
} from "../components/technical-details";
import { clearAllAssets, getAssetsTotalBytes } from "../asset-store";
import { friendlyErrorCopy } from "../error-copy";
import { markForceFreshAssets } from "../force-fresh-flag";
import { formatDuration, humanBytes, truncateMiddle } from "../format";
import { $locale, t } from "../i18n/store";
import { $state, dispatch } from "../store";
import type { ParsedInputs } from "../verifier-client";

const shortHex = (h: string): string => truncateMiddle(h, 10, 6);

export function mountResult(root: HTMLElement): () => void {
  const state = $state.get();
  const isResult = state.phase === "result";
  const isError = state.phase === "error";

  let tone: "done" | "error" = "done";
  let testidBadge: string;

  if (isResult) {
    if (state.verified) {
      testidBadge = "result-verified";
    } else {
      testidBadge = "result-not-verified";
      tone = "error";
    }
  } else if (isError) {
    testidBadge = "result-error";
    tone = "error";
  } else {
    // Defensive fallback; router guards should prevent this branch.
    testidBadge = "result-unknown";
  }

  const showProveAgain = !(isResult && state.verified);
  // On `smt_root_mismatch` only force-fresh reload (HTTP cache bypass) clears
  // the stale snapshot. The primary action handles it, so the manual checkbox
  // is hidden.
  const isStaleSnapshot =
    isResult && !state.verified && state.reason === "smt_root_mismatch";

  root.innerHTML = `
    <section class="screen screen-result">
      <h1 data-testid="result-headline"></h1>
      <div class="result-banner" data-kind="${tone}" data-testid="${testidBadge}">
        <div class="result-line" data-testid="result-detail"></div>
      </div>
      <div data-testid="result-debug"></div>
      ${
        isStaleSnapshot
          ? ""
          : `<div class="result-clear-toggle" data-testid="result-clear-toggle">
        <label class="result-clear-toggle__label">
          <input type="checkbox" data-testid="result-clear-checkbox" />
          <span data-testid="result-clear-label"></span>
        </label>
        <details data-testid="result-clear-why">
          <summary></summary>
          <p></p>
        </details>
      </div>`
      }
      <div class="button-row">
        <button class="secondary-button" data-testid="result-home" type="button"></button>
        ${
          showProveAgain
            ? isStaleSnapshot
              ? `<button class="primary-button" data-testid="result-refresh-retry" type="button"></button>`
              : `<button class="primary-button" data-testid="result-prove-again" type="button"></button>`
            : ""
        }
      </div>
    </section>
  `;

  const headlineEl = root.querySelector<HTMLElement>('[data-testid="result-headline"]')!;
  const detailEl = root.querySelector<HTMLElement>('[data-testid="result-detail"]')!;
  const debugSlot = root.querySelector<HTMLElement>('[data-testid="result-debug"]')!;
  const homeBtn = root.querySelector<HTMLButtonElement>('[data-testid="result-home"]')!;
  const againBtn = root.querySelector<HTMLButtonElement>('[data-testid="result-prove-again"]');
  const refreshBtn = root.querySelector<HTMLButtonElement>('[data-testid="result-refresh-retry"]');
  const clearCheckbox = root.querySelector<HTMLInputElement>('[data-testid="result-clear-checkbox"]');
  const clearLabelEl = root.querySelector<HTMLElement>('[data-testid="result-clear-label"]');
  const whyDetails = root.querySelector<HTMLDetailsElement>('[data-testid="result-clear-why"]');
  const whySummary = whyDetails?.querySelector("summary") ?? null;
  const whyBody = whyDetails?.querySelector("p") ?? null;

  const showDebug = isResult && state.verified;
  let technical: TechnicalDetailsHandle | null = null;
  if (showDebug) {
    technical = renderTechnicalDetails(
      debugSlot,
      buildResultItems(state.nullifier, state.parsedInputs),
    );
  } else if (isError) {
    technical = renderTechnicalDetails(
      debugSlot,
      buildErrorItems(state.where, state.message),
      { explanationKey: "errors.technicalExplanation" },
    );
  }

  let clearing = false;
  let cacheSize: number | null = null;

  function paintLabels(): void {
    if (isResult) {
      const total = state.provingMs + state.submitMs;
      if (state.verified) {
        headlineEl.textContent = t("result.headlines.verified");
        detailEl.textContent = t("result.detailVerified", {
          total: formatDuration(total),
          provingMs: formatDuration(state.provingMs),
          submitMs: formatDuration(state.submitMs),
        });
      } else {
        headlineEl.textContent = t("result.headlines.rejected");
        detailEl.textContent = rejectedDetail(state.reason, state.submitMs);
      }
    } else if (isError) {
      headlineEl.textContent = t("result.headlines.error");
      detailEl.textContent = friendlyErrorCopy(state.where, state.message).body;
    } else {
      headlineEl.textContent = "";
      detailEl.textContent = "";
    }
    homeBtn.textContent = clearing
      ? t("result.clearing")
      : t("result.backToForum");
    if (againBtn) againBtn.textContent = t("result.proveAgain");
    if (refreshBtn) {
      refreshBtn.textContent = clearing
        ? t("result.clearing")
        : t("result.refreshRetry");
    }
    if (clearLabelEl) {
      clearLabelEl.textContent = cacheSize != null && cacheSize > 0
        ? t("result.clearCheckbox", { size: humanBytes(cacheSize) })
        : t("result.clearCheckboxNoSize");
    }
    if (whySummary) whySummary.textContent = t("result.clearWhyTitle");
    if (whyBody) whyBody.textContent = t("result.clearWhyBody");
    if (showDebug && technical) {
      technical.update(buildResultItems(state.nullifier, state.parsedInputs));
    } else if (isError && technical) {
      technical.update(buildErrorItems(state.where, state.message));
    }
  }
  paintLabels();
  const unsubLocale = $locale.listen(paintLabels);

  if (!isStaleSnapshot) {
    void getAssetsTotalBytes()
      .then((bytes) => {
        cacheSize = bytes;
        paintLabels();
      })
      .catch((err) => {
        console.warn("getAssetsTotalBytes failed:", err);
      });
  }

  const onAgain = () => {
    if (isError) dispatch({ type: "reset" });
    else dispatch({ type: "retry_proving" });
  };

  // Reload after wiping the cache so the worker's in-memory PK/witness cache
  // drops with disk. When `markFresh` is true, the post-reload worker also
  // bypasses the browser HTTP cache via `forceFreshAssets`.
  const clearAndReload = async (markFresh: boolean): Promise<void> => {
    homeBtn.disabled = true;
    if (againBtn) againBtn.disabled = true;
    if (refreshBtn) refreshBtn.disabled = true;
    if (clearCheckbox) clearCheckbox.disabled = true;
    clearing = true;
    paintLabels();
    try {
      await clearAllAssets();
      if (markFresh) markForceFreshAssets();
      window.location.reload();
    } catch (err) {
      console.error("clearAndReload failed:", err);
      clearing = false;
      paintLabels();
      homeBtn.disabled = false;
      if (againBtn) againBtn.disabled = false;
      if (refreshBtn) refreshBtn.disabled = false;
      if (clearCheckbox) clearCheckbox.disabled = false;
    }
  };

  const onHome = async () => {
    if (homeBtn.disabled) return;
    if (!clearCheckbox || !clearCheckbox.checked) {
      dispatch({ type: "reset" });
      return;
    }
    await clearAndReload(false);
  };
  const onHomeClick = () => void onHome();

  const onRefreshAndRetry = async () => {
    if (!refreshBtn || refreshBtn.disabled) return;
    await clearAndReload(true);
  };
  const onRefreshClick = () => void onRefreshAndRetry();

  if (againBtn) againBtn.addEventListener("click", onAgain);
  if (refreshBtn) refreshBtn.addEventListener("click", onRefreshClick);
  homeBtn.addEventListener("click", onHomeClick);

  return () => {
    if (againBtn) againBtn.removeEventListener("click", onAgain);
    if (refreshBtn) refreshBtn.removeEventListener("click", onRefreshClick);
    homeBtn.removeEventListener("click", onHomeClick);
    unsubLocale();
    technical?.dispose();
  };
}

function formatModulus(limbs: string[] | undefined): string {
  if (!limbs || limbs.length === 0) return "—";
  return `${limbs.length} limbs — ${shortHex(limbs[0])} …`;
}

const KNOWN_REASONS = new Set([
  "proof_invalid",
  "smt_root_mismatch",
  "issuer_modulus_mismatch",
  "app_id_mismatch",
  "challenge_mismatch",
]);

function rejectedDetail(reason: string | undefined, submitMs: number): string {
  if (reason && KNOWN_REASONS.has(reason)) {
    return t(`result.reasons.${reason}`);
  }
  return t("result.detailRejected", {
    submitMs: formatDuration(submitMs),
  });
}

function buildErrorItems(where: string, message: string): TechnicalItem[] {
  const value = `${where}: ${message}`;
  return [
    {
      label: t("errors.technicalLabel"),
      testid: "result-error-technical",
      value,
      copyValue: value,
    },
  ];
}

function buildResultItems(
  nullifier: string | undefined,
  parsed: ParsedInputs | undefined,
): TechnicalItem[] {
  const items: TechnicalItem[] = [];
  if (nullifier) {
    items.push({
      label: t("result.technical.nullifier"),
      testid: "result-nullifier",
      value: shortHex(nullifier),
      copyValue: nullifier,
    });
  }
  if (parsed) {
    items.push(
      {
        label: t("result.technical.pkCommit"),
        testid: "result-pk-commit",
        value: shortHex(parsed.pkCommit),
        copyValue: parsed.pkCommit,
      },
      {
        label: t("result.technical.smtRoot"),
        testid: "result-smt-root",
        value: shortHex(parsed.smt_root),
        copyValue: parsed.smt_root,
      },
      {
        label: t("result.technical.challenge"),
        testid: "result-challenge",
        value: shortHex(parsed.challenge),
        copyValue: parsed.challenge,
      },
      {
        label: t("result.technical.issuerRsaModulus"),
        testid: "result-issuer-modulus",
        value: formatModulus(parsed.issuerRsaModulus),
        copyValue: parsed.issuerRsaModulus?.join(" "),
      },
    );
  }
  return items;
}
