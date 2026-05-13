import type { NextConfig } from "next";
import path from "node:path";
import { fileURLToPath } from "node:url";

/** Pin Turbopack root to this app when a parent folder (e.g. user home) also has a lockfile. */
const appRoot = path.dirname(fileURLToPath(import.meta.url));

const nextConfig: NextConfig = {
  turbopack: {
    root: appRoot,
  },
  // Hide the floating Next.js dev indicator badge ("N") in development.
  devIndicators: false,
  transpilePackages: ["react-leaflet", "leaflet"],
};

export default nextConfig;
