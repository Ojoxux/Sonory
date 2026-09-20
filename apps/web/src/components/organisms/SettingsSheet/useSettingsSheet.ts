"use client"

import { useCallback, useState } from "react"
import { useIsMounted } from "@/hooks/useIsMounted"
import {
   linkGoogleAccount,
   signInWithGoogle,
   signOutToAnonymous,
} from "@/services/supabase"
import { useAuthStore } from "@/store/useAuthStore"
import { useDebugStore } from "@/store/useDebugStore"
import type { NotificationSettings } from "@/store/useRealtimeStore"
import { useRealtimeStore } from "@/store/useRealtimeStore"
import { showErrorToast } from "@/store/useToastStore"
import type { NotificationPermissionStatus } from "@/utils/notifications"
import {
   getNotificationPermission,
   requestNotificationPermission,
} from "@/utils/notifications"

/**
 * SettingsSheetのカスタムフック
 *
 * @description
 * 通知設定は `persist` で localStorage から復元されるため、SSR の初期値との
 * 不一致を避けるためマウント完了まで `isMounted` を false にしておく。
 *
 * @returns 設定シートで使用する状態と操作関数のセット
 */
export function useSettingsSheet(): {
   isMounted: boolean
   notificationSettings: NotificationSettings
   isNotificationOn: boolean
   notificationPermission: NotificationPermissionStatus
   debugMode: boolean
   handleToggleEnabled: () => Promise<void>
   handleToggleSound: () => void
   handleToggleVibration: () => void
   handleMaxDistanceChange: (value: number) => void
   handleToggleDebugMode: () => void
   isAnonymous: boolean
   email: string | null
   isAccountBusy: boolean
   handleLinkGoogle: () => Promise<void>
   handleSignInWithGoogle: () => Promise<void>
   handleSignOut: () => Promise<void>
} {
   const isMounted = useIsMounted()
   // SSR では Notification API が無いため "default"。クライアントの初回レンダーで
   // 実際の値を読む（描画は isMounted のガードで抑えているので不一致にならない）
   const [notificationPermission, setNotificationPermission] =
      useState<NotificationPermissionStatus>(() =>
         typeof window === "undefined"
            ? "default"
            : getNotificationPermission(),
      )

   const { notificationSettings, updateNotificationSettings } =
      useRealtimeStore()
   const { debugMode, toggleDebugMode } = useDebugStore()
   const { isAnonymous, email } = useAuthStore()
   const [isAccountBusy, setIsAccountBusy] = useState(false)

   // 設定だけ ON でもブラウザで許可されていなければ届かないので、両方そろって初めて ON と見せる
   const isNotificationOn =
      notificationSettings.enabled && notificationPermission === "granted"

   const handleToggleEnabled = useCallback(async (): Promise<void> => {
      if (isNotificationOn) {
         updateNotificationSettings({ enabled: false })
         return
      }

      const granted = await requestNotificationPermission()
      setNotificationPermission(getNotificationPermission())

      if (granted) {
         updateNotificationSettings({ enabled: true })
      } else {
         showErrorToast("通知を許可できませんでした")
      }
   }, [isNotificationOn, updateNotificationSettings])

   const handleToggleSound = useCallback((): void => {
      updateNotificationSettings({
         soundEnabled: !notificationSettings.soundEnabled,
      })
   }, [notificationSettings.soundEnabled, updateNotificationSettings])

   const handleToggleVibration = useCallback((): void => {
      updateNotificationSettings({
         vibrationEnabled: !notificationSettings.vibrationEnabled,
      })
   }, [notificationSettings.vibrationEnabled, updateNotificationSettings])

   const handleMaxDistanceChange = useCallback(
      (value: number): void => {
         updateNotificationSettings({ maxDistance: value })
      },
      [updateNotificationSettings],
   )

   const handleToggleDebugMode = useCallback((): void => {
      toggleDebugMode()
   }, [toggleDebugMode])

   // 成功時はブラウザが Google へ遷移するので、busy を戻すのは失敗したときだけ
   const startOAuth = useCallback(
      async (start: () => Promise<string | null>): Promise<void> => {
         setIsAccountBusy(true)
         const error = await start()
         if (error) {
            showErrorToast("Google アカウントでの認証を開始できませんでした")
            setIsAccountBusy(false)
         }
      },
      [],
   )

   const handleLinkGoogle = useCallback(
      (): Promise<void> => startOAuth(linkGoogleAccount),
      [startOAuth],
   )

   const handleSignInWithGoogle = useCallback(
      (): Promise<void> => startOAuth(signInWithGoogle),
      [startOAuth],
   )

   const handleSignOut = useCallback(async (): Promise<void> => {
      setIsAccountBusy(true)
      await signOutToAnonymous()
      setIsAccountBusy(false)
   }, [])

   return {
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
   }
}
