'use client'

import { AppHeader } from '@/components/molecules/AppHeader'
import { PWAInstallPrompt } from '@/components/organisms/PWAInstallPrompt'
import { RecordingInterface } from '@/components/organisms/RecordingInterface'
import type { UIOverlayProps } from './type'

/**
 * UIオーバーレイコンポーネント
 *
 * @description
 * マップ上に表示されるUI要素を統合するOrganismコンポーネント
 * ヘッダー、PWAインストールプロンプト、録音インターフェースを含む
 *
 * @example
 * ```tsx
 * <UIOverlay
 *   onSettingsClick={() => console.log('設定')}
 *   latitude={37.1234}
 *   longitude={139.1234}
 * />
 * ```
 */
export function UIOverlay({
   onSettingsClick,
   onCompassClick,
   latitude,
   longitude,
   debugTimeOverride,
   mapBearing,
}: UIOverlayProps) {
   return (
      <>
         {/* ヘッダー（常に表示） */}
         <AppHeader
            onSettingsClick={onSettingsClick}
            onCompassClick={onCompassClick}
            latitude={latitude}
            longitude={longitude}
            debugTimeOverride={debugTimeOverride}
            mapBearing={mapBearing}
         />

         {/* PWAインストールプロンプト */}
         <PWAInstallPrompt
            onInstallSuccess={() => {
               console.log('PWAインストール成功')
            }}
            onDismiss={() => {
               console.log('PWAインストールプロンプトを閉じました')
            }}
         />

         {/* 録音インターフェース */}
         <RecordingInterface
            onExpandedChange={() => {
               /* no-op */
            }}
            currentPosition={
               latitude !== undefined && longitude !== undefined
                  ? { latitude, longitude }
                  : null
            }
         />
      </>
   )
}
