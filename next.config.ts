import type { NextConfig } from "next";
import type { RemotePattern } from "next/dist/shared/lib/image-config";

const apiUrl =
  process.env.NEXT_PUBLIC_API_URL ??
  "https://grade-horaria-api-c21a7f69ca18.herokuapp.com/";

const apiPattern: RemotePattern | null = apiUrl
  ? (() => {
      const u = new URL(apiUrl);
      const protocol = u.protocol.replace(":", "") as "http" | "https";
      return {
        protocol,
        hostname: u.hostname,
        port: u.port || undefined,
        pathname: "/**",
      };
    })()
  : null;

const remotePatterns: RemotePattern[] = [
  {
    protocol: "http",
    hostname: "localhost",
    port: "4000",
    pathname: "/public/**",
  } as RemotePattern,
];

if (apiPattern) {
  remotePatterns.push(apiPattern);
}

const nextConfig: NextConfig = {
  images: {
    remotePatterns,
  },
  async rewrites() {
    if (!apiUrl) {
      return [];
    }
    return [
      {
        source: "/public/:path*",
        destination: `${apiUrl}/public/:path*`,
      },
    ];
  },
  webpack(config) {
    config.module.rules.push({
      test: /\.svg$/,
      use: ["@svgr/webpack"],
    });
    return config;
  },
  turbopack: {
    rules: {
      "*.svg": {
        loaders: ["@svgr/webpack"],
        as: "*.js",
      },
    },
  },
};

export default nextConfig;
