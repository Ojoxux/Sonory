"use client"

import { useEffect, useState } from "react"
import type { RealtimeNotification } from "@/store/useRealtimeStore"
import { useRealtimeStore } from "@/store/useRealtimeStore"

/**
 * NotificationCenterのプロパティ型定義
 */
export interface NotificationCenterProps {
   /** 通知の表示位置 */
   position?: "top" | "bottom"
   /** 最大表示通知数 */
   maxNotifications?: number
   /** 自動非表示時間（ミリ秒） */
   autoHideDuration?: number
   /** ピンクリック時のコールバック */
   onPinClick?: (pinId: string) => void
}

/**
 * 通知バナーコンポーネント
 */
interface NotificationBannerProps {
   /** 通知データ */
   notification: RealtimeNotification
   /** 閉じるボタンクリック時のコールバック */
   onClose: () => void
   /** ピンを見るボタンクリック時のコールバック */
   onPinClick: (pinId: string) => void
}

/**
 * 通知バナーコンポーネント
 *
 * @param props - NotificationBannerProps
 * @returns 通知バナーJSX
 */
function NotificationBanner({
   notification,
   onClose,
   onPinClick,
}: NotificationBannerProps) {
   const formatDistance = (distance: number): string => {
      if (distance < 1000) {
         return `${distance}m先`
      }
      return `${(distance / 1000).toFixed(1)}km先`
   }

   const formatTime = (timestamp: Date): string => {
      const now = new Date()
      const diff = now.getTime() - timestamp.getTime()
      const minutes = Math.floor(diff / 60000)

      if (minutes < 1) return "たった今"
      if (minutes < 60) return `${minutes}分前`

      const hours = Math.floor(minutes / 60)
      if (hours < 24) return `${hours}時間前`

      return timestamp.toLocaleDateString()
   }

   const getNotificationIcon = (type: RealtimeNotification["type"]): string => {
      switch (type) {
         case "new_pin":
            return "📍"
         case "pin_analysis_complete":
            return "🔍"
         default:
            return "🔔"
      }
   }

   const getNotificationTitle = (
      notification: RealtimeNotification,
   ): string => {
      switch (notification.type) {
         case "new_pin":
            return "新しい音声ピンが投稿されました"
         case "pin_analysis_complete":
            return "音声分析が完了しました"
         default:
            return "通知"
      }
   }

   return (
      <div className="notification-banner mb-3 animate-slide-in rounded-lg border border-gray-200 bg-white p-4 shadow-lg">
         <div className="flex items-start justify-between">
            <div className="flex flex-1 items-start space-x-3">
               <div className="text-2xl">
                  {getNotificationIcon(notification.type)}
               </div>
               <div className="min-w-0 flex-1">
                  <h4 className="mb-1 font-medium text-gray-900 text-sm">
                     {getNotificationTitle(notification)}
                  </h4>
                  <p className="mb-2 text-gray-600 text-xs">
                     {formatDistance(notification.distance)} •{" "}
                     {formatTime(notification.timestamp)}
                  </p>
                  {notification.data?.primaryLabel && (
                     <p className="font-medium text-blue-600 text-xs">
                        🎵 {notification.data.primaryLabel}
                        {notification.data.confidence && (
                           <span className="ml-1 text-gray-500">
                              ({Math.round(notification.data.confidence * 100)}
                              %)
                           </span>
                        )}
                     </p>
                  )}
               </div>
            </div>
            <div className="ml-3 flex items-center space-x-2">
               <button
                  type="button"
                  onClick={() => onPinClick(notification.pinId)}
                  className="rounded-md bg-blue-500 px-3 py-1 text-white text-xs transition-colors hover:bg-blue-600"
               >
                  ピンを見る
               </button>
               <button
                  type="button"
                  onClick={onClose}
                  className="text-gray-400 transition-colors hover:text-gray-600"
                  aria-label="通知を閉じる"
               >
                  <svg
                     className="h-4 w-4"
                     fill="none"
                     stroke="currentColor"
                     viewBox="0 0 24 24"
                  >
                     <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M6 18L18 6M6 6l12 12"
                     />
                  </svg>
               </button>
            </div>
         </div>
      </div>
   )
}

/**
 * 通知設定パネルコンポーネント
 */
interface NotificationSettingsProps {
   /** 設定値 */
   settings: {
      enabled: boolean
      soundEnabled: boolean
      vibrationEnabled: boolean
      maxDistance: number
   }
   /** 設定更新時のコールバック */
   onUpdate: (
      settings: Partial<{
         enabled: boolean
         soundEnabled: boolean
         vibrationEnabled: boolean
         maxDistance: number
      }>,
   ) => void
   /** パネルを閉じる時のコールバック */
   onClose: () => void
}

/**
 * 通知設定パネルコンポーネント
 *
 * @param props - NotificationSettingsProps
 * @returns 通知設定パネルJSX
 */
function NotificationSettings({
   settings,
   onUpdate,
   onClose,
}: NotificationSettingsProps) {
   return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
         <div className="mx-4 w-full max-w-md rounded-lg bg-white p-6">
            <div className="mb-4 flex items-center justify-between">
               <h3 className="font-semibold text-gray-900 text-lg">通知設定</h3>
               <button
                  type="button"
                  onClick={onClose}
                  className="text-gray-400 transition-colors hover:text-gray-600"
                  aria-label="設定を閉じる"
               >
                  <svg
                     className="h-5 w-5"
                     fill="none"
                     stroke="currentColor"
                     viewBox="0 0 24 24"
                  >
                     <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M6 18L18 6M6 6l12 12"
                     />
                  </svg>
               </button>
            </div>

            <div className="space-y-4">
               <label className="flex items-center space-x-3">
                  <input
                     type="checkbox"
                     checked={settings.enabled}
                     onChange={(e) => onUpdate({ enabled: e.target.checked })}
                     className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-gray-700 text-sm">
                     通知を有効にする
                  </span>
               </label>

               {settings.enabled && (
                  <>
                     <label className="flex items-center space-x-3">
                        <input
                           type="checkbox"
                           checked={settings.soundEnabled}
                           onChange={(e) =>
                              onUpdate({ soundEnabled: e.target.checked })
                           }
                           className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="text-gray-700 text-sm">
                           音声アラート
                        </span>
                     </label>

                     <label className="flex items-center space-x-3">
                        <input
                           type="checkbox"
                           checked={settings.vibrationEnabled}
                           onChange={(e) =>
                              onUpdate({ vibrationEnabled: e.target.checked })
                           }
                           className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="text-gray-700 text-sm">
                           振動アラート
                        </span>
                     </label>

                     <div className="space-y-2">
                        <label className="block text-gray-700 text-sm">
                           通知範囲: {settings.maxDistance}m
                        </label>
                        <input
                           type="range"
                           min="100"
                           max="5000"
                           step="100"
                           value={settings.maxDistance}
                           onChange={(e) =>
                              onUpdate({
                                 maxDistance: Number.parseInt(e.target.value),
                              })
                           }
                           className="h-2 w-full cursor-pointer appearance-none rounded-lg bg-gray-200"
                        />
                        <div className="flex justify-between text-gray-500 text-xs">
                           <span>100m</span>
                           <span>5km</span>
                        </div>
                     </div>
                  </>
               )}
            </div>

            <div className="mt-6 flex justify-end">
               <button
                  type="button"
                  onClick={onClose}
                  className="rounded-md bg-blue-500 px-4 py-2 text-sm text-white transition-colors hover:bg-blue-600"
               >
                  完了
               </button>
            </div>
         </div>
      </div>
   )
}

/**
 * 通知センターコンポーネント
 *
 * @description
 * リアルタイム通知の表示と管理を行います。
 * 新しいピンの通知、設定パネル、通知履歴を提供します。
 *
 * @param props - NotificationCenterProps
 * @returns 通知センターJSX
 */
export default function NotificationCenter({
   position = "top",
   maxNotifications = 5,
   autoHideDuration = 5000,
   onPinClick,
}: NotificationCenterProps) {
   const {
      recentNotifications,
      notificationSettings,
      markNotificationAsRead,
      updateNotificationSettings,
      // clearNotifications,
   } = useRealtimeStore()

   const [visibleNotifications, setVisibleNotifications] = useState<string[]>(
      [],
   )
   const [showSettings, setShowSettings] = useState(false)

   // 新しい通知の自動表示管理
   useEffect(() => {
      const unreadNotifications = recentNotifications
         .filter((n) => !n.isRead)
         .slice(0, maxNotifications)

      const newVisibleIds = unreadNotifications.map((n) => n.id)
      setVisibleNotifications(newVisibleIds)

      // 自動非表示タイマー
      if (autoHideDuration > 0) {
         const timers = newVisibleIds.map((id) =>
            setTimeout(() => {
               setVisibleNotifications((prev) =>
                  prev.filter((visibleId) => visibleId !== id),
               )
               markNotificationAsRead(id)
            }, autoHideDuration),
         )

         return () => {
            for (const timer of timers) {
               clearTimeout(timer)
            }
         }
      }
   }, [
      recentNotifications,
      maxNotifications,
      autoHideDuration,
      markNotificationAsRead,
   ])

   const handleNotificationClose = (notificationId: string) => {
      setVisibleNotifications((prev) =>
         prev.filter((id) => id !== notificationId),
      )
      markNotificationAsRead(notificationId)
   }

   const handlePinClick = (pinId: string) => {
      onPinClick?.(pinId)
      // 通知を既読にする
      const notification = recentNotifications.find((n) => n.pinId === pinId)
      if (notification) {
         handleNotificationClose(notification.id)
      }
   }

   const displayedNotifications = recentNotifications.filter((n) =>
      visibleNotifications.includes(n.id),
   )

   const positionClasses = position === "top" ? "top-4" : "bottom-4"

   return (
      <>
         {/* 通知バナー表示エリア */}
         <div className={`fixed right-4 ${positionClasses} z-40 w-80 max-w-sm`}>
            {displayedNotifications.map((notification) => (
               <NotificationBanner
                  key={notification.id}
                  notification={notification}
                  onClose={() => handleNotificationClose(notification.id)}
                  onPinClick={handlePinClick}
               />
            ))}
         </div>

         {/* 通知設定ボタン */}
         <div className="fixed top-4 left-4 z-30">
            <button
               type="button"
               onClick={() => setShowSettings(true)}
               className="rounded-lg border border-gray-200 bg-white p-2 shadow-md transition-shadow hover:shadow-lg"
               aria-label="通知設定"
            >
               <div className="relative">
                  <svg
                     className="h-5 w-5 text-gray-600"
                     fill="none"
                     stroke="currentColor"
                     viewBox="0 0 24 24"
                  >
                     <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 17h5l-5 5-5-5h5v-12h5v12z"
                     />
                  </svg>
                  {recentNotifications.filter((n) => !n.isRead).length > 0 && (
                     <div className="-top-1 -right-1 absolute h-3 w-3 rounded-full bg-red-500" />
                  )}
               </div>
            </button>
         </div>

         {/* 通知設定パネル */}
         {showSettings && (
            <NotificationSettings
               settings={notificationSettings}
               onUpdate={updateNotificationSettings}
               onClose={() => setShowSettings(false)}
            />
         )}

         {/* カスタムCSS */}
         <style jsx>{`
            @keyframes slide-in {
               from {
                  transform: translateX(100%);
                  opacity: 0;
               }
               to {
                  transform: translateX(0);
                  opacity: 1;
               }
            }

            .animate-slide-in {
               animation: slide-in 0.3s ease-out;
            }
         `}</style>
      </>
   )
}
