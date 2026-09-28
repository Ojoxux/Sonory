"use client"

import { useEffect, useState } from "react"
import { MdInfo, MdSettings } from "react-icons/md"
import { CompassButton } from "@/components/atoms/CompassButton"
import { IconButton } from "@/components/atoms/IconButton"
import { LocationDisplay } from "@/components/atoms/LocationDisplay"
import type { AppHeaderProps } from "./types"
import { isNightHour } from "./utils"

/**
 * アプリケーションヘッダーコンポーネント
 *
 * @description
 * 現在地の地域名と設定ボタンを含むヘッダーMoleculeコンポーネント
 * 地図が暗い時間帯は白系、明るい時間帯は黒系の文字とアイコンにする
 *
 * @param onSettingsClick 設定ボタンがクリックされた時のコールバック
 * @param onAppInfoClick アプリ情報ボタンがクリックされた時のコールバック
 * @param latitude 緯度
 * @param longitude 経度
 * @param mapBearing マップのbearing（回転角度）
 * @param onCompassClick コンパスボタンがクリックされた時のコールバック
 * @param debugTimeOverride デバッグ用時間オーバーライド（時間のみ0-23）
 *
 * @example
 * ```tsx
 * <AppHeader
 *   onSettingsClick={() => console.log('設定')}
 *   latitude={37.1234}
 *   longitude={139.1234}
 * />
 * ```
 */
export function AppHeader({
   onSettingsClick,
   onAppInfoClick,
   onCompassClick,
   latitude,
   longitude,
   debugTimeOverride = null,
   mapBearing,
}: AppHeaderProps) {
   // サーバーとクライアントで時刻がずれるため、時刻はマウント後に読む
   const [currentHour, setCurrentHour] = useState<number | null>(null)

   useEffect(() => {
      const update = (): void => setCurrentHour(new Date().getHours())
      update()
      const interval = setInterval(update, 60000)
      return () => clearInterval(interval)
   }, [])

   const hour = debugTimeOverride ?? currentHour
   const isDarkTime = hour !== null && isNightHour(hour)

   const iconClass = isDarkTime
      ? "bg-white/10 text-white hover:bg-white/20"
      : "bg-black/10 text-neutral-900 hover:bg-black/20"

   return (
      <header className="pointer-events-none fixed top-0 right-0 left-0 z-chrome">
         <div className="flex items-start justify-between p-6">
            {/* 入りは初回の描画だけ。右のグループを少し遅らせる */}
            <div className="pointer-events-auto flex flex-col items-start gap-2 transition duration-menu ease-out starting:-translate-y-2 starting:opacity-0">
               <LocationDisplay
                  latitude={latitude}
                  longitude={longitude}
                  isDarkTime={isDarkTime}
               />

               <CompassButton
                  onClick={onCompassClick}
                  mapBearing={mapBearing}
                  isDarkMode={isDarkTime}
               />
            </div>

            <div className="pointer-events-auto flex items-center gap-3 transition delay-40 duration-menu ease-out starting:-translate-y-2 starting:opacity-0">
               <IconButton
                  icon={<MdInfo className="h-5 w-5" />}
                  ariaLabel="アプリ情報"
                  onClick={onAppInfoClick}
                  className={`${iconClass} backdrop-blur-sm`}
               />

               <IconButton
                  icon={<MdSettings className="h-5 w-5" />}
                  ariaLabel="設定"
                  onClick={onSettingsClick}
                  className={`${iconClass} backdrop-blur-sm`}
               />
            </div>
         </div>
      </header>
   )
}
