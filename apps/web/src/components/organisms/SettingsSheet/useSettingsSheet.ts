"use client"

import { useCallback, useState } from "react"
import { useIsMounted } from "@/hooks/useIsMounted"
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
   notificationPermission: NotificationPermissionStatus
   debugMode: boolean
   handleToggleEnabled: () => Promise<void>
   handleToggleSound: () => void
   handleToggleVibration: () => void
   handleMaxDistanceChange: (value: number) => void
   handleToggleDebugMode: () => void
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

   const handleToggleEnabled = useCallback(async (): Promise<void> => {
      if (notificationSettings.enabled) {
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
   }, [notificationSettings.enabled, updateNotificationSettings])

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

   return {
      isMounted,
      notificationSettings,
      notificationPermission,
      debugMode,
      handleToggleEnabled,
      handleToggleSound,
      handleToggleVibration,
      handleMaxDistanceChange,
      handleToggleDebugMode,
   }
}
