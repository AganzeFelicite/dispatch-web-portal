import type { NextConfig } from "next";

// Proxy /api/* to the backend so the browser makes same-origin calls (no CORS needed).
// Override the backend origin with BACKEND_ORIGIN at build/run time.
const backend = process.env.BACKEND_ORIGIN ?? "http://localhost:8080";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Self-contained server bundle for the Docker image (see Dockerfile).
  output: "standalone",
  async rewrites() {
    return [{ source: "/api/:path*", destination: `${backend}/api/:path*` }];
  },
};

export default nextConfig;
