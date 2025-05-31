import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  /* config options here */
  reactStrictMode: true,
  // 👇 Mapbox 環境変数（任意）
  env: {
    NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN:
      process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN,
  },
}

export default nextConfig
