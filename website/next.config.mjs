// Fail the build before a privileged Supabase credential can enter browser bundles.
const publicKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
let privileged = publicKey.startsWith('sb_secret_');
try { privileged ||= JSON.parse(Buffer.from(publicKey.split('.')[1] || '', 'base64url').toString()).role === 'service_role'; } catch { /* Publishable keys are not JWTs. */ }
if (privileged) throw new Error('A privileged credential was assigned to the public Supabase key variable.');

/** @type {import('next').NextConfig} */
const nextConfig = {
  trailingSlash: true,
  poweredByHeader: false,
  async headers() {
    return [{ source: '/:path*', headers: [
      { key: 'X-Content-Type-Options', value: 'nosniff' },
      { key: 'X-Frame-Options', value: 'DENY' },
      { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
      { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
      { key: 'Content-Security-Policy', value: "base-uri 'self'; object-src 'none'; frame-ancestors 'none'; form-action 'self'" },
      { key: 'Strict-Transport-Security', value: 'max-age=31536000' }
    ] }];
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "www.timeteccloud.com"
      }
    ]
  },
  async redirects() {
    return [
      {
        source: "/order.html",
        destination: "/order",
        permanent: true
      }
    ];
  }
};

export default nextConfig;
