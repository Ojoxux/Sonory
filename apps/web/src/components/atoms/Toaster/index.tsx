import type { ReactElement } from "react"
import { Toaster as SonnerToaster } from "sonner"

const TOAST_DURATION_MS = 6000

// ヘッダー（地域名とボタン）の下に出す
const TOP_OFFSET = { top: 80 }

/**
 * トーストの表示領域
 *
 * @description
 * ルートレイアウトに1つだけ置く。表示は `sonner` の `toast.error()` などを
 * どこからでも呼べばよい。見た目は Sonner の既定を外し、黒ガラスと役割色に揃える
 */
export function Toaster(): ReactElement {
   return (
      <SonnerToaster
         theme="dark"
         position="top-center"
         offset={TOP_OFFSET}
         mobileOffset={TOP_OFFSET}
         closeButton
         // Sonner は自前のシステムフォントを当てるため、本文のフォントを引き継がせる
         style={{ fontFamily: "inherit" }}
         toastOptions={{
            unstyled: true,
            duration: TOAST_DURATION_MS,
            classNames: {
               // 線と文字の色は種類ごとに当てる。基本側にも書くと出力順で勝敗が決まる
               toast: "flex w-full items-start gap-1 rounded-xl border bg-neutral-950/90 p-4 text-sm leading-relaxed shadow-lg backdrop-blur-md",
               error: "border-danger-500/30 text-danger-300",
               content: "flex-1",
               closeButton:
                  "order-last shrink-0 p-2 text-neutral-400 transition-colors hover:text-white",
               icon: "hidden",
            },
         }}
      />
   )
}
