import type { NextConfig } from "next";
const config: NextConfig = {
  serverExternalPackages: ["sharp", "@remotion/renderer", "@remotion/bundler"],
  experimental: {
    proxyClientMaxBodySize: "64mb",
    cpus: 2,
    webpackMemoryOptimizations: true,
  },
};
export default config;
