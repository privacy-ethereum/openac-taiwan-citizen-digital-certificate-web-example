// Setup screen: three click-driven panels (Assets warmup, HiPKI card,
// PIN verify) gate Continue via `$setupReady`. PIN is single-use and
// locks after 3 wrong attempts (the card itself locks in hardware).

import { bytesToHex } from "../bytes";
import { mountHipkiOverlay } from "../components/hipki-overlay";
import {
  renderTechnicalDetails,
  type TechnicalItem,
} from "../components/technical-details";
import { escapeAttr, escapeText } from "../dom-utils";
import { friendlyErrorCopy } from "../error-copy";
import {
  probePkcs11Info,
  signTbs,
  type Pkcs11InfoResponse,
} from "../hipki-client";
import { $locale, t } from "../i18n/store";
import { Pin } from "../pin";
import { buildCardContext } from "../pipeline";
import { recoverFromSmtError, recoverFromWarmupError } from "../recover-assets";
import {
  $hipki,
  $pin,
  $setupReady,
  $smt,
  $warmup,
  dropStalePin,
  isCardReady,
  type HipkiState,
  type PinState,
  type ReaderSlot,
} from "../setup-state";
import { dispatch } from "../store";
import { paintSmt, paintWarmup } from "./setup-panels";

const MAX_PIN_ATTEMPTS = 3;

const MOICA_PLUGIN_INSTALL_URL = "https://moica.nat.gov.tw/rac_plugin.html";

/** HiPKI `/sign` rejects empty input, so we sign a stable non-empty string
 *  to validate the PIN without consuming a card challenge. */
const PIN_TEST_TBS_HEX = bytesToHex(
  new TextEncoder().encode("zkID-pin-test"),
);

/** Attempts remaining for the next verify call. Only `error` carries a
 *  residual count; every other status resets to `MAX_PIN_ATTEMPTS`. */
function attemptsRemainingFrom(state: PinState): number {
  return state.status === "error" ? state.attemptsRemaining : MAX_PIN_ATTEMPTS;
}

function summariseSlots(resp: Pkcs11InfoResponse): ReaderSlot[] {
  return (resp.slots ?? []).map((s) => ({
    slotDescription: s.slotDescription ?? "(unnamed reader)",
    cardSN: s.token?.serialNumber,
  }));
}

export function mountSetup(root: HTMLElement): () => void {
  root.innerHTML = `
    <section class="screen screen-setup">
      <h1 data-testid="setup-title"></h1>
      <p class="intro" data-testid="setup-intro"></p>
      <div class="setup-panels">
        <div class="setup-panel" data-testid="setup-assets">
          <div class="panel-title" data-testid="assets-title"></div>
          <div class="panel-body" data-testid="assets-body"></div>
          <div class="panel-actions">
            <button class="secondary-button" data-testid="assets-retry" type="button" hidden></button>
          </div>
        </div>
        <div class="setup-panel" data-testid="setup-hipki">
          <div class="panel-title" data-testid="hipki-title"></div>
          <div class="reader-checklist" data-testid="hipki-checklist">
            <div class="reader-step" data-step="server" data-status="pending" data-testid="hipki-step-server"></div>
            <div class="reader-step" data-step="reader" data-status="pending" data-testid="hipki-step-reader"></div>
            <div class="reader-step" data-step="card" data-status="pending" data-testid="hipki-step-card"></div>
          </div>
          <div class="panel-body" data-testid="hipki-body"></div>
          <div class="panel-detail" data-testid="hipki-detail"></div>
          <div class="panel-readers" data-testid="hipki-readers" hidden></div>
          <div class="panel-actions">
            <button class="secondary-button" data-testid="hipki-detect" type="button"></button>
            <a
              class="secondary-button"
              data-testid="hipki-install-plugin"
              href="${MOICA_PLUGIN_INSTALL_URL}"
              target="_blank"
              rel="noopener noreferrer"
              hidden
            ></a>
            <button class="primary-button" data-testid="hipki-read" type="button" hidden></button>
          </div>
        </div>
        <div class="setup-panel" data-testid="setup-smt">
          <div class="panel-title" data-testid="smt-title"></div>
          <div class="panel-body" data-testid="smt-body"></div>
          <div class="panel-actions">
            <button class="secondary-button" data-testid="smt-retry" type="button" hidden></button>
          </div>
        </div>
        <div class="setup-panel" data-testid="setup-pin">
          <div class="panel-title" data-testid="pin-title"></div>
          <div class="panel-warning" data-testid="pin-warning"></div>
          <div class="panel-body" data-testid="pin-body" data-state="pending"></div>
          <div class="panel-actions">
            <input
              class="pin-input"
              data-testid="pin-input"
              type="password"
              inputmode="numeric"
              pattern="[0-9]{6,8}"
              autocomplete="off"
              minlength="6"
              maxlength="8"
              disabled
            />
            <button class="secondary-button" data-testid="pin-verify" type="button" disabled></button>
            <span class="pin-lock-badge" data-testid="pin-lock-badge" hidden></span>
          </div>
        </div>
      </div>
      <div data-testid="setup-technical"></div>
      <div class="button-row">
        <button class="secondary-button" data-testid="back-button" type="button"></button>
        <button class="primary-button" data-testid="continue-button" type="button" disabled></button>
      </div>
      <div data-testid="setup-hipki-overlay-slot"></div>
    </section>
  `;

  const titleEl = root.querySelector<HTMLElement>('[data-testid="setup-title"]')!;
  const introEl = root.querySelector<HTMLElement>('[data-testid="setup-intro"]')!;

  const assetsTitle = root.querySelector<HTMLElement>('[data-testid="assets-title"]')!;
  const assetsBody = root.querySelector<HTMLElement>('[data-testid="assets-body"]')!;
  const assetsRetry = root.querySelector<HTMLButtonElement>('[data-testid="assets-retry"]')!;
  const assetsPanel = root.querySelector<HTMLElement>('[data-testid="setup-assets"]')!;

  const hipkiPanel = root.querySelector<HTMLElement>('[data-testid="setup-hipki"]')!;
  const hipkiTitle = root.querySelector<HTMLElement>('[data-testid="hipki-title"]')!;
  const hipkiStepServer = root.querySelector<HTMLElement>(
    '[data-testid="hipki-step-server"]',
  )!;
  const hipkiStepReader = root.querySelector<HTMLElement>(
    '[data-testid="hipki-step-reader"]',
  )!;
  const hipkiStepCard = root.querySelector<HTMLElement>(
    '[data-testid="hipki-step-card"]',
  )!;
  const hipkiBody = root.querySelector<HTMLElement>('[data-testid="hipki-body"]')!;
  const hipkiDetail = root.querySelector<HTMLElement>('[data-testid="hipki-detail"]')!;
  const readersEl = root.querySelector<HTMLElement>('[data-testid="hipki-readers"]')!;
  const detectBtn = root.querySelector<HTMLButtonElement>('[data-testid="hipki-detect"]')!;
  const installPluginLink = root.querySelector<HTMLAnchorElement>(
    '[data-testid="hipki-install-plugin"]',
  )!;
  const readBtn = root.querySelector<HTMLButtonElement>('[data-testid="hipki-read"]')!;

  const smtTitle = root.querySelector<HTMLElement>('[data-testid="smt-title"]')!;
  const smtPanel = root.querySelector<HTMLElement>('[data-testid="setup-smt"]')!;
  const smtBody = root.querySelector<HTMLElement>('[data-testid="smt-body"]')!;
  const smtRetry = root.querySelector<HTMLButtonElement>('[data-testid="smt-retry"]')!;

  const pinTitle = root.querySelector<HTMLElement>('[data-testid="pin-title"]')!;
  const pinWarning = root.querySelector<HTMLElement>('[data-testid="pin-warning"]')!;
  const pinBody = root.querySelector<HTMLElement>('[data-testid="pin-body"]')!;
  const pinInput = root.querySelector<HTMLInputElement>('[data-testid="pin-input"]')!;
  const pinVerify = root.querySelector<HTMLButtonElement>('[data-testid="pin-verify"]')!;
  const pinLockBadge = root.querySelector<HTMLElement>('[data-testid="pin-lock-badge"]')!;
  const pinPanel = root.querySelector<HTMLElement>('[data-testid="setup-pin"]')!;

  const backBtn = root.querySelector<HTMLButtonElement>('[data-testid="back-button"]')!;
  const continueBtn = root.querySelector<HTMLButtonElement>('[data-testid="continue-button"]')!;

  function paintStatic(): void {
    titleEl.textContent = t("setup.title");
    introEl.textContent = t("setup.introIcCard");
    assetsTitle.textContent = t("setup.runtime.title");
    hipkiTitle.textContent = t("setup.reader.title");
    smtTitle.textContent = t("setup.smt.title");
    pinTitle.textContent = t("setup.pin.title");
    pinWarning.replaceChildren(
      document.createTextNode(`${t("setup.pin.warning")} `),
      Object.assign(document.createElement("a"), {
        href: "https://moica.nat.gov.tw/unblockcard.html",
        target: "_blank",
        rel: "noopener noreferrer",
        textContent: t("setup.pin.warningLinkLabel"),
      }),
    );
    pinLockBadge.textContent = t("setup.pin.lockedBadge");
    pinInput.placeholder = t("setup.pin.placeholder");
    installPluginLink.textContent = t("setup.reader.installPlugin");
    backBtn.textContent = t("setup.back");
    continueBtn.textContent = t("setup.continue");
  }

  const warmupEls = {
    panel: assetsPanel,
    body: assetsBody,
    retry: assetsRetry,
  };
  const smtEls = { panel: smtPanel, body: smtBody, retry: smtRetry };
  const smtIdleBody = (): string =>
    isCardReady()
      ? t("setup.smt.bodyLoading")
      : t("setup.smt.bodyReadCardFirst");

  // Rebuild reader rows only when the slot *set* changes, not on selection
  // changes — a full rebuild would destroy focus and drop in-flight clicks
  // on adjacent rows.
  let renderedSlotsKey: string | null = null;

  function slotsKey(slots: ReaderSlot[]): string {
    return slots.map((s) => `${s.slotDescription}|${s.cardSN ?? ""}`).join("\n");
  }

  function paintReaders(slots: ReaderSlot[], selected: string | undefined): void {
    if (slots.length === 0) {
      renderedSlotsKey = null;
      readersEl.hidden = true;
      readersEl.textContent = "";
      return;
    }
    readersEl.hidden = false;
    const key = slotsKey(slots);
    if (key !== renderedSlotsKey) {
      renderedSlotsKey = key;
      readersEl.innerHTML = slots
        .map((s, i) => {
          const id = `hipki-slot-${i}`;
          const disabled = s.cardSN ? "" : "disabled";
          const cardLabel = s.cardSN
            ? t("setup.reader.readerCardLabel", { sn: s.cardSN })
            : t("setup.reader.readerNoCard");
          const slotName = s.slotDescription || t("setup.reader.readerUnnamed");
          return `
            <label class="reader-row${disabled ? " reader-row-disabled" : ""}">
              <input type="radio" name="hipki-slot" id="${id}"
                data-testid="${id}" value="${escapeAttr(s.slotDescription)}"
                ${disabled} />
              <span class="reader-name">${escapeText(slotName)}</span>
              <span class="reader-card">${escapeText(cardLabel)}</span>
            </label>
          `;
        })
        .join("");
      readersEl.querySelectorAll<HTMLInputElement>('input[type="radio"]').forEach((el) => {
        el.addEventListener("change", () => {
          const state = $hipki.get();
          if (state.status !== "readers_listed") return;
          $hipki.set({ ...state, selectedSlot: el.value });
        });
      });
    }
    // Sync `checked` only — preserves focus and any mid-flight click.
    readersEl.querySelectorAll<HTMLInputElement>('input[type="radio"]').forEach((el) => {
      el.checked = el.value === selected;
    });
  }

  type StepStatus = "pending" | "running" | "ready" | "fail";

  function paintStep(
    el: HTMLElement,
    status: StepStatus,
    label: string,
  ): void {
    el.dataset.status = status;
    el.textContent = label;
  }

  function paintChecklist(state: HipkiState): void {
    const tStep = (key: string, params?: Record<string, string | number>) =>
      t(`setup.reader.steps.${key}`, params);

    let server: StepStatus = "pending";
    let reader: StepStatus = "pending";
    let card: StepStatus = "pending";
    let serverLabel = tStep("server");
    let readerLabel = tStep("reader");
    let cardLabel = tStep("card");

    switch (state.status) {
      case "probing":
        break;
      case "detecting":
        server = "running";
        break;
      case "not_installed":
        server = "fail";
        break;
      case "readers_listed": {
        const readerCount = state.slots.length;
        const cardCount = state.slots.filter((s) => s.cardSN).length;
        server = "ready";
        if (state.serverVersion) {
          serverLabel = tStep("serverReadyWithVersion", { version: state.serverVersion });
        }
        if (readerCount === 0) {
          reader = "fail";
        } else {
          reader = "ready";
          readerLabel = tStep("readerReady", { count: readerCount });
        }
        if (readerCount === 0) {
          card = "pending";
        } else if (cardCount === 0) {
          card = "fail";
        } else {
          card = "ready";
          cardLabel = tStep("cardReady", { count: cardCount });
        }
        break;
      }
      case "reading":
        server = "ready";
        reader = "ready";
        card = "ready";
        break;
      case "card_ready":
        server = "ready";
        reader = "ready";
        card = "ready";
        if (state.serverVersion) {
          serverLabel = tStep("serverReadyWithVersion", { version: state.serverVersion });
        }
        cardLabel = tStep("cardReady", { count: 1 });
        break;
    }

    paintStep(hipkiStepServer, server, serverLabel);
    paintStep(hipkiStepReader, reader, readerLabel);
    paintStep(hipkiStepCard, card, cardLabel);
  }

  function paintHipki(state: HipkiState): void {
    hipkiPanel.classList.remove("setup-panel-ok");
    installPluginLink.hidden = true;
    paintChecklist(state);
    switch (state.status) {
      case "probing":
        hipkiBody.textContent = t("setup.reader.bodyClickToDetect");
        hipkiDetail.textContent = "";
        readersEl.hidden = true;
        readersEl.innerHTML = "";
        detectBtn.textContent = t("setup.reader.detect");
        detectBtn.disabled = false;
        readBtn.hidden = true;
        readBtn.disabled = true;
        break;
      case "detecting":
        hipkiBody.textContent = t("setup.reader.detecting");
        hipkiDetail.textContent = t("setup.reader.popupBriefly");
        detectBtn.disabled = true;
        readBtn.hidden = true;
        break;
      case "not_installed": {
        const copy = friendlyErrorCopy("hipki", state.message ?? "");
        hipkiBody.textContent = copy.headline;
        hipkiDetail.textContent = copy.body;
        readersEl.hidden = true;
        readersEl.innerHTML = "";
        detectBtn.textContent = t("setup.reader.tryAgain");
        detectBtn.disabled = false;
        installPluginLink.hidden = copy.kind !== "hipki_not_installed";
        readBtn.hidden = true;
        readBtn.disabled = true;
        break;
      }
      case "readers_listed": {
        const insertedCount = state.slots.filter((s) => s.cardSN).length;
        hipkiDetail.textContent = "";
        if (state.slots.length === 0) {
          hipkiBody.textContent = t("setup.reader.noReadersHint");
        } else if (insertedCount === 0) {
          hipkiBody.textContent = t("setup.reader.insertCard");
        } else {
          hipkiBody.textContent = t("setup.reader.readersWithCards");
        }
        paintReaders(state.slots, state.selectedSlot);
        detectBtn.textContent = t("setup.reader.reDetect");
        detectBtn.disabled = false;
        readBtn.hidden = state.slots.length === 0 || insertedCount === 0;
        readBtn.disabled = !state.selectedSlot || insertedCount === 0;
        break;
      }
      case "reading":
        hipkiBody.textContent = t("setup.reader.reading", { slot: state.slotDescription });
        hipkiDetail.textContent = t("setup.reader.popupBriefly");
        detectBtn.disabled = true;
        readBtn.hidden = false;
        readBtn.disabled = true;
        break;
      case "card_ready":
        hipkiBody.textContent = state.subjectDN
          ? t("setup.reader.cardReadyWithDn", { sn: state.cardSN, dn: state.subjectDN })
          : t("setup.reader.cardReady", { sn: state.cardSN });
        hipkiDetail.textContent = "";
        readersEl.hidden = true;
        readersEl.innerHTML = "";
        detectBtn.textContent = t("setup.reader.reDetect");
        detectBtn.disabled = false;
        readBtn.hidden = true;
        hipkiPanel.classList.add("setup-panel-ok");
        break;
    }
    readBtn.textContent = t("setup.reader.readCard");
    if (state.status === "detecting" || state.status === "reading") {
      hipkiOverlay.show();
    } else {
      hipkiOverlay.hide();
    }
    refreshPinControls();
  }

  function paintPin(state: PinState): void {
    pinPanel.classList.remove("setup-panel-ok");
    pinBody.classList.remove("pin-body-ok", "pin-body-error");
    // Hide the 3-attempt lock-warning once verified so the ready surface
    // doesn't suggest the correct PIN was risky.
    pinWarning.hidden = state.status === "locked";
    pinLockBadge.hidden = state.status !== "locked";
    delete pinBody.dataset.attemptsRemaining;

    let dataState: string = state.status;
    switch (state.status) {
      case "pending":
        pinBody.textContent = isCardReady()
          ? t("setup.pin.bodyEnter")
          : t("setup.pin.bodyDetectFirst");
        break;
      case "verifying":
        pinBody.textContent = t("setup.pin.verifying");
        break;
      case "locked":
        pinBody.textContent = t("setup.pin.lockedSession");
        pinBody.classList.add("pin-body-ok");
        pinPanel.classList.add("setup-panel-ok");
        pinInput.value = "";
        break;
      case "error":
        if (state.attemptsRemaining <= 0) {
          dataState = "hardware-locked";
          pinBody.textContent = t("setup.pin.cardLockedHardware");
        } else if (state.attemptsRemaining === 1) {
          pinBody.textContent = t("setup.pin.attemptsLeftOne");
          pinBody.dataset.attemptsRemaining = "1";
        } else {
          pinBody.textContent = t("setup.pin.attemptsLeftMany", {
            remaining: state.attemptsRemaining,
          });
          pinBody.dataset.attemptsRemaining = String(state.attemptsRemaining);
        }
        pinBody.classList.add("pin-body-error");
        break;
    }
    pinBody.dataset.state = dataState;
    pinVerify.textContent = t("setup.pin.verifyButton");
    refreshPinControls();
  }

  function refreshPinControls(): void {
    const ready = isCardReady();
    const pinNow = $pin.get();
    const locked = pinNow.status === "locked";
    const verifying = pinNow.status === "verifying";
    const remaining = attemptsRemainingFrom(pinNow);
    const lockedOut = remaining <= 0 && !locked;
    pinInput.disabled = !ready || locked || verifying || lockedOut;
    pinInput.readOnly = locked;
    const shortPin = pinInput.value.length < 6;
    pinVerify.disabled = !ready || locked || verifying || lockedOut || shortPin;
    pinVerify.hidden = locked;
  }

  function refreshContinue(ready: boolean): void {
    continueBtn.disabled = !ready;
  }

  // sign-main.ts listens for idle warmup during the setup phase and re-kicks.
  function retryWarmup(): void {
    assetsRetry.disabled = true;
    void recoverFromWarmupError();
  }

  // sign-main.ts listens for idle SMT during the setup phase (with a ready
  // card) and re-kicks `load_smt` on the Worker.
  function retrySmt(): void {
    smtRetry.disabled = true;
    void recoverFromSmtError();
  }

  async function detectReaders(): Promise<void> {
    dropStalePin();
    $hipki.set({ status: "detecting" });
    try {
      const resp = await probePkcs11Info();
      const slots = summariseSlots(resp);
      const defaultSelect =
        slots.find((s) => s.cardSN)?.slotDescription ?? slots[0]?.slotDescription;
      $hipki.set({
        status: "readers_listed",
        slots,
        serverVersion: resp.serverVersion,
        selectedSlot: defaultSelect,
      });
    } catch (err) {
      $hipki.set({
        status: "not_installed",
        message: err instanceof Error ? err.message : String(err),
      });
    }
  }

  async function readSelectedCard(): Promise<void> {
    const state = $hipki.get();
    if (state.status !== "readers_listed" || !state.selectedSlot) return;
    const slotDescription = state.selectedSlot;
    dropStalePin();
    $hipki.set({ status: "reading", slotDescription });
    try {
      const detected = await buildCardContext(slotDescription);
      $hipki.set({
        status: "card_ready",
        card: detected.card,
        cardSN: detected.cardSN ?? "(no serial)",
        subjectDN: detected.subjectDN,
        serverVersion: state.serverVersion,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      $hipki.set({ status: "not_installed", message });
    }
  }

  async function verifyPin(): Promise<void> {
    const hipkiState = $hipki.get();
    if (hipkiState.status !== "card_ready") return;
    const raw = pinInput.value;
    if (raw.length < 6 || raw.length > 8) return;

    const prior = $pin.get();
    const attemptsRemaining = attemptsRemainingFrom(prior);
    if (attemptsRemaining <= 0) return;

    const cardSN = hipkiState.cardSN;
    $pin.set({ status: "verifying", cardSN });
    const candidatePin = new Pin(raw);
    pinInput.value = "";

    try {
      const resp = await signTbs({
        tbs: PIN_TEST_TBS_HEX,
        pin: candidatePin.consume(),
        slotDescription: hipkiState.card.slotDescription,
      });
      if (resp.ret_code !== 0 || resp.last_error !== 0) {
        $pin.set({
          status: "error",
          message: `HiPKI rejected PIN (ret_code=${resp.ret_code})`,
          attemptsRemaining: attemptsRemaining - 1,
        });
        return;
      }
      $pin.set({
        status: "locked",
        pin: new Pin(raw),
        cardSN,
        attemptsRemaining,
      });
    } catch (err) {
      $pin.set({
        status: "error",
        message: err instanceof Error ? err.message : String(err),
        attemptsRemaining: attemptsRemaining - 1,
      });
    }
  }

  const onAssetsRetry = () => retryWarmup();
  const onSmtRetry = () => retrySmt();
  const onDetect = () => void detectReaders();
  const onRead = () => void readSelectedCard();
  const onPinVerify = () => void verifyPin();
  const onPinInput = () => refreshPinControls();
  const onContinue = () => {
    if (continueBtn.disabled) return;
    dispatch({ type: "setup_complete" });
  };
  const onBack = () => dispatch({ type: "reset" });

  assetsRetry.addEventListener("click", onAssetsRetry);
  smtRetry.addEventListener("click", onSmtRetry);
  detectBtn.addEventListener("click", onDetect);
  readBtn.addEventListener("click", onRead);
  pinVerify.addEventListener("click", onPinVerify);
  pinInput.addEventListener("input", onPinInput);
  continueBtn.addEventListener("click", onContinue);
  backBtn.addEventListener("click", onBack);

  const technicalSlot = root.querySelector<HTMLElement>(
    '[data-testid="setup-technical"]',
  )!;
  const hipkiOverlaySlot = root.querySelector<HTMLElement>(
    '[data-testid="setup-hipki-overlay-slot"]',
  )!;
  const hipkiOverlay = mountHipkiOverlay(hipkiOverlaySlot);

  function buildTechnicalItems(): TechnicalItem[] {
    const items: TechnicalItem[] = [];
    const hipki = $hipki.get();
    const smt = $smt.get();
    if (hipki.status === "card_ready") {
      items.push({
        label: t("setup.technical.runtimeKind"),
        testid: "setup-tech-runtime-kind",
        value: hipki.card.certKind,
      });
      if (hipki.subjectDN) {
        items.push({
          label: t("setup.technical.subjectDn"),
          testid: "setup-tech-subject-dn",
          value: hipki.subjectDN,
        });
      }
    }
    const serverVersion =
      hipki.status === "card_ready" || hipki.status === "readers_listed"
        ? hipki.serverVersion
        : undefined;
    if (serverVersion) {
      items.push({
        label: t("setup.technical.serverVersion"),
        testid: "setup-tech-server-version",
        value: serverVersion,
      });
    }
    if (smt.status === "ready") {
      items.push(
        {
          label: t("setup.technical.crlNumber"),
          testid: "setup-tech-crl",
          value: smt.crlNumber,
        },
        {
          label: t("setup.technical.issuer"),
          testid: "setup-tech-issuer",
          value: smt.issuer.toUpperCase(),
        },
      );
    }
    return items;
  }

  function refreshTechnical(): void {
    const items = buildTechnicalItems();
    technicalSlot.hidden = items.length === 0;
    technical.update(items);
  }

  const initialItems = buildTechnicalItems();
  const technical = renderTechnicalDetails(technicalSlot, initialItems);
  technicalSlot.hidden = initialItems.length === 0;

  const unsubWarmup = $warmup.listen((state) => paintWarmup(warmupEls, state));
  const unsubSmt = $smt.listen((state) => {
    paintSmt(smtEls, state, { idleBody: smtIdleBody });
    refreshTechnical();
  });
  const unsubHipki = $hipki.listen((state) => {
    paintHipki(state);
    // Refresh the SMT panel so its body text reflects the new card-ready
    // state (idle message flips from "Read your card" to "Loading…").
    paintSmt(smtEls, $smt.get(), { idleBody: smtIdleBody });
    refreshTechnical();
  });
  const unsubPin = $pin.listen((state) => paintPin(state));
  const unsubReady = $setupReady.listen((ready) => refreshContinue(ready));
  const unsubLocale = $locale.listen(() => {
    paintStatic();
    paintWarmup(warmupEls, $warmup.get());
    paintSmt(smtEls, $smt.get(), { idleBody: smtIdleBody });
    paintHipki($hipki.get());
    paintPin($pin.get());
    refreshTechnical();
  });

  paintStatic();
  paintWarmup(warmupEls, $warmup.get());
  paintSmt(smtEls, $smt.get(), { idleBody: smtIdleBody });
  paintHipki($hipki.get());
  paintPin($pin.get());
  refreshContinue($setupReady.get());

  return () => {
    assetsRetry.removeEventListener("click", onAssetsRetry);
    smtRetry.removeEventListener("click", onSmtRetry);
    detectBtn.removeEventListener("click", onDetect);
    readBtn.removeEventListener("click", onRead);
    pinVerify.removeEventListener("click", onPinVerify);
    pinInput.removeEventListener("input", onPinInput);
    continueBtn.removeEventListener("click", onContinue);
    backBtn.removeEventListener("click", onBack);
    unsubWarmup();
    unsubSmt();
    unsubHipki();
    unsubPin();
    unsubReady();
    unsubLocale();
    technical.dispose();
    hipkiOverlay.dispose();
  };
}
