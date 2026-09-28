"use client"

import type { ReactElement } from "react"
import { buttonVariants } from "@/components/atoms/Button/utils"
import {
   Sheet,
   SheetBody,
   SheetContent,
   SheetHeader,
} from "@/components/molecules/Sheet"
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
export function AppInfoSheet({
   isOpen,
   onClose,
}: AppInfoSheetProps): ReactElement {
   return (
      <Sheet open={isOpen} onClose={onClose}>
         <SheetContent>
            <SheetHeader title="Sonory" description={`v${APP_VERSION}`} />

            <SheetBody>
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
            </SheetBody>
         </SheetContent>
      </Sheet>
   )
}
