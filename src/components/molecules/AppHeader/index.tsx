'use client'

import { CompassIcon } from '@/components/atoms/CompassIcon'
import { IconButton } from '@/components/atoms/IconButton'
import { LocationDisplay } from '@/components/atoms/LocationDisplay'
import { useEffect, useState } from 'react'
import { MdInfo, MdSettings } from 'react-icons/md'
import type { AppHeaderProps } from './type'

/**
 * アプリケーションヘッダーコンポーネント
 *
 * @description
 * 現在地の地域名と設定ボタンを含むヘッダーMoleculeコンポーネント
 * 時間帯に応じてアイコンの色も変更
 *
 * @param onSettingsClick 設定ボタンがクリックされた時のコールバック
 * @param latitude 緯度
 * @param longitude 経度
 * @param mapBearing マップのbearing（回転角度）
 * @param onCompassClick コンパスボタンがクリックされた時のコールバック
 * @param debugTimeOverride デバッグ用時間オーバーライド（時間のみ0-23）
 * @param mapBearing マップのbearing（回転角度）
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
  onCompassClick,
  latitude,
  longitude,
  debugTimeOverride,
  mapBearing,
}: AppHeaderProps) {
  const [isDarkTime, setIsDarkTime] = useState(false)

  // 時間帯をチェック（6時〜18時を明るい時間帯とする）
  useEffect(() => {
    const checkTimeOfDay = () => {
      const hour = new Date().getHours()
      setIsDarkTime(hour < 6 || hour >= 18)
    }

    checkTimeOfDay()
    const interval = setInterval(checkTimeOfDay, 60000) // 1分ごとに更新

    return () => clearInterval(interval)
  }, [])

  // 時間帯に応じたアイコンカラー
  const iconColorClass = isDarkTime ? 'text-white' : 'text-gray-900'
  const iconBgClass = isDarkTime
    ? 'bg-white/10 hover:bg-white/20'
    : 'bg-black/10 hover:bg-black/20'

  return (
    <header className="fixed top-0 left-0 right-0 z-[100] pointer-events-none">
      <div className="flex items-start justify-between p-6">
        {/* 地域名表示 */}
        <div className="pointer-events-auto animate-fade-in-down">
          <LocationDisplay
            latitude={latitude}
            longitude={longitude}
            debugTimeOverride={debugTimeOverride}
          />
        </div>

        {/* アクションボタン群 */}
        <div className="flex items-center gap-3 pointer-events-auto animate-fade-in-down">
          {/* コンパスボタン */}
          <IconButton
            icon={<CompassIcon className="w-5 h-5" mapBearing={mapBearing} />}
            ariaLabel="現在位置に戻る"
            onClick={onCompassClick}
            className={`${iconBgClass} ${iconColorClass} backdrop-blur-sm`}
          />

          {/* 情報ボタン */}
          <IconButton
            icon={<MdInfo className="w-5 h-5" />}
            ariaLabel="アプリ情報"
            onClick={() => console.log('情報')}
            className={`${iconBgClass} ${iconColorClass} backdrop-blur-sm`}
          />

          {/* 設定ボタン */}
          <IconButton
            icon={<MdSettings className="w-5 h-5" />}
            ariaLabel="設定"
            onClick={onSettingsClick}
            className={`${iconBgClass} ${iconColorClass} backdrop-blur-sm`}
          />
        </div>
      </div>
    </header>
  )
}
