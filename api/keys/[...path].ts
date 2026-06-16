// Streaming reverse proxy for GitHub Release assets under /keys/*.
//
// Static `rewrites` in vercel.json don't work for github.com release
// downloads: github.com responds with a 302 to a signed S3 URL on a
// different origin, which the browser can't follow because COEP:
// require-corp blocks the cross-origin S3 response. This Edge function
// follows the redirect server-side and streams the bytes back same-origin.
//
// The .gz assets are served by GitHub as application/octet-stream (the .gz
// is part of the filename, not a Content-Encoding), so fetch won't auto-
// decompress and the worker's DecompressionStream pipeline keeps working.

export const config = { runtime: "edge" };

const RELEASE_BASE =
  "https://github.com/privacy-ethereum/zkID/releases/download/RSA-X.509-Cert-latest";

export default async function handler(request: Request): Promise<Response> {
  const url = new URL(request.url);
  // Vercel rewrites preserve the user-visible URL, so request.url reflects
  // the original `/keys/<asset>` path even though this file lives at
  // /api/keys/[...path]. Strip whichever prefix is present.
  const subpath = url.pathname.replace(/^\/(api\/keys|keys)\//, "");
  if (!subpath) {
    return new Response("Missing asset path", { status: 400 });
  }

  const upstream = `${RELEASE_BASE}/${subpath}`;
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
  // Same staleness reason as the SMT proxy; longer max-age because zkID
  // `RSA-X.509-Cert-latest` rotates far less often than the CRL snapshot.
  headers.set("cache-control", "public, max-age=300, must-revalidate");

  return new Response(upstreamRes.body, { status: 200, headers });
}
