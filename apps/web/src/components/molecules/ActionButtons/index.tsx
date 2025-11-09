"use client"

import { motion } from "framer-motion"
import type { ActionButtonsProps } from "./types"
import { getButtonText, shouldDisableButton } from "./utils"

/**
 * アクションボタンコンポーネント
 *
 * @description
 * 分析結果画面のアクションボタン（ピン配置/閉じる）を表示
 * 結果の有無によって表示内容を切り替える
 *
 * @param hasResults 分析結果が存在するか
 * @param pinCreationStatus ピン作成ステータス
 * @param hasPosition 現在位置が存在するか
 * @param onPlacePin ピン配置ボタンのクリックハンドラー
 * @param onClose 閉じるボタンのクリックハンドラー
 *
 * @example
 * ```tsx
 * <ActionButtons
 *   hasResults={true}
 *   pinCreationStatus="idle"
 *   hasPosition={true}
 *   onPlacePin={() => console.log("Place pin")}
 *   onClose={() => console.log("Close")}
 * />
 * ```
 */
export function ActionButtons({
   hasResults,
   pinCreationStatus,
   hasPosition,
   onPlacePin,
   onClose,
}: ActionButtonsProps) {
   // 結果がない場合は閉じるボタンだけ表示
   if (!hasResults) {
      return (
         <motion.button
            onClick={onClose}
            className="w-full touch-manipulation rounded-xl bg-blue-600 px-4 py-3 font-semibold text-sm text-white transition-all duration-200 active:bg-blue-700"
            whileTap={{ scale: 0.98 }}
         >
            閉じる
         </motion.button>
      )
   }

   const isDisabled = shouldDisableButton(pinCreationStatus, hasPosition)
   const buttonText = getButtonText(pinCreationStatus, hasPosition)

   return (
      <>
         <motion.button
            onClick={onPlacePin}
            disabled={isDisabled}
            className={`flex-1 touch-manipulation rounded-xl px-4 py-3 font-semibold text-sm text-white transition-all duration-200 ${
               isDisabled
                  ? "cursor-not-allowed bg-gray-600/60"
                  : "bg-green-600 active:bg-green-700"
            }`}
            whileTap={isDisabled ? {} : { scale: 0.98 }}
         >
            {buttonText}
         </motion.button>
         <motion.button
            onClick={onClose}
            className="flex-1 touch-manipulation rounded-xl border border-white/10 bg-white/5 px-4 py-3 font-semibold text-sm text-white transition-all duration-200 active:bg-white/10"
            whileTap={{ scale: 0.98 }}
         >
            閉じる
         </motion.button>
      </>
   )
}
