/**
 * Security headers.
 *
 * Scope note, so this is not over-read: this app is fully static and prerendered.
 * There is no auth, no database, no Server Action, no API route, no middleware,
 * no form and no user-controlled input anywhere in it. That removes almost the
 * entire class of vulnerabilities these headers defend against — the value here
 * is defence in depth (if a dependency or the build is ever compromised, or the
 * site is framed or MITM'd) rather than closing a live hole.
 *
 * `script-src` still needs 'unsafe-inline': Next's App Router inlines its RSC
 * flight payload and hydration bootstrap into the prerendered HTML. Removing it
 * requires a per-request nonce, which forces dynamic rendering and gives up the
 * static prerender the site is built around. That trade was not worth making
 * here; the protection that actually matters against injection on a site with no
 * user input is `object-src 'none'` plus `base-uri 'self'`.
 *
 * `img-src`/`font-src` allow data: and blob: because the CRT renderer and the
 * certificate textures paint from them. fonts are self-hosted through next/font,
 * so no third-party font origin is granted.
 */
const securityHeaders = [
  { key: "Content-Security-Policy", value: [
      "default-src 'self'",
      "base-uri 'self'",
      "object-src 'none'",
      "form-action 'self'",
      "frame-ancestors 'none'",
      "script-src 'self' 'unsafe-inline'",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: blob:",
      "font-src 'self' data:",
      "connect-src 'self'",
      "manifest-src 'self'",
      "upgrade-insecure-requests",
    ].join("; ") },
  // Clickjacking: the site is a single full-viewport page, so no legitimate
  // reason for any origin to frame it.
  { key: "X-Frame-Options", value: "DENY" },
  // Stops MIME sniffing — a .pdf or .svg can no longer be coaxed into
  // executing as HTML.
  { key: "X-Content-Type-Options", value: "nosniff" },
  // The CV link is the only place the site sends the visitor anywhere, and it
  // does not need to leak the referring URL.
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  // The site uses none of these. Denying them by default means a future
  // dependency cannot quietly start asking for the microphone or the camera.
  { key: "Permissions-Policy", value: [
      "accelerometer=()",
      "autoplay=()",
      "camera=()",
      "display-capture=()",
      "encrypted-media=()",
      "fullscreen=(self)",
      "geolocation=()",
      "gyroscope=()",
      "magnetometer=()",
      "microphone=()",
      "midi=()",
      "payment=()",
      "usb=()",
    ].join(", ") },
  // Isolates the browsing context so the page cannot be window-opened and
  // navigated to by an attacker holding a reference to it.
  { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
  { key: "X-DNS-Prefetch-Control", value: "off" },
  { key: "X-Permitted-Cross-Domain-Policies", value: "none" },
];

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  // Do not advertise the framework. Minor, but it is free.
  poweredByHeader: false,

  async headers() {
    return [
      { source: "/:path*", headers: securityHeaders },
      {
        // The CV is a downloadable file, not a document to render in a frame.
        source: "/cv_emploi.pdf",
        headers: [
          { key: "Cache-Control", value: "public, max-age=0, must-revalidate" },
          { key: "Content-Disposition", value: 'attachment; filename="cv_emploi.pdf"' },
        ],
      },
    ];
  },
};

export default nextConfig;