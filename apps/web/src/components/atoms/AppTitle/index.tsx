"use client"

import type { AppTitleProps } from "./type"

/**
 * アプリケーションタイトルコンポーネント
 *
 * @description
 * Sonoryアプリケーションのタイトルを表示するAtomコンポーネント
 * 音の波形をイメージしたグラデーションとアニメーションを含む
 *
 * @param className クラス名
 *
 * @example
 * ```tsx
 * <AppTitle />
 * ```
 */
export function AppTitle({ className = "" }: AppTitleProps) {
   return (
      <div className={`relative ${className}`}>
         {/* 音波エフェクト */}
         <div className="-z-10 absolute inset-0">
            <div className="-translate-x-1/2 -translate-y-1/2 absolute top-1/2 left-1/2 h-32 w-32 animate-pulse rounded-full bg-gradient-to-r from-purple-400/20 to-blue-400/20 blur-2xl" />
         </div>

         {/* タイトル */}
         <h1 className="relative font-bold text-3xl tracking-tight">
            <span className="bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
               Sonory
            </span>
            <span className="-bottom-1 absolute left-0 h-px w-full scale-x-0 transform bg-gradient-to-r from-purple-400/50 to-blue-400/50 transition-transform duration-300 group-hover:scale-x-100" />
         </h1>

         {/* サブテキスト */}
         <p className="mt-1 font-medium text-gray-500 text-xs tracking-wider">
            10秒の軌跡印
         </p>
      </div>
   )
}
