export const LOCALES = ["en", "zh-TW"] as const;
export type Locale = (typeof LOCALES)[number];

export const HTML_LANG_TAG: Record<Locale, string> = {
  en: "en",
  "zh-TW": "zh-Hant-TW",
};

export type MessageParams = Record<string, string | number>;

export interface Messages {
  landing: {
    title: string;
    intro: string;
    start: string;
    /** Trigger label for the inline privacy expandable, e.g. "how this works". */
    privacyTrigger: string;
    /** Always-visible note explaining one-time network cost on first use. */
    networkUsage: string;
    /** One-shot banner shown when the prior /prove session was cut off. */
    interruptedNotice: string;
    privacy: {
      result: { title: string; body: string };
      card: { title: string; body: string };
      zk: { title: string; body: string; learnMore: string };
    };
  };
  setup: {
    title: string;
    introIcCard: string;
    runtime: {
      title: string;
      preparing: string;
      ready: string;
      components: {
        certChainRS2048: string;
        certChainRS4096: string;
        userSigRS2048: string;
      };
      retry: string;
      reset: string;
      slowHint: string;
    };
    reader: {
      title: string;
      bodyClickToDetect: string;
      detect: string;
      reDetect: string;
      tryAgain: string;
      readCard: string;
      detecting: string;
      popupBriefly: string;
      installPlugin: string;
      noReadersHint: string;
      insertCard: string;
      readersWithCards: string;
      reading: string;
      cardReady: string;
      cardReadyWithDn: string;
      readerUnnamed: string;
      readerCardLabel: string;
      readerNoCard: string;
      steps: {
        server: string;
        serverReadyWithVersion: string;
        reader: string;
        readerReady: string;
        card: string;
        cardReady: string;
      };
    };
    smt: {
      title: string;
      bodyReadCardFirst: string;
      bodyLoading: string;
      retry: string;
      reset: string;
      ready: string;
      phases: {
        wasm: string;
        snapshot: string;
        ingest: string;
      };
      progressBytes: string;
      progressNodes: string;
      progressBytesOnly: string;
    };
    pin: {
      title: string;
      warning: string;
      warningLinkLabel: string;
      bodyDetectFirst: string;
      bodyEnter: string;
      verifying: string;
      verifyButton: string;
      lockedSession: string;
      lockedBadge: string;
      cardLockedHardware: string;
      attemptsLeftOne: string;
      attemptsLeftMany: string;
      placeholder: string;
    };
    technical: {
      runtimeKind: string;
      crlNumber: string;
      issuer: string;
      serverVersion: string;
      subjectDn: string;
    };
    back: string;
    continue: string;
  };
  ready: {
    title: string;
    intro: string;
    groups: {
      claim: string;
      inputs: string;
    };
    rows: {
      card: string;
      certChain: string;
      runtime: string;
      pin: string;
      challenge: string;
    };
    helpers: {
      card: string;
      certChain: string;
      runtime: string;
      pin: string;
      challenge: string;
    };
    cardNotReady: string;
    cardEmpty: string;
    chainRsa4096: string;
    chainRsa2048: string;
    runtimeReady: string;
    runtimeStatus: string;
    pinLocked: string;
    pinStatus: string;
    challengeShort: string;
    challengeFetching: string;
    backToSetup: string;
    startProving: string;
    startProvingFetching: string;
    startProvingRetry: string;
  };
  proving: {
    title: string;
    intro: string;
    cancel: string;
    runningLabel: string;
    errorLabel: string;
    steps: {
      challenge: string;
      sign: string;
      smt: string;
      build: string;
      prove_cert: string;
      prove_user_sig: string;
    };
    sublabels: {
      witness: string;
      prep: string;
      proving: string;
    };
    progress: {
      /** Template "{current} of {total}" — current step counter beside the spinner. */
      summary: string;
      /** Disclosure label when the full step list is collapsed. */
      showSteps: string;
      /** Disclosure label when the full step list is expanded. */
      hideSteps: string;
      /** sr-only aria-label for the segment bar; uses {current}/{total}. */
      segmentsLabel: string;
      /** Fallback summary label shown before any step has started. */
      statusIdle: string;
      /** Summary label once every step is done (just before the screen transitions). */
      statusDone: string;
    };
  };
  review: {
    title: string;
    intro: string;
    technical: {
      challenge: string;
      certChainType: string;
      certProofBytes: string;
      userSigProofBytes: string;
      provingMs: string;
    };
    privacy: {
      willSendLabel: string;
      willSendValue: string;
      willSendHelper: string;
      willNotSendLabel: string;
      willNotSendValue: string;
    };
    guardrail: string;
    retry: string;
    send: string;
  };
  submitting: {
    title: string;
    intro: string;
    submitStep: string;
  };
  result: {
    headlines: {
      verified: string;
      rejected: string;
      error: string;
    };
    detailVerified: string;
    detailRejected: string;
    /** Keyed by `linkverify.Reason*` from go-zkid-verifier. */
    reasons: {
      proof_invalid: string;
      smt_root_mismatch: string;
      issuer_modulus_mismatch: string;
      app_id_mismatch: string;
      challenge_mismatch: string;
    };
    clearing: string;
    backToForum: string;
    proveAgain: string;
    /** Primary button on `smt_root_mismatch` rejection: clears caches and
     *  reloads with the `forceFreshAssets` flag set, so the next session
     *  bypasses the browser HTTP cache. */
    refreshRetry: string;
    /** Checkbox label that toggles cache wipe before navigating away. `{size}` is filled with humanBytes(). */
    clearCheckbox: string;
    /** Same checkbox label rendered before the size resolves. */
    clearCheckboxNoSize: string;
    clearWhyTitle: string;
    clearWhyBody: string;
    technical: {
      nullifier: string;
      pkCommit: string;
      smtRoot: string;
      challenge: string;
      issuerRsaModulus: string;
    };
  };
  technical: {
    sectionTitle: string;
    explanation: string;
    copyAll: string;
    copied: string;
  };
  errors: {
    technicalLabel: string;
    technicalExplanation: string;
    network_offline: { headline: string; body: string };
    network_http: { headline: string; body: string };
    verifier_unavailable: { headline: string; body: string };
    verifier_provider_unavailable: { headline: string; body: string };
    challenge_expired: { headline: string; body: string };
    challenge_consumed: { headline: string; body: string };
    nullifier_duplicate: { headline: string; body: string };
    popup_blocked: { headline: string; body: string };
    popup_timeout: { headline: string; body: string };
    hipki_not_installed: { headline: string; body: string };
    card_reader_unreachable: { headline: string; body: string };
    card_sign_failed: { headline: string; body: string };
    asset_corrupt: { headline: string; body: string };
    asset_unreachable: { headline: string; body: string };
    storage_full: { headline: string; body: string };
    rate_limited: { headline: string; body: string };
    wasm_init: { headline: string; body: string };
    unknown: { headline: string; body: string };
  };
  carousel: {
    ariaLabel: string;
    pause: string;
    resume: string;
    prev: string;
    next: string;
    proving: {
      card1: { headline: string; body: string };
      card2: { headline: string; body: string };
      card3: { headline: string; body: string };
      card4: { headline: string; body: string };
    };
    submitting: {
      card1: { headline: string; body: string };
      card2: { headline: string; body: string };
      card3: { headline: string; body: string };
      card4: { headline: string; body: string; link: string };
    };
  };
  switcher: {
    en: string;
    zhTw: string;
    ariaLabel: string;
  };
}
