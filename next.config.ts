import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  // Only use static export for production builds
  ...(process.env.NODE_ENV === 'production' && { output: 'export' }),
  trailingSlash: true,
  images: {
    unoptimized: true,
  },
  // Allow cross-origin requests in dev mode
  ...(process.env.NODE_ENV === 'development' && {
    allowedDevOrigins: ['localhost:3000', '127.0.0.1:3000', '192.168.1.112:3000'],
  }),
};

export default nextConfig;