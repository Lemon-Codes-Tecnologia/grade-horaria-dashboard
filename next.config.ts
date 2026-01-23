import type { NextConfig } from "next";

const apiUrl = process.env.NEXT_PUBLIC_API_URL;
const apiPattern = apiUrl
  ? (() => {
      try {
        const url = new URL(apiUrl);
        return {
          protocol: url.protocol.replace(":", ""),
          hostname: url.hostname,
          port: url.port || undefined,
          pathname: "/public/**",
        };
      } catch {
        return null;
      }
    })()
  : null;

const nextConfig: NextConfig = {
  /* config options here */
  images: {
    remotePatterns: [
      {
        protocol: "http",
        hostname: "localhost",
        port: "4000",
        pathname: "/public/**",
      },
      ...(apiPattern ? [apiPattern] : []),
    ],
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
