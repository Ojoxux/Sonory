"use client"

import { useState } from "react"
import type { AccountSectionProps } from "./types"

const BUTTON_CLASS =
   "w-full rounded-xl bg-white/90 px-4 py-3 font-semibold text-black text-sm transition-colors hover:bg-white disabled:opacity-50"

/**
 * 設定シートのアカウント欄
 *
 * @description
 * 匿名ユーザーには Google 連携の導線を、連携済みユーザーにはメールアドレスとログアウトを出す。
 * 連携済みアカウントでのログインは、この端末で作ったピンを失うので一段階確認を挟む。
 */
export function AccountSection({
   isAnonymous,
   email,
   isBusy,
   onLink,
   onSignIn,
   onSignOut,
}: AccountSectionProps) {
   const [isConfirmingSignIn, setIsConfirmingSignIn] = useState(false)

   return (
      <section className="space-y-3">
         <h3 className="font-semibold text-lg text-white">アカウント</h3>

         {isAnonymous ? (
            <div className="space-y-3 rounded-xl border border-white/15 bg-white/5 px-4 py-3">
               <p className="text-neutral-300 text-sm leading-relaxed">
                  別の端末でも、この端末で作ったピンを引き継げます
               </p>
               <button
                  type="button"
                  onClick={onLink}
                  disabled={isBusy}
                  className={BUTTON_CLASS}
               >
                  Google アカウントと連携
               </button>

               {isConfirmingSignIn ? (
                  <div className="space-y-2 rounded-lg border border-warn-500/30 bg-warn-500/10 px-3 py-2">
                     <p className="text-sm text-warn-300 leading-relaxed">
                        この端末で作ったピンは、ログイン後に編集・削除できなくなります
                     </p>
                     <div className="flex gap-2">
                        <button
                           type="button"
                           onClick={onSignIn}
                           disabled={isBusy}
                           className="flex-1 rounded-lg bg-white/90 px-3 py-2 font-semibold text-black text-sm disabled:opacity-50"
                        >
                           ログインする
                        </button>
                        <button
                           type="button"
                           onClick={() => setIsConfirmingSignIn(false)}
                           className="flex-1 rounded-lg border border-white/15 px-3 py-2 text-sm text-white"
                        >
                           やめる
                        </button>
                     </div>
                  </div>
               ) : (
                  <p className="text-neutral-400 text-sm">
                     すでに連携済みですか？{" "}
                     <button
                        type="button"
                        onClick={() => setIsConfirmingSignIn(true)}
                        disabled={isBusy}
                        className="underline disabled:opacity-50"
                     >
                        ログイン
                     </button>
                  </p>
               )}
            </div>
         ) : (
            <div className="space-y-3 rounded-xl border border-white/15 bg-white/5 px-4 py-3">
               <p className="text-sm text-white">
                  {email ?? "Google アカウント"} で連携中
               </p>
               <button
                  type="button"
                  onClick={onSignOut}
                  disabled={isBusy}
                  className="w-full rounded-xl border border-white/15 px-4 py-3 text-sm text-white disabled:opacity-50"
               >
                  ログアウト
               </button>
            </div>
         )}
      </section>
   )
}
