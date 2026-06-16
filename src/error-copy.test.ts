import { afterEach, describe, expect, it, vi } from "vitest";

import { classifyError, friendlyErrorCopy } from "./error-copy";

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("classifyError", () => {
  describe("manifest fast path", () => {
    it("rate_limited", () => {
      expect(classifyError("warmup", "anything", { manifestCode: "rate_limited" })).toBe(
        "rate_limited",
      );
    });
    it("missing_asset and malformed both map to asset_corrupt", () => {
      expect(classifyError("warmup", "x", { manifestCode: "missing_asset" })).toBe(
        "asset_corrupt",
      );
      expect(classifyError("warmup", "x", { manifestCode: "malformed" })).toBe(
        "asset_corrupt",
      );
    });
    it("unreachable maps to asset_unreachable", () => {
      expect(classifyError("warmup", "x", { manifestCode: "unreachable" })).toBe(
        "asset_unreachable",
      );
    });
  });

  describe("HiPKI patterns", () => {
    it("popup blocked", () => {
      expect(
        classifyError("hipki", "HiPKI popup blocked - allow popups for this site"),
      ).toBe("popup_blocked");
    });
    it("popup did not signal ready in setup routes to plug-in missing", () => {
      expect(classifyError("hipki", "HiPKI popup did not signal ready")).toBe(
        "hipki_not_installed",
      );
    });
    it("popup timeout in setup routes to plug-in missing", () => {
      expect(classifyError("hipki", "HiPKI popup timeout")).toBe(
        "hipki_not_installed",
      );
    });
    it("popup timeout outside hipki keeps generic popup_timeout copy", () => {
      expect(classifyError("sign", "HiPKI popup timeout")).toBe("popup_timeout");
    });
    it("sign failed with ret_code", () => {
      expect(
        classifyError("sign", "HiPKI sign failed: ret_code=4 last_error=63364"),
      ).toBe("card_sign_failed");
    });
    it("sign response missing certb64", () => {
      expect(
        classifyError("sign", "HiPKI sign response missing certb64 (needed to proof-match the signing key)"),
      ).toBe("card_sign_failed");
    });
    it("rejected PIN", () => {
      expect(classifyError("pin", "HiPKI rejected PIN (ret_code=4)")).toBe(
        "card_sign_failed",
      );
    });
    it("buildCardContext token errors classify by where", () => {
      expect(classifyError("hipki", "HiPKI: no token in /pkcs11info response")).toBe(
        "card_reader_unreachable",
      );
      expect(classifyError("sign", "HiPKI: no user cert in token")).toBe(
        "card_sign_failed",
      );
    });
  });

  describe("verifier server messages", () => {
    it("challenge expired", () => {
      expect(
        classifyError(
          "challenge",
          "POST /challenge returned 400 Bad Request: challenge expired",
        ),
      ).toBe("challenge_expired");
      expect(
        classifyError(
          "submit",
          "POST /link-verify returned 400 Bad Request: challenge expired",
        ),
      ).toBe("challenge_expired");
    });
    it("challenge already consumed and not-found-or-already-consumed", () => {
      expect(
        classifyError(
          "submit",
          "POST /link-verify returned 410 Gone: challenge already consumed",
        ),
      ).toBe("challenge_consumed");
      expect(
        classifyError(
          "submit",
          "POST /link-verify returned 404 Not Found: challenge not found or already consumed: 0xabc",
        ),
      ).toBe("challenge_consumed");
    });
    it("nullifier already registered", () => {
      expect(
        classifyError(
          "submit",
          "POST /link-verify returned 409 Conflict: nullifier already registered",
        ),
      ).toBe("nullifier_duplicate");
    });
    it("verifier provider unavailable", () => {
      expect(
        classifyError(
          "submit",
          "POST /link-verify returned 503 Service Unavailable: smt root provider unavailable, retry later",
        ),
      ).toBe("verifier_provider_unavailable");
      expect(
        classifyError(
          "submit",
          "POST /link-verify returned 503 Service Unavailable: issuer cert provider unavailable, retry later",
        ),
      ).toBe("verifier_provider_unavailable");
    });
  });

  describe("HTTP status patterns", () => {
    it("5xx routes to network_http", () => {
      expect(
        classifyError("submit", "POST /link-verify returned 500 Internal Server Error"),
      ).toBe("network_http");
      expect(
        classifyError("warmup", "fetch https://github.com/x.bin returned 503 Service Unavailable"),
      ).toBe("network_http");
    });
    it("4xx routes to verifier_unavailable", () => {
      expect(
        classifyError("challenge", "POST /challenge returned 400 Bad Request"),
      ).toBe("verifier_unavailable");
      expect(
        classifyError("submit", "POST /link-verify returned 422 Unprocessable Content"),
      ).toBe("verifier_unavailable");
    });
  });

  describe("integrity", () => {
    it("hash mismatch is asset_corrupt", () => {
      expect(
        classifyError("warmup", "hash mismatch for cert_chain_rs4096_pk.bin: expected abc, got def"),
      ).toBe("asset_corrupt");
    });
    it("smt_load with manifest missing_asset surfaces asset_corrupt", () => {
      expect(
        classifyError(
          "smt_load",
          "no sha256 digest published for g3-tree-snapshot.bin.gz",
          { manifestCode: "missing_asset" },
        ),
      ).toBe("asset_corrupt");
    });
    it("smt_load hash mismatch is asset_corrupt", () => {
      expect(
        classifyError(
          "smt_load",
          "hash mismatch for g3-tree-snapshot.bin.gz: expected abc, got def",
        ),
      ).toBe("asset_corrupt");
    });
  });

  describe("fetch failures", () => {
    it("offline navigator routes to network_offline", () => {
      vi.stubGlobal("navigator", { onLine: false });
      expect(classifyError("challenge", "fetch failed for https://verifier.example/")).toBe(
        "network_offline",
      );
    });
    it("online navigator + warmup routes to asset_unreachable", () => {
      vi.stubGlobal("navigator", { onLine: true });
      expect(
        classifyError("warmup", "fetch failed for https://github.com/x.bin"),
      ).toBe("asset_unreachable");
    });
    it("online navigator + hipki fetch failure routes to plug-in missing", () => {
      vi.stubGlobal("navigator", { onLine: true });
      expect(classifyError("hipki", "fetch failed for http://localhost:61161/")).toBe(
        "hipki_not_installed",
      );
    });
    it("online navigator + challenge routes to verifier_unavailable", () => {
      vi.stubGlobal("navigator", { onLine: true });
      expect(classifyError("challenge", "fetch failed for https://verifier.example/")).toBe(
        "verifier_unavailable",
      );
    });
    it("returned no body counts as a fetch failure", () => {
      vi.stubGlobal("navigator", { onLine: true });
      expect(
        classifyError("warmup", "fetch https://github.com/x.bin returned no body"),
      ).toBe("asset_unreachable");
    });
  });

  describe("storage quota", () => {
    it("warmup + DOM quota message maps to storage_full", () => {
      expect(
        classifyError(
          "warmup",
          "The operation failed because it would cause the application to exceed its storage quota.",
        ),
      ).toBe("storage_full");
    });
    it("smt_load + QuotaExceededError name maps to storage_full", () => {
      expect(
        classifyError("smt_load", "QuotaExceededError: writer.write failed"),
      ).toBe("storage_full");
    });
    it("quota wins over fetch-failure heuristics", () => {
      vi.stubGlobal("navigator", { onLine: true });
      expect(
        classifyError(
          "warmup",
          "fetch failed for x: would cause the application to exceed its storage quota",
        ),
      ).toBe("storage_full");
    });
  });

  describe("wasm init", () => {
    it("warmup + wasm message is wasm_init", () => {
      expect(
        classifyError("warmup", "smt.wasm did not export expected functions"),
      ).toBe("wasm_init");
      expect(
        classifyError("warmup", "wasm_exec.js did not define globalThis.Go"),
      ).toBe("wasm_init");
      expect(classifyError("warmup", "smt.wasm failed to initialize")).toBe(
        "wasm_init",
      );
    });
    it("warmup + non-wasm-non-network message falls through to asset_unreachable", () => {
      expect(classifyError("warmup", "some other thing went wrong")).toBe(
        "asset_unreachable",
      );
    });
  });

  describe("where-based fallback", () => {
    it("challenge defaults to verifier_unavailable", () => {
      expect(classifyError("challenge", "weird shape thing")).toBe(
        "verifier_unavailable",
      );
    });
    it("submit defaults to verifier_unavailable", () => {
      expect(classifyError("submit", "weird shape thing")).toBe(
        "verifier_unavailable",
      );
    });
    it("smt_load defaults to asset_unreachable", () => {
      expect(classifyError("smt_load", "snapshot decode failed")).toBe(
        "asset_unreachable",
      );
    });
    it("hipki defaults to card_reader_unreachable", () => {
      expect(classifyError("hipki", "weird shape thing")).toBe(
        "card_reader_unreachable",
      );
    });
    it("worker / build / unknown where fall through to unknown", () => {
      expect(classifyError("worker", "worker crashed")).toBe("unknown");
      expect(classifyError("build", "circuit input build failed")).toBe("unknown");
    });
  });
});

describe("friendlyErrorCopy", () => {
  it("returns translated headline + body for the classified kind", () => {
    const copy = friendlyErrorCopy("submit", "POST /link-verify returned 500 ISE");
    expect(copy.kind).toBe("network_http");
    expect(copy.headline).toBe("服務暫時無法使用");
    expect(copy.body).toContain("請稍後再試一次");
  });

  it("emits where: rawMessage as the technical string", () => {
    const copy = friendlyErrorCopy("sign", "HiPKI sign failed: ret_code=4 last_error=63364");
    expect(copy.technical).toBe("sign: HiPKI sign failed: ret_code=4 last_error=63364");
  });

  it("does not leak the raw message into the body", () => {
    const raw = "POST /challenge returned 503 Service Unavailable";
    const copy = friendlyErrorCopy("challenge", raw);
    expect(copy.body).not.toContain(raw);
    expect(copy.body).not.toContain("503");
  });
});
