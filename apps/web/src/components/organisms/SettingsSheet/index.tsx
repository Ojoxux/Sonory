"use client"

import { Select } from "@/components/atoms/Select"
import { SettingToggle } from "@/components/atoms/SettingToggle"
import { AccountSection } from "@/components/molecules/AccountSection"
import {
   Sheet,
   SheetBody,
   SheetContent,
   SheetHeader,
} from "@/components/molecules/Sheet"
import { MAX_DISTANCE_OPTIONS } from "./constants"
import type { SettingsSheetProps } from "./types"
import { useSettingsSheet } from "./useSettingsSheet"

/**
 * 設定シート
 *
 * @description
 * 通知設定（有効/無効・音・振動・通知範囲）と開発者向けのデバッグモード切り替えを
 * まとめたボトムシート。通知の有効化時にはブラウザの通知権限を要求する。
 *
 * @param isOpen シートの開閉状態
 * @param onClose 閉じるときのコールバック
 */
export function SettingsSheet({ isOpen, onClose }: SettingsSheetProps) {
   const {
      isMounted,
      notificationSettings,
      isNotificationOn,
      notificationPermission,
      debugMode,
      handleToggleEnabled,
      handleToggleSound,
      handleToggleVibration,
      handleMaxDistanceChange,
      handleToggleDebugMode,
      isAnonymous,
      email,
      isAccountBusy,
      handleLinkGoogle,
      handleSignInWithGoogle,
      handleSignOut,
   } = useSettingsSheet()

   if (!isMounted) {
      return null
   }

   return (
      <Sheet open={isOpen} onClose={onClose}>
         <SheetContent>
            <SheetHeader title="設定" />

            <SheetBody>
               <div className="space-y-6 px-6 pb-6">
                  <AccountSection
                     isAnonymous={isAnonymous}
                     email={email}
                     isBusy={isAccountBusy}
                     onLink={handleLinkGoogle}
                     onSignIn={handleSignInWithGoogle}
                     onSignOut={handleSignOut}
                  />

                  <section className="space-y-3">
                     <h3 className="font-semibold text-lg text-white">通知</h3>

                     <SettingToggle
                        checked={isNotificationOn}
                        onChange={handleToggleEnabled}
                        label="通知"
                        description={
                           notificationPermission === "denied"
                              ? "ブラウザの設定から通知を許可してください"
                              : "近くに新しい音声ピンが投稿されたときに知らせる"
                        }
                     />

                     <SettingToggle
                        checked={notificationSettings.soundEnabled}
                        onChange={handleToggleSound}
                        label="音"
                        disabled={!isNotificationOn}
                     />

                     <SettingToggle
                        checked={notificationSettings.vibrationEnabled}
                        onChange={handleToggleVibration}
                        label="振動"
                        disabled={!isNotificationOn}
                     />

                     <div className="flex items-center justify-between gap-3 rounded-xl border border-white/15 bg-white/5 px-4 py-3">
                        <span className="font-semibold text-sm text-white">
                           通知範囲
                        </span>
                        <Select
                           label="通知範囲"
                           value={notificationSettings.maxDistance}
                           onValueChange={handleMaxDistanceChange}
                           options={MAX_DISTANCE_OPTIONS}
                           disabled={!isNotificationOn}
                        />
                     </div>
                  </section>

                  <section className="space-y-3">
                     <h3 className="font-semibold text-lg text-white">
                        開発者向け
                     </h3>

                     <SettingToggle
                        checked={debugMode}
                        onChange={handleToggleDebugMode}
                        label="デバッグモード"
                     />
                  </section>
               </div>
            </SheetBody>
         </SheetContent>
      </Sheet>
   )
}
