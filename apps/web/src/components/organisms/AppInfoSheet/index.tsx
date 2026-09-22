"use client"

import { Sheet } from "react-modal-sheet"
import { buttonVariants } from "@/components/atoms/Button/utils"
import { useIsMounted } from "@/hooks/useIsMounted"
import { APP_DESCRIPTION, LIBRARY_CREDITS, REPOSITORY_URL } from "./constants"
import type { AppInfoSheetProps } from "./types"

const APP_VERSION = process.env.NEXT_PUBLIC_APP_VERSION || "0.0.0"

/**
 * アプリ情報シート
 *
 * @description
 * アプリ名・バージョン・主要ライブラリのクレジット・リポジトリへのリンクを表示する
 * 静的なボトムシート。状態は持たない。
 *
 * @param isOpen シートの開閉状態
 * @param onClose 閉じるときのコールバック
 */
export function AppInfoSheet({ isOpen, onClose }: AppInfoSheetProps) {
   const isMounted = useIsMounted()

   if (!isMounted) {
      return null
   }

   return (
      <Sheet
         isOpen={isOpen}
         onClose={onClose}
         detent="content"
         snapPoints={[0, 1]}
         initialSnap={1}
         tweenConfig={{ ease: "easeInOut", duration: 0.3 }}
      >
         <Sheet.Container className="border-t! border-white/10! bg-black/95! shadow-2xl! backdrop-blur-xl!">
            <Sheet.Header className="bg-transparent!">
               <div className="flex flex-col items-center px-6 pt-4 pb-2">
                  <div className="mb-2 h-1 w-12 rounded-full bg-white/20" />
                  <h2 className="font-bold text-white text-xl">Sonory</h2>
                  <p className="mt-1 text-neutral-400 text-xs">
                     v{APP_VERSION}
                  </p>
               </div>
            </Sheet.Header>

            <Sheet.Content className="bg-transparent!">
               <div className="space-y-6 px-6 pb-6">
                  <p className="text-neutral-300 text-sm">{APP_DESCRIPTION}</p>

                  <section className="space-y-2">
                     <h3 className="font-semibold text-lg text-white">
                        主要ライブラリ
                     </h3>
                     <ul className="space-y-1.5">
                        {LIBRARY_CREDITS.map((credit) => (
                           <li
                              key={credit.name}
                              className="flex items-center justify-between rounded-xl border border-white/15 bg-white/5 px-4 py-2.5"
                           >
                              <span className="font-medium text-sm text-white">
                                 {credit.name}
                              </span>
                              <span className="text-neutral-400 text-xs">
                                 {credit.description}
                              </span>
                           </li>
                        ))}
                     </ul>
                  </section>

                  <a
                     href={REPOSITORY_URL}
                     target="_blank"
                     rel="noopener noreferrer"
                     className={buttonVariants({ block: true })}
                  >
                     リポジトリを見る
                  </a>
               </div>
            </Sheet.Content>
         </Sheet.Container>

         <Sheet.Backdrop onTap={onClose} />
      </Sheet>
   )
}
