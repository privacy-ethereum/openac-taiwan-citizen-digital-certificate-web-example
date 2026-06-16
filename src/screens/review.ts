// Review screen: user-gated checkpoint between `proving` and `submitting`.
// Proofs live only in memory until the user clicks Send.

import {
  renderTechnicalDetails,
  type TechnicalItem,
} from "../components/technical-details";
import { formatDuration, humanBytes, truncateMiddle } from "../format";
import { $locale, t } from "../i18n/store";
import { $state, dispatch, type ProvingRun } from "../store";

const MAX_TOTAL_BYTES = 2 * 1024 * 1024;
const SAFE_THRESHOLD = Math.round(MAX_TOTAL_BYTES * 0.8);

function shortId(id: string): string {
  return truncateMiddle(id, 8, 4);
}

export function mountReview(root: HTMLElement): () => void {
  const state = $state.get();
  if (state.phase !== "review") {
    // Edge case (e.g., manual URL navigation) — router gates on phase.
    dispatch({ type: "retry_proving" });
    return () => {};
  }
  const run: ProvingRun = state.run;

  const certBytes = run.certProofBytes.byteLength;
  const userSigBytes = run.userSigProofBytes.byteLength;
  const totalBytes = certBytes + userSigBytes;
  const overBudget = totalBytes > SAFE_THRESHOLD;

  root.innerHTML = `
    <section class="screen screen-review">
      <h1 data-testid="review-title"></h1>
      <p class="intro" data-testid="review-intro"></p>
      <div class="review-privacy" data-testid="review-privacy">
        <div class="review-privacy-row review-privacy-row-send">
          <span class="review-privacy-label" data-testid="review-will-send-label"></span>
          <span class="review-privacy-value" data-testid="review-will-send-value"></span>
        </div>
        <p class="review-privacy-helper" data-testid="review-will-send-helper"></p>
        <div class="review-privacy-row review-privacy-row-not-send">
          <span class="review-privacy-label" data-testid="review-will-not-send-label"></span>
          <span class="review-privacy-value" data-testid="review-will-not-send-value"></span>
        </div>
      </div>
      <div data-testid="review-technical"></div>
      <div class="review-guardrail" data-testid="review-guardrail" hidden></div>
      <div class="button-row">
        <button class="secondary-button" data-testid="review-retry" type="button"></button>
        <button class="primary-button" data-testid="review-send" type="button"></button>
      </div>
    </section>
  `;

  const titleEl = root.querySelector<HTMLElement>('[data-testid="review-title"]')!;
  const introEl = root.querySelector<HTMLElement>('[data-testid="review-intro"]')!;
  const willSendLabelEl = root.querySelector<HTMLElement>('[data-testid="review-will-send-label"]')!;
  const willSendValueEl = root.querySelector<HTMLElement>('[data-testid="review-will-send-value"]')!;
  const willSendHelperEl = root.querySelector<HTMLElement>('[data-testid="review-will-send-helper"]')!;
  const willNotSendLabelEl = root.querySelector<HTMLElement>('[data-testid="review-will-not-send-label"]')!;
  const willNotSendValueEl = root.querySelector<HTMLElement>('[data-testid="review-will-not-send-value"]')!;
  const technicalSlot = root.querySelector<HTMLElement>('[data-testid="review-technical"]')!;
  const guardrailEl = root.querySelector<HTMLElement>('[data-testid="review-guardrail"]')!;
  const retryBtn = root.querySelector<HTMLButtonElement>('[data-testid="review-retry"]')!;
  const sendBtn = root.querySelector<HTMLButtonElement>('[data-testid="review-send"]')!;

  guardrailEl.hidden = !overBudget;

  function buildItems(): TechnicalItem[] {
    return [
      {
        label: t("review.technical.challenge"),
        testid: "review-challenge",
        value: shortId(run.challenge),
        copyValue: run.challenge,
      },
      {
        label: t("review.technical.certChainType"),
        testid: "review-chain",
        value: run.certChainType.toUpperCase(),
      },
      {
        label: t("review.technical.certProofBytes"),
        testid: "review-cert-size",
        value: humanBytes(certBytes, "0 B"),
        copyValue: String(certBytes),
      },
      {
        label: t("review.technical.userSigProofBytes"),
        testid: "review-user-sig-size",
        value: humanBytes(userSigBytes, "0 B"),
        copyValue: String(userSigBytes),
      },
      {
        label: t("review.technical.provingMs"),
        testid: "review-proving-ms",
        value: formatDuration(run.provingMs),
        copyValue: String(Math.round(run.provingMs)),
      },
    ];
  }

  const technical = renderTechnicalDetails(technicalSlot, buildItems());

  function paintLabels(): void {
    titleEl.textContent = t("review.title");
    introEl.textContent = t("review.intro");
    willSendLabelEl.textContent = t("review.privacy.willSendLabel");
    willSendValueEl.textContent = t("review.privacy.willSendValue");
    willSendHelperEl.textContent = t("review.privacy.willSendHelper");
    willNotSendLabelEl.textContent = t("review.privacy.willNotSendLabel");
    willNotSendValueEl.textContent = t("review.privacy.willNotSendValue");
    guardrailEl.textContent = t("review.guardrail");
    retryBtn.textContent = t("review.retry");
    sendBtn.textContent = t("review.send");
    technical.update(buildItems());
  }
  paintLabels();
  const unsubLocale = $locale.listen(paintLabels);

  const onSend = () => dispatch({ type: "send_proof" });
  const onRetry = () => dispatch({ type: "retry_proving" });

  sendBtn.addEventListener("click", onSend);
  retryBtn.addEventListener("click", onRetry);

  return () => {
    sendBtn.removeEventListener("click", onSend);
    retryBtn.removeEventListener("click", onRetry);
    unsubLocale();
    technical.dispose();
  };
}
