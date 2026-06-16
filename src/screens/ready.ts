// Ready screen: user-gated checkpoint between setup and proving.
//
// Pre-fetches the challenge on mount so the Start-proving click reaches
// window.open with the user-activation window still live. Fetching inside
// the click handler would await a network response first and get the HiPKI
// popup blocked by every modern browser.

import { $challenge, type ChallengeState } from "../challenge-state";
import { friendlyErrorCopy } from "../error-copy";
import { $locale, t } from "../i18n/store";
import { $hipki, $pin, $setupReady, $warmup } from "../setup-state";
import { dispatch } from "../store";
import { createChallenge } from "../verifier-client";

export function startButtonStateFor(
  c: ChallengeState,
): { disabled: boolean; label: string } {
  switch (c.status) {
    case "pending":
    case "fetching":
      return { disabled: true, label: t("ready.startProvingFetching") };
    case "ready":
      return { disabled: false, label: t("ready.startProving") };
    case "error":
      return { disabled: false, label: t("ready.startProvingRetry") };
  }
}

export function mountReady(root: HTMLElement): () => void {
  root.innerHTML = `
    <section class="screen screen-ready">
      <h1 data-testid="ready-title"></h1>
      <p class="intro" data-testid="ready-intro"></p>
      <div class="ready-summary" data-testid="ready-summary">
        <section class="ready-group" data-testid="ready-group-claim">
          <h2 class="ready-group-title" data-testid="ready-group-title-claim"></h2>
          <div class="ready-list">
            <div class="ready-row">
              <span class="ready-label" data-testid="ready-label-cert-chain"></span>
              <span class="ready-value" data-testid="ready-cert-chain">—</span>
              <span class="ready-helper" data-testid="ready-helper-cert-chain"></span>
            </div>
            <div class="ready-row">
              <span class="ready-label" data-testid="ready-label-challenge"></span>
              <span class="ready-value" data-testid="ready-challenge">—</span>
              <span class="ready-helper" data-testid="ready-helper-challenge"></span>
            </div>
          </div>
        </section>
        <section class="ready-group" data-testid="ready-group-inputs">
          <h2 class="ready-group-title" data-testid="ready-group-title-inputs"></h2>
          <div class="ready-list">
            <div class="ready-row">
              <span class="ready-label" data-testid="ready-label-card"></span>
              <span class="ready-value" data-testid="ready-card">—</span>
              <span class="ready-helper" data-testid="ready-helper-card"></span>
            </div>
            <div class="ready-row">
              <span class="ready-label" data-testid="ready-label-runtime"></span>
              <span class="ready-value" data-testid="ready-runtime">—</span>
              <span class="ready-helper" data-testid="ready-helper-runtime"></span>
            </div>
            <div class="ready-row">
              <span class="ready-label" data-testid="ready-label-pin"></span>
              <span class="ready-value" data-testid="ready-pin">—</span>
              <span class="ready-helper" data-testid="ready-helper-pin"></span>
            </div>
          </div>
        </section>
      </div>
      <div class="button-row">
        <button class="secondary-button" data-testid="ready-back" type="button"></button>
        <button class="primary-button" data-testid="start-proving" type="button" disabled></button>
      </div>
    </section>
  `;

  const titleEl = root.querySelector<HTMLElement>('[data-testid="ready-title"]')!;
  const introEl = root.querySelector<HTMLElement>('[data-testid="ready-intro"]')!;
  const groupTitleClaimEl = root.querySelector<HTMLElement>('[data-testid="ready-group-title-claim"]')!;
  const groupTitleInputsEl = root.querySelector<HTMLElement>('[data-testid="ready-group-title-inputs"]')!;
  const labelCardEl = root.querySelector<HTMLElement>('[data-testid="ready-label-card"]')!;
  const labelChainEl = root.querySelector<HTMLElement>('[data-testid="ready-label-cert-chain"]')!;
  const labelRuntimeEl = root.querySelector<HTMLElement>('[data-testid="ready-label-runtime"]')!;
  const labelPinEl = root.querySelector<HTMLElement>('[data-testid="ready-label-pin"]')!;
  const labelChallengeEl = root.querySelector<HTMLElement>('[data-testid="ready-label-challenge"]')!;
  const cardEl = root.querySelector<HTMLElement>('[data-testid="ready-card"]')!;
  const chainEl = root.querySelector<HTMLElement>('[data-testid="ready-cert-chain"]')!;
  const runtimeEl = root.querySelector<HTMLElement>('[data-testid="ready-runtime"]')!;
  const pinEl = root.querySelector<HTMLElement>('[data-testid="ready-pin"]')!;
  const challengeEl = root.querySelector<HTMLElement>('[data-testid="ready-challenge"]')!;
  const helperCardEl = root.querySelector<HTMLElement>('[data-testid="ready-helper-card"]')!;
  const helperChainEl = root.querySelector<HTMLElement>('[data-testid="ready-helper-cert-chain"]')!;
  const helperRuntimeEl = root.querySelector<HTMLElement>('[data-testid="ready-helper-runtime"]')!;
  const helperPinEl = root.querySelector<HTMLElement>('[data-testid="ready-helper-pin"]')!;
  const helperChallengeEl = root.querySelector<HTMLElement>('[data-testid="ready-helper-challenge"]')!;
  const backBtn = root.querySelector<HTMLButtonElement>('[data-testid="ready-back"]')!;
  const startBtn = root.querySelector<HTMLButtonElement>('[data-testid="start-proving"]')!;

  let fetchController: AbortController | null = null;

  function paint(): void {
    titleEl.textContent = t("ready.title");
    introEl.textContent = t("ready.intro");
    groupTitleClaimEl.textContent = t("ready.groups.claim");
    groupTitleInputsEl.textContent = t("ready.groups.inputs");
    labelCardEl.textContent = t("ready.rows.card");
    labelChainEl.textContent = t("ready.rows.certChain");
    labelRuntimeEl.textContent = t("ready.rows.runtime");
    labelPinEl.textContent = t("ready.rows.pin");
    labelChallengeEl.textContent = t("ready.rows.challenge");
    helperCardEl.textContent = t("ready.helpers.card");
    helperChainEl.textContent = t("ready.helpers.certChain");
    helperRuntimeEl.textContent = t("ready.helpers.runtime");
    helperPinEl.textContent = t("ready.helpers.pin");
    helperChallengeEl.textContent = t("ready.helpers.challenge");
    backBtn.textContent = t("ready.backToSetup");

    const hipki = $hipki.get();
    const pinState = $pin.get();
    const warmup = $warmup.get();
    const challenge = $challenge.get();

    if (hipki.status === "card_ready") {
      const dn = hipki.subjectDN ? ` — ${hipki.subjectDN}` : "";
      cardEl.textContent = `${hipki.cardSN}${dn}`;
      chainEl.textContent =
        hipki.card.certKind === "certChainRS4096"
          ? t("ready.chainRsa4096")
          : t("ready.chainRsa2048");
    } else {
      cardEl.textContent = t("ready.cardNotReady");
      chainEl.textContent = t("ready.cardEmpty");
    }
    pinEl.textContent =
      pinState.status === "locked"
        ? t("ready.pinLocked")
        : t("ready.pinStatus", { status: pinState.status });

    runtimeEl.textContent =
      warmup.status === "ready"
        ? t("ready.runtimeReady")
        : t("ready.runtimeStatus", { status: warmup.status });

    if (challenge.status === "ready") {
      const { challenge: decimal } = challenge.challenge;
      challengeEl.textContent = t("ready.challengeShort", { short: decimal.slice(0, 12) });
    } else if (challenge.status === "error") {
      challengeEl.textContent = friendlyErrorCopy("challenge", challenge.message).body;
    } else {
      challengeEl.textContent = t("ready.challengeFetching");
    }
    const btn = startButtonStateFor(challenge);
    startBtn.disabled = btn.disabled;
    startBtn.textContent = btn.label;
  }

  async function fetchChallenge(): Promise<void> {
    fetchController?.abort();
    fetchController = new AbortController();
    const mine = fetchController;
    $challenge.set({ status: "fetching" });
    try {
      const challenge = await createChallenge({ signal: mine.signal });
      if (fetchController !== mine) return;
      $challenge.set({ status: "ready", challenge });
    } catch (err) {
      if (fetchController !== mine) return;
      if (err instanceof DOMException && err.name === "AbortError") return;
      const message = err instanceof Error ? err.message : String(err);
      $challenge.set({ status: "error", message });
    }
  }

  function onStart(): void {
    if (startBtn.disabled) return;
    const current = $challenge.get();
    if (current.status === "error") {
      void fetchChallenge();
      return;
    }
    // A pre-fetched challenge can expire while the user idles on this screen.
    // Consuming a stale challenge would burn the single-use PIN only to hit a
    // server-side rejection minutes into proving; re-fetch first.
    if (
      current.status === "ready" &&
      isChallengeExpired(current.challenge.expires_at)
    ) {
      void fetchChallenge();
      return;
    }
    dispatch({ type: "start_proving" });
  }
  function onBack(): void {
    fetchController?.abort();
    dispatch({ type: "reset_to_setup" });
  }

  startBtn.addEventListener("click", onStart);
  backBtn.addEventListener("click", onBack);

  const unsubHipki = $hipki.listen(paint);
  const unsubPin = $pin.listen(paint);
  const unsubWarmup = $warmup.listen(paint);
  const unsubChallenge = $challenge.listen(paint);
  const unsubLocale = $locale.listen(paint);

  paint();

  // Bounce to setup if any precondition regressed (PIN cleared, card removed).
  if (!$setupReady.get()) {
    dispatch({ type: "reset_to_setup" });
  }

  // Pre-fetch only if no ready challenge is already cached from a prior visit.
  const nowChallenge = $challenge.get();
  if (nowChallenge.status === "pending" || nowChallenge.status === "error") {
    void fetchChallenge();
  }

  return () => {
    fetchController?.abort();
    startBtn.removeEventListener("click", onStart);
    backBtn.removeEventListener("click", onBack);
    unsubHipki();
    unsubPin();
    unsubWarmup();
    unsubChallenge();
    unsubLocale();
  };
}

/** Treat unparseable timestamps as expired so we re-fetch rather than trust
 *  a malformed response. 5-second skew buffer to cover clock drift between
 *  the browser and the Go verifier. */
function isChallengeExpired(expiresAt: string): boolean {
  const expiry = Date.parse(expiresAt);
  if (Number.isNaN(expiry)) return true;
  return expiry - Date.now() <= 5_000;
}
