#!/usr/bin/env node
// Delegate wasm + key fetching to the openac-rsa-x509 package scripts,
// then copy the runtime-served assets into public/assets/ so Vite can
// serve them at /assets/<name> (witness_calculator.js, circuit WASMs).
import { execFileSync } from "node:child_process";
import { copyFile, mkdir, unlink } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const WEB_DIR = resolve(HERE, "..");
const PKG_DIR = join(WEB_DIR, "node_modules", "openac-rsa-x509");
const PKG_SCRIPTS = join(PKG_DIR, "scripts");
const PKG_ASSETS = join(PKG_DIR, "assets");
const PUBLIC_ASSETS = join(WEB_DIR, "public", "assets");

// Delete the snippets tarball sentinel so the tarball is always re-extracted
// with the original browser-compatible workerHelpers.js. The package's
// fetch-assets.mjs would otherwise patch that file with a Node.js stub that
// makes initThreadPool() throw inside the browser Worker.
const snippetsSentinel = join(PKG_DIR, "src", "wasm", ".tarball-stamp-snippets_tar_gz");
try { await unlink(snippetsSentinel); } catch { /* ok if missing */ }

// Run the package's fetch-assets.mjs with patching disabled (browser build
// needs the real wasm-bindgen-rayon workerHelpers.js, not the Node.js stub).
execFileSync(process.execPath, [join(PKG_SCRIPTS, "fetch-assets.mjs")], {
  stdio: "inherit",
  env: { ...process.env, SKIP_WORKER_HELPERS_PATCH: "1" },
});

// Proving keys don't need the patch guard.
execFileSync(process.execPath, [join(PKG_SCRIPTS, "fetch-proving-keys.mjs")], { stdio: "inherit" });

// Copy runtime-served assets that Vite serves at /assets/* to public/assets/.
// witness_calculator.js is fetched at runtime by witness.ts from /assets/.
// Circuit WASMs are fetched via the /keys/ proxy, but keep local copies too.
const PUBLIC_FILES = [
  "witness_calculator.js",
  "cert_chain_rs2048.wasm",
  "cert_chain_rs4096.wasm",
  "user_sig_rs2048.wasm",
];

await mkdir(PUBLIC_ASSETS, { recursive: true });
for (const name of PUBLIC_FILES) {
  await copyFile(join(PKG_ASSETS, name), join(PUBLIC_ASSETS, name));
  console.log(`  copied  ${name} → public/assets/`);
}
console.log("fetch-assets: public/assets sync done");
