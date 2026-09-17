"use client"

import { Sheet } from "react-modal-sheet"
import { SettingToggle } from "@/components/atoms/SettingToggle"
import { AccountSection } from "@/components/molecules/AccountSection"
import { MAX_DISTANCE_OPTIONS } from "./constants"
import type { SettingsSheetProps } from "./types"
import { useSettingsSheet } from "./useSettingsSheet"

/**
 * 設定シート
 *
 * @description
 * 通知設定（有効/無効・音・振動・通知範囲）と開発者向けのデバッグモード切り替えを
 * まとめたボトムシート。通知の有効化時にはブラウザの通知権限を要求する。
 * react-modal-sheet を使用してボトムシートとして表示する。
 *
 * @param isOpen シートの開閉状態
 * @param onClose 閉じるときのコールバック
 */
export function SettingsSheet({ isOpen, onClose }: SettingsSheetProps) {
   const {
      isMounted,
      notificationSettings,
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
                  <h2 className="font-bold text-white text-xl">設定</h2>
               </div>
            </Sheet.Header>

            <Sheet.Content className="bg-transparent!">
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
                        checked={notificationSettings.enabled}
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
                        disabled={!notificationSettings.enabled}
                     />

                     <SettingToggle
                        checked={notificationSettings.vibrationEnabled}
                        onChange={handleToggleVibration}
                        label="振動"
                        disabled={!notificationSettings.enabled}
                     />

                     <label className="flex flex-col gap-1.5 rounded-xl border border-white/15 bg-white/5 px-4 py-3">
                        <span className="font-semibold text-sm text-white">
                           通知範囲
                        </span>
                        <select
                           value={notificationSettings.maxDistance}
                           onChange={(event) =>
                              handleMaxDistanceChange(
                                 Number(event.target.value),
                              )
                           }
                           disabled={!notificationSettings.enabled}
                           className="rounded-lg border border-white/15 bg-black/40 px-3 py-2 text-sm text-white disabled:opacity-50"
                        >
                           {MAX_DISTANCE_OPTIONS.map((option) => (
                              <option key={option.value} value={option.value}>
                                 {option.label}
                              </option>
                           ))}
                        </select>
                     </label>
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
            </Sheet.Content>
         </Sheet.Container>

         <Sheet.Backdrop onTap={onClose} />
      </Sheet>
   )
}
