import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      // Supabase storage (project-scoped CDN)
      {
        protocol: "https",
        hostname: "wsjpurqemkpmssrqmndy.supabase.co",
      },
      // QR code generator used in admin gift vault flow
      {
        protocol: "https",
        hostname: "api.qrserver.com",
      },
    ],
  },
};

export default nextConfig;
