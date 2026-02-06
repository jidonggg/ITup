import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      {
        source: "/mentor/register",
        destination: "/mentor/apply",
        permanent: true,
      },
      {
        source: "/mentor/recruit",
        destination: "/mentor/apply",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
