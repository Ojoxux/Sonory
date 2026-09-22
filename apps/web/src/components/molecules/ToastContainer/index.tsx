"use client"

import { AnimatePresence } from "motion/react"
import { Toast } from "@/components/atoms/Toast"
import { useToastStore } from "@/store/useToastStore"

/**
 * トースト通知の表示エリア
 *
 * @description
 * useToastStore の内容を画面上部に積み上げて表示するMoleculeコンポーネント。
 * アプリ全体で1箇所（UIOverlay）にマウントし、`showErrorToast` から
 * どのフックからでも通知できるようにする
 *
 * @example
 * ```tsx
 * <ToastContainer />
 * ```
 */
export function ToastContainer() {
   const { toasts, removeToast } = useToastStore()

   return (
      <div className="pointer-events-none fixed inset-x-0 top-20 z-chrome flex flex-col items-center gap-2 px-4">
         <AnimatePresence>
            {toasts.map((toast) => (
               <Toast
                  key={toast.id}
                  message={toast.message}
                  onDismiss={() => removeToast(toast.id)}
               />
            ))}
         </AnimatePresence>
      </div>
   )
}
