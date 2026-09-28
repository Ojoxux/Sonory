"use client"

import { clsx } from "clsx"
import { MIC_PERMISSION_DESCRIPTIONS } from "./constants"
import type { MicPermissionToggleProps } from "./types"

/**
 * マイク許可トグル
 *
 * @description
 * 録音前の確認画面でマイク権限を要求するコントロール。
 * ブラウザの権限は JS から取り消せないため、許可後は操作不能にする。
 * 拒否された場合は再タップを許可する（毎回聞き直すブラウザがあるため）。
 *
 * @param state マイク権限の状態
 * @param onRequest 許可要求時のコールバック
 * @param className 追加のCSSクラス
 */
export function MicPermissionToggle({
   state,
   onRequest,
   className = "",
}: MicPermissionToggleProps) {
   const isGranted = state === "granted"
   const isDenied = state === "denied"
   const isLocked = isGranted || state === "requesting"

   return (
      <button
         type="button"
         role="switch"
         aria-checked={isGranted}
         aria-label="マイクの使用を許可"
         aria-describedby="mic-permission-description"
         disabled={isLocked}
         onClick={onRequest}
         className={clsx(
            "flex w-full touch-manipulation items-center justify-between gap-3 rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-left transition duration-press ease-out not-disabled:hover:bg-white/10 not-disabled:active:scale-97",
            className,
         )}
      >
         <span className="flex flex-col gap-0.5">
            <span className="font-semibold text-sm text-white">
               マイクの使用を許可
            </span>
            <span
               id="mic-permission-description"
               className={clsx(
                  "text-xs",
                  isDenied ? "text-danger-300" : "text-neutral-300",
               )}
            >
               {MIC_PERMISSION_DESCRIPTIONS[state]}
            </span>
         </span>

         <span
            aria-hidden="true"
            className={clsx(
               "relative inline-flex h-6 w-11 shrink-0 rounded-full transition-colors duration-menu ease-out",
               isGranted
                  ? "bg-done-500"
                  : isDenied
                    ? "bg-danger-500/60"
                    : "bg-white/20",
            )}
         >
            <span
               className={clsx(
                  "absolute top-0.5 left-0.5 size-5 rounded-full bg-white shadow transition-transform duration-menu ease-out",
                  isGranted ? "translate-x-5" : "translate-x-0",
               )}
            />
         </span>
      </button>
   )
}
