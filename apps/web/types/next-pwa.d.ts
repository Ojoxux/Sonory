// types/next-pwa.d.ts
// TypeScript が withPWA の型を認識して補完や型チェックが効くようになります。
declare module 'next-pwa' {
   import { NextConfig } from 'next'

   type WithPWA = (config: NextConfig) => NextConfig
   const withPWA: WithPWA

   export default withPWA
}
