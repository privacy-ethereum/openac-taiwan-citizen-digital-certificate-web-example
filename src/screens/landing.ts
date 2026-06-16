import { createPrimaryButton, type PrimaryButtonHandle } from "../components/primary-button";
import {
  createPrivacySheet,
  type PrivacyPillar,
  type PrivacySheetHandle,
} from "../components/privacy-sheet";
import { $locale, t } from "../i18n/store";
import { takeProvingInterrupted } from "../storage-handoff";
import { dispatch } from "../store";

const PSE_PRIVACY_URL = "https://pse.dev/projects/zk-id";

function landingPillars(): PrivacyPillar[] {
  return [
    {
      id: "result",
      title: t("landing.privacy.result.title"),
      body: t("landing.privacy.result.body"),
    },
    {
      id: "card",
      title: t("landing.privacy.card.title"),
      body: t("landing.privacy.card.body"),
    },
    {
      id: "zk",
      title: t("landing.privacy.zk.title"),
      body: t("landing.privacy.zk.body"),
      learnMoreText: t("landing.privacy.zk.learnMore"),
      learnMoreHref: PSE_PRIVACY_URL,
    },
  ];
}

export function mountLanding(root: HTMLElement): () => void {
  const showInterruptedNotice = takeProvingInterrupted();
  root.innerHTML = `
    <section class="screen screen-landing">
      <div
        class="landing-interrupted-notice"
        data-testid="landing-interrupted-notice"
        role="status"
        hidden
      ></div>
      <h1 data-testid="landing-title"></h1>
      <p class="intro" data-testid="landing-intro"></p>
      <p
        class="landing-network-usage"
        data-testid="landing-network-usage"
      ></p>
      <div class="landing-privacy" data-testid="landing-privacy"></div>
      <div class="landing-cta" data-testid="landing-cta"></div>
    </section>
  `;
  const titleEl = root.querySelector<HTMLElement>('[data-testid="landing-title"]')!;
  const introEl = root.querySelector<HTMLElement>('[data-testid="landing-intro"]')!;
  const networkUsageEl = root.querySelector<HTMLElement>(
    '[data-testid="landing-network-usage"]',
  )!;
  const noticeEl = root.querySelector<HTMLElement>(
    '[data-testid="landing-interrupted-notice"]',
  )!;
  const privacyHost = root.querySelector<HTMLElement>('[data-testid="landing-privacy"]')!;
  const ctaHost = root.querySelector<HTMLElement>('[data-testid="landing-cta"]')!;

  const button: PrimaryButtonHandle = createPrimaryButton({
    label: t("landing.start"),
    onClick: () => dispatch({ type: "start" }),
    testId: "start-button",
  });
  ctaHost.appendChild(button.el);

  const privacy: PrivacySheetHandle = createPrivacySheet({
    summary: t("landing.privacyTrigger"),
    pillars: landingPillars(),
  });
  privacyHost.appendChild(privacy.el);

  function paint(): void {
    titleEl.textContent = t("landing.title");
    introEl.textContent = t("landing.intro");
    networkUsageEl.textContent = t("landing.networkUsage");
    button.setLabel(t("landing.start"));
    privacy.setSummary(t("landing.privacyTrigger"));
    privacy.setPillars(landingPillars());
    if (showInterruptedNotice) {
      noticeEl.textContent = t("landing.interruptedNotice");
      noticeEl.hidden = false;
    }
  }

  paint();
  const unsubLocale = $locale.listen(paint);

  return () => {
    unsubLocale();
  };
}
