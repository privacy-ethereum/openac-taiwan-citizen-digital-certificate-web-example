// Streaming reverse proxy for moica-revocation-smt release assets under
// /smt-snapshot/*. See api/keys/[...path].ts for the full rationale —
// same redirect-follow + COEP problem, same fix.

export const config = { runtime: "edge" };

const SMT_SNAPSHOT_BASE =
  "https://github.com/privacy-ethereum/moica-revocation-smt/releases/download/snapshot-latest";

export default async function handler(request: Request): Promise<Response> {
  const url = new URL(request.url);
  // See api/keys/[...path].ts — request.url reflects the user-visible path
  // through Vercel rewrites, not the rewritten /api/... path.
  const subpath = url.pathname.replace(
    /^\/(api\/smt-snapshot|smt-snapshot)\//,
    "",
  );
  if (!subpath) {
    return new Response("Missing asset path", { status: 400 });
  }

  const upstream = `${SMT_SNAPSHOT_BASE}/${subpath}`;
  const upstreamRes = await fetch(upstream, { redirect: "follow" });

  if (!upstreamRes.ok || !upstreamRes.body) {
    return new Response(`Upstream ${upstreamRes.status}`, {
      status: upstreamRes.status,
    });
  }

  const headers = new Headers();
  const contentType = upstreamRes.headers.get("content-type");
  if (contentType) headers.set("content-type", contentType);
  const contentLength = upstreamRes.headers.get("content-length");
  if (contentLength) headers.set("content-length", contentLength);
  // Path is mutable (no digest in URL) and upstream rewrites `snapshot-latest`
  // on each CRL refresh, so `immutable` would pin stale bytes against fresh
  // manifest digests and surface as `asset_corrupt` on the client.
  headers.set("cache-control", "public, max-age=60, must-revalidate");

  return new Response(upstreamRes.body, { status: 200, headers });
}
