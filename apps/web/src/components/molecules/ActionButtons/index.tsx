"use client"

import { Button } from "@/components/atoms/Button"
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
         <Button intent="accent" block onClick={onClose}>
            閉じる
         </Button>
      )
   }

   const isDisabled = shouldDisableButton(pinCreationStatus, hasPosition)
   const buttonText = getButtonText(pinCreationStatus, hasPosition)

   return (
      <>
         <Button
            intent="done"
            onClick={onPlacePin}
            disabled={isDisabled}
            className="flex-1"
         >
            {buttonText}
         </Button>
         <Button onClick={onClose} className="flex-1">
            閉じる
         </Button>
      </>
   )
}
