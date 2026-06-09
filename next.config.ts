import type { NextConfig } from "next";

// Baseline security headers for the whole app. NOTE: we deliberately do NOT set a
// global Content-Security-Policy here — the Next app needs inline scripts/styles
// for hydration, and a strict CSP would require nonces (a larger change). The
// public user-generated page at /u/[slug] sets its OWN strict scriptless CSP in
// its route handler; these headers cover clickjacking / MIME / referrer / HSTS
// for everything else.
const SECURITY_HEADERS = [
  { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
  { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
]

const nextConfig: NextConfig = {
  allowedDevOrigins: ['127.0.0.1'],
  serverExternalPackages: ['unpdf', 'mammoth'],
  async headers() {
    return [{ source: '/:path*', headers: SECURITY_HEADERS }]
  },
};

export default nextConfig;
