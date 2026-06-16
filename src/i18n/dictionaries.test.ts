import { describe, expect, it } from "vitest";

import { en } from "./en";
import { zhTW } from "./zh-TW";

function flatten(obj: unknown, prefix = ""): string[] {
  if (obj == null || typeof obj !== "object") return [];
  const out: string[] = [];
  for (const [key, value] of Object.entries(obj as Record<string, unknown>)) {
    const path = prefix ? `${prefix}.${key}` : key;
    if (value && typeof value === "object" && !Array.isArray(value)) {
      out.push(...flatten(value, path));
    } else {
      out.push(path);
    }
  }
  return out.sort();
}

describe("i18n / dictionary parity", () => {
  it("en and zh-TW have identical key trees", () => {
    expect(flatten(zhTW)).toEqual(flatten(en));
  });

  it("every leaf is a non-empty string in both locales", () => {
    for (const dict of [en, zhTW]) {
      for (const key of flatten(dict)) {
        const value = key
          .split(".")
          .reduce<unknown>(
            (acc, part) =>
              acc && typeof acc === "object" ? (acc as Record<string, unknown>)[part] : undefined,
            dict,
          );
        expect(typeof value, `${key} should be a string`).toBe("string");
        expect((value as string).length, `${key} should be non-empty`).toBeGreaterThan(0);
      }
    }
  });
});
