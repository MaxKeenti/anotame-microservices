import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  async rewrites() {
    return [
      {
        source: "/api/identity/:path*",
        destination: `${process.env.NEXT_PUBLIC_IDENTITY_URL || "http://localhost:8081"}/:path*`, // Proxy to Identity Service
      },
      {
        source: "/api/catalog/:path*",
        destination: `${process.env.NEXT_PUBLIC_CATALOG_URL || "http://localhost:8082"}/:path*`, // Proxy to Catalog Service
      },
      {
        source: "/api/sales/:path*",
        destination: `${process.env.NEXT_PUBLIC_SALES_URL || "http://localhost:8083"}/:path*`, // Proxy to Sales Service
      },
      {
        source: "/api/operations/:path*",
        destination: `${process.env.NEXT_PUBLIC_OPERATIONS_URL || "http://localhost:8084"}/:path*`, // Proxy to Operations Service
      },
    ];
  },
};

export default nextConfig;
