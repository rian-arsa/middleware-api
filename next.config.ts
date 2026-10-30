import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  cacheComponents: true,
  partialPrefetching: true,
  // Proxy harus meneruskan path apa adanya; redirect 308 merusak preflight CORS.
  skipTrailingSlashRedirect: true,
};

export default nextConfig;
