// Builds the proving + submitting card sets from the i18n dictionary.

import { t } from "../i18n/store";
import type { CarouselDeck } from "./zk-education-carousel";

export function provingCards(): CarouselDeck {
  return [
    {
      id: "p-card-stays",
      glyph: "▢",
      headline: t("carousel.proving.card1.headline"),
      body: t("carousel.proving.card1.body"),
    },
    {
      id: "p-math-not-data",
      glyph: "Σ",
      headline: t("carousel.proving.card2.headline"),
      body: t("carousel.proving.card2.body"),
    },
    {
      id: "p-local",
      glyph: "⌂",
      headline: t("carousel.proving.card3.headline"),
      body: t("carousel.proving.card3.body"),
    },
    {
      id: "p-nearly-done",
      glyph: "→",
      headline: t("carousel.proving.card4.headline"),
      body: t("carousel.proving.card4.body"),
    },
  ];
}

export function submittingCards(): CarouselDeck {
  return [
    {
      id: "s-only-answer",
      glyph: "?",
      headline: t("carousel.submitting.card1.headline"),
      body: t("carousel.submitting.card1.body"),
    },
    {
      id: "s-math-checked",
      glyph: "✓",
      headline: t("carousel.submitting.card2.headline"),
      body: t("carousel.submitting.card2.body"),
    },
    {
      id: "s-no-trace",
      glyph: "∅",
      headline: t("carousel.submitting.card3.headline"),
      body: t("carousel.submitting.card3.body"),
    },
    {
      id: "s-open-source",
      glyph: "⌥",
      headline: t("carousel.submitting.card4.headline"),
      body: t("carousel.submitting.card4.body"),
      link: {
        href: "https://github.com/privacy-ethereum/zkID/tree/RSA-X.509-Cert",
        label: t("carousel.submitting.card4.link"),
      },
    },
  ];
}

export function carouselLabels(): {
  pause: string;
  resume: string;
  prev: string;
  next: string;
} {
  return {
    pause: t("carousel.pause"),
    resume: t("carousel.resume"),
    prev: t("carousel.prev"),
    next: t("carousel.next"),
  };
}
