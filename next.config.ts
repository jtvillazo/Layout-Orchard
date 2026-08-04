import type { NextConfig } from "next";

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

export default nextConfig;