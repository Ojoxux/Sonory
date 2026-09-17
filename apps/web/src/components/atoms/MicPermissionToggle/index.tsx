"use client"

import { motion } from "motion/react"
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
 * @param isClosing 閉じるアニメーション中かどうか
 * @param className 追加のCSSクラス
 */
export function MicPermissionToggle({
   state,
   onRequest,
   isClosing,
   className = "",
}: MicPermissionToggleProps) {
   const isGranted = state === "granted"
   const isDenied = state === "denied"
   const isLocked = isGranted || state === "requesting"

   const trackColor = isGranted
      ? "bg-green-500"
      : isDenied
        ? "bg-red-500/60"
        : "bg-white/20"

   return (
      <motion.div
         className={`relative z-50 mb-4 ${className}`}
         initial={{ opacity: 0, y: 30 }}
         animate={isClosing ? { opacity: 0, y: 20 } : { opacity: 1, y: 0 }}
         transition={
            isClosing ? { duration: 0.2 } : { delay: 1.5, duration: 0.6 }
         }
      >
         <button
            type="button"
            role="switch"
            aria-checked={isGranted}
            aria-label="マイクの使用を許可"
            aria-describedby="mic-permission-description"
            disabled={isLocked}
            onClick={onRequest}
            className="pointer-events-auto flex w-full items-center justify-between gap-3 rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-left transition-colors duration-300 hover:bg-white/10 disabled:hover:bg-white/5"
         >
            <span className="flex flex-col gap-0.5">
               <span className="font-semibold text-sm text-white">
                  マイクの使用を許可
               </span>
               <span
                  id="mic-permission-description"
                  className={`text-xs ${isDenied ? "text-red-300" : "text-neutral-300"}`}
               >
                  {MIC_PERMISSION_DESCRIPTIONS[state]}
               </span>
            </span>

            <span
               aria-hidden="true"
               className={`relative inline-flex h-6 w-11 shrink-0 rounded-full transition-colors duration-300 ${trackColor}`}
            >
               <span
                  className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform duration-300 ${
                     isGranted ? "translate-x-5" : "translate-x-0"
                  }`}
               />
            </span>
         </button>
      </motion.div>
   )
}
