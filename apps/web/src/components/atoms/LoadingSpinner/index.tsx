"use client"

/**
 * ローディングスピナーコンポーネント
 *
 * @description
 * 処理中を示すスピナーアニメーションのAtomコンポーネント
 *
 * @example
 * ```tsx
 * <LoadingSpinner />
 * ```
 */
export function LoadingSpinner() {
   return (
      <div className="relative mx-auto h-10 w-10">
         <div className="absolute inset-0 animate-spin rounded-full border-[3px] border-white/20 border-t-white" />
      </div>
   )
}
