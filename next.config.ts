import { spawnSync } from "node:child_process";
import { randomUUID } from "node:crypto";

import withSerwistInit from "@serwist/next";
import type { NextConfig } from "next";

const revision =
  spawnSync("git", ["rev-parse", "HEAD"], { encoding: "utf-8" }).stdout?.trim() ||
  randomUUID();

const withSerwist = withSerwistInit({
  swSrc: "app/sw.ts",
  swDest: "public/sw.js",
  disable: process.env.NODE_ENV === "development",
  cacheOnNavigation: true,
  reloadOnOnline: false,
  additionalPrecacheEntries: [
    { url: "/~offline", revision },
    { url: "/", revision },
    { url: "/new-project", revision },
    { url: "/test-grid", revision },
  ],
  globPublicPatterns: ["icons/**/*.{png,svg,ico}"],
});

const nextConfig: NextConfig = {
  // Permite acceder al servidor de dev desde otros dispositivos en la LAN
  // (ej. probar desde el iPhone usando la IP de red). Sin esto, Next.js
  // bloquea recursos de dev (HMR, parte del bundle) cuando el origin no es
  // localhost, y eso puede dejar la hidratación/los listeners de touch a medias.
  // Debe coincidir con la IP que muestra `npm run dev` en "Network:".
  allowedDevOrigins: [
    "192.168.50.124",
    "192.168.50.156",
    "192.168.1.8",
  ],
};

export default withSerwist(nextConfig);
