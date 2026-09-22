"use client"

import { useState } from "react"
import { Button } from "@/components/atoms/Button"
import type { AccountSectionProps } from "./types"

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
               <Button intent="accent" block onClick={onLink} disabled={isBusy}>
                  Google アカウントと連携
               </Button>

               {isConfirmingSignIn ? (
                  <div className="space-y-2 rounded-lg border border-warn-500/30 bg-warn-500/10 px-3 py-2">
                     <p className="text-sm text-warn-300 leading-relaxed">
                        この端末で作ったピンは、ログイン後に編集・削除できなくなります
                     </p>
                     <div className="flex gap-2">
                        <Button
                           intent="accent"
                           size="sm"
                           onClick={onSignIn}
                           disabled={isBusy}
                           className="flex-1"
                        >
                           ログインする
                        </Button>
                        <Button
                           size="sm"
                           onClick={() => setIsConfirmingSignIn(false)}
                           className="flex-1"
                        >
                           やめる
                        </Button>
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
               <Button block onClick={onSignOut} disabled={isBusy}>
                  ログアウト
               </Button>
            </div>
         )}
      </section>
   )
}
