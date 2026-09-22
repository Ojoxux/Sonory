"use client"

import clsx from "clsx"
import { type ReactElement, useEffect, useEffectEvent, useRef } from "react"
import { Drawer } from "vaul"
import { VAUL_TRANSITION_MS } from "./constants"
import type {
   SheetBodyProps,
   SheetContentProps,
   SheetHeaderProps,
   SheetProps,
} from "./types"

/**
 * ボトムシート
 *
 * @description
 * Vaul の Drawer に黒ガラスの地・ハンドル・見出しを載せたもの。
 * 開閉とドラッグの動きは Vaul の既定（iOS のドロワー曲線）に任せる。
 * 中身は `SheetContent` の中に `SheetHeader` と `SheetBody` を置いて組む
 *
 * @param open 開閉状態
 * @param onClose ユーザー操作で閉じようとしたとき
 * @param dismissible false のあいだはユーザー操作で閉じられない
 * @param onExited 閉じるアニメーションが終わったとき。親がここでアンマウントすると退場が見える
 *
 * @example
 * ```tsx
 * <Sheet open={isOpen} onClose={onClose}>
 *    <SheetContent>
 *       <SheetHeader title="設定" />
 *       <SheetBody>…</SheetBody>
 *    </SheetContent>
 * </Sheet>
 * ```
 */
export function Sheet({
   open,
   onClose,
   dismissible = true,
   onExited,
   children,
}: SheetProps): ReactElement {
   const wasOpenRef = useRef(open)
   const handleExited = useEffectEvent(() => onExited?.())

   // Vaul の onAnimationEnd は open を外から false にしたときには呼ばれないため、自前で待つ
   useEffect(() => {
      const wasOpen = wasOpenRef.current
      wasOpenRef.current = open
      if (open || !wasOpen) return
      const timer = setTimeout(handleExited, VAUL_TRANSITION_MS)
      return () => clearTimeout(timer)
   }, [open])

   return (
      <Drawer.Root
         open={open}
         onOpenChange={(next) => {
            if (!next) onClose()
         }}
         dismissible={dismissible}
      >
         <Drawer.Portal>
            <Drawer.Overlay className="fixed inset-0 z-sheet bg-black/50" />
            {children}
         </Drawer.Portal>
      </Drawer.Root>
   )
}

/**
 * シートの面。ハンドルを持ち、高さは中身に合わせて画面の 11/12 まで伸びる
 */
export function SheetContent({ children }: SheetContentProps): ReactElement {
   return (
      <Drawer.Content className="glass fixed inset-x-0 bottom-0 z-sheet flex max-h-11/12 flex-col rounded-t-2xl border-t shadow-2xl outline-none">
         <div
            aria-hidden="true"
            className="mx-auto mt-3 mb-2 h-1 w-12 shrink-0 rounded-full bg-white/20"
         />
         {children}
      </Drawer.Content>
   )
}

/**
 * シートの見出し。`Drawer.Title` を必ず1つ置くためにどのシートもこれを使う
 */
export function SheetHeader({
   title,
   description,
   titleHidden = false,
}: SheetHeaderProps): ReactElement {
   if (titleHidden && description === undefined) {
      return <Drawer.Title className="sr-only">{title}</Drawer.Title>
   }

   return (
      <div className="shrink-0 px-6 pb-4 text-center">
         <Drawer.Title
            className={clsx(
               "font-bold text-white text-xl",
               titleHidden && "sr-only",
            )}
         >
            {title}
         </Drawer.Title>
         {description !== undefined && (
            <Drawer.Description className="mt-1 text-neutral-400 text-sm">
               {description}
            </Drawer.Description>
         )}
      </div>
   )
}

/**
 * シートの本文。見出しを残したまま、はみ出した分だけスクロールする
 */
export function SheetBody({ children }: SheetBodyProps): ReactElement {
   return (
      <div className="safe-bottom min-h-0 overflow-y-auto overscroll-contain">
         {children}
      </div>
   )
}
