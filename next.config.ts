import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://apis.google.com https://*.clerk.accounts.dev https://generativelanguage.googleapis.com",
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
              "img-src 'self' data: https://*.clerk.accounts.dev https://img.clerk.com",
              "font-src 'self' https://fonts.gstatic.com",
              "frame-src 'self' https://*.clerk.accounts.dev",
              "connect-src 'self' https://api.clerk.dev https://*.clerk.accounts.dev https://clerk.googleapis.com https://*.supabase.co https://generativelanguage.googleapis.com https://ai.googleapis.com"
            ].join('; ')
          }
        ]
      }
    ];
  }
};

export default nextConfig;
