/** @type {import('next').NextConfig} */
const apiUrl =
  process.env.NEXT_PUBLIC_API_URL ??
  "https://grade-horaria-api-c21a7f69ca18.herokuapp.com/";

const buildApiPattern = (rawUrl) => {
  if (!rawUrl) {
    return null;
  }
  try {
    const url = new URL(rawUrl);
    if (url.protocol !== "http:" && url.protocol !== "https:") {
      return null;
    }
    return {
      protocol: url.protocol.replace(":", ""),
      hostname: url.hostname,
      port: url.port || undefined,
      pathname: "/public/**",
    };
  } catch {
    return null;
  }
};

const apiPattern = buildApiPattern(apiUrl);

const remotePatterns = [
  {
    protocol: "http",
    hostname: "localhost",
    port: "4000",
    pathname: "/public/**",
  },
];

if (apiPattern) {
  remotePatterns.push(apiPattern);
}

const nextConfig = {
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
