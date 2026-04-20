import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Keep xml-crypto and xmldom as Node modules (not bundled)
  // Required for SAML signing — dynamic require() of internal modules
  serverExternalPackages: ['xml-crypto', '@xmldom/xmldom'],
};

export default nextConfig;
