import type { Messages } from "./types";

export const en: Messages = {
  landing: {
    title: "Verified Taiwanese Badge",
    intro:
      "Prove you're Taiwanese & over 18 with Taiwanese Citizen Digital Certificate without sharing your full credential.",
    start: "Start",
    privacyTrigger: "how this works",
    networkUsage:
      "First-time use downloads about 100 MB of public verification components. Later verifications reuse the cache, so the on-device size is larger than what was downloaded.",
    interruptedNotice:
      "Last verification was interrupted. Please keep this tab open when continuing.",
    privacy: {
      result: {
        title: "ONLY THE NECESSARY RESULT",
        body: 'Test Verifier learns "verified Taiwanese ≥18" and nothing else.',
      },
      card: {
        title: "NO FULL CREDENTIAL SHARED",
        body: "Your card stays in your hands. The proof is generated on this device.",
      },
      zk: {
        title: "ZERO-KNOWLEDGE PROOF",
        body: "Math proves the claim without revealing the data behind it.",
        learnMore: "learn more →",
      },
    },
  },
  setup: {
    title: "Setup check",
    introIcCard: "Preparing 4 things on your device. This takes a moment.",
    runtime: {
      title: "Verification component",
      preparing: "Preparing the verification component…",
      ready: "Verification component ready.",
      components: {
        certChainRS2048: "Cert chain (RSA-2048)",
        certChainRS4096: "Cert chain (RSA-4096)",
        userSigRS2048: "User signature",
      },
      retry: "Retry",
      reset: "Reset cached files",
      slowHint:
        "First-time loading takes a bit longer. Keep this tab open and do not refresh.",
    },
    reader: {
      title: "Certificate components",
      bodyClickToDetect:
        "Click Detect to check HiPKI LocalSignServer, your card reader, and your Citizen Digital Certificate.",
      detect: "Detect",
      reDetect: "Detect again",
      tryAgain: "Try again",
      readCard: "Read card",
      detecting:
        "Checking HiPKI LocalSignServer, card reader, and inserted card…",
      popupBriefly: "A small popup will open. Don't close this tab.",
      installPlugin: "Install MOICA plug-in",
      noReadersHint: "Plug in a USB card reader, then click Detect again.",
      insertCard:
        "Insert your Citizen Digital Certificate into the reader, then click Detect again.",
      readersWithCards: "Pick a reader below, then click Read card.",
      reading: "Reading your Citizen Digital Certificate from {slot}…",
      cardReady: "Card {sn}",
      cardReadyWithDn: "Card {sn} ({dn})",
      readerUnnamed: "(unnamed reader)",
      readerCardLabel: "card {sn}",
      readerNoCard: "no card inserted",
      steps: {
        server: "HiPKI LocalSignServer",
        serverReadyWithVersion: "HiPKI LocalSignServer (v{version})",
        reader: "Card reader",
        readerReady: "Card reader ({count} detected)",
        card: "Citizen Digital Certificate",
        cardReady: "Citizen Digital Certificate ({count} inserted)",
      },
    },
    smt: {
      title: "Credential status",
      bodyReadCardFirst: "Please read your Citizen Digital Certificate first.",
      bodyLoading: "Checking your credential's status on this device…",
      retry: "Retry",
      reset: "Reset cached files",
      ready: "Credential status confirmed (CRL #{crlNumber}, issuer {issuer}).",
      phases: {
        wasm: "loading credential status engine",
        snapshot: "downloading credential status snapshot",
        ingest: "preparing credential status check",
      },
      progressBytes: " ({done} / {total})",
      progressNodes: " ({done} / {total} entries)",
      progressBytesOnly: " ({done})",
    },
    pin: {
      title: "PIN verification",
      warning:
        "3 tries total. After 3 wrong attempts the card locks and a service-center visit is required.",
      warningLinkLabel: "unlock instructions →",
      bodyDetectFirst: "Read your Citizen Digital Certificate first.",
      bodyEnter: "Enter your PIN, then click Verify PIN.",
      verifying: "Verifying via the local card reader popup…",
      verifyButton: "Verify PIN",
      lockedSession: "PIN verified. You can continue without re-entering for this session.",
      lockedBadge: "Verified for this session",
      cardLockedHardware:
        "Card locked. Visit a Ministry of the Interior service center to unlock.",
      attemptsLeftOne:
        "Wrong PIN. Last try. A 4th wrong attempt locks the card.",
      attemptsLeftMany: "Wrong PIN. {remaining} tries left.",
      placeholder: "PIN",
    },
    technical: {
      runtimeKind: "Proving component",
      crlNumber: "Credential status (CRL number)",
      issuer: "Issuer",
      serverVersion: "Card reader software version",
      subjectDn: "Card subject",
    },
    back: "Back",
    continue: "Continue",
  },
  ready: {
    title: "Review what you'll prove",
    intro:
      "Ready to prove your eligibility for the Verified Taiwanese Badge. Test Verifier only receives what's needed, not your full Citizen Digital Certificate.",
    groups: {
      claim: "What Test Verifier will learn",
      inputs: "Inputs from your card (not shared)",
    },
    rows: {
      card: "Citizen Digital Certificate",
      certChain: "Eligibility condition",
      runtime: "Credential status",
      pin: "PIN",
      challenge: "Verification request",
    },
    helpers: {
      card: "Used to sign the proof. Stays on this device.",
      certChain: "This proof will only tell Test Verifier this fact.",
      runtime: "Check the latest snapshot locally.",
      pin: "Unlock your card locally. Never sent.",
      challenge: "One-time request from Test Verifier. Prevents replay.",
    },
    cardNotReady: "Not ready",
    cardEmpty: "–",
    chainRsa4096: "Taiwanese person over 18",
    chainRsa2048: "Taiwanese person over 18",
    runtimeReady: "Confirmed on this device",
    runtimeStatus: "Status: {status}",
    pinLocked: "Verified",
    pinStatus: "Status: {status}",
    challengeShort: "{short}…",
    challengeFetching: "Getting a verification request…",
    backToSetup: "Back",
    startProving: "Start proving",
    startProvingFetching: "Getting verification request…",
    startProvingRetry: "Retry",
  },
  proving: {
    title: "Proving your eligibility",
    intro:
      "Proving in your browser. This may take a few seconds, so please keep this tab open.",
    cancel: "Cancel",
    runningLabel: "Proving…",
    errorLabel: "Error",
    steps: {
      challenge: "Get verification request",
      sign: "Confirm your Citizen Digital Certificate",
      smt: "Check that your credential is valid (revoked status)",
      build: "Prepare proof data",
      prove_cert: "Confirm badge eligibility",
      prove_user_sig: "Finalize proof",
    },
    sublabels: {
      witness: "preparing",
      prep: "preparing",
      proving: "proving",
    },
    progress: {
      summary: "{current} of {total}",
      showSteps: "Show steps",
      hideSteps: "Hide steps",
      segmentsLabel: "Proving progress, step {current} of {total}",
      statusIdle: "Starting",
      statusDone: "Wrapping up",
    },
  },
  review: {
    title: "Review before sending",
    intro:
      "Your proof is ready. Nothing has been sent yet. Click Send and Test Verifier will receive what's needed to confirm your eligibility and update your badge.",
    technical: {
      challenge: "verification request id",
      certChainType: "cert chain type",
      certProofBytes: "cert-chain proof size",
      userSigProofBytes: "user-sig proof size",
      provingMs: "proving time",
    },
    privacy: {
      willSendLabel: "Test Verifier will receive",
      willSendValue: "Required proof info",
      willSendHelper:
        "Includes this request, data to prevent duplicate verifications, and data confirming your credential is valid.",
      willNotSendLabel: "Test Verifier will not receive",
      willNotSendValue: "Your full Citizen Digital Certificate, your PIN.",
    },
    guardrail:
      "Your proof is approaching the 2 MB submission limit. Sending may fail; if it does, please retry.",
    retry: "Prove again",
    send: "Send proof",
  },
  submitting: {
    title: "Sending proof",
    intro:
      "Please keep this tab open. Test Verifier is verifying your proof.",
    submitStep: "Send to Test Verifier",
  },
  result: {
    headlines: {
      verified: "Verified",
      rejected: "Not verified",
      error: "Couldn't verify",
    },
    detailVerified:
      "Verified in {total}. Return to Test Verifier, and your profile will show the Verified Taiwanese Badge.",
    detailRejected:
      "Test Verifier did not accept your proof (responded in {submitMs}). Please retry.",
    reasons: {
      proof_invalid:
        "Your proof did not verify. Please prove again.",
      smt_root_mismatch:
        "The credential status snapshot was updated. Tap Refresh and retry to use the latest.",
      issuer_modulus_mismatch:
        "The issuer of your card did not match what Test Verifier trusts. Make sure you used your Citizen Digital Certificate.",
      app_id_mismatch:
        "App identifier mismatch. Please return to Test Verifier and start the flow again.",
      challenge_mismatch:
        "Verification request mismatch. Please return to Test Verifier and start the flow again.",
    },
    clearing: "Clearing…",
    backToForum: "Back to Test Verifier",
    proveAgain: "Prove again",
    refreshRetry: "Refresh and retry",
    clearCheckbox: "Also clear cached files ({size}) before leaving",
    clearCheckboxNoSize: "Also clear cached files before leaving",
    clearWhyTitle: "Why and when?",
    clearWhyBody:
      "These are public verification files (proving keys, credential status snapshot) cached on your device to speed up future proofs. They contain no personal data. Re-downloading later uses much less network than the cache size suggests. Clear them to free up space if you don't plan to prove again.",
    technical: {
      nullifier: "nullifier",
      pkCommit: "pkCommit",
      smtRoot: "smt_root",
      challenge: "challenge",
      issuerRsaModulus: "issuerRsaModulus",
    },
  },
  technical: {
    sectionTitle: "Technical details",
    explanation:
      "These technical values are part of the proof package and help with support. Test Verifier does not receive your full Citizen Digital Certificate or your PIN.",
    copyAll: "Copy all",
    copied: "Copied!",
  },
  errors: {
    technicalLabel: "Technical details",
    technicalExplanation:
      "Diagnostic context for support. No personal data is included.",
    network_offline: {
      headline: "Couldn't reach the network",
      body: "You appear to be offline. Check your connection and retry.",
    },
    network_http: {
      headline: "Service is unavailable",
      body: "The verifier is temporarily unavailable. Please try again in a moment.",
    },
    verifier_unavailable: {
      headline: "Couldn't reach the verifier",
      body: "We could not get a response from Test Verifier's verifier. Please retry, or come back in a few minutes.",
    },
    verifier_provider_unavailable: {
      headline: "Verifier dependencies are unavailable",
      body: "Test Verifier's verifier could not reach one of its data sources. Please wait a moment and retry.",
    },
    challenge_expired: {
      headline: "Verification request expired",
      body: "The verification request from Test Verifier timed out. Click Prove again to get a fresh request.",
    },
    challenge_consumed: {
      headline: "Verification request already used",
      body: "This verification request has already been used. Click Prove again to get a fresh one.",
    },
    nullifier_duplicate: {
      headline: "Already verified with this card",
      body: "This Citizen Digital Certificate has already verified for Test Verifier. You can only verify once per card.",
    },
    popup_blocked: {
      headline: "Card reader popup was blocked",
      body: "Your browser blocked the card reader popup. Allow popups for this site, then click Detect again.",
    },
    popup_timeout: {
      headline: "Card reader didn't respond",
      body: "The card reader software did not respond in time. Make sure it is running, then click Detect again.",
    },
    hipki_not_installed: {
      headline: "HiPKI LocalSignServer not running",
      body: "Start the HiPKI LocalSignServer on this computer, then click Try again. If you haven't installed it, install the MOICA plug-in.",
    },
    card_reader_unreachable: {
      headline: "Card reader software not detected",
      body: "We could not reach the local card reader software. Install it on this machine and keep it running, then click Detect.",
    },
    card_sign_failed: {
      headline: "Could not sign with your card",
      body: "The card reader reported a problem. Re-insert your Citizen Digital Certificate, then try again.",
    },
    asset_corrupt: {
      headline: "A cached file looks damaged or out of date",
      body: "A verification file on this device failed its integrity check. Tap Reset cached files to clear the cache and reload.",
    },
    asset_unreachable: {
      headline: "Couldn't download a verification file",
      body: "We could not download a verification file. Check your connection and retry.",
    },
    storage_full: {
      headline: "Not enough space on this device",
      body: "We could not finish saving the verification files. Free up space and retry, or use a desktop browser for the first proof.",
    },
    rate_limited: {
      headline: "Too many download attempts",
      body: "The download server has rate-limited us. Please wait a few minutes, then retry.",
    },
    wasm_init: {
      headline: "Couldn't start the prover",
      body: "Your browser could not start the local prover. Reload this tab, or try a different browser.",
    },
    unknown: {
      headline: "Something went wrong",
      body: "We hit an unexpected problem. Please retry. If it keeps happening, expand Technical details and share them with support.",
    },
  },
  carousel: {
    ariaLabel: "zero-knowledge privacy education",
    pause: "Pause",
    resume: "Resume",
    prev: "Previous card",
    next: "Next card",
    proving: {
      card1: {
        headline: "YOUR CARD STAYS WITH YOU",
        body: "The card never leaves your hands. Right now, only a mathematical statement is being computed.",
      },
      card2: {
        headline: "MATH, NOT DATA",
        body: "Your browser is building a zero-knowledge proof: math that confirms a fact without revealing the data behind it.",
      },
      card3: {
        headline: "EVERYTHING IS ON YOUR DEVICE",
        body: "This computation runs only on your device. Nothing has been sent to any server yet.",
      },
      card4: {
        headline: "NEARLY DONE",
        body: "When the proof is ready, only the proof will be sent to Test Verifier. Your data stays here.",
      },
    },
    submitting: {
      card1: {
        headline: "ONLY THE ANSWER",
        body: 'Test Verifier learns "verified Taiwanese ≥18" and nothing else. Not your name, ID, or PIN.',
      },
      card2: {
        headline: "THE PROOF IS BEING CHECKED",
        body: "A short check at Test Verifier confirms the math is valid. No personal data is involved in this verification.",
      },
      card3: {
        headline: "NO TRACE LEFT BEHIND",
        body: "The proof can verify only this one session. It can't be re-used to identify you later.",
      },
      card4: {
        headline: "OPEN SOURCE & AUDITABLE",
        body: "The protocol is public on GitHub. Anyone, including you, can verify how privacy is preserved.",
        link: "View on GitHub",
      },
    },
  },
  switcher: {
    en: "EN",
    zhTw: "中文",
    ariaLabel: "Language",
  },
};
