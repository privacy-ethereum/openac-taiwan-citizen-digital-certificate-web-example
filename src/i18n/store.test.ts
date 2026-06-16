import { afterEach, describe, expect, it, vi } from "vitest";

import { $locale, getInitialLocale, setLocale, t } from "./store";

describe("i18n / store", () => {
  afterEach(() => {
    setLocale("zh-TW");
  });

  it("returns the literal string when there are no params", () => {
    setLocale("en");
    expect(t("setup.runtime.retry")).toBe("Retry");
  });

  it("interpolates {name} placeholders from params", () => {
    setLocale("en");
    expect(t("setup.pin.attemptsLeftMany", { remaining: 2 })).toBe(
      "Wrong PIN. 2 tries left.",
    );
  });

  it("preserves the placeholder when a param is missing", () => {
    setLocale("en");
    expect(t("setup.pin.attemptsLeftMany")).toContain("{remaining}");
  });

  it("returns the key and warns when the key is unknown", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    expect(t("does.not.exist")).toBe("does.not.exist");
    warn.mockRestore();
  });

  it("setLocale updates the $locale atom", () => {
    setLocale("zh-TW");
    expect($locale.get()).toBe("zh-TW");
    setLocale("en");
    expect($locale.get()).toBe("en");
  });

  it("setLocale is a no-op when the locale matches", () => {
    setLocale("en");
    let called = 0;
    const unsub = $locale.listen(() => {
      called += 1;
    });
    setLocale("en");
    unsub();
    expect(called).toBe(0);
  });

  it("getInitialLocale returns zh-TW when storage is unavailable", () => {
    expect(getInitialLocale()).toBe("zh-TW");
  });
});
