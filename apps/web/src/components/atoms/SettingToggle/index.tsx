"use client"

import { Switch } from "@base-ui-components/react/switch"
import { clsx } from "clsx"
import { type ReactElement, useId } from "react"
import type { SettingToggleProps } from "./types"

/**
 * 設定用の汎用トグル
 *
 * @description
 * 行全体が1つのスイッチ。ラベルや補足文言の上を押しても切り替わる。
 *
 * @param checked トグルの現在の状態
 * @param onChange 切り替え時のコールバック
 * @param label トグルのラベル
 * @param description ラベル下に表示する補足文言
 * @param disabled 無効化するかどうか
 * @param className 追加のCSSクラス
 */
export function SettingToggle({
   checked,
   onChange,
   label,
   description,
   disabled = false,
   className,
}: SettingToggleProps): ReactElement {
   const descriptionId = useId()

   // Root は非表示の <input> を隣に出す。親の space-y に数えられないよう包む
   return (
      <div className="relative">
         <Switch.Root
            checked={checked}
            onCheckedChange={() => onChange()}
            disabled={disabled}
            aria-label={label}
            aria-describedby={description ? descriptionId : undefined}
            nativeButton
            render={(props) => <button type="button" {...props} />}
            className={clsx(
               "group flex w-full touch-manipulation select-none items-center justify-between gap-3 rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-left transition duration-press ease-out focus-visible:outline-2 focus-visible:outline-white/60 focus-visible:outline-offset-2 not-data-disabled:hover:bg-white/10 not-data-disabled:active:scale-97 data-disabled:cursor-not-allowed data-disabled:opacity-50",
               className,
            )}
         >
            <span className="flex flex-col gap-0.5">
               <span className="font-semibold text-sm text-white">{label}</span>
               {description && (
                  <span id={descriptionId} className="text-neutral-300 text-xs">
                     {description}
                  </span>
               )}
            </span>

            <span className="relative inline-flex h-6 w-11 shrink-0 rounded-full bg-white/20 transition-colors duration-menu ease-out group-data-checked:bg-done-500">
               <Switch.Thumb className="absolute top-0.5 left-0.5 size-5 rounded-full bg-white shadow transition-transform duration-menu ease-out data-checked:translate-x-5" />
            </span>
         </Switch.Root>
      </div>
   )
}
