# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository scope

Frontend-only repo: a simplified, single-purpose example app showing how a
Taiwanese citizen digital certificate (自然人憑證, HiPKI smart card) drives an
in-browser zkID prover. This is a trimmed-down fork of an upstream
OpenAC web app — the FIDO-TW remote auth path, multi-locale i18n, theme
switching, maintenance mode, the marketing carousel, and the
e2e/Playwright suite were all removed to keep this an IC-card-only,
zh-TW-only minimal example. All Rust crates,
Circom circuits, and the Flutter mobile app live upstream in
[`privacy-ethereum/zkID`](https://github.com/privacy-ethereum/zkID/tree/RSA-X.509-Cert); this repo consumes their
compiled artifacts via the upstream's GitHub Release.

Real personal data from MOICA / HiPKI cards must never be committed. Test
fixtures under `src/__fixtures__/` are synthetic.

## Architecture (the big picture)

### The split-circuit protocol the web app consumes

Two circuits, both linked by a `pk_commit` value the verifier checks for equality
across the two proofs:

- **Circuit A — `CertChainRSA256`** (`cert_chain_rs2048` for MOICA-G2,
  `cert_chain_rs4096` for MOICA-G3): RSA-SHA256 cert-chain verification +
  DER parsing of TBS / subject / serial + SMT non-membership proof for
  revocation + `pk_commit`.
- **Circuit B — `UserSigRSA256`** (`user_sig_rs2048`, always 2048-bit user
  keys): RSA signature over the verifier-issued `app_id` payload + `pk_commit` +
  `nullifier = ChunkedPoseidonP256(user_rsa_signature)` + Semaphore-style
  `challenge` binding.

`CircuitKind` values are camelCase in TypeScript: `certChainRS2048`,
`certChainRS4096`, `userSigRS2048` (see `src/manifest.ts`). The snake_case
forms above name the on-disk wasm assets and proving keys.

`pk_commit = ChunkedPoseidonP256(user_pk_limbs ‖ pk_blind)` where `pk_blind` is
a per-session uniform 248-bit value. `nullifier` is per-`(card, app_id)` and
unforgeable without the card's private key. The `challenge` field element is
bound via a dummy square inside the circuit to prevent precomputed proof replay.

Public-output layouts (the verifier parses witnesses in declaration order):

| Circuit              | Layout                                                       |
|----------------------|--------------------------------------------------------------|
| `cert_chain_rs2048`  | `[pk_commit, issuer_rsa_modulus[17], smt_root]` — 19 elems   |
| `cert_chain_rs4096`  | `[pk_commit, issuer_rsa_modulus[34], smt_root]` — 36 elems   |
| `user_sig_rs2048`    | `[pk_commit, nullifier, app_id_packed, challenge]` — 4 elems |

The verifier wire schema (from the upstream zkID
[`RSA-X.509-Cert` branch](https://github.com/privacy-ethereum/zkID/tree/RSA-X.509-Cert)) uses
`user_sig_proof.user_sig`, `pkCommit`, and `issuerRsaModulus` field names —
see `src/verifier-client.ts`. `app_id_packed` is `tbs[0..31]` packed
little-endian into one field element; the verifier matches against the
configured `APP_ID` after the same packing.

Audit v2 fixes from the upstream zkID
[`RSA-X.509-Cert` branch](https://github.com/privacy-ethereum/zkID/tree/RSA-X.509-Cert) refreshed the underlying
circuit binaries (DER-walked serial/modulus offsets in cert-chain; pinned
SHA-256 padding in user-sig) but kept every wire field and public-output
size identical, so the downstream impact here is an asset refresh only.
The verifier deployment must hold the post-#75 verifying keys for proofs
produced after that refresh to pass `/link-verify`.

### Web app: two routes with different COOP

The app serves itself as **two same-origin documents**:

- **`/`** — `Cross-Origin-Opener-Policy: same-origin-allow-popups`, **not**
  cross-origin-isolated. Runs landing/setup/ready, the HiPKI signing popup,
  SMT rebuild, and input building.
- **`/prove`** — `Cross-Origin-Opener-Policy: same-origin`, **cross-origin-isolated**.
  Hosts the Worker that does wasm warmup + multi-threaded proving (rayon over
  SharedArrayBuffer).

`ProveInput` crosses the boundary via `sessionStorage`
(`src/storage-handoff.ts`). Vite's dev server enforces this via the
`coopPerPath` middleware in `vite.config.ts`. Production hosts must serve
path-scoped headers (`public/_headers` works on Netlify / Cloudflare Pages);
without that, the app falls back to single-threaded mode.

This split exists because HiPKI's LocalSignServer (running on the user's
`localhost:61161`) sends no `Access-Control-Allow-Origin` headers, so the app
uses HiPKI's `popupForm` postMessage bridge for signing. A fully
cross-origin-isolated document cannot host that popup; a single-COOP page
cannot host rayon. Hence the split.

The Worker has two modes: `warmup` (download + decompress + `load_pk` per
`CircuitKind`) and `prove` (witness + prove). Mid-step cancellation isn't
supported — `Retry` terminates and respawns the Worker, paying a small
wasm-init cost for clean cancellation semantics.

### Asset pipeline

The web app fetches every binary it needs from
[`privacy-ethereum/zkID`](https://github.com/privacy-ethereum/zkID/releases/tag/RSA-X.509-Cert-latest) — at build time for
WASM bundles, and at runtime for proving keys.

**Build time** (`scripts/fetch-assets.mjs`, run by `pnpm fetch:assets`):
- `spartan2_wasm.{js,_bg.wasm,.d.ts,_bg.wasm.d.ts}.gz` → `src/wasm/`
- `snippets.tar.gz` → extracted into `src/wasm/snippets/` (preserves the
  `wasm-bindgen-rayon-<hash>/src/workerHelpers.js` tree)
- `certChainRS2048.wasm.gz`, `certChainRS4096.wasm.gz`, `userSigRS2048.wasm.gz`
  → `public/assets/{cert_chain_rs2048,cert_chain_rs4096,user_sig_rs2048}.wasm`
- `witness_calculator.js.gz` → `public/assets/witness_calculator.js`

The script also writes two tiny stubs (`src/wasm/package.json` and
`src/wasm/index.js`) so the wasm-bindgen ESM surface resolves under Vite.

**Runtime** (Worker, `src/worker.ts` + `src/asset-download.ts`):
- `/keys/*` proxies to `https://github.com/privacy-ethereum/zkID/releases/download/RSA-X.509-Cert-latest/<asset>`
  (see `vite.config.ts`).
- `/smt-snapshot/*` proxies to
  `https://github.com/privacy-ethereum/moica-revocation-smt/releases/download/snapshot-latest/<asset>`.

Runtime digests come from the GitHub Release API and are verified against the
**gzipped** bytes during streaming download (`SubtleCrypto.digest`). Cached
assets live in OPFS keyed by the upstream SHA-256, with IndexedDB fallback.
Production deployments must reverse-proxy both paths same-origin — pointing
env vars at bare `github.com` URLs is not supported (no GitHub Release CORS
guarantee).

**wasm-bindgen version drift.** The wasm glue is built by upstream CI with a
pinned `wasm-bindgen-cli` version. If upstream bumps the `wasm-bindgen` crate
without bumping their CI tool version, we get a cryptic `BindingsNotSupported`
runtime error here. Look upstream when debugging.

## Commands

All commands run from the repo root.

```sh
pnpm install
cp .env.example .env.local           # set VITE_VERIFIER_BASE_URL, VITE_HIPKI_BASE_URL, etc.

pnpm fetch:assets                    # download WASM + circuit bundles from zkID release
pnpm dev                             # fetch:assets + vite dev server

pnpm test                            # vitest unit tests
pnpm lint                            # tsc --noEmit
pnpm build                           # fetch:assets + vite build + tsc --noEmit
```

`pnpm fetch:assets` writes a manifest at `src/wasm/.fetch-manifest.json` to skip
re-downloads when the release hasn't changed (cheap HEAD/ETag check).

There is no e2e suite in this example repo (Playwright + its fixtures were
removed along with FIDO-TW support); see the upstream OpenAC web app if
you need that coverage as reference.
