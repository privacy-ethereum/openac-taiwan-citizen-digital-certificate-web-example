import { afterEach, beforeEach, describe, expect, it } from "vitest";

import {
  _resetForceFreshFlagForTest,
  consumeForceFreshAssetsFlag,
  markForceFreshAssets,
} from "./force-fresh-flag";

// JSDOM provides sessionStorage; the helper guards against environments where
// it throws (private mode, Worker scope) but the happy path is exercised here.

describe("force-fresh-flag", () => {
  beforeEach(() => {
    _resetForceFreshFlagForTest();
  });

  afterEach(() => {
    _resetForceFreshFlagForTest();
  });

  it("returns false when sessionStorage has no flag", () => {
    expect(consumeForceFreshAssetsFlag()).toBe(false);
    expect(sessionStorage.getItem("forceFreshAssets")).toBeNull();
  });

  it("returns true when markForceFreshAssets was called and clears storage", () => {
    markForceFreshAssets();
    expect(sessionStorage.getItem("forceFreshAssets")).toBe("1");
    expect(consumeForceFreshAssetsFlag()).toBe(true);
    expect(sessionStorage.getItem("forceFreshAssets")).toBeNull();
  });

  it("caches the value across calls so both warmup + load_smt see it", () => {
    markForceFreshAssets();
    expect(consumeForceFreshAssetsFlag()).toBe(true);
    // sessionStorage was cleared on the first read; second caller still sees true.
    expect(consumeForceFreshAssetsFlag()).toBe(true);
  });

  it("a subsequent mark+consume cycle requires _resetForceFreshFlagForTest", () => {
    markForceFreshAssets();
    expect(consumeForceFreshAssetsFlag()).toBe(true);
    markForceFreshAssets();
    // Cached `true` persists; in real life this happens across a page reload
    // where the module is re-initialized. The reset hook simulates that.
    expect(consumeForceFreshAssetsFlag()).toBe(true);
    _resetForceFreshFlagForTest();
    markForceFreshAssets();
    expect(consumeForceFreshAssetsFlag()).toBe(true);
  });
});
