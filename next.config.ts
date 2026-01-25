import type { NextConfig } from "next";
import type { RemotePattern } from "next/dist/shared/lib/image-config";

const apiUrl =
  process.env.NEXT_PUBLIC_API_URL ??
  "https://grade-horaria-api-c21a7f69ca18.herokuapp.com/";

const buildApiPattern = (rawUrl?: string): RemotePattern | null => {
  if (!rawUrl) {
    return null;
  }
  try {
    const url = new URL(rawUrl);
    if (url.protocol !== "http:" && url.protocol !== "https:") {
      return null;
    }
    return {
      protocol: url.protocol.replace(":", "") as "http" | "https",
      hostname: url.hostname,
      port: url.port || undefined,
      pathname: "/public/**",
    } as RemotePattern;
  } catch {
    return null;
  }
};

const apiPattern = buildApiPattern(apiUrl);

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
  /* config options here */
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
        '*.svg': {
          loaders: ['@svgr/webpack'],
          as: '*.js',
        },
      },
    },
  
};

export default nextConfig;
