# openac-taiwan-citizen-digital-certificate-web-example

Vite + TypeScript example app that runs cert-chain + user-sig Spartan2 zero-
knowledge proofs in the browser against a Taiwanese citizen digital
certificate (自然人憑證) read via a HiPKI smart-card reader. Prover WASM and
circuit bundles are downloaded from the
[`privacy-ethereum/zkID`](https://github.com/privacy-ethereum/zkID/releases/tag/RSA-X.509-Cert-latest) GitHub release.
Verification is server-side via
[`go-zkid-verifier`](https://github.com/privacy-ethereum/go-zkid-verifier).

This is a simplified, single-auth-method (IC card only), single-locale
(zh-TW only) fork of the upstream zkID web client, meant as a minimal
end-to-end example rather than a production app.

## Quick start

```sh
pnpm install
cp .env.example .env.local            # set VITE_VERIFIER_BASE_URL, etc.
pnpm dev                              # opens http://localhost:5173
```

`pnpm dev` and `pnpm build` both run `pnpm fetch:assets` first, which pulls the
WASM prover, circuit witness bundles, and TypeScript declarations into
`src/wasm/` and `public/assets/`. Run it manually after a release refresh.

### Other commands

```sh
pnpm test          # vitest unit tests
pnpm lint          # tsc --noEmit
pnpm build         # fetch:assets + vite build + tsc
pnpm fetch:assets  # download WASM + circuit bundles from the latest release
```

## Flow

Seven screens, each gated by an explicit user action:

```
landing → setup → ready → proving → review → submitting → result
```

- **Setup** has four panels: proving runtime warmup, HiPKI card detect + read,
  per-issuer revocation snapshot rebuild, PIN verify (3-attempt lockout).
  "Continue to proving" stays disabled until all four are green.
- **Proving** runs 6 steps: fetch challenge, sign with card, check revocation,
  build inputs, prove cert-chain, prove user-sig. Cancel routes back to setup.
- **Review** shows proof sizes and proving time. "Send proof to verifier"
  submits; "Retry proving" routes back to setup for PIN re-entry (single-use
  PIN policy).
- **Result** shows verified/not-verified, the server-derived nullifier, and a
  debug block with parsed public inputs. "Prove again" routes back to setup.

Revocation is checked against a Sparse Merkle Tree rebuilt in-browser from a
snapshot, so the card's serial never leaves the device.

## Asset sources

Runtime URLs (all gzipped on the server):

- `/keys/cert_chain_rs{2048,4096}_proving.key.gz`
- `/keys/user_sig_rs2048_proving.key.gz`
- `/keys/{certChainRS2048,certChainRS4096,userSigRS2048}.wasm.gz` (witness gen)
- `/smt-snapshot/smt.wasm`, `/smt-snapshot/wasm_exec.js`
- `/smt-snapshot/g{2,3}-tree-snapshot.bin.gz` (per-issuer, fetched after card
  read)

SHA-256 digests come from the GitHub Release API:
`api.github.com/repos/privacy-ethereum/zkID/releases/tags/RSA-X.509-Cert-latest` and
`api.github.com/repos/privacy-ethereum/moica-revocation-smt/releases/tags/snapshot-latest`.
Digests verify the gzipped bytes during streaming download.

In dev, `/keys/*` and `/smt-snapshot/*` are proxied to GitHub Releases by
`vite.config.ts`. In prod, the host must reverse-proxy both paths same-origin.
Pointing env vars at bare `github.com` release URLs is not supported (no
release-CORS contract).

Verifying keys live only on the Go server.

## External services

| Service / source       | Env var                  | Default                  | Purpose                                      |
| ----------------------- | ------------------------- | ------------------------- | --------------------------------------------- |
| `go-zkid-verifier`      | `VITE_VERIFIER_BASE_URL`  | `http://localhost:8080`   | Challenge + `link-verify`                     |
| HiPKI LocalSignServer   | `VITE_HIPKI_BASE_URL`     | `http://localhost:61161`  | IC-card `pkcs11info` + `sign` over popupForm  |
| `moica-revocation-smt`  | dev proxy                 | `/smt-snapshot` to GH release | Binary SMT snapshot + `smt.wasm`         |

The 31-byte `app_id` and per-session `challenge` come from `POST /challenge`,
so there's no client env var for them. To change `app_id`, set it on the
verifier. Per-request timeouts: `VITE_VERIFIER_TIMEOUT_MS` (default 60000).

### HiPKI popup bridge

HiPKI's LocalSignServer ships no CORS headers, so direct `fetch` from the
browser is blocked. The app uses HiPKI's `popupForm` postMessage bridge: each
operation opens a same-origin popup at `localhost:61161/popupForm` and
exchanges JSON over `window.postMessage`.

## Browser requirements

The app serves two same-origin documents with different COOP headers so the
HiPKI popup and the rayon thread pool can both work:

| Route    | COOP                         | `crossOriginIsolated` | Runs                                          |
| -------- | ---------------------------- | --------------------- | --------------------------------------------- |
| `/`      | `same-origin-allow-popups`   | `false`               | Landing, setup, ready, HiPKI sign, SMT, build |
| `/prove` | `same-origin`                | `true`                 | Worker warmup + witness + prove               |

`ProveInput` crosses the boundary via `sessionStorage`
(`src/storage-handoff.ts`). Vite enforces the split via `coopPerPath` in
`vite.config.ts`. Production hosts must serve path-scoped headers
(`public/_headers` works on Netlify and Cloudflare Pages); without that, the
app falls back to single-threaded mode.

## Production deployment

Three things the dev proxy provides for free that production has to replicate:

1. Cross-origin isolation headers on `/prove` for SharedArrayBuffer.
2. A reverse proxy from `/hipki/*` to the user's `localhost:61161`.
3. A reverse proxy from `/smt-snapshot/*` to the moica-revocation-smt release.

A pure cloud-hosted "visit from any browser" deployment is not viable, because
the HiPKI server runs on the user's machine. Two patterns work:

- **Hosted app + user-side mini-proxy.** Ship a small native helper (Caddy,
  nginx, or a tiny Go binary) alongside the HiPKI installer that exposes
  `/hipki/*` on the deployed app's origin.
- **Local-first.** Bundle the static app + a tiny local server in the same
  installer as HiPKI. Everything runs on `http://localhost:<port>`.

## Thread-count policy

```
threads = clamp(navigator.hardwareConcurrency - 1, 2, 8)
```

Leave one core for the main thread. The 8-thread cap exists because wasm32
has a 4 GB linear-memory ceiling and `cert_chain_rs4096` proofs pressure it.
Override with `?threads=<n>` on the URL (clamped to `[1, 32]`).

## Storage inspection

Cached assets live in OPFS at a key that embeds the upstream SHA-256 (e.g.
`cert_chain_rs2048_pk_<sha>`); key-hits skip rehashing. The IndexedDB fallback
uses database `zkid-assets`, object store `assets`. Delete the entry to force
a re-download, or use the "Clear cached assets" button on the result screen.

## Known limitations

- Failed fetches discard partial bytes; retry re-downloads from scratch.
- No `.partial` rename on writer commit. A crash between stream close and the
  SHA-256 check can leave hash-suffixed bytes that the next run trusts via the
  key-hit fast path. "Clear cached assets" is the escape hatch.
- HiPKI popup is single-shot per operation, so card-insertion polling is not
  possible. Detect / Read are explicit clicks.
- The Worker cannot be cancelled mid-step. `Retry` terminates and respawns it.
- IC card only — no automated test suite for the flow (no e2e/Playwright
  setup in this example); the upstream OpenAC web app has one for
  reference.
