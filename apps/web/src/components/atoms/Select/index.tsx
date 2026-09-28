"use client"

import { Select as BaseSelect } from "@base-ui-components/react/select"
import { clsx } from "clsx"
import { Check, ChevronDown } from "lucide-react"
import { type ReactElement, useRef } from "react"
import type { SelectProps } from "./types"

/**
 * 黒ガラスのドロップダウン
 *
 * @param value 選択中の値
 * @param onValueChange 選択が変わったときのコールバック
 * @param options 選択肢
 * @param label 読み上げ用のラベル
 * @param disabled 無効化するかどうか
 *
 * @example
 * ```tsx
 * <Select label="通知範囲" value={1000} options={OPTIONS} onValueChange={setRange} />
 * ```
 */
export function Select<Value>({
   value,
   onValueChange,
   options,
   label,
   disabled = false,
   className,
}: SelectProps<Value>): ReactElement {
   // body 直下に出すと、モーダルなシートが外側を押せなくしているため操作できない。
   // シートの中に置き、はみ出しそうなら反転させる
   const portalContainerRef = useRef<HTMLDivElement>(null)

   return (
      <div>
         <BaseSelect.Root
            value={value}
            onValueChange={(next) => {
               if (next !== null) onValueChange(next)
            }}
            items={options}
            disabled={disabled}
         >
            <BaseSelect.Trigger
               aria-label={label}
               className={clsx(
                  "group inline-flex min-w-24 touch-manipulation select-none items-center justify-between gap-2 rounded-lg border border-white/15 bg-black/40 px-3 py-2 text-sm text-white transition duration-press ease-out focus-visible:outline-2 focus-visible:outline-white/60 focus-visible:outline-offset-2 not-data-disabled:hover:bg-black/60 not-data-disabled:active:scale-97 data-disabled:cursor-not-allowed data-disabled:opacity-50 data-popup-open:bg-black/60",
                  className,
               )}
            >
               <BaseSelect.Value />
               <BaseSelect.Icon className="text-white/60 transition-transform duration-menu ease-out group-data-popup-open:rotate-180">
                  <ChevronDown aria-hidden="true" className="size-4" />
               </BaseSelect.Icon>
            </BaseSelect.Trigger>

            <BaseSelect.Portal container={portalContainerRef}>
               <BaseSelect.Positioner
                  side="bottom"
                  align="end"
                  sideOffset={8}
                  alignItemWithTrigger={false}
                  className="z-prompt outline-none"
               >
                  <BaseSelect.Popup className="glass min-w-(--anchor-width) origin-(--transform-origin) rounded-xl border p-1 shadow-2xl outline-none transition duration-menu ease-out motion-reduce:transition-opacity data-ending-style:scale-95 data-starting-style:scale-95 data-ending-style:opacity-0 data-starting-style:opacity-0 data-ending-style:duration-hint">
                     <BaseSelect.List>
                        {options.map((option) => (
                           <BaseSelect.Item
                              key={String(option.value)}
                              value={option.value}
                              className="flex cursor-default select-none items-center justify-between gap-6 rounded-lg px-3 py-2 text-sm text-white outline-none data-highlighted:bg-white/10"
                           >
                              <BaseSelect.ItemText>
                                 {option.label}
                              </BaseSelect.ItemText>
                              <BaseSelect.ItemIndicator className="text-done-300">
                                 <Check aria-hidden="true" className="size-4" />
                              </BaseSelect.ItemIndicator>
                           </BaseSelect.Item>
                        ))}
                     </BaseSelect.List>
                  </BaseSelect.Popup>
               </BaseSelect.Positioner>
            </BaseSelect.Portal>
         </BaseSelect.Root>
         <div ref={portalContainerRef} />
      </div>
   )
}
