import { atom } from "nanostores";

import { en } from "./en";
import { zhTW } from "./zh-TW";
import { HTML_LANG_TAG, LOCALES, type Locale, type MessageParams, type Messages } from "./types";

const STORAGE_KEY = "zkid:locale";

const DICTIONARIES: Record<Locale, Messages> = {
  en,
  "zh-TW": zhTW,
};

export const AVAILABLE_LOCALES: ReadonlyArray<Locale> = LOCALES;

function readStoredLocale(): Locale | null {
  try {
    const raw = globalThis.localStorage?.getItem(STORAGE_KEY);
    return raw && (LOCALES as ReadonlyArray<string>).includes(raw)
      ? (raw as Locale)
      : null;
  } catch {
    return null;
  }
}

export function getInitialLocale(): Locale {
  return readStoredLocale() ?? "zh-TW";
}

export const $locale = atom<Locale>(getInitialLocale());

if (typeof document !== "undefined") {
  document.documentElement.lang = HTML_LANG_TAG[$locale.get()];
}

export function setLocale(loc: Locale): void {
  if ($locale.get() === loc) return;
  $locale.set(loc);
  try {
    globalThis.localStorage?.setItem(STORAGE_KEY, loc);
  } catch {
    // localStorage unavailable (private mode, file://): in-memory only.
  }
  if (typeof document !== "undefined") {
    document.documentElement.lang = HTML_LANG_TAG[loc];
  }
}

export function getMessages(): Messages {
  return DICTIONARIES[$locale.get()];
}

function lookup(messages: Messages, key: string): unknown {
  let cur: unknown = messages;
  for (const part of key.split(".")) {
    if (cur && typeof cur === "object" && part in (cur as Record<string, unknown>)) {
      cur = (cur as Record<string, unknown>)[part];
    } else {
      return undefined;
    }
  }
  return cur;
}

const PLACEHOLDER_RE = /\{(\w+)\}/g;

function interpolate(template: string, params: MessageParams | undefined): string {
  if (!params) return template;
  return template.replace(PLACEHOLDER_RE, (_, name) => {
    const v = params[name];
    return v === undefined ? `{${name}}` : String(v);
  });
}

export function t(key: string, params?: MessageParams): string {
  const value = lookup(getMessages(), key);
  if (typeof value !== "string") {
    if (import.meta.env?.DEV) {
      console.warn(`[i18n] missing key: ${key}`);
    }
    return key;
  }
  return interpolate(value, params);
}
