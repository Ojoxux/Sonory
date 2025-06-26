import type { NextConfig } from 'next'

const withPWA = require('@ducanh2912/next-pwa').default({
   dest: 'public',
   register: true,
   skipWaiting: true,
   runtimeCaching: [
      {
         urlPattern: /^https?.*/,
         handler: 'NetworkFirst',
         options: {
            cacheName: 'offlineCache',
            expiration: {
               maxEntries: 200,
               maxAgeSeconds: 24 * 60 * 60, // 24 hours
            },
         },
      },
   ],
   disable: process.env.NODE_ENV === 'development',
})

const nextConfig: NextConfig = {
   /* config options here */
   reactStrictMode: true,
   // 👇 Mapbox 環境変数（任意）
   env: {
      NEXT_PUBLIC_MAPBOX_TOKEN: process.env.NEXT_PUBLIC_MAPBOX_TOKEN,
   },
   // 👇 開発環境でのAPI プロキシ設定
   async rewrites() {
      return [
         {
            source: '/api/:path*',
            destination: 'http://localhost:8787/api/:path*',
         },
      ]
   },
}

export default withPWA(nextConfig)
