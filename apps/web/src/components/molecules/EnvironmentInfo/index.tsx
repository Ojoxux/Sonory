"use client"

import { MdPublic } from "react-icons/md"
import type { EnvironmentInfoProps } from "./types"

/**
 * 環境情報コンポーネント
 *
 * @description
 * AI分析によって推定された環境情報を表示する
 * 環境情報が存在しない場合は何も表示しない
 *
 * @param environment 環境情報
 *
 * @example
 * ```tsx
 * <EnvironmentInfo
 *   environment={{
 *     description: "屋外の公園",
 *     primary_type: "outdoor"
 *   }}
 * />
 * ```
 */
export function EnvironmentInfo({ environment }: EnvironmentInfoProps) {
   if (!environment) {
      return null
   }

   return (
      <div className="rounded-xl border border-accent-500/30 bg-accent-500/10 p-4">
         <div className="flex items-center gap-2">
            <MdPublic className="h-5 w-5 text-accent-400" />
            <span className="text-accent-300 text-sm">
               {environment.description || environment.primary_type}
            </span>
         </div>
      </div>
   )
}
