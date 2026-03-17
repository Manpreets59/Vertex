import { withSentryConfig } from "@sentry/nextjs";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Disable Turbopack by setting webpack option
  // Turbopack's WASM bindings don't work well in sandboxed environments like WebContainer
  webpack: (config, { isServer }) => {
    return config;
  },
  headers: async () => {
    return [
      {
        source: "/:path*",
        headers: [
          {
            key: "Cross-Origin-Opener-Policy",
            value: "same-origin",
          },
          {
            key: "Cross-Origin-Embedder-Policy",
            value: "credentialless",
          },
        ],
      },
    ];
  },
};

// Only enable Sentry in production
const sentryConfig = process.env.NODE_ENV === "production"
  ? withSentryConfig(nextConfig, {
      org: "student-vfo",
      project: "vertex",
      silent: !process.env.CI,
      widenClientFileUpload: true,
      webpack: {
        automaticVercelMonitors: true,
        treeshake: {
          removeDebugLogging: true,
        },
      }
    })
  : nextConfig;

export default sentryConfig;
