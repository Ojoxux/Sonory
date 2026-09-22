"use client"

import { motion } from "motion/react"
import { InstructionItem } from "../../atoms/InstructionItem"
import { REVEAL_VARIANTS } from "../RecordingInstructions/constants"
import type { InstructionsListProps } from "./types"

/**
 * 確認事項リストコンポーネント
 *
 * @description
 * 録音前の確認事項を一覧表示するコンポーネント。
 * 各項目は親の `staggerChildren` に乗って順に出る
 *
 * @param items 確認事項の配列
 * @param className 追加のCSSクラス
 */
export function InstructionsList({
   items,
   className = "",
}: InstructionsListProps) {
   return (
      <ul className={`mb-6 space-y-3 ${className}`}>
         {items.map((item) => (
            <motion.li key={item} variants={REVEAL_VARIANTS}>
               <InstructionItem text={item} />
            </motion.li>
         ))}
      </ul>
   )
}
