import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  transpilePackages: [
    '@deck.gl/core',
    '@deck.gl/layers',
    '@deck.gl/geo-layers',
    '@deck.gl/react',
    'h3-js'
  ],
};

export default nextConfig;
