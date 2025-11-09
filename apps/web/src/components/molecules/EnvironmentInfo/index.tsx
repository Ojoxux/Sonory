"use client"

import { motion } from "framer-motion"
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
      <motion.div
         className="rounded-xl border border-blue-500/30 bg-blue-500/10 p-4 backdrop-blur-sm"
         initial={{ opacity: 0, scale: 0.9 }}
         animate={{ opacity: 1, scale: 1 }}
      >
         <div className="flex items-center gap-2">
            {/* TODO: あまり絵文字は使いたくない。アイコンを使ったほうがいい */}
            <span className="text-blue-400 text-lg">🌍</span>
            <span className="text-blue-300 text-sm">
               {environment.description || environment.primary_type}
            </span>
         </div>
      </motion.div>
   )
}
