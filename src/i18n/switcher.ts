import { $locale, AVAILABLE_LOCALES, setLocale, t } from "./store";
import type { Locale } from "./types";

const MOUNTED_FLAG = "data-locale-switcher-mounted";

export function mountLocaleSwitcher(target: HTMLElement | null): () => void {
  if (!target) return () => {};
  if (AVAILABLE_LOCALES.length < 2) return () => {};
  if (target.getAttribute(MOUNTED_FLAG) === "true") return () => {};
  target.setAttribute(MOUNTED_FLAG, "true");

  const group = document.createElement("div");
  group.className = "locale-switcher";
  group.setAttribute("role", "group");

  const buttons: Array<{ loc: Locale; el: HTMLButtonElement }> = AVAILABLE_LOCALES.map(
    (loc) => {
      const el = document.createElement("button");
      el.type = "button";
      el.className = "locale-switcher-btn";
      el.dataset.locale = loc;
      el.dataset.testid = `locale-${loc}`;
      el.addEventListener("click", () => setLocale(loc));
      group.appendChild(el);
      return { loc, el };
    },
  );

  function paint(): void {
    const current = $locale.get();
    group.setAttribute("aria-label", t("switcher.ariaLabel"));
    for (const { loc, el } of buttons) {
      el.textContent = loc === "en" ? t("switcher.en") : t("switcher.zhTw");
      el.setAttribute("aria-pressed", loc === current ? "true" : "false");
      if (loc === current) el.setAttribute("data-active", "true");
      else el.removeAttribute("data-active");
    }
  }

  paint();
  target.replaceChildren(group);
  const unsub = $locale.listen(paint);

  return () => {
    unsub();
    target.removeAttribute(MOUNTED_FLAG);
    target.replaceChildren();
  };
}
