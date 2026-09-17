"use client"

import { motion } from "motion/react"
import { CloseButton } from "@/components/atoms/CloseButton"
import type { ToastProps } from "./types"

/**
 * トースト通知コンポーネント
 *
 * @description
 * 画面全体向けのエラー通知を1件表示する。見た目は ErrorDisplay を踏襲しつつ、
 * 自動で消えるまでの表示と手動の閉じるボタンを持つ点が異なる
 *
 * @param message 表示するメッセージ
 * @param onDismiss 閉じるボタンクリック時のコールバック
 *
 * @example
 * ```tsx
 * <Toast message="録音の開始に失敗しました" onDismiss={() => {}} />
 * ```
 */
export function Toast({ message, onDismiss }: ToastProps) {
   return (
      <motion.div
         className="pointer-events-auto flex w-full max-w-sm items-start gap-1 rounded-xl border border-red-500/30 bg-red-500/10 p-4 backdrop-blur-sm"
         initial={{ opacity: 0, y: -16, scale: 0.95 }}
         animate={{ opacity: 1, y: 0, scale: 1 }}
         exit={{ opacity: 0, scale: 0.95 }}
      >
         <span className="flex-1 text-red-300 text-sm leading-relaxed">
            {message}
         </span>
         <CloseButton onClick={onDismiss} ariaLabel="通知を閉じる" />
      </motion.div>
   )
}
