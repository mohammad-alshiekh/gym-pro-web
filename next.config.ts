import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  logging: {
    // The API client runs in the browser, so its console output is forwarded to
    // the `next dev` terminal — that is what makes src/lib/apiLogger.ts visible
    // there. Dev only; it has no effect on a production build.
    browserToTerminal: true,
  },
};

export default nextConfig;
