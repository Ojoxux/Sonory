"use client"

import { InstructionItem } from "../../atoms/InstructionItem"
import { revealDelay } from "../RecordingInstructions/constants"
import type { InstructionsListProps } from "./types"

/**
 * 確認事項リストコンポーネント
 *
 * @description
 * 録音前の確認事項を一覧表示するコンポーネント。
 * 各項目は `reveal` で順に出る
 *
 * @param items 確認事項の配列
 * @param startStep 何番目から順に出すか
 * @param className 追加のCSSクラス
 */
export function InstructionsList({
   items,
   startStep = 0,
   className = "",
}: InstructionsListProps) {
   return (
      <ul className={`mb-6 space-y-3 ${className}`}>
         {items.map((item, index) => (
            <li
               key={item}
               className="reveal"
               style={revealDelay(startStep + index)}
            >
               <InstructionItem text={item} />
            </li>
         ))}
      </ul>
   )
}
