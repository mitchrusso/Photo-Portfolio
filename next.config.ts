import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  poweredByHeader: false,
  async redirects() {
    return [
      ...["photoviewpro.com", "www.photoviewpro.com"].map((host) => ({
        source: "/:path*",
        has: [{ type: "host" as const, value: host }],
        destination: "https://photoview.io/:path*",
        statusCode: 301 as const,
      })),
      {
        source: "/:path*",
        has: [{ type: "host", value: "www.photoview.io" }],
        destination: "https://photoview.io/:path*",
        permanent: true,
      },
    ]
  },
  async headers() {
    return [
      {
        headers: [
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-DNS-Prefetch-Control", value: "off" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=()" },
          ...(process.env.NODE_ENV === "production"
            ? [{ key: "Strict-Transport-Security", value: "max-age=31536000; includeSubDomains" }]
            : []),
        ],
        source: "/(.*)",
      },
      ...["/dashboard/:path*", "/account/:path*", "/admin/:path*", "/login", "/register/:path*"].map((source) => ({
        headers: [
          { key: "Content-Security-Policy", value: "frame-ancestors 'none'" },
          { key: "X-Frame-Options", value: "DENY" },
        ],
        source,
      })),
    ]
  },
  images: {
    // PhotoView.io already creates display and thumbnail variants. Serving them
    // directly also lets the browser follow short-lived private R2 redirects.
    unoptimized: true,
    localPatterns: [
      {
        pathname: "/api/media/**",
      },
    ],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "photos.smugmug.com",
      },
      {
        protocol: "https",
        hostname: "*.public.blob.vercel-storage.com",
      },
    ],
  },
};

export default nextConfig;
